"""
PERUNDHU (பேருந்து) — Phase 9 ML ETA Prediction Configuration
Defines paths, feature schemas, hyperparameters, and domain constants for Madurai Pilot.
"""

import os
from pathlib import Path

# Base Paths
ML_DIR = Path(__file__).resolve().parent
REPO_ROOT = ML_DIR.parent
DATA_DIR = ML_DIR / "data"
ARTIFACTS_DIR = ML_DIR / "artifacts"
CURRENT_MODEL_VERSION = "v1.0"
CURRENT_ARTIFACT_DIR = ARTIFACTS_DIR / CURRENT_MODEL_VERSION

# Feature Columns (strictly no future data, purely observable at prediction timestamp)
FEATURE_COLUMNS = [
    "distance_to_stop_meters",           # Remaining distance along corridor to target stop
    "distance_along_route_meters",       # Current progress from origin stand
    "current_speed_kmph",                # Instantaneous GPS speed (0 if stationary)
    "rolling_speed_kmph",                # 5-observation rolling average speed
    "heading",                           # Vehicle direction (0 - 360 deg)
    "stops_remaining",                   # Count of downstream intermediate stops
    "segment_index",                     # Current corridor segment index
    "time_of_day_sin",                   # Cyclical sin encoding of hour (2 * pi * hour / 24)
    "time_of_day_cos",                   # Cyclical cos encoding of hour (2 * pi * hour / 24)
    "day_of_week",                       # Day of week index (0=Monday, 6=Sunday)
    "is_weekend",                        # Binary flag for Saturday / Sunday
    "is_peak_hour",                      # 1 during 08:00-11:00 or 17:00-20:00, else 0
    "scheduled_segment_duration_seconds" # Timetable expected travel duration for segment
]

TARGET_COLUMN = "actual_travel_time_seconds"

# Model Hyperparameters for Gradient Boosting & XGBoost
MODEL_CONFIG = {
    "random_state": 42,
    "test_size": 0.15,
    "val_size": 0.15,
    "learning_rate": 0.05,
    "n_estimators": 120,
    "max_depth": 5,
    "min_child_weight": 3,
    "subsample": 0.85,
    "colsample_bytree": 0.85
}

# Domain Constants for Madurai Pilot Corridors
PILOT_DISTRICT = "MADURAI"
PILOT_ROUTES = ["70", "77"]

# Speed and Proximity Thresholds
STOP_ARRIVAL_RADIUS_METERS = 50.0
STOP_DWELL_MAX_SPEED_KMPH = 8.0
MAX_VALID_BUS_SPEED_KMPH = 85.0
MIN_EFFECTIVE_SPEED_KMPH = 10.0
MAX_POSITION_AGE_SECONDS = 120  # Stale GPS threshold (2 minutes)
ROUTE_DEVIATION_THRESHOLD_METERS = 150.0  # Off-route threshold

# Prediction Sources & Statuses
class PredictionSource:
    ML_PREDICTION = "ML_PREDICTION"
    BASELINE_ESTIMATE = "BASELINE_ESTIMATE"
    OFFICIAL_SCHEDULE = "OFFICIAL_SCHEDULE"
    ETA_UNAVAILABLE = "ETA_UNAVAILABLE"

# Fallback Reasons
class FallbackReason:
    GPS_STALE = "GPS_STALE"
    BUS_OFF_ROUTE = "BUS_OFF_ROUTE"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    UNASSIGNED_TRIP = "UNASSIGNED_TRIP"
    TERMINAL_REACHED = "TERMINAL_REACHED"
    OUT_OF_DISTRIBUTION = "OUT_OF_DISTRIBUTION"
    INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"

