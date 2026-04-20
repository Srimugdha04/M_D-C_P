/* ===================================================
   NEXA AI DASHBOARD — app.js
   All frontend logic: auth, data fetching, UI updates
   =================================================== */

// ---- App State ----
let user = JSON.parse(localStorage.getItem('user')) || null;
let latestPredictions = null;
let chartInstance = null;

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', () => {
    // Restore session if user exists
    if (user) {
        let loginOverlay = document.getElementById('login-overlay');
        if (loginOverlay) loginOverlay.style.display = 'none';
        
        let userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = user.name;
        
        let userInitialsEl = document.getElementById('user-initials');
        if (userInitialsEl) userInitialsEl.textContent = user.name.split(' ').map(w => w[0]).join('').slice(0, 2);
        
        let topbarBankEl = document.getElementById('topbar-bank');
        if (topbarBankEl) topbarBankEl.textContent  = `Bank ID: ${user.bankId}`;
        
        // Only loadData if we are on the main dashboard to prevent error
        if (document.getElementById('ledger-body')) {
            loadData();
        }
    }

    // Allow pressing Enter in login fields
    let passInput = document.getElementById('pass');
    if (passInput) {
        passInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') login();
        });
    }
    let emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') login();
        });
    }
    // Allow pressing Enter to send chat
    let chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMsg();
        });
    }
});

// ===================================================
// AUTH
// ===================================================

async function login() {
    const email    = document.getElementById('email').value.trim();
    const pass     = document.getElementById('pass').value;
    const loginBtn = document.getElementById('login-btn');
    const loginErr = document.getElementById('login-error');

    if (!email || !pass) {
        showLoginError('Please enter both email and password.');
        return;
    }

    // Loading state
    loginBtn.innerHTML = '<span class="spinner"></span> Signing in...';
    loginBtn.disabled = true;
    loginErr.style.display = 'none';

    try {
        const res  = await fetch('/api/auth/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password: pass })
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            user = data.data;
            localStorage.setItem('user', JSON.stringify(user));
            let loginOverlay = document.getElementById('login-overlay');
            if (loginOverlay) loginOverlay.style.display = 'none';

            let userNameEl = document.getElementById('user-name');
            if (userNameEl) userNameEl.textContent = user.name;

            let userInitialsEl = document.getElementById('user-initials');
            if (userInitialsEl) userInitialsEl.textContent = user.name.split(' ').map(w => w[0]).join('').slice(0, 2);

            let topbarBankEl = document.getElementById('topbar-bank');
            if (topbarBankEl) topbarBankEl.textContent = `Bank ID: ${user.bankId}`;
            
            if (document.getElementById('ledger-body')) {
                loadData();
            } else {
                // If not on the dashboard, redirect there
                window.location.href = '/';
            }
        } else {
            showLoginError('Invalid email or password. Please try again.');
        }
    } catch (err) {
        showLoginError('Cannot connect to server. Is Flask running?');
    } finally {
        loginBtn.innerHTML = 'Sign In';
        loginBtn.disabled  = false;
    }
}

function showLoginError(msg) {
    const el = document.getElementById('login-error');
    if (el) {
        el.textContent    = msg;
        el.style.display  = 'block';
    }
}

function logout() {
    localStorage.removeItem('user');
    user = null;
    
    // Check if login overlay exists, otherwise redirect to index.html
    let overlay = document.getElementById('login-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        let loginErr = document.getElementById('login-error');
        if (loginErr) loginErr.style.display = 'none';
        let emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = '';
        let passInput = document.getElementById('pass');
        if (passInput) passInput.value = '';
    }
    
    if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    } else {
        location.reload();
    }
}
window.logout = logout;

// ===================================================
// NAVIGATION
// ===================================================

function switchTab(tab, el) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    const titleMap = { dashboard: 'Bank Ledger', customers: 'Customer Directory' };
    document.getElementById('view-title').textContent = titleMap[tab] || 'Bank Ledger';
    loadData();
}

// ===================================================
// LOAD CUSTOMER DATA  →  GET /api/bank/<bank_id>
// ===================================================

