/**
 * courtroom.js — Courtroom simulation mode with evidence display and expert report editor.
 */

const Courtroom = (() => {
    function init() {
        // Rubric checklist score tracking
        const checkboxes = document.querySelectorAll('.rubric-checklist input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', updateRubricScore);
        });
    }

    function updateRubricScore() {
        const checkboxes = document.querySelectorAll('.rubric-checklist input[type="checkbox"]');
        const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
        const total = checkboxes.length;
        const scoreEl = document.getElementById('rubricScore');
        scoreEl.textContent = `Score: ${checked}/${total}`;

        // Color feedback
        const pct = checked / total;
        if (pct >= 0.83) scoreEl.style.color = '#34d399';
        else if (pct >= 0.5) scoreEl.style.color = '#fbbf24';
        else scoreEl.style.color = '#f87171';
    }

    function populateEvidence(featA, featB, simResult) {
        console.log('[Courtroom] Populating evidence...', { featA: !!featA, featB: !!featB, simResult: !!simResult });
        const container = document.getElementById('evidenceData');
        if (!container) {
            console.error('[Courtroom] Container #evidenceData not found!');
            return;
        }
        if (!featA || !featB) {
            container.innerHTML = '<p class="placeholder-text">No analysis data available yet.</p>';
            return;
        }

        const round = (v, d = 1) => (typeof v === 'number' ? v.toFixed(d) : v);

        container.innerHTML = `
            <p style="color:#fbbf24;font-size:0.82rem;margin-bottom:0.75rem;">
                🔒 Speaker identities anonymized for simulation purposes.
            </p>
            <table>
                <thead>
                    <tr><th>Feature</th><th>Speaker X</th><th>Speaker Y</th></tr>
                </thead>
                <tbody>
                    <tr><td>f0 Mean</td><td>${round(featA.pitch.mean)} Hz</td><td>${round(featB.pitch.mean)} Hz</td></tr>
                    <tr><td>f0 Range</td><td>${round(featA.pitch.range)} Hz</td><td>${round(featB.pitch.range)} Hz</td></tr>
                    <tr><td>F1 Mean</td><td>${round(featA.formants.f1_mean)} Hz</td><td>${round(featB.formants.f1_mean)} Hz</td></tr>
                    <tr><td>F2 Mean</td><td>${round(featA.formants.f2_mean)} Hz</td><td>${round(featB.formants.f2_mean)} Hz</td></tr>
                    <tr><td>Spectrum CoG</td><td>${round(featA.spectral_moments.cog)} Hz</td><td>${round(featB.spectral_moments.cog)} Hz</td></tr>
                    <tr><td>LTAS Alpha</td><td>${round(featA.ltas.alpha_ratio)} dB</td><td>${round(featB.ltas.alpha_ratio)} dB</td></tr>
                    <tr><td>Jitter (local)</td><td>${(featA.jitter * 100).toFixed(2)} %</td><td>${(featB.jitter * 100).toFixed(2)} %</td></tr>
                    <tr><td>RAP</td><td>${(featA.rap * 100).toFixed(2)} %</td><td>${(featB.rap * 100).toFixed(2)} %</td></tr>
                    <tr><td>Articulation Rate</td><td>${round(featA.articulation_rate)} syl/s</td><td>${round(featB.articulation_rate)} syl/s</td></tr>
                </tbody>
            </table>
            ${simResult ? `
                <div style="margin-top:1rem;padding:1rem;background:rgba(56,189,248,0.05);border-radius:12px;border:1px solid rgba(56,189,248,0.2);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                        <strong style="color:var(--accent-neon-cyan);font-family:var(--font-data);">LR_EVIDENCE_STRENGTH:</strong>
                        <span style="font-family:var(--font-data);font-weight:900;color:#fff;">${simResult.lr.toExponential(2)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem;">
                        <strong style="color:var(--accent-neon-cyan);font-family:var(--font-data);">LOG10_LR:</strong>
                        <span style="font-family:var(--font-data);font-weight:900;color:#fff;">${simResult.log_lr.toFixed(2)}</span>
                    </div>
                    <p style="font-size:1.1rem;color:#fff;font-weight:600;border-top:1px solid rgba(255,255,255,0.1);padding-top:0.8rem;">
                        ${simResult.verbal_scale}
                    </p>
                    <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem;font-family:var(--font-data);text-align:right;">
                        PROTOCOL: VFAS_v2.0 // CONFIDENCE: ${simResult.confidence.toUpperCase()}
                    </p>
                </div>
            ` : ''}
        `;
    }

    return { init, populateEvidence };
})();
