function requireRole(pageRole) {
    fetch("/bagares/api/auth_check.php", {
        credentials: "same-origin"
    })
    .then(res => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
    })
    .then(user => {
        console.log("Auth check - User role from session:", user.role); // DEBUG
        
        const role = user.role.toLowerCase().trim();
        console.log("Normalized role:", role); // DEBUG
        
        // ROLE COMPATIBILITY MAP
        const roleMap = {
            admin: ["admin"],
            manager: ["manager"],
            optometrist: ["optometrist"],
            receptionist: ["receptionist", "secretary/cashier", "secretary", "cashier"]
        };

        console.log("Checking against:", roleMap[pageRole]); // DEBUG
        
        if (!roleMap[pageRole]) {
            console.error("Invalid page role:", pageRole);
            window.location.href = "/bagares/login.html";
            return;
        }
        
        if (!roleMap[pageRole].includes(role)) {
            console.error("Access denied. User role:", role, "Required:", roleMap[pageRole]);
            window.location.href = "/bagares/login.html";
            return;
        }
        
        console.log("Access granted!"); // DEBUG
    })
    .catch(error => {
        console.error("Auth error:", error);
        window.location.href = "/bagares/login.html";
    });
}