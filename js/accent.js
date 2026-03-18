/**
 * accent.js — Accent & Dialect comparison learning module.
 */

const Accent = (() => {
    const accentData = {
        'london-ny': {
            title: 'London English vs New York English',
            accents: [
                {
                    name: 'London English (Estuary / Cockney features)',
                    features: [
                        'Non-rhotic — post-vocalic /r/ is dropped (e.g., "car" → /kɑː/)',
                        'T-glottaling — /t/ replaced by glottal stop between vowels (e.g., "butter" → /bʌʔə/)',
                        'TH-fronting — /θ/ and /ð/ may become /f/ and /v/ in informal speech',
                        'Diphthong shift — FACE vowel /eɪ/ can be realized as [aɪ]',
                        'GOAT vowel may be fronted to [əʊ] or [ɛʊ]',
                    ],
                    rhoticity: 'non-rhotic',
                },
                {
                    name: 'New York English',
                    features: [
                        'Variably rhotic — traditionally non-rhotic, increasingly rhotic in younger speakers',
                        'THOUGHT–LOT distinction — "caught" /kɔːt/ vs "cot" /kɑːt/ remain distinct',
                        'Raised THOUGHT vowel — /ɔː/ is often raised and diphthongized',
                        'Short-a split — "bad" has a tense /æː/ while "bat" has a lax /æ/',
                        'Coil–curl merger — in some older speakers, these can overlap',
                    ],
                    rhoticity: 'variably rhotic',
                },
            ],
            vowelShifts: [
                { pair: 'caught – cot', type: 'distinct', note: 'Both accents maintain this distinction (unlike General American)' },
                { pair: 'FACE diphthong', type: 'distinct', note: 'London: [aɪ]-like | NYC: standard [eɪ]' },
                { pair: 'GOOSE vowel', type: 'distinct', note: 'London: fronted [ʉː] | NYC: back [uː]' },
            ],
        },
        'rp-ga': {
            title: 'Received Pronunciation vs General American',
            accents: [
                {
                    name: 'Received Pronunciation (RP)',
                    features: [
                        'Non-rhotic — /r/ only before vowels',
                        'BATH vowel uses /ɑː/ ("bath", "dance", "can\'t")',
                        'LOT vowel is rounded /ɒ/',
                        'Clear distinction between TRAP /æ/ and BATH /ɑː/',
                        'Intrusive /r/ — linking between vowels (e.g., "idea‿of")',
                    ],
                    rhoticity: 'non-rhotic',
                },
                {
                    name: 'General American (GA)',
                    features: [
                        'Fully rhotic — /r/ pronounced in all positions',
                        'BATH vowel uses /æ/ (same as TRAP)',
                        'Caught–cot merger — /ɔː/ and /ɑː/ merging for many speakers',
                        'T-flapping — intervocalic /t/ becomes [ɾ] (e.g., "water" → [ˈwɔɾɚ])',
                        'Rhotic vowels — "nurse" /ɝː/, "letter" /ɚ/',
                    ],
                    rhoticity: 'rhotic',
                },
            ],
            vowelShifts: [
                { pair: 'caught – cot', type: 'merged', note: 'Merged in GA, distinct in RP' },
                { pair: 'BATH – TRAP', type: 'distinct', note: 'Split in RP (/ɑː/ vs /æ/), merged in GA (/æ/)' },
                { pair: 'LOT vowel', type: 'distinct', note: 'RP: rounded /ɒ/ | GA: unrounded /ɑː/' },
            ],
        },
        'scottish-southern': {
            title: 'Scottish English vs Southern US English',
            accents: [
                {
                    name: 'Scottish English',
                    features: [
                        'Fully rhotic — strong post-vocalic /r/ (often trilled or tapped)',
                        'No FOOT–GOOSE distinction — both use /ʉ/',
                        'Monophthongal FACE /eː/ and GOAT /oː/',
                        'Glottal stop for intervocalic /t/',
                        'Scottish Vowel Length Rule — vowel length tied to following consonant',
                    ],
                    rhoticity: 'rhotic',
                },
                {
                    name: 'Southern US English',
                    features: [
                        'Variably rhotic — historically less rhotic, now increasingly rhotic',
                        'Monophthongization of /aɪ/ → [aː] ("ride" → [raːd])',
                        'PIN–PEN merger — /ɪ/ and /ɛ/ merge before nasals',
                        'Southern Vowel Shift — rotation of front vowels',
                        'Distinctive drawl — vowel lengthening and diphthongization',
                    ],
                    rhoticity: 'variably rhotic',
                },
            ],
            vowelShifts: [
                { pair: 'PIN – PEN', type: 'merged', note: 'Merged in Southern US, distinct in Scottish' },
                { pair: 'PRICE diphthong', type: 'distinct', note: 'Scottish: [ɑe] | Southern: monophthong [aː]' },
                { pair: 'FOOT – GOOSE', type: 'merged', note: 'Merged in Scottish, distinct in Southern US' },
            ],
        },
        'australian-irish': {
            title: 'Australian English vs Irish English',
            accents: [
                {
                    name: 'Australian English',
                    features: [
                        'Non-rhotic — post-vocalic /r/ not pronounced',
                        'Raised DRESS and TRAP vowels (part of Aussie vowel shift)',
                        'FLEECE and GOOSE vowels are diphthongized',
                        'HIGH rising terminal — statements often end with rising intonation',
                        'PRICE vowel backed to [ɑɪ]',
                    ],
                    rhoticity: 'non-rhotic',
                },
                {
                    name: 'Irish English (Hiberno-English)',
                    features: [
                        'Fully rhotic — strong post-vocalic /r/ (retroflex or alveolar)',
                        'STRUT vowel may be realized as /ʊ/ ("but" → [bʊt])',
                        'TH-stopping — /θ/ → [t̪] and /ð/ → [d̪] ("think" → [t̪ɪŋk])',
                        'Distinctive intonation patterns from Irish language influence',
                        'SQUARE vowel often monophthongal /eː/',
                    ],
                    rhoticity: 'rhotic',
                },
            ],
            vowelShifts: [
                { pair: 'STRUT vowel', type: 'distinct', note: 'Irish: /ʊ/ | Australian: /a/' },
                { pair: 'DRESS vowel', type: 'distinct', note: 'Australian: raised [e] | Irish: standard /ɛ/' },
                { pair: 'PRICE diphthong', type: 'distinct', note: 'Australian: [ɑɪ] | Irish: [ʌɪ]' },
            ],
        },
    };

    function init() {
        const select = document.getElementById('accentSelect');
        select.addEventListener('change', () => renderAccent(select.value));
        renderAccent(select.value);
    }

    function renderAccent(key) {
        console.log(`[SamDetector] Rendering accent comparison: ${key}`);
        const data = accentData[key];
        if (!data) {
            console.warn(`[SamDetector] No data found for accent key: ${key}`);
            return;
        }

        const container = document.getElementById('accentContent');
        container.innerHTML = '';

        // Header Card with metadata feel
        const header = document.createElement('div');
        header.className = 'accent-card glass-card';
        header.style.borderLeft = '4px solid var(--accent-neon-cyan)';
        header.innerHTML = `
            <div style="font-family:var(--font-data); font-size:0.75rem; color:var(--accent-neon-cyan); margin-bottom:0.5rem;">
                // CASE_STUDY_ID: ${key.toUpperCase()} // ANALYSIS_TYPE: COMPARATIVE_PHONETICS
            </div>
            <h2 style="color:var(--accent-neon-cyan); text-shadow: 0 0 10px rgba(0,242,255,0.5);">${data.title}</h2>
        `;
        container.appendChild(header);

        // Accent cards
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        grid.style.gap = '1.5rem';
        container.appendChild(grid);

        data.accents.forEach((accent, index) => {
            const card = document.createElement('div');
            card.className = 'accent-card glass-card';
            const color = index === 0 ? 'var(--sample-a)' : 'var(--sample-b)';
            card.style.borderTop = `2px solid ${color}`;

            let rhoticityHtml = '';
            if (accent.rhoticity === 'rhotic') {
                rhoticityHtml = '<span class="rhoticity-marker rhotic">✓ RHOTIC_POSITIVE</span>';
            } else if (accent.rhoticity === 'non-rhotic') {
                rhoticityHtml = '<span class="rhoticity-marker non-rhotic">✗ RHOTIC_NEGATIVE</span>';
            } else {
                rhoticityHtml = `<span class="rhoticity-marker rhotic" style="opacity:0.6">~ ${accent.rhoticity.toUpperCase()}</span>`;
            }

            card.innerHTML = `
                <div style="font-family:var(--font-data); font-size:0.7rem; color:${color}; margin-bottom:0.5rem;">[ PROBE_0${index + 1} ]</div>
                <h3 style="color:${color}">${accent.name}</h3>
                <div style="margin: 1rem 0;">${rhoticityHtml}</div>
                <h4 style="font-family:var(--font-data); font-size:0.8rem; letter-spacing:1px;">DIAGNOSTIC_FEATURES</h4>
                <ul style="border-left: 1px solid ${color}; padding-left: 1.5rem; margin-top: 0.5rem;">
                    ${accent.features.map(f => `<li style="margin-bottom:0.8rem; list-style:none; position:relative;">
                        <span style="position:absolute; left:-1.5rem; color:${color}">»</span> ${f}
                    </li>`).join('')}
                </ul>
            `;
            grid.appendChild(card);
        });

        // Vowel shift visualization
        if (data.vowelShifts.length) {
            const vizCard = document.createElement('div');
            vizCard.className = 'accent-card glass-card';
            vizCard.style.borderBottom = '4px solid var(--accent-neon-green)';
            vizCard.innerHTML = `
                <div style="font-family:var(--font-data); font-size:0.75rem; color:var(--accent-neon-green); margin-bottom:0.5rem;">
                    // CROSS_REFERENCE: VOWEL_VARIATION_VECTOR
                </div>
                <h3>Phonetic Mergers & Splits</h3>
                <p style="margin-bottom:1.5rem;">Diagnostic contrasts recorded in system data:</p>
                <div class="vowel-shift-viz" style="background:rgba(0,0,0,0.3); border:1px solid rgba(57,255,20,0.2);">
                    ${data.vowelShifts.map(vs => `
                        <div class="vowel-pair" style="border-bottom:1px solid rgba(255,255,255,0.05); padding: 0.8rem 0; width:100%;">
                            <span class="vowel-tag ${vs.type}">${vs.type.toUpperCase()}</span>
                            <strong style="font-family:var(--font-data); color:var(--text-primary);">${vs.pair}</strong>
                            <div style="color:var(--text-secondary); font-size:0.82rem; margin-top:0.3rem; font-style:italic;">DATA_SOURCE: ${vs.note}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(vizCard);
        }

        // Forensic diagnostic readout
        const noteCard = document.createElement('div');
        noteCard.className = 'accent-card glass-card';
        noteCard.style.backgroundColor = 'rgba(0, 242, 255, 0.05)';
        noteCard.style.border = '1px solid rgba(0, 242, 255, 0.2)';
        noteCard.innerHTML = `
            <h3 style="color:var(--accent-neon-yellow)">⚠️ FORENSIC_CAUTION</h3>
            <p>Accent features exist on a continuum and vary by speaker, age, social context, and region. 
            The descriptions above represent <em>typical</em> features but individual speakers may display 
            more or fewer of these characteristics. In forensic phonetics, accent analysis is one component 
            of speaker comparison but cannot alone identify a speaker.</p>
            <p style="color:var(--accent-neon-yellow); font-family:var(--font-data); font-size:0.8rem; margin-top:1rem; border-top:1px solid rgba(240,240,0,0.2); padding-top:0.5rem;">
                SYSTEM_STATUS: OPERATIONAL // BIOMETRIC_FIDELITY: OPTIMAL
            </p>
        `;
        container.appendChild(noteCard);
    }

    return { init };
})();
