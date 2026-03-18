/**
 * visualizations.js — Plotly.js-based waveform, spectrogram, pitch contour, and formant plots.
 */

const Visualizations = (() => {
    function getDynamicLayout() {
        return {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { 
                family: 'Inter, sans-serif', 
                color: varProp('--text-muted') || '#94a3b8', 
                size: 11 
            },
            margin: { l: 50, r: 20, t: 10, b: 40 },
            xaxis: { 
                gridcolor: varProp('--border-glass') || 'rgba(255,255,255,0.05)', 
                zerolinecolor: varProp('--border-glass') || 'rgba(255,255,255,0.08)' 
            },
            yaxis: { 
                gridcolor: varProp('--border-glass') || 'rgba(255,255,255,0.05)', 
                zerolinecolor: varProp('--border-glass') || 'rgba(255,255,255,0.08)' 
            },
        };
    }

    const plotlyConfig = {
        responsive: true,
        displayModeBar: false,
    };

    const colorA = '#818cf8';
    const colorB = '#f472b6';

    function render(label, features, vizType) {
        const containerId = 'plot' + label;
        const color = label === 'A' ? colorA : colorB;

        switch (vizType) {
            case 'waveform':
                renderWaveform(containerId, features, color);
                break;
            case 'spectrogram':
                renderSpectrogram(containerId, features);
                break;
            case 'pitch':
                renderPitch(containerId, features, color);
                break;
            case 'formants':
                renderFormants(containerId, features, color);
                break;
            case 'ltas':
                renderLTAS(containerId, features, color);
                break;
        }
    }

    function renderWaveform(containerId, features, color) {
        const trace = {
            x: features.waveform.x,
            y: features.waveform.y,
            type: 'scatter',
            mode: 'lines',
            line: { color, width: 1 },
            fill: 'tozeroy',
            fillcolor: color + '15',
        };
        const layout = {
            ...getDynamicLayout(),
            xaxis: { ...getDynamicLayout().xaxis, title: 'Time (s)' },
            yaxis: { ...getDynamicLayout().yaxis, title: 'Amplitude' },
        };
        Plotly.newPlot(containerId, [trace], layout, plotlyConfig);
    }

    function renderSpectrogram(containerId, features) {
        const trace = {
            z: features.spectrogram.data,
            x: features.spectrogram.times,
            y: features.spectrogram.freqs,
            type: 'heatmap',
            colorscale: [
                [0, '#0a0e17'],
                [0.25, '#1e1b4b'],
                [0.5, '#6366f1'],
                [0.75, '#22d3ee'],
                [1, '#f1f5f9'],
            ],
            showscale: false,
        };
        const layout = {
            ...getDynamicLayout(),
            xaxis: { ...getDynamicLayout().xaxis, title: 'Time (s)' },
            yaxis: { ...getDynamicLayout().yaxis, title: 'Frequency (Hz)' },
        };
        Plotly.newPlot(containerId, [trace], layout, plotlyConfig);
    }

    function renderPitch(containerId, features, color) {
        // Filter out unvoiced (0 Hz) frames
        const x = [], y = [];
        for (let i = 0; i < features.pitch.contour_y.length; i++) {
            if (features.pitch.contour_y[i] > 0) {
                x.push(features.pitch.contour_x[i]);
                y.push(features.pitch.contour_y[i]);
            }
        }
        const trace = {
            x, y,
            type: 'scatter',
            mode: 'lines+markers',
            line: { color, width: 2 },
            marker: { size: 3, color },
        };
        const layout = {
            ...getDynamicLayout(),
            xaxis: { ...getDynamicLayout().xaxis, title: 'Time (s)' },
            yaxis: { ...getDynamicLayout().yaxis, title: 'Pitch (Hz)' },
        };
        Plotly.newPlot(containerId, [trace], layout, plotlyConfig);
    }

    function renderFormants(containerId, features, color) {
        if (!features.formants || !features.formants.times || features.formants.times.length === 0) {
            Plotly.newPlot(containerId, [], { ...plotlyLayout, title: 'No Formant Data' }, plotlyConfig);
            return;
        }

        const traceF1 = {
            x: features.formants.times,
            y: features.formants.f1_values,
            type: 'scatter',
            mode: 'lines',
            name: 'F1',
            line: { color, width: 2.5 },
        };
        const traceF2 = {
            x: features.formants.times,
            y: features.formants.f2_values,
            type: 'scatter',
            mode: 'lines',
            name: 'F2',
            line: { color: color + '99', width: 2, dash: 'dot' },
        };
        const traceF3 = {
            x: features.formants.times,
            y: features.formants.f3_values,
            type: 'scatter',
            mode: 'lines',
            name: 'F3',
            line: { color: color + '66', width: 2, dash: 'dashdot' },
        };
        
        const layout = {
            ...getDynamicLayout(),
            xaxis: { ...getDynamicLayout().xaxis, title: 'Time (s)' },
            yaxis: { 
                ...getDynamicLayout().yaxis, 
                title: 'Frequency (Hz)',
                range: [0, 5000], // Standard forensic formant range
                dtick: 1000
            },
            showlegend: true,
            legend: { 
                x: 1, 
                y: 1.1, 
                xanchor: 'right', 
                orientation: 'h', 
                bgcolor: 'rgba(0,0,0,0)',
                font: { size: 10 }
            },
            hovermode: 'x unified'
        };
        
        Plotly.newPlot(containerId, [traceF1, traceF2, traceF3], layout, plotlyConfig);
        setTimeout(() => Plotly.Plots.resize(containerId), 100);
    }

    function renderLTAS(containerId, features, color) {
        const trace = {
            x: features.ltas.freqs,
            y: features.ltas.values,
            type: 'scatter',
            mode: 'lines',
            name: 'LTAS',
            line: { color, width: 2 },
            fill: 'tozeroy',
            fillcolor: color + '10',
        };
        const layout = {
            ...getDynamicLayout(),
            xaxis: { ...getDynamicLayout().xaxis, title: 'Frequency (Hz)', type: 'log' },
            yaxis: { ...getDynamicLayout().yaxis, title: 'Power (dB)' },
        };
        Plotly.newPlot(containerId, [trace], layout, plotlyConfig);
    }

    function renderValidation(containerId, data) {
        const traceROC = {
            x: data.roc.fpr,
            y: data.roc.tpr,
            type: 'scatter',
            mode: 'lines',
            name: 'ROC Curve',
            line: { color: varProp('--accent-neon-cyan'), width: 3 },
            fill: 'tozeroy',
            fillcolor: 'rgba(56, 189, 248, 0.1)'
        };

        const traceBaseline = {
            x: [0, 1],
            y: [0, 1],
            type: 'scatter',
            mode: 'lines',
            name: 'Random Chance',
            line: { color: '#475569', width: 1, dash: 'dash' }
        };

        const layout = {
            ...getDynamicLayout(),
            xaxis: { ...getDynamicLayout().xaxis, title: 'False Positive Rate (FPR)', range: [0, 1] },
            yaxis: { ...getDynamicLayout().yaxis, title: 'True Positive Rate (TPR)', range: [0, 1] },
            showlegend: true,
            legend: { x: 1, y: 0, xanchor: 'right' }
        };

        Plotly.newPlot(containerId, [traceROC, traceBaseline], layout, plotlyConfig);
        setTimeout(() => Plotly.Plots.resize(containerId), 100);

        // Update stats
        const eerEl = document.getElementById('eerVal');
        const cllrEl = document.getElementById('cllrVal');
        if (eerEl) eerEl.textContent = (data.eer * 100).toFixed(2) + '%';
        if (cllrEl) cllrEl.textContent = data.cllr.toFixed(4);
    }

    function varProp(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    return { render, renderValidation };
})();
