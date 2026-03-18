import numpy as np
import librosa
import scipy.signal

class TamperingDetector:
    """
    Detects signs of audio manipulation, editing, or synthetic speech.
    """
    def analyze(self, audio_data: np.ndarray, sr: int) -> dict:
        """Run full forensic tampering analysis."""
        discontinuities = self.detect_spectral_discontinuities(audio_data, sr)
        compression = self.detect_compression_artifacts(audio_data, sr)
        ai_score = self.ai_speech_heuristic(audio_data, sr)
        
        return {
            "edit_likelihood_score": round(float(np.mean([d["score"] for d in discontinuities] + [compression["score"]])), 2),
            "discontinuities": discontinuities,
            "compression_artifacts": compression,
            "ai_speech_detection": {
                "likelihood_score": ai_score,
                "markers": "High spectral consistency" if ai_score > 0.7 else "Normal variance"
            }
        }

    def detect_spectral_discontinuities(self, y: np.ndarray, sr: int) -> list:
        """Detect sudden jumps in spectral energy (potential edit points)."""
        # FFT-based spectral flux
        stft = np.abs(librosa.stft(y))
        flux = np.sqrt(np.sum(np.diff(stft, axis=1)**2, axis=0))
        
        # Threshold for anomalies
        threshold = np.mean(flux) + 3 * np.std(flux)
        peaks, _ = scipy.signal.find_peaks(flux, height=threshold, distance=int(sr/10))
        
        results = []
        for p in peaks:
            results.append({
                "time": float(p * 512 / sr), # assuming default hop_length
                "score": float(flux[p] / threshold),
                "type": "Spectral Jump"
            })
        return results

    def detect_compression_artifacts(self, y: np.ndarray, sr: int) -> dict:
        """Identify artifacts characteristic of MP3/AAC compression."""
        # Check for sharp HF cut-off (typical of lossy compression)
        stft = np.abs(librosa.stft(y))
        spectrum = np.mean(stft, axis=1)
        freqs = librosa.fft_frequencies(sr=sr)
        
        # Find frequency where energy drops significantly
        high_freq_energy = np.sum(spectrum[freqs > 16000])
        total_energy = np.sum(spectrum)
        ratio = high_freq_energy / total_energy if total_energy > 0 else 1.0
        
        is_compressed = ratio < 0.01 # Threshold for potential compression
        return {
            "is_potentially_compressed": is_compressed,
            "hf_energy_ratio": float(ratio),
            "score": 0.8 if is_compressed else 0.1
        }

    def ai_speech_heuristic(self, y: np.ndarray, sr: int) -> float:
        """Heuristic for AI/Synthetic speech based on spectral flatness and pitch stability."""
        flatness = np.mean(librosa.feature.spectral_flatness(y=y))
        # AI speech often has unnaturally stable pitch or lack of micro-tremor
        return float(1.0 - flatness) if flatness < 0.01 else 0.2
