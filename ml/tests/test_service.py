"""
Tests for FastAPI ML ETA Prediction Service Endpoints.
"""

from fastapi.testclient import TestClient
import pytest
from ml.service import app
from ml.config import PredictionSource, FallbackReason

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["service"] == "perundhu-ml-eta"
    assert data["status"] in ["UP", "DEGRADED"]
    assert "model_version" in data

def test_model_info_endpoint():
    res = client.get("/model-info", headers={"X-Internal-Token": "perundhu-ml-internal-secret-2026"})
    assert res.status_code == 200
    data = res.json()
    assert "version" in data
    assert "metrics" in data
    assert "feature_columns" in data

def test_predict_standard_movement():
    payload = {
        "bus_id": "bus-mdu-101",
        "route_number": "70",
        "target_stop_code": "MDU-MGR",
        "distance_to_stop_meters": 2400.0,
        "distance_along_route_meters": 4500.0,
        "current_speed_kmph": 26.0,
        "rolling_speed_kmph": 24.5,
        "heading": 45.0,
        "stops_remaining": 3.0,
        "is_deviated": False,
        "tracking_status": "LIVE"
    }
    res = client.post("/predict", json=payload, headers={"X-Internal-Token": "perundhu-ml-internal-secret-2026"})
    assert res.status_code == 200
    data = res.json()
    assert data["bus_id"] == "bus-mdu-101"
    assert data["prediction_source"] in [PredictionSource.ML_PREDICTION, PredictionSource.BASELINE_ESTIMATE]
    assert data["predicted_seconds"] > 0
    assert data["confidence"] > 0
    assert data["confidence_lower_seconds"] <= data["predicted_seconds"] <= data["confidence_upper_seconds"]
    assert data["inference_latency_ms"] >= 0

def test_predict_deviated_returns_unavailable():
    payload = {
        "bus_id": "bus-mdu-102",
        "distance_to_stop_meters": 1800.0,
        "is_deviated": True,
        "tracking_status": "DEVIATED"
    }
    res = client.post("/predict", json=payload, headers={"X-Internal-Token": "perundhu-ml-internal-secret-2026"})
    assert res.status_code == 200
    data = res.json()
    assert data["prediction_source"] == PredictionSource.ETA_UNAVAILABLE
    assert data["fallback_reason"] == FallbackReason.BUS_OFF_ROUTE

def test_predict_stale_gps_returns_unavailable():
    payload = {
        "bus_id": "bus-mdu-103",
        "distance_to_stop_meters": 1800.0,
        "is_deviated": False,
        "tracking_status": "OFFLINE"
    }
    res = client.post("/predict", json=payload, headers={"X-Internal-Token": "perundhu-ml-internal-secret-2026"})
    assert res.status_code == 200
    data = res.json()
    assert data["prediction_source"] == PredictionSource.ETA_UNAVAILABLE
    assert data["fallback_reason"] == FallbackReason.GPS_STALE

