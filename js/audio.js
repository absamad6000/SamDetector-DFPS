/**
 * audio.js — File upload and live recording for Sample A and Sample B.
 */

const Audio = (() => {
    let mediaRecorderA = null;
    let mediaRecorderB = null;
    let chunksA = [];
    let chunksB = [];

    function init() {
        // Upload handlers
        document.getElementById('uploadA').addEventListener('change', e => handleUpload(e, 'a'));
        document.getElementById('uploadB').addEventListener('change', e => handleUpload(e, 'b'));

        // Record handlers
        document.getElementById('recordA').addEventListener('click', () => toggleRecord('a'));
        document.getElementById('recordB').addEventListener('click', () => toggleRecord('b'));

        // Compare button
        document.getElementById('compareBtn').addEventListener('click', compareHandler);
    }

    async function handleUpload(event, label) {
        const file = event.target.files[0];
        if (!file) return;

        const upper = label.toUpperCase();
        const player = document.getElementById('player' + upper);
        const status = document.getElementById('status' + upper);
        const info = document.getElementById('info' + upper);

        // Show in audio player
        const url = URL.createObjectURL(file);
        player.src = url;

        status.textContent = 'Analyzing...';
        status.classList.remove('loaded');
        info.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

        // Send to backend
        try {
            const features = await sendToBackend(file, label);
            App.state['features' + upper] = features;
            status.textContent = '✓ Loaded';
            status.classList.add('loaded');
            Visualizations.render(upper, features, App.state.activeViz);
            updateCompareButton();
        } catch (err) {
            console.error('[Audio] Upload failed:', err);
            status.textContent = '✗ Error';
            // Provide more detail to user
            const errMsg = err.message.includes('fetch')
                ? 'Server connection failed. Is the backend running?'
                : err.message;
            info.textContent = errMsg;
            status.title = err.message; // Full error in tooltip
        }
    }

    async function toggleRecord(label) {
        const upper = label.toUpperCase();
        const btn = document.getElementById('record' + upper);
        const isA = label === 'a';
        const recorder = isA ? mediaRecorderA : mediaRecorderB;
        const chunks = isA ? chunksA : chunksB;

        if (recorder && recorder.state === 'recording') {
            // Stop recording
            recorder.stop();
            btn.classList.remove('recording');
            btn.innerHTML = '<span class="record-dot"></span> Record';
            return;
        }

        // Start recording
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            if (isA) { chunksA = []; mediaRecorderA = mr; }
            else { chunksB = []; mediaRecorderB = mr; }

            const localChunks = isA ? chunksA : chunksB;

            mr.ondataavailable = e => { if (e.data.size > 0) localChunks.push(e.data); };
            mr.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(localChunks, { type: 'audio/webm' });

                // --- CONVERT WEBM TO WAV ---
                const status = document.getElementById('status' + upper);
                const info = document.getElementById('info' + upper);
                status.textContent = 'Encoding...';

                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const arrayBuffer = await blob.arrayBuffer();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                    const wavBlob = audioBufferToWav(audioBuffer);
                    const file = new File([wavBlob], `recording_${label}.wav`, { type: 'audio/wav' });

                    const player = document.getElementById('player' + upper);
                    player.src = URL.createObjectURL(wavBlob);

                    status.textContent = 'Analyzing...';
                    info.textContent = `Recorded (${(wavBlob.size / 1024).toFixed(1)} KB)`;

                    const features = await sendToBackend(file, label);
                    App.state['features' + upper] = features;
                    status.textContent = '✓ Loaded';
                    status.classList.add('loaded');
                    Visualizations.render(upper, features, App.state.activeViz);
                    updateCompareButton();
                } catch (err) {
                    console.error('WAV Encoding/Analysis failed:', err);
                    status.textContent = '✗ Error';
                    info.textContent = err.message;
                }
            };

            mr.start();
            btn.classList.add('recording');
            btn.innerHTML = '<span class="record-dot"></span> Stop';
        } catch (err) {
            alert('Microphone access denied. Please allow microphone permissions.');
        }
    }

    /**
     * Converts an AudioBuffer to a PCM WAV Blob.
     */
    function audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const dataLength = buffer.length * blockAlign;
        const bufferLength = 44 + dataLength;

        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);

        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        // RIFF header
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(8, 'WAVE');

        // fmt chunk
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);

        // data chunk
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        // Write interleaved PCM data
        const offset = 44;
        const channels = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let index = 0;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                let sample = channels[channel][i];
                // Clip
                sample = Math.max(-1, Math.min(1, sample));
                // Scale to 16-bit signed integer
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset + index, sample, true);
                index += 2;
            }
        }

        return new Blob([view], { type: 'audio/wav' });
    }

    async function sendToBackend(file, label) {
        const formData = new FormData();
        formData.append('file', file);

        const resp = await fetch(`/api/analyze?label=${label}`, {
            method: 'POST',
            body: formData,
        });
        if (!resp.ok) {
            const err = await resp.json();
            throw new Error(err.detail || 'Analysis failed');
        }
        const data = await resp.json();
        return data.features;
    }

    function updateCompareButton() {
        const btn = document.getElementById('compareBtn');
        btn.disabled = !(App.state.featuresA && App.state.featuresB);
    }

    async function compareHandler() {
        const btn = document.getElementById('compareBtn');
        const loading = document.getElementById('loadingBar');
        btn.disabled = true;
        loading.classList.add('active');

        try {
            const resp = await fetch('/api/similarity', { method: 'POST' });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.detail || 'Comparison failed');
            }
            const result = await resp.json();
            App.state.similarityResult = result;
            Similarity.display(result);
            Similarity.showFeatures(App.state.featuresA, App.state.featuresB);

            // NEW: Populate Forensic Modules
            Courtroom.populateEvidence(App.state.featuresA, App.state.featuresB, result);
            Security.addAuditEntry(`Performed Biometric Comparison | LR: ${result.lr.toExponential(2)}`);

            if (result.validation) {
                Visualizations.renderValidation('validationPlot', result.validation);
            }
        } catch (err) {
            alert('Comparison error: ' + err.message);
        } finally {
            btn.disabled = false;
            loading.classList.remove('active');
        }
    }

    return { init };
})();
