// Load navbar
fetch('../components/admin/navbar.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;

    // Show users tab by default on page load
    switchTab('users');
  })
  .catch(error => console.error('Error loading navbar:', error));

// Function to switch between tabs
function switchTab(pageId) {
  console.log('Switching to:', pageId);

  // Get all tab placeholders
  const usersTab = document.getElementById('usersTab-placeholder');
  const auditTab = document.getElementById('auditTab-placeholder');

  // Hide all tabs
  usersTab.style.display = 'none';
  auditTab.style.display = 'none';

  // Show the selected tab
  if (pageId === 'users') {
    usersTab.style.display = 'block';
  } else if (pageId === 'audit') {
    auditTab.style.display = 'block';
  }

  // Update active state on buttons
  const buttons = document.querySelectorAll('.nav-button');
  buttons.forEach(btn => {
    const onclick = btn.getAttribute('onclick');
    if (onclick && onclick.includes(pageId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Export for global use
window.switchTab = switchTab;