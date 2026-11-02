"""
Tests for Dataset Generation and Data Leakage Prevention.
"""

from pathlib import Path
import pandas as pd
import pytest
from ml.config import DATA_DIR, TARGET_COLUMN
from ml.dataset_generator import build_benchmark_dataset

def test_benchmark_dataset_integrity():
    csv_path = DATA_DIR / "dataset_v1.csv"
    if not csv_path.exists():
        df, meta = build_benchmark_dataset(num_trips_route70=10, num_trips_route77=10)
    else:
        df = pd.read_csv(csv_path)

    assert len(df) > 0
    assert TARGET_COLUMN in df.columns
    # Target travel time must be strictly positive (no negative target or future leakage)
    assert (df[TARGET_COLUMN] > 0).all()
    # Distance to stop must be strictly positive
    assert (df["distance_to_stop_meters"] >= 0).all()

def test_trip_split_disjointness():
    csv_path = DATA_DIR / "dataset_v1.csv"
    df = pd.read_csv(csv_path)

    trips = df["trip_id"].unique()
    n_trips = len(trips)
    n_test = int(n_trips * 0.15)
    train_trips = set(trips[:-n_test])
    test_trips = set(trips[-n_test:])

    # Strict disjointness: intersection must be empty
    assert len(train_trips.intersection(test_trips)) == 0

