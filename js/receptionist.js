// role protection
requireRole("receptionist");

console.log("=== RECEPTIONIST PAGE LOADED ===");

// ===============================
// SECRETARY/CASHIER PAGE LOGIC BELOW
// ===============================

// load navbar first
fetch("../components/receptionist/navbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("navbar-placeholder").innerHTML = html;
        
        // THEN load profile dropdown data after navbar is loaded
        return fetch("../api/auth_check.php", {
            credentials: "same-origin"
        });
    })
    .then(res => res.json())
    .then(user => {
        console.log("Profile loaded:", user);
        
        const profileName = document.querySelector(".profile-name");
        const profileRole = document.querySelector(".profile-role");
        
        if (profileName && profileRole) {
            profileName.textContent = user.firstname + " " + user.lastname;
            // ✅ Show original role with proper capitalization
            profileRole.textContent = user.original_role || user.role;
        }
    })
    .catch(error => {
        console.error("Error loading profile:", error);
    });