/**
 * research.js — Research / batch processing mode.
 */

const Research = (() => {
    let batchFiles = [];

    function init() {
        const toggle = document.getElementById('batchToggle');
        const content = document.getElementById('researchContent');
        const upload = document.getElementById('batchUpload');
        const processBtn = document.getElementById('batchProcessBtn');

        if (toggle && content) {
            toggle.addEventListener('change', () => {
                content.style.display = toggle.checked ? 'block' : 'none';
            });
        }

        if (upload) {
            upload.addEventListener('change', handleBatchSelect);
        }

        if (processBtn) {
            processBtn.addEventListener('click', processBatch);
        }
    }

    function handleBatchSelect(e) {
        batchFiles = Array.from(e.target.files);
        const list = document.getElementById('batchFileList');
        list.innerHTML = '';

        batchFiles.forEach(f => {
            const item = document.createElement('div');
            item.className = 'batch-file-item';
            item.textContent = `📎 ${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
            list.appendChild(item);
        });

        // Enable process button if at least 2 files
        document.getElementById('batchProcessBtn').disabled = batchFiles.length < 2;
    }

    async function processBatch() {
        const btn = document.getElementById('batchProcessBtn');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            // Sort files into pairs based on name prefix
            const pairs = pairFiles(batchFiles);
            if (pairs.length === 0) {
                alert('Could not form pairs. Name files with matching prefixes (e.g., pair1_a.wav, pair1_b.wav).');
                return;
            }

            // Analyze each pair
            const pairResults = [];
            for (const pair of pairs) {
                const featA = await analyzeFile(pair.a, 'a');
                const featB = await analyzeFile(pair.b, 'b');

                // Get similarity
                const resp = await fetch('/api/similarity', { method: 'POST' });
                const simResult = await resp.json();

                pairResults.push({
                    nameA: pair.a.name,
                    nameB: pair.b.name,
                    features_a: featA,
                    features_b: featB,
                    similarity: simResult,
                });
            }

            Security.addAuditEntry(`Batch Process Completed | Pairs: ${pairs.length}`);

            if (pairResults.length > 0 && pairResults[0].similarity.validation) {
                Visualizations.renderValidation('validationPlot', pairResults[0].similarity.validation);
            }

            displayBatchResults(pairResults);
        } catch (err) {
            alert('Batch processing error: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Process All Pairs';
        }
    }

    function pairFiles(files) {
        const groups = {};
        files.forEach(f => {
            // Try to extract prefix before _a or _b
            const match = f.name.match(/^(.+?)_([ab])\.\w+$/i);
            if (match) {
                const prefix = match[1];
                const label = match[2].toLowerCase();
                if (!groups[prefix]) groups[prefix] = {};
                groups[prefix][label] = f;
            }
        });

        const pairs = [];
        Object.values(groups).forEach(g => {
            if (g.a && g.b) pairs.push(g);
        });

        // Fallback: pair sequentially if no naming convention found
        if (pairs.length === 0 && files.length >= 2) {
            for (let i = 0; i < files.length - 1; i += 2) {
                pairs.push({ a: files[i], b: files[i + 1] });
            }
        }

        return pairs;
    }

    async function analyzeFile(file, label) {
        const formData = new FormData();
        formData.append('file', file);

        const resp = await fetch(`/api/analyze?label=${label}`, {
            method: 'POST',
            body: formData,
        });
        if (!resp.ok) throw new Error(`Failed to analyze ${file.name}`);
        const data = await resp.json();
        return data.features;
    }

    function displayBatchResults(pairResults) {
        const resultsSection = document.getElementById('batchResults');
        resultsSection.style.display = 'block';

        const similarities = pairResults.map(r => r.similarity.similarity_pct);
        const mean = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        const std = Math.sqrt(similarities.map(x => (x - mean) ** 2).reduce((a, b) => a + b, 0) / similarities.length);

        // Stats grid
        const statsGrid = document.getElementById('batchStatsGrid');
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Pairs Analyzed</div>
                <div class="stat-value">${pairResults.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Mean Similarity</div>
                <div class="stat-value">${mean.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Std Deviation</div>
                <div class="stat-value">${std.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Min</div>
                <div class="stat-value">${Math.min(...similarities).toFixed(1)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Max</div>
                <div class="stat-value">${Math.max(...similarities).toFixed(1)}%</div>
            </div>
        `;

        // Plot distribution
        const trace = {
            x: similarities,
            type: 'histogram',
            marker: {
                color: 'rgba(99,102,241,0.6)',
                line: { color: '#6366f1', width: 1 },
            },
            nbinsx: Math.max(5, Math.ceil(similarities.length / 2)),
        };
        const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 11 },
            margin: { l: 50, r: 20, t: 60, b: 50 },
            xaxis: {
                title: 'Similarity (%)',
                gridcolor: 'rgba(255,255,255,0.05)',
            },
            yaxis: {
                title: 'Frequency',
                gridcolor: 'rgba(255,255,255,0.05)',
            },
            title: { text: 'Similarity Score Distribution', font: { size: 14, color: '#f1f5f9' } },
        };
        Plotly.newPlot('batchPlot', [trace], layout, { responsive: true, displayModeBar: false });
    }

    return { init };
})();
