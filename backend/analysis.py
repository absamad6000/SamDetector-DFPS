"""
Audio feature extraction using scipy and numpy exclusively.
Professional forensic precision engine.
"""

import numpy as np
import scipy.signal
import scipy.linalg
import soundfile as sf
import librosa
from pathlib import Path

def get_audio_metadata(audio_path: str) -> dict:
    """Extract technical metadata from audio file."""
    info = sf.info(audio_path)
    return {
        "sample_rate": info.samplerate,
        "channels": info.channels,
        "subtype": info.subtype,
        "format": info.format,
        "duration": info.duration,
        "frames": info.frames
    }

def calculate_snr(data: np.ndarray) -> float:
    """Estimate Signal-to-Noise Ratio using energy-based voice activity."""
    # Simple RMS-based SNR
    rms = np.sqrt(np.mean(data**2))
    # Estimate noise floor from lowest 10% of energy frames
    frame_len = 1024
    if len(data) < frame_len: return 0.0
    energies = [np.sqrt(np.mean(data[i:i+frame_len]**2)) for i in range(0, len(data)-frame_len, frame_len)]
    noise_floor = np.percentile(energies, 10)
    if noise_floor < 1e-10: return 60.0 # Excellent
    snr = 20 * np.log10(rms / noise_floor)
    return float(snr)

def detect_clipping(data: np.ndarray, threshold: float = 0.99) -> bool:
    """Check for digital clipping in the waveform."""
    return bool(np.any(np.abs(data) >= threshold))

def run_vad(data: np.ndarray, sr: int) -> list:
    """Voice Activity Detection using librosa."""
    # Returns intervals of non-silent speech
    intervals = librosa.effects.split(data, top_db=30)
    return intervals.tolist()

