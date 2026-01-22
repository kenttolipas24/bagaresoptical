// ==============================================
// Load Appointment Action Modal HTML
// ==============================================
fetch('../components/modals/optometrist/appointment-action-modal.html')
  .then(res => {
    if (!res.ok) {
      throw new Error(`Failed to load modal: ${res.status} ${res.statusText}`);
    }
    return res.text();
  })
  .then(html => {
    const placeholder = document.getElementById('appointment-action-dropdown-placeholder');
    if (!placeholder) {
      console.error('Placeholder element #appointment-action-dropdown-placeholder not found');
      return;
    }
    placeholder.innerHTML = html;
    console.log('Appointment action modal loaded successfully');
    
    // Setup global listeners after HTML is inserted
    setupGlobalClickListener();
  })
  .catch(error => {
    console.error('Error loading appointment action modal:', error);
  });

// ==============================================
// State
// ==============================================
let currentPatientId = null;

// ==============================================
// Open modal when clicking the 3-dot button
// ==============================================
window.openAppointmentActionModal = function(event, patientId) {
  event.stopPropagation();
  
  if (!patientId) {
    console.warn('No patient ID provided to open modal');
    return;
  }
  
  currentPatientId = patientId;

  const modal = document.getElementById('appointmentActionModal');
  if (!modal) {
    console.error('Modal #appointmentActionModal not found in DOM');
    return;
  }

  const content = modal.querySelector('.action-dropdown-content');
  if (!content) {
    console.error('Dropdown content container not found inside modal');
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();

  // Show modal
  modal.classList.add('show');

  // Position dropdown: right-aligned below button
  content.style.position = 'fixed';
  content.style.top      = `${rect.bottom + 8}px`; // 8px spacing
  content.style.left     = `${rect.right - content.offsetWidth}px`;
  content.style.zIndex   = '1001';
};

// ==============================================
// Close modal
// ==============================================
window.closeAppointmentActionModal = function() {
  const modal = document.getElementById('appointmentActionModal');
  if (modal) {
    modal.classList.remove('show');
  }
  currentPatientId = null; // clear state
};

// ==============================================
// Close on outside click or Escape key
// ==============================================
function setupGlobalClickListener() {
  // Click outside
  document.addEventListener('click', function(e) {
    const modal = document.getElementById('appointmentActionModal');
    if (!modal || !modal.classList.contains('show')) return;

    const isClickInside = 
      modal.querySelector('.action-dropdown-content')?.contains(e.target) ||
      e.target.closest('.action-btn');

    if (!isClickInside) {
      closeAppointmentActionModal();
    }
  });

  // Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeAppointmentActionModal();
    }
  });
}

// ==============================================
// Action Handlers
// ==============================================

// View patient details
window.viewPatientDetails = function() {
  if (!currentPatientId) {
    alert('No patient selected');
    return;
  }
  
  console.log('Viewing patient details:', currentPatientId);
  
  // TODO: Implement real view modal or page redirect
  alert(`Viewing full details for patient ID: ${currentPatientId}`);
  
  closeAppointmentActionModal();
};

// Start eye examination
window.eyeExamine = function() {
  if (!currentPatientId) {
    alert('No patient selected');
    return;
  }
  
  console.log('Starting eye exam for patient ID:', currentPatientId);
  
  // Call global eye exam modal if it exists
  if (typeof window.openEyeExamModal === 'function') {
    window.openEyeExamModal(currentPatientId);
  } else {
    // Fallback
    alert(`Eye examination form for patient ID: ${currentPatientId}\n(Implement openEyeExamModal() to show the exam form)`);
  }
  
  closeAppointmentActionModal();
};

// Cancel / delete patient record
window.cancelPatient = function() {
  if (!currentPatientId) return;
  
  if (confirm(`Are you sure you want to cancel/delete patient record ID: ${currentPatientId}?`)) {
    console.log('Cancelling patient record:', currentPatientId);
    
    // TODO: Real API call
    // fetch('../api/cancel_patient.php', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ patient_id: currentPatientId })
    // }).then(res => res.json()).then(data => {
    //   if (data.success) {
    //     alert('Patient record cancelled');
    //     // Refresh table
    //     if (typeof window.updatePatientTable === 'function') {
    //       window.updatePatientTable(currentFilter || 'no-exam');
    //     }
    //   }
    // });
    
    alert(`Patient ID ${currentPatientId} cancelled/deleted (implement API call)`);
    
    // Optional: refresh table
    if (typeof window.updatePatientTable === 'function') {
      window.updatePatientTable(currentFilter || 'no-exam');
    }
  }
  
  closeAppointmentActionModal();
};