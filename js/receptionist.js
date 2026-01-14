// role protection
requireRole("receptionist");

console.log("=== RECEPTIONIST PAGE LOADED ===");

// Load profile data
fetch("../api/auth_check.php", {
    credentials: "same-origin"
})
.then(res => res.json())
.then(user => {
    console.log("Profile loaded:", user);
    
    // Wait for navbar to load, then update profile
    setTimeout(() => {
        const profileName = document.querySelector(".profile-name");
        const profileRole = document.querySelector(".profile-role");
        
        if (profileName && profileRole) {
            profileName.textContent = user.firstname + " " + user.lastname;
            profileRole.textContent = user.original_role || user.role;
        }
    }, 500);
})
.catch(error => {
    console.error("Error loading profile:", error);
});

// Setup navigation after everything is loaded
setTimeout(() => {
    setupNavigation();
    showSection('patient'); // Show patient section by default
}, 1000);

// Navigation setup function
function setupNavigation() {
    console.log('🔧 Setting up navigation...');
    
    const navButtons = document.querySelectorAll('.nav-button');
    
    if (navButtons.length === 0) {
        console.error('❌ No navigation buttons found!');
        return;
    }
    
    console.log('✅ Found', navButtons.length, 'navigation buttons');
    
    // Set Patient button as active by default
    const patientBtn = document.querySelector('[data-page="patient"]');
    if (patientBtn) {
        patientBtn.classList.add('active');
        console.log('✅ Patient button set as active');
    }
    
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const page = this.getAttribute('data-page');
            console.log('🖱️ Navigation clicked:', page);
            
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show the corresponding section
            showSection(page);
        });
    });
}



// Make functions globally accessible
window.setupNavigation = setupNavigation;
window.showSection = showSection;