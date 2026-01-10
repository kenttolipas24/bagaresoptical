// role protection
requireRole("optometrist");

// ===============================
// OPTOMETRIST PAGE LOGIC BELOW
// ===============================
console.log("Optometrist panel loaded");

// load navbar first
fetch("../components/optometrists/navbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("navbar-placeholder").innerHTML = html;
        
        // THEN load profile dropdown data after navbar is loaded
        return fetch("../api/auth_check.php");
    })
    .then(res => res.json())
    .then(user => {
        const profileName = document.querySelector(".profile-name");
        const profileRole = document.querySelector(".profile-role");
        
        if (profileName && profileRole) {
            profileName.textContent = user.firstname + " " + user.lastname;
            profileRole.textContent = user.role;
        }
    })
    .catch(error => {
        console.error("Error loading profile:", error);
    });

// add your existing optometrist JS here