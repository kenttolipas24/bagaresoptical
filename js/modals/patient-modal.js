// ================================================
//  PATIENT MODAL (patient-modal.js)
// ================================================

// Load the patient modal HTML first
fetch('../components/modals/patient-modal.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('patient-modals-placeholder').innerHTML = data;
    
    initializePatientModal();
  })
  .catch(error => {
    console.error('Error loading patient modal:', error);
  });


// ────────────────────────────────────────────────
// initialize Patient Modal
// ────────────────────────────────────────────────
function initializePatientModal() {
  const patientForm = document.getElementById('patientRecordForm');
  if (patientForm) {
    patientForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const patientData = {
        firstname: document.getElementById('patientFirstName').value,
        middlename: document.getElementById('patientMiddleInitial').value,
        lastname: document.getElementById('patientLastName').value,
        suffix: document.getElementById('patientSuffix').value,
        email: document.getElementById('patientEmail').value,
        birthdate: document.getElementById('patientDateOfBirth').value,
        address: document.getElementById('patientAddress').value,
        phone: document.getElementById('patientContactNumber').value
      };

      console.log('📤 Sending patient data:', patientData);
      
      // Send to API
      fetch('../api/add_patient.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Patient added successfully!');
          console.log('✅ Patient added with ID:', data.patient_id);
          
          // Update the table if the function exists
          if (typeof window.updatePatientTable === 'function') {
            window.updatePatientTable();
          }
          
          // Close modal
          closePatientModal();
        } else {
          alert('Error adding patient: ' + (data.error || 'Unknown error'));
          console.error('❌ Error:', data.error);
        }
      })
      .catch(error => {
        console.error('❌ Network error:', error);
        alert('Failed to add patient. Please try again.');
      });
    });
  }

  // Close modal when clicking overlay
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('patient-modal-overlay')) {
      closePatientModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('patientRecordModal');
      if (modal && modal.classList.contains('active')) {
        closePatientModal();
      }
    }
  });
}

// ────────────────────────────────────────────────
// Patient Modal Functions
// ────────────────────────────────────────────────
window.openPatientModal = function(mode = 'add', patientData = null) {
  const modal = document.getElementById('patientRecordModal');
  
  if (!modal) {
    console.error('Patient modal not found!');
    return;
  }

  const modalTitle = document.getElementById('patientModalTitle');
  const form = document.getElementById('patientRecordForm');
  const submitBtn = form.querySelector('.patient-btn-submit');

  if (mode === 'edit' && patientData) {
    modalTitle.textContent = 'Edit Patient';
    submitBtn.textContent = 'Update Patient';
    
    // Store patient ID for updating
    form.dataset.patientId = patientData.id;
    
    // Fill form with patient data
    document.getElementById('patientFirstName').value = patientData.firstName || '';
    document.getElementById('patientMiddleInitial').value = patientData.middleInitial || '';
    document.getElementById('patientLastName').value = patientData.lastName || '';
    document.getElementById('patientSuffix').value = patientData.suffix || '';
    document.getElementById('patientEmail').value = patientData.email || '';
    document.getElementById('patientDateOfBirth').value = patientData.dateOfBirth || '';
    document.getElementById('patientAddress').value = patientData.address || '';
    document.getElementById('patientContactNumber').value = patientData.contactNumber || '';
  } else {
    modalTitle.textContent = 'Add Patient';
    submitBtn.textContent = 'Add Patient';
    delete form.dataset.patientId;
    form.reset();
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

window.closePatientModal = function() {
  const modal = document.getElementById('patientRecordModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}