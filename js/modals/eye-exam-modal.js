// Load the eye exam modal HTML content first
fetch('../components/modals/optometrist/eye-exam-modal.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('eye-exam-modal-placeholder').innerHTML = data;
  })
  .catch(error => {
    console.error('Error loading eye exam modal:', error);
  });

// Global variable to store current appointment ID
let currentExamAppointmentId = null;

// Function to open eye exam modal - MAKE IT GLOBAL
window.openEyeExamModal = function(appointmentId) {
  currentExamAppointmentId = appointmentId;
  const modal = document.getElementById('eye-exam-modal');
  
  if (!modal) {
    console.error('Eye exam modal not found');
    return;
  }

  console.log('🔍 Opening eye exam for appointment ID:', appointmentId);

  // Show modal FIRST
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Fetch appointment details
  fetch(`../api/get_appointment_details.php?id=${appointmentId}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.error) {
        throw new Error(data.message);
      }
      
      console.log('✅ Patient data received:', data);
      
      // Populate patient information with error checking
      const setTextContent = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = value || '-';
          console.log(`✅ Set ${id}:`, value || '-');
        } else {
          console.error(`❌ Element not found: ${id}`);
        }
      };

      setTextContent('patientName', data.patient_name);
      setTextContent('patientAge', data.age ? `${data.age} years old` : '-');
      setTextContent('patientBirthdate', data.birthdate);
      setTextContent('patientEmail', data.email);
      setTextContent('patientAddress', data.address);

      // Set today's date as default for exam date
      const dateInput = document.getElementById('examDate');
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
      }

      // Check if there's existing exam data
      if (data.exam_data) {
        console.log('📋 Found existing exam data, populating...');
        populateExamData(data.exam_data);
      }
    })
    .catch(error => {
      console.error('❌ Error loading appointment details:', error);
      alert('Error loading patient information: ' + error.message);
    });
}

// Function to populate existing exam data
function populateExamData(examData) {
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

  // Visual acuity
  if (examData.va_dist_od) document.getElementById('va_dist_od').value = examData.va_dist_od;
  if (examData.va_dist_os) document.getElementById('va_dist_os').value = examData.va_dist_os;
  if (examData.va_near_od) document.getElementById('va_near_od').value = examData.va_near_od;
  if (examData.va_near_os) document.getElementById('va_near_os').value = examData.va_near_os;

  // Lens recommendation
  if (examData.lens_type) document.getElementById('lensType').value = examData.lens_type;
  if (examData.lens_material) document.getElementById('lensMaterial').value = examData.lens_material;

  // Coatings
  if (examData.coatings) {
    const coatings = examData.coatings.split(',');
    if (coatings.includes('Anti-Reflective')) document.getElementById('coating_ar').checked = true;
    if (coatings.includes('Blue Light Filter')) document.getElementById('coating_blue').checked = true;
    if (coatings.includes('Photochromic')) document.getElementById('coating_photo').checked = true;
  }

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
    alert('No appointment selected');
    return;
  }

  const examData = {
    appointment_id: currentExamAppointmentId,
    exam_date: document.getElementById('examDate').value,

    // Refraction
    od_sph: document.getElementById('od_sph').value,
    od_cyl: document.getElementById('od_cyl').value,
    od_axis: document.getElementById('od_axis').value,
    od_add: document.getElementById('od_add').value,

    os_sph: document.getElementById('os_sph').value,
    os_cyl: document.getElementById('os_cyl').value,
    os_axis: document.getElementById('os_axis').value,
    os_add: document.getElementById('os_add').value,

    pd: document.getElementById('pd').value,

    // Lens Recommendation
    lens_type: document.getElementById('lensType').value,
    lens_material: document.getElementById('lensMaterial').value,

    // Notes
    notes: document.getElementById('examNotes').value
  };

  if (!examData.exam_date) {
    alert('Please select exam date');
    return;
  }

  fetch('../api/save_eye_exam.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(examData)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Eye examination saved successfully!');
      closeEyeExamModal();
    } else {
      alert('Error saving examination: ' + (data.message || 'Unknown error'));
    }
  })
  .catch(error => {
    console.error('Error saving eye exam:', error);
    alert('Error saving examination. Please try again.');
  });
};


// Helper function to get selected coatings
function getSelectedCoatings() {
  const coatings = [];
  if (document.getElementById('coating_ar').checked) coatings.push('Anti-Reflective');
  if (document.getElementById('coating_blue').checked) coatings.push('Blue Light Filter');
  if (document.getElementById('coating_photo').checked) coatings.push('Photochromic');
  return coatings.join(',');
}

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