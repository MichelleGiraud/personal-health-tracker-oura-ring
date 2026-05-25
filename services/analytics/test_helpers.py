import pytest
from main import label_readiness, classify_recovery_day, build_prediction_confidence

# -------------------------------------------------------
# label_readiness
# -------------------------------------------------------
def test_label_readiness_optimal():
    assert label_readiness(90) == "Optimal"
    assert label_readiness(85) == "Optimal"

def test_label_readiness_good():
    assert label_readiness(84) == "Good"
    assert label_readiness(70) == "Good"

def test_label_readiness_fair():
    assert label_readiness(69) == "Fair"
    assert label_readiness(55) == "Fair"

def test_label_readiness_low():
    assert label_readiness(54) == "Low"
    assert label_readiness(0) == "Low"

# -------------------------------------------------------
# classify_recovery_day
# -------------------------------------------------------
def test_classify_recovery_day_ready():
    assert classify_recovery_day(80) == "Ready"
    assert classify_recovery_day(75) == "Ready"

def test_classify_recovery_day_moderate():
    assert classify_recovery_day(74) == "Moderate"
    assert classify_recovery_day(60) == "Moderate"

def test_classify_recovery_day_recovery():
    assert classify_recovery_day(59) == "Recovery"
    assert classify_recovery_day(0) == "Recovery"