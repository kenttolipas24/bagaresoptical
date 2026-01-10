/*********************************************************
 * 1. GLOBAL STATE (DECLARE FIRST!)
 *********************************************************/
let users = [];

/*********************************************************
 * 2. LOAD USER TAB HTML
 *********************************************************/
fetch('../components/admin/user-tab.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('usersTab-placeholder').innerHTML = html;
        loadUsers(); // load from database AFTER HTML exists
    })
    .catch(err => console.error('Error loading user tab:', err));

/*********************************************************
 * 3. LOAD USERS FROM DATABASE
 *********************************************************/
function loadUsers() {
    fetch('../api/get_user.php')
        .then(res => res.json())
        .then(data => {
            users = data;
            renderUsers();
        })
        .catch(err => console.error('Failed to load users:', err));
}

/*********************************************************
 * 4. RENDER USERS
 *********************************************************/
function renderUsers(filteredUsers = users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:2rem;color:#6b7280">
                    No users found
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filteredUsers.map(user => {
        const fullName =
            `${user.firstname} ${user.middlename || ''} ${user.lastname}${user.suffix ? ', ' + user.suffix : ''}`;

        // Format the date
        const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';

        return `
        <tr>
            <td>
                <div class="user-info">${fullName}</div>
                <div class="user-id">ID: ${user.id}</div>
            </td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-role">${user.role}</span></td>
            <td>${createdDate}</td>
        </tr>`;
    }).join('');
}

/*********************************************************
 * 5. FILTER USERS
 *********************************************************/
function filterUsers() {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || 'all';

    const filtered = users.filter(user => {
        const fullName =
            `${user.firstname} ${user.middlename || ''} ${user.lastname} ${user.suffix || ''}`.toLowerCase();

        return (
            (fullName.includes(searchTerm) ||
             user.email.toLowerCase().includes(searchTerm) ||
             user.username.toLowerCase().includes(searchTerm)) &&
            (roleFilter === 'all' || user.role === roleFilter)
        );
    });

    renderUsers(filtered);
}

/*********************************************************
 * 6. PLACEHOLDER FOR ADD USER MODAL
 *********************************************************/
function openAddUserModal() {
    console.log('Open add user modal');
}

/*********************************************************
 * 7. EXPORTS
 *********************************************************/
window.loadUsers = loadUsers;
window.filterUsers = filterUsers;
window.openAddUserModal = openAddUserModal;