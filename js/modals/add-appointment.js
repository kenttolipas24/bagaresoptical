// =============================================
// Load Add Appointment Modal
// =============================================
fetch('../components/modals/add-appointment.html')
  .then(res => {
    if (!res.ok) throw new Error(`Failed to load modal: ${res.status}`);
    return res.text();
  })
  .then(data => {
    const placeholder = document.getElementById('add-appointment-modal-placeholder');
    if (!placeholder) {
      console.error('Placeholder #add-appointment-modal-placeholder not found in page');
      return;
    }

    placeholder.innerHTML = data;
    console.log('Add appointment modal loaded successfully');

    // Give DOM a moment to parse the new HTML
    setTimeout(() => {
      setupModalEventListeners();
    }, 50);
  })
  .catch(err => {
    console.error('Error loading add appointment modal:', err);
  });

// =============================================
// Setup modal behavior after load
// =============================================
function setupModalEventListeners() {
  const modal = document.getElementById('addAppointmentModal');
  if (!modal) {
    console.error('Modal #addAppointmentModal not found after insertion');
    return;
  }

  console.log('Modal found – listeners attached');

  // Close when clicking outside (overlay)
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeAddAppointmentModal();
    }
  });

  // Set minimum date = today
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }
}

// =============================================
// Global ESC key to close modal
// =============================================
document.addEventListener('keydown', function(e) {
  const modal = document.getElementById('addAppointmentModal');
  if (e.key === 'Escape' && modal?.classList.contains('show')) {
    closeAddAppointmentModal();
  }
});

// =============================================
// Open / Close Modal
// =============================================
window.openAddAppointmentModal = function() {
  const modal = document.getElementById('addAppointmentModal');
  if (!modal) {
    console.error('Cannot open modal – #addAppointmentModal not found');
    return;
  }
  modal.classList.add('show');
};

window.closeAddAppointmentModal = function() {
  const modal = document.getElementById('addAppointmentModal');
  if (modal) {
    modal.classList.remove('show');
    const warning = document.getElementById('conflictWarning');
    if (warning) warning.classList.add('hidden');
  }

  const form = document.getElementById('appointmentForm');
  if (form) form.reset();
};

// =============================================
// Save Appointment – FIXED VERSION
// =============================================
window.saveAppointment = async function() {
  const form = document.getElementById('appointmentForm');
  if (!form) {
    console.error('Form #appointmentForm not found');
    alert('Error: Form not found. Please check modal HTML.');
    return;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Gather values with safety checks
  const getValue = (id) => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`Element #${id} not found`);
      return '';
    }
    return el.value.trim();
  };

  const data = {
    firstname:        getValue('firstname'),
    middlename:       getValue('middlename') || null,
    lastname:         getValue('lastname'),
    suffix:           getValue('suffix') || null,
    phone:            getValue('phone') || null,
    email:            getValue('email') || null,
    appointment_date: getValue('appointmentDate'),
    appointment_time: getValue('appointmentTime'),
    service:          getValue('service'),
    notes:            getValue('notes') || null
  };

  // Required fields quick check
  if (!data.firstname || !data.lastname || !data.appointment_date || 
      !data.appointment_time || !data.service) {
    alert('Please fill all required fields.');
    return;
  }

  const warning = document.getElementById('conflictWarning');

  try {
    // 1. Check if time slot is already taken
    const checkRes = await fetch('../api/check_appointment_slot.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time
      })
    });

    if (!checkRes.ok) {
      throw new Error(`Conflict check failed: ${checkRes.status}`);
    }

    const check = await checkRes.json();

    if (check.conflict === true) {
      if (warning) warning.classList.remove('hidden');
      return;
    }

    // 2. Create patient (if needed) + appointment
    const saveRes = await fetch('../api/save_appointment.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!saveRes.ok) {
      throw new Error(`Save failed: ${saveRes.status}`);
    }

    const result = await saveRes.json();

    if (result.success) {
      alert('Appointment added successfully!');
      closeAddAppointmentModal();
      // Refresh table if function exists
      if (typeof window.refreshAppointments === 'function') {
        window.refreshAppointments();
      }
    } else {
      alert('Error from server: ' + (result.error || 'Unknown error'));
    }

  } catch (err) {
    console.error('Appointment save failed:', err);
    alert('Error: ' + err.message);
  }
};