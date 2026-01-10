function requireRole(role) {
    fetch("/bagares/api/auth_check.php", {
        credentials: "same-origin"
    })
    .then(res => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
    })
    .then(user => {
        if (user.role.toLowerCase() !== role.toLowerCase()) {
            window.location.href = "/bagares/login.html";
        }
    })
    .catch(() => {
        window.location.href = "/bagares/login.html";
    });
}
