"""
Tests for Baseline Model Calculations and Predictions.
"""

import numpy as np
import pytest
from ml.baseline import CorridorBaselineModel
from ml.config import PredictionSource

def test_baseline_predict_single():
    model = CorridorBaselineModel()
    features = {
        "distance_to_stop_meters": 2000.0,
        "stops_remaining": 2.0,
        "rolling_speed_kmph": 24.0,
        "is_peak_hour": 0.0
    }
    res = model.predict_single(features)
    assert res["prediction_source"] == PredictionSource.BASELINE_ESTIMATE
    assert res["predicted_seconds"] > 0
    assert res["predicted_minutes"] > 0
    # 2000m at 24 km/h (6.67 m/s) = ~300s + 2*30s = ~360s (~6 mins)
    assert 300 <= res["predicted_seconds"] <= 420

def test_baseline_peak_hour_deceleration():
    model = CorridorBaselineModel()
    off_peak_res = model.predict_single({
        "distance_to_stop_meters": 3000.0,
        "stops_remaining": 3.0,
        "rolling_speed_kmph": 30.0,
        "is_peak_hour": 0.0
    })
    peak_res = model.predict_single({
        "distance_to_stop_meters": 3000.0,
        "stops_remaining": 3.0,
        "rolling_speed_kmph": 30.0,
        "is_peak_hour": 1.0
    })
    # Peak hour should predict longer travel time due to traffic factor
    assert peak_res["predicted_seconds"] > off_peak_res["predicted_seconds"]

def test_baseline_vectorized_predict():
    model = CorridorBaselineModel()
    X = np.zeros((3, 13), dtype=np.float32)
    # distance_to_stop_meters is index 0
    X[0, 0] = 500.0
    X[1, 0] = 1500.0
    X[2, 0] = 3000.0
    # rolling_speed_kmph is index 3
    X[:, 3] = 25.0
    # stops_remaining is index 5
    X[0, 5] = 1.0
    X[1, 5] = 2.0
    X[2, 5] = 4.0

    preds = model.predict(X)
    assert len(preds) == 3
    assert preds[0] < preds[1] < preds[2]

