/**
 * app.js — Main application controller: Forensic Protocol registration, tab routing, global state.
 */

const App = (() => {
    // Global state
    const state = {
        ethicsAccepted: false,
        currentTab: 'analysis',
        activeViz: 'waveform',
        featuresA: null,
        featuresB: null,
        similarityResult: null,
        engineVersion: '2.0.0',
        reproducibilitySeed: 42
    };

    function init() {
        checkHealth();
        setupEthicsModal();
        setupTabs();
        setupVizToggles();
        setupMenu();
        setupModals();
    }

    async function checkHealth() {
        try {
            const resp = await fetch('/api/health');
            if (!resp.ok) throw new Error('Unhealthy status');
            console.log('[App] Backend Health: OK');
        } catch (err) {
            console.warn('[App] Backend Health Check Failed:', err);
            // Non-blocking but visible in status if needed
        }
    }

    function setupMenu() {
        const menuBtn = document.getElementById('menuBtn');
        const menuContent = document.getElementById('menuContent');

        if (!menuBtn || !menuContent) return;

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuContent.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            menuContent.classList.remove('active');
        });

        menuContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    function setupModals() {
        const mapping = [
            { btn: 'btnAboutDev', modal: 'aboutDevModal', close: 'closeAboutDev' },
            { btn: 'btnContactUs', modal: 'contactModal', close: 'closeContact' }
        ];

        // Security & Audit menu item — switches tab instead of opening a modal
        const secBtn = document.getElementById('btnSecurityMenu');
        if (secBtn) {
            secBtn.addEventListener('click', () => {
                document.getElementById('menuContent').classList.remove('active');
                switchTab('security');
            });
        }

        mapping.forEach(item => {
            const btn = document.getElementById(item.btn);
            const modal = document.getElementById(item.modal);
            const close = document.getElementById(item.close);

            if (btn && modal) {
                btn.addEventListener('click', () => {
                    modal.classList.add('active');
                    document.getElementById('menuContent').classList.remove('active');
                });
            }

            if (close && modal) {
                close.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            }

            // Close on background click
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.classList.remove('active');
                });
            }
        });

        // Contact Form Submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = contactForm.querySelector('button');
                btn.disabled = true;
                btn.innerHTML = 'Sending...';

                const payload = {
                    name: document.getElementById('contactName').value,
                    email: document.getElementById('contactEmail').value,
                    message: document.getElementById('contactMessage').value
                };

                try {
                    const resp = await fetch('/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!resp.ok) throw new Error('Failed to send');
                    contactForm.style.display = 'none';
                    document.getElementById('contactSuccess').style.display = 'block';
                    Security.addAuditEntry(`Contact message received from ${payload.email}`);
                } catch (err) {
                    btn.disabled = false;
                    btn.innerHTML = '<span class="btn-icon">✈️</span> Send Message';
                    alert('Failed to send message: ' + err.message);
                }
            });
        }
    }


    function setupEthicsModal() {
        const modal = document.getElementById('ethicsModal');
        const btn = document.getElementById('ethicsAcceptBtn');
        const app = document.getElementById('appContainer');

        // Check sessionStorage
        if (sessionStorage.getItem('vct_ethics') === 'accepted') {
            modal.classList.remove('active');
            app.classList.remove('app-hidden');
            state.ethicsAccepted = true;
            return;
        }

        btn.addEventListener('click', () => {
            modal.classList.remove('active');
            app.classList.remove('app-hidden');
            state.ethicsAccepted = true;
            sessionStorage.setItem('vct_ethics', 'accepted');
        });
    }

    function setupTabs() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                switchTab(target);
            });
        });
    }

    function switchTab(tabName) {
        state.currentTab = tabName;
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        document.querySelector(`.nav-tab[data-tab="${tabName}"]`).classList.add('active');
        const tabEl = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
        if (tabEl) tabEl.classList.add('active');

        // NEW: Re-render modules if switching tabs
        if (tabName === 'research' && App.state.similarityResult && App.state.similarityResult.validation) {
            Visualizations.renderValidation('validationPlot', App.state.similarityResult.validation);
        }
        if (tabName === 'courtroom' && App.state.featuresA && App.state.featuresB) {
            Courtroom.populateEvidence(App.state.featuresA, App.state.featuresB, App.state.similarityResult);
        }
    }

    function setupVizToggles() {
        document.querySelectorAll('.viz-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.viz-toggle').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.activeViz = btn.dataset.viz;
                // Re-render if data available
                if (state.featuresA) Visualizations.render('A', state.featuresA, state.activeViz);
                if (state.featuresB) Visualizations.render('B', state.featuresB, state.activeViz);
            });
        });
    }


    return { init, state };
})();

document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOM Content Loaded. Initializing modules...');
    const modules = [
        { name: 'App', init: App.init },
        { name: 'Audio', init: Audio.init },
        { name: 'Similarity', init: Similarity.init },
        { name: 'Courtroom', init: Courtroom.init },
        { name: 'Security', init: Security.init },
        { name: 'Research', init: Research.init },
        { name: 'Export', init: Export.init }
    ];

    modules.forEach(m => {
        try {
            m.init();
            console.log(`[App] ${m.name} initialized successfully.`);
        } catch (err) {
            console.error(`[App] Failed to initialize ${m.name}:`, err);
        }
    });

    // --- Developer Dashboard Logic ---
    let devAuthenticated = false;
    const devModal = document.getElementById('devDashboardModal');

    // Ctrl+Shift+D to open
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
            e.preventDefault();
            devModal.classList.add('active');
        }
    });

    document.getElementById('closeDevDashboard')?.addEventListener('click', () => {
        devModal.classList.remove('active');
    });

    document.getElementById('btnDevLogin')?.addEventListener('click', async () => {
        const pwd = document.getElementById('devPassword').value;
        const errEl = document.getElementById('devAuthError');
        try {
            const resp = await fetch('/api/dev/messages', {
                headers: { 'Authorization': 'Bearer ' + pwd }
            });
            if (!resp.ok) throw new Error('Invalid credentials');

            // Success
            errEl.style.display = 'none';
            document.getElementById('devAuthSection').style.display = 'none';
            document.getElementById('devMessagesSection').style.display = 'block';
            devAuthenticated = true;
            renderDevMessages(await resp.json());
        } catch (err) {
            errEl.style.display = 'block';
        }
    });

    document.getElementById('refreshDevMessagesBtn')?.addEventListener('click', async () => {
        if (!devAuthenticated) return;
        const pwd = document.getElementById('devPassword').value;
        try {
            const resp = await fetch('/api/dev/messages', {
                headers: { 'Authorization': 'Bearer ' + pwd }
            });
            if (resp.ok) renderDevMessages(await resp.json());
        } catch (e) { console.error('Error refreshing messages', e); }
    });

    function renderDevMessages(messages) {
        const container = document.getElementById('devMessagesContainer');
        if (!messages || messages.length === 0) {
            container.innerHTML = '<p class="placeholder-text">No messages yet.</p>';
            return;
        }

        container.innerHTML = messages.map(m => `
            <div class="message-card glass-card" style="margin-bottom: 0.75rem; padding: 1rem; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="color: var(--accent-neon-cyan);">${m.name}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${m.created_at}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                    <a href="mailto:${m.email}" style="color: var(--accent-neon-cyan);">${m.email}</a>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">${m.message}</p>
            </div>
        `).join('');
    }
});
