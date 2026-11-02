"""
PERUNDHU (பேருந்து) — Phase 9 Feature Engineering & Input Validation
Provides pure feature extraction functions without future data leakage.
"""

import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

from .config import (
    FEATURE_COLUMNS,
    MAX_VALID_BUS_SPEED_KMPH,
    PILOT_ROUTES
)

# Geographic Boundaries of Tamil Nadu (WGS-84)
TAMIL_NADU_LAT_BOUNDS = (8.0, 13.6)
TAMIL_NADU_LNG_BOUNDS = (76.2, 80.4)

def calculate_time_features(dt: datetime) -> Dict[str, float]:
    """Calculates cyclical time and calendar features from an observation datetime."""
    # Hour as continuous float: hour + minute/60 + second/3600
    hour_float = dt.hour + (dt.minute / 60.0) + (dt.second / 3600.0)
    
    # 24-hour cycle encoding
    time_sin = math.sin(2.0 * math.pi * hour_float / 24.0)
    time_cos = math.cos(2.0 * math.pi * hour_float / 24.0)
    
    day_of_week = dt.weekday()  # 0 = Monday, 6 = Sunday
    is_weekend = 1.0 if day_of_week in [5, 6] else 0.0
    
    # Morning peak: 08:00 - 11:00 (8.0 to 11.0), Evening peak: 17:00 - 20:30 (17.0 to 20.5)
    is_peak = (
        1.0
        if (8.0 <= hour_float <= 11.0 or 17.0 <= hour_float <= 20.5) and not is_weekend
        else 0.0
    )
    
    return {
        "time_of_day_sin": round(time_sin, 6),
        "time_of_day_cos": round(time_cos, 6),
        "day_of_week": float(day_of_week),
        "is_weekend": is_weekend,
        "is_peak_hour": is_peak
    }

def validate_raw_input(data: Dict[str, Any]) -> List[str]:
    """Validates incoming observation data before feature processing."""
    errors = []
    
    lat = data.get("lat")
    lng = data.get("lng")
    if lat is None or lng is None:
        errors.append("Latitude and longitude are required.")
    elif not (TAMIL_NADU_LAT_BOUNDS[0] <= lat <= TAMIL_NADU_LAT_BOUNDS[1]):
        errors.append(f"Latitude {lat} is outside Tamil Nadu geographic bounds.")
    elif not (TAMIL_NADU_LNG_BOUNDS[0] <= lng <= TAMIL_NADU_LNG_BOUNDS[1]):
        errors.append(f"Longitude {lng} is outside Tamil Nadu geographic bounds.")
        
    speed = data.get("current_speed_kmph", 0.0)
    if speed < 0.0:
        errors.append("Speed cannot be negative.")
    elif speed > MAX_VALID_BUS_SPEED_KMPH:
        errors.append(f"Speed {speed} km/h exceeds maximum valid bus velocity threshold.")
        
    dist = data.get("distance_to_stop_meters")
    if dist is None or dist < 0.0:
        errors.append("distance_to_stop_meters must be a non-negative number.")
        
    return errors

def extract_features_from_dict(data: Dict[str, Any]) -> np.ndarray:
    """
    Extracts ordered feature vector for a single inference request.
    Strictly follows FEATURE_COLUMNS order.
    """
    # Parse timestamp or default to current UTC
    timestamp_str = data.get("recorded_at")
    if timestamp_str:
        try:
            dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        except Exception:
            dt = datetime.now(timezone.utc)
    else:
        dt = datetime.now(timezone.utc)
        
    time_feats = calculate_time_features(dt)
    
    distance_to_stop = float(data.get("distance_to_stop_meters", 0.0))
    distance_along_route = float(data.get("distance_along_route_meters", 0.0))
    current_speed = float(data.get("current_speed_kmph", 0.0))
    rolling_speed = float(data.get("rolling_speed_kmph", current_speed if current_speed > 0 else 25.0))
    heading = float(data.get("heading", 0.0)) % 360.0
    stops_remaining = float(data.get("stops_remaining", 1.0))
    segment_index = float(data.get("segment_index", 0.0))
    scheduled_duration = float(data.get("scheduled_segment_duration_seconds", max(60.0, distance_to_stop / 8.0)))
    
    feature_dict = {
        "distance_to_stop_meters": distance_to_stop,
        "distance_along_route_meters": distance_along_route,
        "current_speed_kmph": current_speed,
        "rolling_speed_kmph": rolling_speed,
        "heading": heading,
        "stops_remaining": stops_remaining,
        "segment_index": segment_index,
        "time_of_day_sin": time_feats["time_of_day_sin"],
        "time_of_day_cos": time_feats["time_of_day_cos"],
        "day_of_week": time_feats["day_of_week"],
        "is_weekend": time_feats["is_weekend"],
        "is_peak_hour": time_feats["is_peak_hour"],
        "scheduled_segment_duration_seconds": scheduled_duration
    }
    
    # Return 2D array [1, num_features] in canonical feature order
    return np.array([[feature_dict[col] for col in FEATURE_COLUMNS]], dtype=np.float32)

def prepare_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Prepares and validates a training DataFrame ensuring clean types and no missing values."""
    df_clean = df.copy()
    
    # Ensure all required features are present
    for col in FEATURE_COLUMNS:
        if col not in df_clean.columns:
            raise ValueError(f"Missing required feature column in DataFrame: {col}")
            
    # Cast features to float32
    for col in FEATURE_COLUMNS:
        df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce").fillna(0.0).astype(np.float32)
        
    return df_clean

