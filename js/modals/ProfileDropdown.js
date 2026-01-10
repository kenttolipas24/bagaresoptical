// ProfileDropdown.js - Admin Version

let profileModal = null;
let profileButton = null;

function loadProfileDropdown() {
    fetch('../components/modals/admin/profile-dropdown.html')
        .then(res => res.text())
        .then(data => {
            document.getElementById('profile-dropdown-placeholder').innerHTML = data;

            // Now that modal exists, get references
            profileModal = document.getElementById('profileModal');
            profileButton = document.querySelector('.icon-button.profile-btn');

            if (!profileModal || !profileButton) {
                console.error('Profile modal or button not found');
                return;
            }

            // Attach click listener to button
            profileButton.addEventListener('click', function(e) {
                e.stopPropagation();
                profileModal.classList.toggle('active');
            });

            // Close when clicking outside
            document.addEventListener('click', function(e) {
                if (profileModal.classList.contains('active')) {
                    if (!profileModal.contains(e.target) && !profileButton.contains(e.target)) {
                        profileModal.classList.remove('active');
                    }
                }
            });

            // Close with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && profileModal.classList.contains('active')) {
                    profileModal.classList.remove('active');
                }
            });

            // Menu item clicks - UPDATED TO SHOW CONTENT
            profileModal.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const text = this.querySelector('.menu-text').textContent.trim();

                    if (this.classList.contains('logout')) {
                        handleLogout();
                    } else {
                        // Map menu text to section names
                        const sectionMap = {
                            'Basic Information': 'basic-info',
                            'My Profile': 'my-profile',
                            'Settings': 'settings',
                            'Notifications': 'notifications',
                            'Privacy & Security': 'privacy',
                            'Help & Support': 'help'
                        };
                        
                        const section = sectionMap[text];
                        if (section) {
                            showProfileSection(section);
                        }
                    }

                    // Close modal
                    profileModal.classList.remove('active');
                });
            });

            console.log('Profile dropdown ready!');
        })
        .catch(err => console.error('Failed to load profile dropdown:', err));
}

// Show profile section
function showProfileSection(section) {
    console.log('Opening section:', section);
    
    // Hide main tabs
    document.getElementById('usersTab-placeholder').style.display = 'none';
    document.getElementById('auditTab-placeholder').style.display = 'none';
    
    // Show profile section
    const profileSection = document.getElementById('profile-section-placeholder');
    profileSection.style.display = 'block';
    
    // Load specific content
    loadProfileContent(section);
    
    // Remove active from nav buttons
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Load profile content
function loadProfileContent(section) {
    const profileSection = document.getElementById('profile-section-placeholder');
    
    let content = '';
    
    switch(section) {
        case 'basic-info':
            content = `
                <div class="profile-content">
                    <div class="profile-header">
                        <button class="back-button" onclick="backToMain()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back
                        </button>
                        <h2>Basic Information</h2>
                    </div>
                    <div class="profile-body">
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Full Name</label>
                                <p>Admin User</p>
                            </div>
                            <div class="info-item">
                                <label>Username</label>
                                <p>admin</p>
                            </div>
                            <div class="info-item">
                                <label>Email</label>
                                <p>admin@example.com</p>
                            </div>
                            <div class="info-item">
                                <label>Role</label>
                                <p>Administrator</p>
                            </div>
                            <div class="info-item">
                                <label>Status</label>
                                <p><span class="badge badge-active">Active</span></p>
                            </div>
                            <div class="info-item">
                                <label>Account Created</label>
                                <p>Jan 1, 2026</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'my-profile':
            content = `
                <div class="profile-content">
                    <div class="profile-header">
                        <button class="back-button" onclick="backToMain()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back
                        </button>
                        <h2>My Profile</h2>
                    </div>
                    <div class="profile-body">
                        <h3>Edit Profile</h3>
                        <p>Profile editing form coming soon...</p>
                    </div>
                </div>
            `;
            break;
            
        case 'settings':
            content = `
                <div class="profile-content">
                    <div class="profile-header">
                        <button class="back-button" onclick="backToMain()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back
                        </button>
                        <h2>Settings</h2>
                    </div>
                    <div class="profile-body">
                        <h3>Application Settings</h3>
                        <p>Settings page coming soon...</p>
                    </div>
                </div>
            `;
            break;
            
        case 'notifications':
            content = `
                <div class="profile-content">
                    <div class="profile-header">
                        <button class="back-button" onclick="backToMain()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back
                        </button>
                        <h2>Notifications</h2>
                    </div>
                    <div class="profile-body">
                        <h3>Notification Center</h3>
                        <p>No new notifications</p>
                    </div>
                </div>
            `;
            break;
            
        case 'privacy':
            content = `
                <div class="profile-content">
                    <div class="profile-header">
                        <button class="back-button" onclick="backToMain()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back
                        </button>
                        <h2>Privacy & Security</h2>
                    </div>
                    <div class="profile-body">
                        <h3>Security Settings</h3>
                        <p>Change password and manage security settings...</p>
                    </div>
                </div>
            `;
            break;
            
        case 'help':
            content = `
                <div class="profile-content">
                    <div class="profile-header">
                        <button class="back-button" onclick="backToMain()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back
                        </button>
                        <h2>Help & Support</h2>
                    </div>
                    <div class="profile-body">
                        <h3>Need Help?</h3>
                        <p>Documentation and support resources coming soon...</p>
                    </div>
                </div>
            `;
            break;
    }
    
    profileSection.innerHTML = content;
}

// Back to main
function backToMain() {
    document.getElementById('profile-section-placeholder').style.display = 'none';
    document.getElementById('usersTab-placeholder').style.display = 'block';
    
    // Re-activate User Management tab
    if (typeof switchTab === 'function') {
        switchTab('users');
    }
}

// Logout
function handleLogout() {
        window.location.href = '../login.html';
}

// Export functions globally
window.showProfileSection = showProfileSection;
window.backToMain = backToMain;
window.handleLogout = handleLogout;

// Load when page is ready
document.addEventListener('DOMContentLoaded', loadProfileDropdown);