def extract_features(audio_path: str) -> dict:
    """
    Extract acoustic features from an audio file using pure scipy/numpy.
    High-precision forensic vocal analysis.
    """
    # --- Load audio ---
    # --- Metadata & Pre-processing ---
    metadata = get_audio_metadata(audio_path)
    data, sr = sf.read(audio_path)
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)  # Mono
    
    snr = calculate_snr(data)
    clipped = detect_clipping(data)
    vad_intervals = run_vad(data, sr)
    
    # Pre-emphasis for formant/spectral analysis
    data_emph = np.append(data[0], data[1:] - 0.97 * data[:-1])
    duration = metadata["duration"]
    
    # --- Resample to 22050 for consistency ---
    target_sr = 22050
    if sr != target_sr:
        num_samples = int(len(data) * target_sr / sr)
        data = scipy.signal.resample(data, num_samples)
        data_emph = scipy.signal.resample(data_emph, num_samples)
        sr = target_sr

    # --- Waveform (downsample for frontend) ---
    hop = max(1, len(data) // 4000)
    waveform_y = data[::hop].tolist()
    waveform_x = np.linspace(0, duration, len(waveform_y)).tolist()

    # --- FFT-based Spectrogram ---
    f, t_spec, Sxx = scipy.signal.spectrogram(data, fs=sr, nperseg=1024, noverlap=512)
    Sxx_dB = 10 * np.log10(np.maximum(Sxx, 1e-10))
    freq_indices = np.linspace(0, len(f)-1, 128).astype(int)
    spec_freqs = f[freq_indices].tolist()
    spec_data = Sxx_dB[freq_indices, :].tolist()
    spec_times = t_spec.tolist()

    # --- LTAS (Long-Term Average Spectrum) ---
    ltas_results = _calculate_ltas(data, sr)

    # --- Spectral Moments ---
    spectral_moments = _calculate_spectral_moments(data, sr)

    # --- Robust Pitch Tracking & Jitter ---
    pitch_results = _estimate_pitch_robust(data, sr)
    
    # --- Time-Varying Formant tracking ---
    formant_results = _track_formants(data_emph, sr)

    # --- Shimmer & HNR ---
    shimmer = _calculate_shimmer(data, sr, pitch_results["contour_y"])
    hnr = _calculate_hnr(data, sr)

    # --- MFCC & Spectral Features (librosa) ---
    mfccs = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=13)
    spec_centroid = librosa.feature.spectral_centroid(y=data, sr=sr)
    spec_flatness = librosa.feature.spectral_flatness(y=data)
    
    # --- Advanced Perturbation (RAP) ---
    rap = _calculate_rap(pitch_results["contour_y"])

    # --- Articulation Rate (Speech rate excluding pauses) ---
    # Simple peak detection on RMS energy
    rms = np.sqrt(np.convolve(data**2, np.ones(1024)/1024, mode='same'))
    peaks, _ = scipy.signal.find_peaks(rms, height=np.mean(rms)*1.5, distance=sr//4)
    speech_rate = len(peaks) / duration if duration > 0 else 0.0
    
    avg_pause = _calculate_avg_pause(rms, sr)
    total_pause_time = avg_pause * (duration / 2.0) # Estimated total pause
    articulation_rate = len(peaks) / (duration - total_pause_time) if duration > total_pause_time else speech_rate

    return {
        "metadata": metadata,
        "preprocessing": {
            "snr_db": round(snr, 2),
            "clipping_detected": clipped,
            "vad_segments": vad_intervals,
            "channel_id": "telephone" if sr < 10000 else "studio",
        },
        "duration": round(duration, 2),
        "pitch": pitch_results,
        "formants": formant_results,
        "shimmer": round(float(shimmer), 4),
        "jitter": round(float(pitch_results["jitter"]), 4),
        "rap": round(float(rap), 4),
        "hnr": round(float(hnr), 2),
        "ltas": ltas_results,
        "spectral_moments": spectral_moments,
        "speech_rate": round(speech_rate, 2),
        "spectral_features": {
            "mfccs_mean": mfccs.mean(axis=1).tolist(),
            "spectral_centroid_mean": float(np.mean(spec_centroid)),
            "spectral_flatness_mean": float(np.mean(spec_flatness)),
        },
        "articulation_rate": round(articulation_rate, 2),
        "avg_pause_length": round(avg_pause, 3),
        "waveform": {"x": waveform_x, "y": waveform_y},
        "spectrogram": {
            "times": spec_times,
            "freqs": spec_freqs,
            "data": spec_data,
        },
    }

def _estimate_pitch_robust(y, sr):
    """Estimate pitch with median filtering and jitter calculation."""
    frame_size = int(0.04 * sr)  # 40ms
    hop_size = int(0.01 * sr)    # 10ms
    pitches = []
    times = []
    
    for i in range(0, len(y) - frame_size, hop_size):
        frame = y[i:i+frame_size]
        # Hanning window
        frame = frame * np.hanning(len(frame))
        
        # Autocorrelation
        corr = np.correlate(frame, frame, mode='full')
        corr = corr[len(corr)//2:]
        
        # Peak search between 75Hz and 500Hz
        d_min = int(sr / 500)
        d_max = int(sr / 75)
        
        if d_max >= len(corr): continue
        
        peak = np.argmax(corr[d_min:d_max]) + d_min
        
        if corr[peak] > 0.4 * corr[0]: # Higher voiced threshold for forensic robustness
            pitches.append(float(sr / peak))
        else:
            pitches.append(0.0)
        times.append(float(i / sr))

    # Median filter to remove octave jumps and outliers
    if len(pitches) > 0:
        pitches_filtered = scipy.signal.medfilt(pitches, kernel_size=3)
    else:
        pitches_filtered = np.array([])

    voiced = [p for p in pitches_filtered if p > 0]
    
    # Jitter (Local) calculation: average absolute difference between consecutive fundamental periods
    jitter = 0.0
    if len(voiced) > 1:
        diffs = np.abs(np.diff(voiced))
        jitter = np.mean(diffs) / np.mean(voiced)

    return {
        "mean": round(float(np.mean(voiced)), 2) if voiced else 0.0,
        "min": round(float(np.min(voiced)), 2) if voiced else 0.0,
        "max": round(float(np.max(voiced)), 2) if voiced else 0.0,
        "range": round(float(np.max(voiced) - np.min(voiced)), 2) if voiced else 0.0,
        "jitter": jitter,
        "contour_x": times,
        "contour_y": pitches_filtered.tolist() if len(pitches_filtered) > 0 else []
    }

def _track_formants(y_emph, sr):
    """Time-varying formant tracking (F1-F3) across the sample."""
    frame_size = int(0.05 * sr)  # 50ms
    hop_size = int(0.02 * sr)    # 20ms
    
    f1s, f2s, f3s = [], [], []
    times = []
    
    # LPC order: 2 + sr/1000 is a common rule of thumb for formants
    # For 22050Hz, this is ~24. For 44100Hz, it's ~46.
    order = 2 + int(sr / 1000)
    
    for i in range(0, len(y_emph) - frame_size, hop_size):
        frame = y_emph[i:i+frame_size]
        # Skip if frame is too quiet (silence)
        if np.max(np.abs(frame)) < 1e-3: 
            continue 
            
        frame = frame * np.hamming(len(frame))
        
        try:
            # LPC coefficients using Levinson-Durbin
            # Use librosa's lpc or scipy's linalg
            A = librosa.lpc(frame, order=order)
            
            # Roots of polynomial
            roots = np.roots(A)
            roots = [r for r in roots if np.imag(r) > 0]
            
            angles = np.arctan2(np.imag(roots), np.real(roots))
            freqs = sorted(angles * (sr / (2 * np.pi)))
            
            # Filter valid forensic formants for human voice
            # F1: 200-1200, F2: 600-3000, F3: 1500-4500
            valid_formants = [f for f in freqs if 200 < f < 5000]
            
            if len(valid_formants) >= 3:
                f1s.append(float(valid_formants[0]))
                f2s.append(float(valid_formants[1]))
                f3s.append(float(valid_formants[2]))
                times.append(float(i / sr))
            elif len(valid_formants) == 2:
                f1s.append(float(valid_formants[0]))
                f2s.append(float(valid_formants[1]))
                f3s.append(0.0) # Placeholder or interpolate
                times.append(float(i / sr))
        except:
            continue

    return {
        "f1_mean": round(float(np.mean(f1s)), 2) if f1s else 0.0,
        "f2_mean": round(float(np.mean(f2s)), 2) if f2s else 0.0,
        "f3_mean": round(float(np.mean(f3s)), 2) if f3s else 0.0,
        "f1_values": f1s,
        "f2_values": f2s,
        "f3_values": f3s,
        "times": times,
    }

def _calculate_shimmer(y, sr, pitches):
    """Estimate Shimmer (amplitude perturbation) in voiced segments."""
    voiced_indices = [i for i, p in enumerate(pitches) if p > 0]
    if len(voiced_indices) < 10: return 0.0
    
    hop_size = int(0.01 * sr)
    amps = []
    
    for idx in voiced_indices:
        start = idx * hop_size
        end = start + int(0.02 * sr) # 20ms window for peak
        if end > len(y): break
        frame = np.abs(y[start:end])
        if len(frame) > 0:
            amps.append(np.max(frame))
    
    if len(amps) < 2: return 0.0
    
    # Local shimmer: mean absolute difference between consecutive peak amplitudes
    shimmer = np.mean(np.abs(np.diff(amps))) / np.mean(amps)
    return shimmer

def _calculate_hnr(y, sr):
    """Harmonic-to-Noise Ratio proxy using autocorrelation peak."""
    mid = len(y) // 2
    frame_size = int(0.05 * sr)
    if len(y) < frame_size: return 0.0
    
    frame = y[mid : mid+frame_size]
    # Autocorrelation
    corr = np.correlate(frame, frame, mode='full')
    corr = corr[len(corr)//2:]
    
    # Peak outside zero-lag (lag > 2ms)
    d_min = int(sr * 0.002)
    if d_min >= len(corr): return 0.0
    
    r_max = np.max(corr[d_min:])
    r_zero = corr[0]
    
    if r_zero > r_max and (r_zero - r_max) > 0:
        hnr = 10 * np.log10(r_max / (r_zero - r_max))
        return hnr
    return 0.0

def _calculate_ltas(y, sr):
    """Calculate Long-Term Average Spectrum and spectral slope metrics."""
    f, pxx = scipy.signal.welch(y, sr, nperseg=2048)
    pxx_db = 10 * np.log10(np.maximum(pxx, 1e-10))
    
    # Alpha ratio: ratio of energy above/below 1000Hz
    idx_1k = np.argmin(np.abs(f - 1000))
    low_e = np.sum(pxx[:idx_1k])
    high_e = np.sum(pxx[idx_1k:])
    alpha_ratio = 10 * np.log10(high_e / low_e) if low_e > 0 else 0.0
    
    # Hammarberg index: max(0-2kHz) - max(2-5kHz)
    idx_2k = np.argmin(np.abs(f - 2000))
    idx_5k = np.argmin(np.abs(f - 5000))
    max_low = np.max(pxx_db[:idx_2k]) if idx_2k > 0 else 0.0
    max_high = np.max(pxx_db[idx_2k:idx_5k]) if idx_5k > idx_2k else 0.0
    hammarberg = max_low - max_high

    # Downsample for frontend plotting
    indices = np.linspace(0, len(f)-1, 200).astype(int)
    return {
        "freqs": f[indices].tolist(),
        "values": pxx_db[indices].tolist(),
        "alpha_ratio": round(float(alpha_ratio), 2),
        "hammarberg_index": round(float(hammarberg), 2)
    }

def _calculate_spectral_moments(y, sr):
    """Calculate the first 4 spectral moments (CoG, SD, Skewness, Kurtosis)."""
    f, pxx = scipy.signal.welch(y, sr, nperseg=1024)
    # Normalize power spectrum to obtain a probability distribution
    pxx_norm = pxx / np.sum(pxx)
    
    # 1st Moment: Center of Gravity (Mean)
    cog = np.sum(f * pxx_norm)
    
    # 2nd Moment: Standard Deviation (Square root of variance)
    variance = np.sum(((f - cog)**2) * pxx_norm)
    sd = np.sqrt(variance)
    
    # 3rd Moment: Skewness
    skewness = np.sum(((f - cog)**3) * pxx_norm) / (sd**3) if sd > 0 else 0.0
    
    # 4th Moment: Kurtosis
    kurtosis = np.sum(((f - cog)**4) * pxx_norm) / (sd**4) if sd > 0 else 0.0
    
    return {
        "cog": round(float(cog), 2),
        "sd": round(float(sd), 2),
        "skewness": round(float(skewness), 3),
        "kurtosis": round(float(kurtosis), 3)
    }

def _calculate_rap(pitches):
    """Relative Average Perturbation (RAP) - 3-cycle jitter variant."""
    voiced = [p for p in pitches if p > 0]
    if len(voiced) < 4: return 0.0
    periods = 1.0 / np.array(voiced)
    
    rap_sum = 0
    for i in range(1, len(periods) - 1):
        # Difference between current period and average of 3 periods
        avg_3 = (periods[i-1] + periods[i] + periods[i+1]) / 3.0
        rap_sum += np.abs(periods[i] - avg_3)
    
    rap = (rap_sum / (len(periods) - 2)) / np.mean(periods)
    return rap

def _calculate_avg_pause(rms, sr):
    """Standardized pause detection."""
    threshold = np.mean(rms) * 0.2
    silent_mask = rms < threshold
    frame_dur = 1.0 / sr
    pause_lengths = []
    curr_pause = 0
    for is_silent in silent_mask:
        if is_silent:
            curr_pause += frame_dur
        else:
            if curr_pause > 0.15: # 150ms minimum for a pause
                pause_lengths.append(curr_pause)
            curr_pause = 0
    return float(np.mean(pause_lengths)) if pause_lengths else 0.0
