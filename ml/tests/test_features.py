"""
Tests for ML Feature Engineering and Validation Schemas.
"""

from datetime import datetime, timezone
import numpy as np
import pytest
from ml.features import (
    calculate_time_features,
    validate_raw_input,
    extract_features_from_dict
)
from ml.config import FEATURE_COLUMNS

def test_calculate_time_features_peak_hour():
    # 09:30 AM on Monday (weekday peak hour)
    dt = datetime(2026, 11, 2, 9, 30, 0, tzinfo=timezone.utc)
    feats = calculate_time_features(dt)
    assert feats["is_peak_hour"] == 1.0
    assert feats["is_weekend"] == 0.0
    assert feats["day_of_week"] == 0.0
    assert -1.0 <= feats["time_of_day_sin"] <= 1.0
    assert -1.0 <= feats["time_of_day_cos"] <= 1.0

def test_calculate_time_features_weekend_non_peak():
    # 10:00 AM on Sunday (weekend - not regular urban peak)
    dt = datetime(2026, 11, 1, 10, 0, 0, tzinfo=timezone.utc)
    feats = calculate_time_features(dt)
    assert feats["is_weekend"] == 1.0
    assert feats["is_peak_hour"] == 0.0
    assert feats["day_of_week"] == 6.0

def test_validate_raw_input_valid():
    valid_data = {
        "lat": 9.9252,
        "lng": 78.1198,
        "current_speed_kmph": 28.5,
        "distance_to_stop_meters": 1250.0
    }
    errors = validate_raw_input(valid_data)
    assert len(errors) == 0

def test_validate_raw_input_out_of_bounds():
    # Latitude outside Tamil Nadu
    invalid_data = {
        "lat": 28.6139,  # New Delhi
        "lng": 77.2090,
        "current_speed_kmph": 20.0,
        "distance_to_stop_meters": 1000.0
    }
    errors = validate_raw_input(invalid_data)
    assert any("outside Tamil Nadu" in e for e in errors)

def test_validate_raw_input_impossible_speed():
    invalid_data = {
        "lat": 9.9252,
        "lng": 78.1198,
        "current_speed_kmph": 150.0,  # Impossible for Tamil Nadu city bus
        "distance_to_stop_meters": 500.0
    }
    errors = validate_raw_input(invalid_data)
    assert any("exceeds maximum valid" in e for e in errors)

def test_extract_features_from_dict_shape_and_order():
    data = {
        "distance_to_stop_meters": 1500.0,
        "distance_along_route_meters": 3000.0,
        "current_speed_kmph": 30.0,
        "rolling_speed_kmph": 28.0,
        "heading": 45.0,
        "stops_remaining": 3.0,
        "segment_index": 2.0,
        "scheduled_segment_duration_seconds": 180.0,
        "recorded_at": "2026-11-01T09:15:00Z"
    }
    vec = extract_features_from_dict(data)
    assert isinstance(vec, np.ndarray)
    assert vec.shape == (1, len(FEATURE_COLUMNS))
    assert not np.isnan(vec).any()

