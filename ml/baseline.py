"""
PERUNDHU (பேருந்து) — Phase 9 Baseline ETA Prediction Model
Implements a physics-based, corridor-aware, time-of-day adjusted baseline model.
Provides a robust benchmark for comparing machine learning models.
"""

from typing import Dict, Any, Union
import numpy as np
import pandas as pd
from .config import (
    FEATURE_COLUMNS,
    PredictionSource,
    MIN_EFFECTIVE_SPEED_KMPH
)

class CorridorBaselineModel:
    """
    Corridor physics and time-of-day adjusted baseline model.
    Calculates ETA using remaining route distance, effective corridor velocity,
    time-of-day congestion modifiers, and intermediate stop dwell times.
    """
    def __init__(
        self,
        default_urban_speed_kmph: float = 24.0,
        peak_speed_factor: float = 0.75,
        default_dwell_seconds_per_stop: float = 30.0
    ):
        self.default_urban_speed_kmph = default_urban_speed_kmph
        self.peak_speed_factor = peak_speed_factor
        self.default_dwell_seconds_per_stop = default_dwell_seconds_per_stop
        self.is_fitted = True

    def fit(self, X: Any, y: Any = None):
        """No heavy parameter training needed for physics baseline; stores empirical mean speed if data provided."""
        if isinstance(X, pd.DataFrame) and "rolling_speed_kmph" in X.columns:
            valid_speeds = X["rolling_speed_kmph"][X["rolling_speed_kmph"] > 5.0]
            if len(valid_speeds) > 0:
                self.default_urban_speed_kmph = float(valid_speeds.median())
        self.is_fitted = True
        return self

    def predict_single(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates baseline travel time for a single observation dictionary."""
        distance_meters = float(features.get("distance_to_stop_meters", 0.0))
        stops_remaining = float(features.get("stops_remaining", 0.0))
        is_peak = float(features.get("is_peak_hour", 0.0))
        rolling_speed = float(features.get("rolling_speed_kmph", self.default_urban_speed_kmph))

        # Clamp rolling speed to realistic urban bounds [10 km/h, 50 km/h]
        if rolling_speed < MIN_EFFECTIVE_SPEED_KMPH or np.isnan(rolling_speed):
            effective_speed = self.default_urban_speed_kmph
        else:
            effective_speed = min(50.0, max(MIN_EFFECTIVE_SPEED_KMPH, rolling_speed))

        # Apply peak hour traffic deceleration factor
        if is_peak > 0.5:
            effective_speed *= self.peak_speed_factor

        # Convert km/h to m/s
        speed_mps = (effective_speed * 1000.0) / 3600.0

        # Transit time + intermediate stop dwells
        transit_time_seconds = distance_meters / speed_mps
        dwell_time_seconds = stops_remaining * self.default_dwell_seconds_per_stop

        total_seconds = max(10.0, round(transit_time_seconds + dwell_time_seconds))

        return {
            "predicted_seconds": total_seconds,
            "predicted_minutes": round(total_seconds / 60.0, 1),
            "effective_speed_kmph": round(effective_speed, 1),
            "confidence": 0.65,
            "prediction_source": PredictionSource.BASELINE_ESTIMATE
        }

    def predict(self, X: Union[np.ndarray, pd.DataFrame]) -> np.ndarray:
        """Vectorized prediction compatible with scikit-learn evaluation metrics."""
        if isinstance(X, pd.DataFrame):
            dist_idx = FEATURE_COLUMNS.index("distance_to_stop_meters")
            stops_idx = FEATURE_COLUMNS.index("stops_remaining")
            peak_idx = FEATURE_COLUMNS.index("is_peak_hour")
            speed_idx = FEATURE_COLUMNS.index("rolling_speed_kmph")
            X_mat = X[FEATURE_COLUMNS].to_numpy()
        else:
            dist_idx = FEATURE_COLUMNS.index("distance_to_stop_meters")
            stops_idx = FEATURE_COLUMNS.index("stops_remaining")
            peak_idx = FEATURE_COLUMNS.index("is_peak_hour")
            speed_idx = FEATURE_COLUMNS.index("rolling_speed_kmph")
            X_mat = np.array(X)

        distances = X_mat[:, dist_idx]
        stops = X_mat[:, stops_idx]
        peaks = X_mat[:, peak_idx]
        speeds = X_mat[:, speed_idx]

        # Vectorized effective speed
        eff_speeds = np.where(
            (speeds < MIN_EFFECTIVE_SPEED_KMPH) | np.isnan(speeds),
            self.default_urban_speed_kmph,
            np.clip(speeds, MIN_EFFECTIVE_SPEED_KMPH, 50.0)
        )
        eff_speeds = np.where(peaks > 0.5, eff_speeds * self.peak_speed_factor, eff_speeds)

        speeds_mps = (eff_speeds * 1000.0) / 3600.0
        transit_seconds = distances / speeds_mps
        dwell_seconds = stops * self.default_dwell_seconds_per_stop

        predicted = np.maximum(10.0, np.round(transit_seconds + dwell_seconds))
        return predicted

