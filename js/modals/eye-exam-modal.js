// Load the eye exam modal HTML content first
fetch('../components/modals/optometrist/eye-exam-modal.html')
  .then(res => res.text())
  .then(data => {
    const placeholder = document.getElementById('eye-exam-modal-placeholder');
    if (placeholder) {
      placeholder.innerHTML = data;
      console.log('✅ Eye exam modal HTML loaded');
    } else {
      console.error('❌ Placeholder #eye-exam-modal-placeholder not found');
    }
  })
  .catch(error => {
    console.error('❌ Error loading eye exam modal:', error);
  });

// Global variable to store current patient/appointment ID
let currentExamAppointmentId = null;

// Function to open eye exam modal - accepts patient_id or appointment_id
window.openEyeExamModal = function(id) {
  currentExamAppointmentId = id;
  const modal = document.getElementById('eye-exam-modal');
  
  if (!modal) {
    console.error('❌ Eye exam modal not found');
    return;
  }

  console.log('🔍 Opening eye exam for ID:', id);

  // Show modal FIRST
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Fetch patient details
  fetch(`../api/get_appointment_details.php?id=${id}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      console.log('📦 Full response:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load patient data');
      }
      
      console.log('✅ Patient data received successfully');
      
      // Populate patient information with slight delay to ensure DOM is ready
      setTimeout(() => {
        const nameEl = document.getElementById('patientName');
        const ageEl = document.getElementById('patientAge');
        const bdayEl = document.getElementById('patientBirthdate');
        const emailEl = document.getElementById('patientEmail');
        const addrEl = document.getElementById('patientAddress');
        
        if (nameEl) {
          nameEl.textContent = data.patient_name || '-';
          console.log('✅ Set patientName:', data.patient_name);
        } else {
          console.error('❌ patientName element not found!');
        }
        
        if (ageEl) ageEl.textContent = data.age ? `${data.age} years old` : '-';
        if (bdayEl) bdayEl.textContent = data.birthdate || '-';
        if (emailEl) emailEl.textContent = data.email || '-';
        if (addrEl) addrEl.textContent = data.address || '-';
        
        console.log('✅ All patient info populated');
      }, 100);

      // Set today's date as default for exam date
      const dateInput = document.getElementById('examDate');
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
      }

      // Check if there's existing exam data
      if (data.has_exam && data.exam_data) {
        console.log('📋 Found existing exam data, populating...');
        populateExamData(data.exam_data);
      } else {
        console.log('ℹ️ No existing exam data');
      }
    })
    .catch(error => {
      console.error('❌ Error loading patient details:', error);
      alert('Error loading patient information: ' + error.message);
    });
}

// Function to populate existing exam data
function populateExamData(examData) {
  console.log('📝 Populating exam data:', examData);
  
  // Exam date
  if (examData.exam_date) {
    const dateInput = document.getElementById('examDate');
    if (dateInput) {
      const examDate = new Date(examData.exam_date);
      dateInput.value = examDate.toISOString().split('T')[0];
    }
  }

  // Refraction data
  if (examData.od_sph) document.getElementById('od_sph').value = examData.od_sph;
  if (examData.od_cyl) document.getElementById('od_cyl').value = examData.od_cyl;
  if (examData.od_axis) document.getElementById('od_axis').value = examData.od_axis;
  if (examData.od_add) document.getElementById('od_add').value = examData.od_add;
  if (examData.os_sph) document.getElementById('os_sph').value = examData.os_sph;
  if (examData.os_cyl) document.getElementById('os_cyl').value = examData.os_cyl;
  if (examData.os_axis) document.getElementById('os_axis').value = examData.os_axis;
  if (examData.os_add) document.getElementById('os_add').value = examData.os_add;
  if (examData.pd) document.getElementById('pd').value = examData.pd;

  // Lens recommendation
  if (examData.lens_type) document.getElementById('lensType').value = examData.lens_type;
  if (examData.lens_material) document.getElementById('lensMaterial').value = examData.lens_material;

  // Notes
  if (examData.notes) document.getElementById('examNotes').value = examData.notes;
}

// Function to close eye exam modal
window.closeEyeExamModal = function() {
  const modal = document.getElementById('eye-exam-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Reset form
    resetExamForm();
    currentExamAppointmentId = null;
  }
}

// Function to reset exam form
function resetExamForm() {
  const inputs = document.querySelectorAll('#eye-exam-modal input:not([readonly]), #eye-exam-modal select, #eye-exam-modal textarea');
  inputs.forEach(input => {
    if (input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
}

// Function to save eye examination
window.saveEyeExam = function() {
  if (!currentExamAppointmentId) {
    alert('No patient selected');
    return;
  }

  const examData = {
    patient_id: currentExamAppointmentId, // This is the patient ID
    exam_date: document.getElementById('examDate').value,

    // Refraction
    od_sph: document.getElementById('od_sph').value || null,
    od_cyl: document.getElementById('od_cyl').value || null,
    od_axis: document.getElementById('od_axis').value || null,
    od_add: document.getElementById('od_add').value || null,

    os_sph: document.getElementById('os_sph').value || null,
    os_cyl: document.getElementById('os_cyl').value || null,
    os_axis: document.getElementById('os_axis').value || null,
    os_add: document.getElementById('os_add').value || null,

    pd: document.getElementById('pd').value || null,

    // Lens Recommendation
    lens_type: document.getElementById('lensType').value || null,
    lens_material: document.getElementById('lensMaterial').value || null,

    // Notes
    notes: document.getElementById('examNotes').value || null
  };

  if (!examData.exam_date) {
    alert('Please select exam date');
    return;
  }

  console.log('💾 Saving exam data:', examData);

  fetch('../api/save_eye_exam.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(examData)
  })
  .then(res => res.json())
  .then(data => {
    console.log('📤 Save response:', data);
    if (data.success) {
      alert('Eye examination saved successfully!');
      closeEyeExamModal();
      
      // Refresh table if function exists
      if (typeof updatePatientTable === 'function') {
        updatePatientTable();
      }
    } else {
      alert('Error saving examination: ' + (data.message || 'Unknown error'));
    }
  })
  .catch(error => {
    console.error('❌ Error saving eye exam:', error);
    alert('Error saving examination. Please try again.');
  });
};

// Close modal when clicking outside
window.addEventListener('click', function(event) {
  const modal = document.getElementById('eye-exam-modal');
  if (event.target === modal) {
    closeEyeExamModal();
  }
});

// Close modal on ESC key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    const modal = document.getElementById('eye-exam-modal');
    if (modal && modal.classList.contains('active')) {
      closeEyeExamModal();
    }
  }
});