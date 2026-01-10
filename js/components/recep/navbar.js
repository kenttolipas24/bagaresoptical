// Load navbar
fetch('../components/receptionist/navbar.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;
    
    // Add event listeners after navbar is loaded
    setupNavigation();
  })
  .catch(error => {
    console.error('Error loading navbar:', error);
  });

function setupNavigation() {
  // Get all navigation buttons
  const navButtons = document.querySelectorAll('.nav-button');
  
  navButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get the page from data attribute
      const page = this.getAttribute('data-page');
      
      // Remove active class from all buttons
      navButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Show the corresponding section
      showSection(page);
    });
  });
}

function showSection(section) {
  const patientSection = document.getElementById('patient_table-placeholder');
  const appointmentSection = document.getElementById('appointment-section');
  const salesSection = document.getElementById('sales-section');
  const requestSection = document.getElementById('request-section');
  
  // Hide all sections
  if (patientSection) patientSection.style.display = 'none';
  if (appointmentSection) appointmentSection.style.display = 'none';
  if (salesSection) salesSection.style.display = 'none';
  if (requestSection) requestSection.style.display = 'none';
  
  // Show the selected section
  if (section === 'patient' && patientSection) {
    patientSection.style.display = 'block';
  } else if (section === 'appointment' && appointmentSection) {
    appointmentSection.style.display = 'block';
  } else if (section === 'sales' && salesSection) {
    salesSection.style.display = 'block';
  } else if (section === 'request' && requestSection) {
    requestSection.style.display = 'block';
  }
}