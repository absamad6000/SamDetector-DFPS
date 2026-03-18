import numpy as np
from scipy.stats import norm

class LikelihoodRatioEngine:
    """
    Likelihood Ratio (LR) Framework for Forensic Speaker Comparison.
    LR = P(Evidence | Same Speaker) / P(Evidence | Different Speaker)
    """
    def __init__(self):
        # Placeholder for population statistics (Mean, StdDev)
        # In a real system, these would be derived from a large reference database
        self.population_stats = {
            "pitch_mean": {"mean": 180.0, "std": 40.0},
            "f1_mean": {"mean": 500.0, "std": 100.0},
            "f2_mean": {"mean": 1500.0, "std": 300.0}
        }

    def calculate_lr(self, features_a: dict, features_b: dict) -> dict:
        """Calculate forensic LR across multiple features."""
        lrs = {}
        
        # 1. Pitch LR (simplistic normal distribution model)
        pa, pb = features_a["pitch"]["mean"], features_b["pitch"]["mean"]
        if pa > 0 and pb > 0:
            # Within-speaker variance (assumed small for demo)
            within_std = 5.0 
            # Probability under Same Speaker Hypothesis (H1)
            p_h1 = norm.pdf(pa, loc=pb, scale=within_std)
            # Probability under Different Speaker Hypothesis (H2)
            p_h2 = norm.pdf(pa, loc=self.population_stats["pitch_mean"]["mean"], 
                            scale=self.population_stats["pitch_mean"]["std"])
            lrs["pitch"] = float(p_h1 / p_h2) if p_h2 > 0 else 1.0

        # 2. Add more features (Formants, etc.)
        f1a, f1b = features_a["formants"]["f1_mean"], features_b["formants"]["f1_mean"]
        if f1a > 0 and f1b > 0:
            within_std_f1 = 20.0
            p_h1_f1 = norm.pdf(f1a, loc=f1b, scale=within_std_f1)
            p_h2_f1 = norm.pdf(f1a, loc=self.population_stats["f1_mean"]["mean"], 
                               scale=self.population_stats["f1_mean"]["std"])
            lrs["f1"] = float(p_h1_f1 / p_h2_f1) if p_h2_f1 > 0 else 1.0

        # Overall Log-LR
        log_lrs = [np.log10(v) for v in lrs.values() if v > 0]
        total_log_lr = float(np.sum(log_lrs))
        total_lr = 10 ** total_log_lr

        return {
            "total_lr": total_lr,
            "log_lr": total_log_lr,
            "feature_lrs": lrs,
            "verbal_scale": self.get_verbal_scale(total_log_lr)
        }

    def get_verbal_scale(self, log_lr: float) -> str:
        """Map Log-LR to verbal strength-of-evidence scale (standard forensic practice)."""
        abs_log_lr = abs(log_lr)
        if log_lr > 0:
            direction = "supports Same Speaker Hypothesis"
        else:
            direction = "supports Different Speaker Hypothesis"

        if abs_log_lr < 1:
            return f"Weak/Inconclusive evidence that {direction}"
        elif abs_log_lr < 2:
            return f"Moderate evidence that {direction}"
        elif abs_log_lr < 3:
            return f"Strong evidence that {direction}"
        elif abs_log_lr < 4:
            return f"Very strong evidence that {direction}"
        else:
            return f"Extremely strong evidence that {direction}"
