import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve, auc

def generate_validation_metrics(y_true: list, y_scores: list) -> dict:
    """
    Generate ROC, EER, and Cllr for model validation.
    y_true: 1 for same-speaker, 0 for different-speaker
    y_scores: LR or similarity scores
    """
    fpr, tpr, thresholds = roc_curve(y_true, y_scores)
    roc_auc = auc(fpr, tpr)
    
    # Calculate Equal Error Rate (EER)
    fnr = 1 - tpr
    eer = fpr[np.nanargmin(np.absolute((fpr - fnr)))]
    
    # Cllr (Log Likelihood Ratio Cost) - Standard forensic metric
    # Placeholder for Cllr calculation
    cllr = _calculate_cllr(y_true, y_scores)
    
    return {
        "auc": roc_auc,
        "eer": float(eer),
        "cllr": float(cllr),
        "roc_curve": {"fpr": fpr.tolist(), "tpr": tpr.tolist()}
    }

def _calculate_cllr(y_true, y_scores):
    """Placeholder for Cllr metric."""
    # Simplified Cllr
    y_true = np.array(y_true)
    y_scores = np.array(y_scores)
    # Log-lrs for actual same-speaker and different-speaker pairs
    lrs_same = y_scores[y_true == 1]
    lrs_diff = y_scores[y_true == 0]
    
    if len(lrs_same) == 0 or len(lrs_diff) == 0: return 1.0
    
    c_same = np.mean(np.log2(1 + 1/lrs_same))
    c_diff = np.mean(np.log2(1 + lrs_diff))
    return 0.5 * (c_same + c_diff)
