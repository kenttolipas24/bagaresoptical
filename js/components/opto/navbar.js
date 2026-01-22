// navbar.js - FIXED with proper active state highlighting

fetch('../components/optometrists/navbar.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;

    // Show Appointment by default on page load
    changePage('appointment');
    
    // Mark Appointment button as active by default
    setTimeout(() => {
      const appointmentBtn = document.querySelector('.nav-button[onclick*="appointment"]');
      if (appointmentBtn) {
        appointmentBtn.classList.add('active');
      }
    }, 0);
  })
  .catch(error => console.error('Error loading navbar:', error));

// Single function to switch pages
function changePage(pageId, event) {
  console.log('Switching to:', pageId);

  // Update active state on buttons
  const buttons = document.querySelectorAll('.nav-button');
  buttons.forEach(b => b.classList.remove('active'));
  
  // Add active to the clicked button
  const activeBtn = document.querySelector(`.nav-button[onclick*="${pageId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  // Hide all placeholders
  document.getElementById('Cal&Det-placeholder').style.display = 'none';
  document.getElementById('patient-record-placeholder').style.display = 'none';
  document.getElementById('eye-exam-results-placeholder').style.display = 'none';
  document.getElementById('reports-placeholder').style.display = 'none';

  // Show the correct one
  if (pageId === 'appointment') {
    document.getElementById('Cal&Det-placeholder').style.display = 'block';
  } else if (pageId === 'patient-record') {
    document.getElementById('patient-record-placeholder').style.display = 'block';
  } else if (pageId === 'eye-exam-results') {
    document.getElementById('eye-exam-results-placeholder').style.display = 'block';
  } else if (pageId === 'reports') {
    document.getElementById('reports-placeholder').style.display = 'block';
  }
}

// Optional: If you need to manually trigger page changes from elsewhere in your code
function setActivePage(pageId) {
  const buttons = document.querySelectorAll('.nav-button');
  
  // Remove active from all
  buttons.forEach(b => b.classList.remove('active'));
  
  // Find and activate the correct button
  const targetBtn = document.querySelector(`.nav-button[onclick*="${pageId}"]`);
  if (targetBtn) {
    targetBtn.classList.add('active');
  }
  
  // Switch page
  changePage(pageId);
}