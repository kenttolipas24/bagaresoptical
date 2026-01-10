// role protection
requireRole("optometrist");

// ===============================
// OPTOMETRIST PAGE LOGIC BELOW
// ===============================
console.log("Optometrist panel loaded");

// load navbar
fetch("../components/optometrists/navbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("navbar-placeholder").innerHTML = html;
    });

// load profile dropdown
fetch("../api/auth_check.php")
    .then(res => res.json())
    .then(user => {
        document.querySelector(".profile-name").textContent =
            user.firstname + " " + user.lastname;
        document.querySelector(".profile-role").textContent =
            user.role;
    });

// add your existing optometrist JS here
