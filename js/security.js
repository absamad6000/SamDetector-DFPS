/**
 * security.js — Handles audit logging, RBAC state, and security dashboard updates.
 */

const Security = (() => {
    const auditLogs = [
        { id: 1, user: 'Analyst_Alpha', action: 'System Initialization', timestamp: '2026-03-06 09:00:22', status: 'SUCCESS' },
        { id: 2, user: 'Analyst_Alpha', action: 'AES-256 Key Rotation', timestamp: '2026-03-06 10:15:45', status: 'SUCCESS' },
    ];

    function init() {
        renderAuditLogs();
        setupSecurityControls();
        loadMessages();

        const refreshBtn = document.getElementById('refreshMessagesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadMessages);
        }
    }

    async function loadMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        try {
            const resp = await fetch('/api/messages');
            if (!resp.ok) throw new Error('Failed');
            const messages = await resp.json();

            if (messages.length === 0) {
                container.innerHTML = '<p class="placeholder-text">No messages yet.</p>';
                return;
            }

            container.innerHTML = messages.map(m => `
                <div class="message-card glass-card" style="margin-bottom: 0.75rem; padding: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong style="color: var(--accent-neon-cyan);">${m.name}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${m.created_at}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">${m.email}</div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">${m.message}</p>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = '<p class="placeholder-text">Could not load messages.</p>';
        }
    }

    function addAuditEntry(action, user = 'Current_User', status = 'SUCCESS') {
        const entry = {
            id: auditLogs.length + 1,
            user,
            action,
            timestamp: new Date().toLocaleString(),
            status
        };
        auditLogs.unshift(entry);
        renderAuditLogs();
    }

    function renderAuditLogs() {
        const tbody = document.getElementById('auditLogBody');
        if (!tbody) return;

        tbody.innerHTML = auditLogs.map(log => `
            <tr>
                <td>${log.timestamp}</td>
                <td><code style="color: var(--accent-neon-cyan)">${log.user}</code></td>
                <td>${log.action}</td>
                <td><span class="badge ${log.status === 'SUCCESS' ? 'badge-secure' : 'badge-danger'}">${log.status}</span></td>
            </tr>
        `).join('');
    }

    function setupSecurityControls() {
        // Placeholder for security toggle logic if needed in SPA
    }

    return { init, addAuditEntry };
})();
