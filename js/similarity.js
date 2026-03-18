/**
 * similarity.js — Display similarity score, traffic light, feature scores, and explanations.
 */

const Similarity = (() => {
    function init() {
        // No initial setup needed — display is triggered by compare button
    }

    function display(result) {
        const section = document.getElementById('similaritySection');
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Animate score ring
        const pct = result.similarity_pct;
        const ringFill = document.getElementById('ringFill');
        const circumference = 2 * Math.PI * 52; // r=52
        const offset = circumference - (pct / 100) * circumference;

        // Ring color based on log_lr
        const logLr = result.log_lr || 0;
        let ringColor = 'var(--accent-neon-cyan)';
        if (logLr > 1.5) ringColor = 'var(--accent-neon-green)';
        if (logLr < -1.5) ringColor = 'var(--accent-neon-magenta)';

        ringFill.style.stroke = ringColor;
        setTimeout(() => { ringFill.style.strokeDashoffset = offset; }, 100);

        // Score text
        document.getElementById('scoreText').textContent = pct + '%';

        // Traffic light
        document.querySelectorAll('.light').forEach(l => l.classList.remove('active'));
        const lightMap = { high: 'lightGreen', moderate: 'lightYellow', low: 'lightRed' };
        const lightId = lightMap[result.confidence];
        const lightEl = lightId ? document.getElementById(lightId) : null;
        if (lightEl) lightEl.classList.add('active');

        // Confidence/LR Text
        document.getElementById('confidenceText').textContent = result.confidence_text;

        // NEW: Likelihood Ratio Display
        if (result.lr !== undefined) {
            document.getElementById('lrValue').textContent = `LR: ${result.lr.toExponential(2)}`;
            document.getElementById('logLrValue').textContent = `Log10(LR): ${result.log_lr.toFixed(2)}`;

            const verbalEl = document.getElementById('verbalScaleText');
            verbalEl.textContent = result.verbal_scale;

            // Color code verbal scale
            if (result.log_lr > 3) verbalEl.style.color = 'var(--accent-neon-green)';
            else if (result.log_lr > 1) verbalEl.style.color = 'var(--accent-neon-cyan)';
            else if (result.log_lr > -1) verbalEl.style.color = 'var(--accent-neon-yellow)';
            else verbalEl.style.color = 'var(--accent-neon-magenta)';
        }

        // Feature score chips
        const featureScores = document.getElementById('featureScores');
        featureScores.innerHTML = '';
        const labels = {
            pitch_mean: 'f0 Mean',
            pitch_range: 'f0 Range',
            formants: 'Formants (F1-F3)',
            ltas: 'LTAS Correlation',
            spectral_moments: 'Spectral Moments',
            perturbation: 'Glottal Perturb',
            temporal: 'Prosodic/Temporal',
        };
        for (const [key, val] of Object.entries(result.feature_scores)) {
            const chip = document.createElement('div');
            chip.className = 'feat-score-chip';
            chip.innerHTML = `<span class="chip-label">${labels[key] || key}</span>
                              <span class="chip-value" style="color: ${chipColor(val)}">${val}%</span>`;
            featureScores.appendChild(chip);
        }

        // Explanations
        const explContainer = document.getElementById('explanations');
        explContainer.innerHTML = '';
        result.explanations.forEach(text => {
            const div = document.createElement('div');
            div.className = 'explanation-item';
            div.textContent = text;
            explContainer.appendChild(div);
        });
    }

    function chipColor(val) {
        if (val >= 85) return 'var(--accent-neon-green)';
        if (val >= 60) return 'var(--accent-neon-yellow)';
        return 'var(--accent-neon-magenta)';
    }

    function showFeatures(featA, featB) {
        const section = document.getElementById('featuresSummary');
        section.style.display = 'block';

        renderFeatureGrid('featGridA', featA);
        renderFeatureGrid('featGridB', featB);
    }

    function renderFeatureGrid(containerId, feat) {
        const grid = document.getElementById(containerId);
        grid.innerHTML = '';

        const items = [
            { label: 'f0 Mean', value: feat.pitch.mean.toFixed(1) + ' Hz' },
            { label: 'f0 Range', value: feat.pitch.range.toFixed(1) + ' Hz' },
            { label: 'F1 Mean', value: feat.formants.f1_mean.toFixed(1) + ' Hz' },
            { label: 'F2 Mean', value: feat.formants.f2_mean.toFixed(1) + ' Hz' },
            { label: 'F3 Mean', value: (feat.formants.f3_mean || 'N/A') + ' Hz' },
            { label: 'LTAS Alpha', value: feat.ltas.alpha_ratio.toFixed(2) + ' dB' },
            { label: 'Spectral CoG', value: feat.spectral_moments.cog.toFixed(0) + ' Hz' },
            { label: 'Jitter (local)', value: (feat.jitter * 100).toFixed(2) + ' %' },
            { label: 'Shimmer (local)', value: (feat.shimmer * 100).toFixed(2) + ' %' },
            { label: 'RAP', value: (feat.rap * 100).toFixed(2) + ' %' },
            { label: 'HNR', value: (feat.hnr !== undefined ? feat.hnr : 'N/A') + ' dB' },
            { label: 'Articulation Rate', value: feat.articulation_rate.toFixed(1) + ' syl/s' },
        ];

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'feat-item';
            div.innerHTML = `<div class="feat-label">${item.label}</div>
                             <div class="feat-value">${item.value}</div>`;
            grid.appendChild(div);
        });
    }

    return { init, display, showFeatures };
})();
