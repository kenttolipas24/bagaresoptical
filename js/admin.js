// MUST RUN FIRST
requireRole("admin");

console.log("Admin dashboard loaded");

// Example: navbar loader
fetch("../components/admin/navbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("navbar-placeholder").innerHTML = html;
    });