async function loadData() {
    const tbody = document.getElementById('ledger-body');
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state">
        <i class="fas fa-circle-notch fa-spin"></i><br>Loading customers...
    </td></tr>`;

    try {
        const res  = await fetch(`/api/bank/${user.bankId}`);
        const data = await res.json();

        // Update stats
        document.getElementById('stat-total').textContent   = data.customers.length;
        document.getElementById('stat-bank').textContent    = data.bank_name;

        if (data.customers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">
                <i class="fas fa-users-slash"></i><p>No customers found.</p>
            </td></tr>`;
            return;
        }

        tbody.innerHTML = data.customers.map(c => `
            <tr>
                <td>
                    <span class="customer-name">${c.name}</span>
                    <span class="customer-id">${c.customerId}</span>
                </td>
                <td>${c.tenure} Mo</td>
                <td>$${c.monthlyCharges}</td>
                <td id="risk-${c.customerId}">
                    <span class="risk-pending"><i class="fas fa-clock"></i> Pending</span>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#f64e60;padding:30px;">
            <i class="fas fa-exclamation-triangle"></i> Failed to load data.
        </td></tr>`;
    }
}

// ===================================================
// PREDICT ALL  →  GET /api/predict/all/<bank_id>
// ===================================================

async function predictAll() {
    const btn = document.getElementById('predict-btn');
    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner"></span> Running Model...';

    try {
        const res     = await fetch(`/api/predict/all/${user.bankId}`);
        latestPredictions = await res.json();

        let highRisk = 0;
        latestPredictions.forEach(r => {
            const cell   = document.getElementById(`risk-${r.customerId}`);
            if (!cell) return;
            const pct    = Math.round(r.prob);
            const isHigh = r.prob > 50;
            if (isHigh) highRisk++;
            cell.innerHTML = isHigh
                ? `<span class="risk-high"><i class="fas fa-exclamation-circle"></i> ${pct}% High Risk</span>`
                : `<span class="risk-safe"><i class="fas fa-check-circle"></i> ${pct}% Safe</span>`;
        });

        document.getElementById('stat-highrisk').textContent = highRisk;

    } catch (err) {
        alert('Prediction failed. Check the server.');
    } finally {
        btn.classList.remove('loading');
        btn.innerHTML = '<i class="fas fa-brain"></i> PREDICT ALL CUSTOMER CHURN';
    }
}

// ===================================================
// GRAPHICAL REPRESENTATION
// ===================================================

async function showGraph() {
    if (!latestPredictions) {
        alert('Please run "PREDICT ALL CUSTOMER CHURN" first to generate data.');
        return;
    }

    // Show modal
    document.getElementById('graph-modal').style.display = 'flex';

    // Prepare chart data
    const labels = latestPredictions.map(r => r.customerId);
    const data = latestPredictions.map(r => r.prob);

    const ctx = document.getElementById('churnChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Churn Risk (%)',
                data: data,
                borderColor: '#1bc5bd',
                backgroundColor: 'rgba(27, 197, 189, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#1bc5bd',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Customer ID'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Risk Probability (%)'
                    }
                }
            }
        }
    });
}

function closeGraph() {
    document.getElementById('graph-modal').style.display = 'none';
}

// ===================================================
// AI CHAT  →  POST /api/chat
// ===================================================

function toggleBot() {
    const w = document.getElementById('bot-window');
    const isVisible = w.style.display === 'flex';
    w.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
        // Welcome message on first open
        const logs = document.getElementById('chat-logs');
        if (logs.children.length === 0) {
            appendBubble('ai', `Hello! I'm Nexa AI, your bank analytics advisor for ${user ? user.bankId : 'your bank'}. How can I help you today?`);
        }
        setTimeout(() => document.getElementById('chat-input').focus(), 100);
    }
}

async function sendMsg() {
    const input = document.getElementById('chat-input');
    const val   = input.value.trim();
    if (!val) return;

    appendBubble('user', val);
    input.value = '';

    // Typing indicator
    const typingId = appendBubble('ai', '<i class="fas fa-circle-notch fa-spin"></i> Thinking...');

    try {
        const res  = await fetch('/api/chat', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ message: val, bankId: user.bankId })
        });
        const data = await res.json();

        // Replace typing indicator with actual reply
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.innerHTML = data.reply;

    } catch (err) {
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.innerHTML = 'Connection error. Please try again.';
    }

    const logs = document.getElementById('chat-logs');
    logs.scrollTop = logs.scrollHeight;
}

function appendBubble(type, text) {
    const id   = 'bubble-' + Date.now() + Math.random().toString(36).slice(2);
    const logs = document.getElementById('chat-logs');
    const div  = document.createElement('div');
    div.className   = `chat-bubble ${type}`;
    div.id          = id;
    div.innerHTML   = text;
    logs.appendChild(div);
    logs.scrollTop  = logs.scrollHeight;
    return id;
}
