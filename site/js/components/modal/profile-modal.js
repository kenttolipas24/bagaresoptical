/**
 * profile-modal.js - Bagares Optical Clinic
 * Complete script for Modal Lifecycle, Auth, and Data Fetching
 */

// ==========================================
// 1. COMPONENT INITIALIZATION
// ==========================================

// Fetch the HTML component and inject it into the index.html placeholder
fetch('components/modal/profile-modal.html')
    .then(res => {
        if (!res.ok) throw new Error('Could not load profile modal HTML');
        return res.text();
    })
    .then(html => {
        const placeholder = document.getElementById('profile-modal-placeholder');
        if (placeholder) placeholder.innerHTML = html;
    })
    .catch(err => console.error('Error:', err));

// ==========================================
// 2. MODAL CONTROLS
// ==========================================

window.openProfileModal = async function() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    modal.classList.add('active');
    
    // Check real session status from the server
    try {
        const res = await fetch('api/check_session.php');
        const session = await res.json();
        
        if (session.isLoggedIn) {
            switchProfileView('account');
            loadPatientDashboard();
        } else {
            switchProfileView('login');
        }
    } catch (err) {
        switchProfileView('login');
    }
};

window.closeProfileModal = function() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('active');
};

window.switchProfileView = function(view) {
    document.querySelectorAll('.auth-view').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`view-${view}`);
    if (target) target.classList.remove('hidden');
};

// ==========================================
// 3. AUTHENTICATION (AJAX to PHP)
// ==========================================

window.handlePatientAuth = async function(event, type) {
    event.preventDefault();
    
    // Determine target API and prepare data
    const endpoint = type === 'login' ? 'api/login.php' : 'api/register.php';
    const payload = type === 'login' ? {
        email: document.getElementById('login-email').value,
        pass: document.getElementById('login-pass').value
    } : {
        full_name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        pass: document.getElementById('reg-pass').value
    };

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (result.success) {
            switchProfileView('account');
            loadPatientDashboard();
        } else {
            alert(result.message || 'Authentication failed');
        }
    } catch (err) {
        alert('Server error. Please try again later.');
    }
};

window.handlePatientLogout = async function() {
    await fetch('api/logout.php');
    switchProfileView('login');
};

// ==========================================
// 4. DATA FETCHING (DASHBOARD FEEDBACK)
// ==========================================

/**
 * Fetches real-time feedback (Pending, Confirmed, Rescheduled) 
 * from the database.
 */
async function loadPatientDashboard() {
    const nameDisplay = document.getElementById('display-patient-name');
    const listContainer = document.getElementById('appointmentList');
    
    try {
        const res = await fetch('api/get_patient_status.php');
        const data = await res.json();
        
        if (nameDisplay) nameDisplay.innerText = data.full_name;
        
        if (data.appointments && data.appointments.length > 0) {
            listContainer.innerHTML = data.appointments.map(apt => `
                <div class="apt-card">
                    <div class="apt-meta">
                        <span class="apt-type">${apt.appointment_type}</span>
                        <span class="apt-date">Date: ${apt.appointment_date}</span>
                    </div>
                    <span class="status-badge status-${apt.status.toLowerCase()}">${apt.status}</span>
                </div>
            `).join('');
        } else {
            listContainer.innerHTML = '<p class="no-data">No appointments found.</p>';
        }
    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}