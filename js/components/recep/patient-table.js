// Load the patient table HTML content into the placeholder
fetch('../components/receptionist/patient-table.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('patient_table-placeholder').innerHTML = data;
    
    // Initialize table after loading
    initializePatientTable();
  })
  .catch(error => {
    console.error('Error loading patient table:', error);
  });

function initializePatientTable() {
  // Wait a bit for HTML to render
  setTimeout(() => {
    // Load and display initial data
    updatePatientTable();
    
    // Initialize search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.patient-table tbody tr');
        
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
      });
    }

    // Add event listeners for closing dropdown
    if (typeof setupDropdownListeners === 'function') {
      setupDropdownListeners();
    }
  }, 100);
}

// Make updatePatientTable function global so modal can call it
window.updatePatientTable = function() {
  const tbody = document.querySelector('.patient-table tbody');
  if (!tbody) {
    console.error('Patient table body not found');
    return;
  }
  
  // Load patients from localStorage (empty by default)
  let patients = JSON.parse(localStorage.getItem('patients')) || [];
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  // Show message if no patients exist
  if (patients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
          No patients found. Click "Add Patient" to add your first patient.
        </td>
      </tr>
    `;
    return;
  }
  
  // Add all patients to table
  patients.forEach((patient) => {
    const fullName = `${patient.firstName} ${patient.middleInitial || ''} ${patient.lastName}`.trim();
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${fullName}</td>
      <td>${patient.address || 'N/A'}</td>
      <td>${patient.lastVisit || 'N/A'}</td>
      <td>${(patient.prescription || 'No prescription yet').replace(/\n/g, '<br>')}</td>
      <td><span class="status ${(patient.status || 'active').toLowerCase()}">${patient.status || 'Active'}</span></td>
      <td>
        <div class="action-btn-container">
          <button class="action-btn" onclick="toggleActionDropdown(event, ${patient.id})">⋮</button>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}