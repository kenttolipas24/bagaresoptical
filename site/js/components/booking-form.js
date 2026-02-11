/**
 * js/pages/booking.js - Bagares Optical Clinic
 */

// ===============================
// Load Booking Form HTML (IMPORTANT: DO NOT REMOVE)
// ===============================
fetch('components/booking-form.html')
  .then(res => {
    if (!res.ok) {
      throw new Error('Failed to load booking form HTML');
    }
    return res.text();
  })
  .then(html => {
    const placeholder = document.getElementById('booking-form-placeholder');
    if (!placeholder) {
      throw new Error('booking-form-placeholder not found');
    }

    placeholder.innerHTML = html;
    setMinDate();
    attachFormHandler();
  })
  .catch(err => {
    console.error('Booking form load error:', err);
  });

// ===============================
// Set Minimum Date
// ===============================
function setMinDate() {
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }
}

// ===============================
// Step Navigation (FIXED SCROLL)
// ===============================
let currentStep = 1;
const bookingData = {}; // Global object to store data across steps

window.nextStep = function(stepNumber) {
  if (!validateStep(currentStep)) {
    return;
  }

  // Store data only when moving forward
  if (currentStep === 1 && stepNumber === 2) {
    bookingData.service = document.querySelector('input[name="service"]:checked')?.value;
    bookingData.date    = document.getElementById('date')?.value;
    bookingData.time    = document.getElementById('time')?.value;
  }

  if (currentStep === 2 && stepNumber === 3) {
    bookingData.firstname  = document.getElementById('firstname')?.value.trim();
    bookingData.middlename = document.getElementById('middlename')?.value.trim() || '';
    bookingData.lastname   = document.getElementById('lastname')?.value.trim();
    bookingData.suffix     = document.getElementById('suffix')?.value.trim() || '';
    bookingData.address    = document.getElementById('address')?.value.trim();
    bookingData.birthdate  = document.getElementById('birthdate')?.value;
    bookingData.email      = document.getElementById('email')?.value.trim();
    bookingData.phone      = document.getElementById('phone')?.value.trim() || null;

    populateConfirmation();
  }

  document.getElementById(`step-${currentStep}`).classList.add('hidden');
  document.getElementById(`step-${stepNumber}`).classList.remove('hidden');
  
  currentStep = stepNumber;

  // FIXED: Scroll to the booking section instead of the top of the website
  const bookingSection = document.getElementById('booking');
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.prevStep = function() {
  document.getElementById(`step-${currentStep}`).classList.add('hidden');
  const prevStepNum = currentStep - 1;
  document.getElementById(`step-${prevStepNum}`).classList.remove('hidden');
  
  currentStep = prevStepNum;

  // FIXED: Scroll to the booking section container
  const bookingSection = document.getElementById('booking');
  if (bookingSection) {
    bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// ===============================
// Validate Current Step
// ===============================
function validateStep(step) {
  if (step === 1) {
    const service = document.querySelector('input[name="service"]:checked');
    const date = document.getElementById('date')?.value;
    const time = document.getElementById('time')?.value;
    
    if (!service || !date || !time) {
      alert('Please select a service, date, and time');
      return false;
    }
    return true;
  }
  
  if (step === 2) {
    const firstname = document.getElementById('firstname')?.value.trim();
    const lastname  = document.getElementById('lastname')?.value.trim();
    const address   = document.getElementById('address')?.value.trim();
    const birthdate = document.getElementById('birthdate')?.value;
    const email     = document.getElementById('email')?.value.trim();
    const phone     = document.getElementById('phone')?.value.trim();

    if (!firstname || !lastname || !address || !birthdate || !email) {
      alert('Please fill in all required fields (phone is optional)');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return false;
    }
    
    if (phone !== '') {
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        alert('Phone number must start with 09 and be 11 digits');
        return false;
      }
    }
    return true;
  }
  return true;
}

// ===============================
// Populate Confirmation
// ===============================
function populateConfirmation() {
  const service = document.querySelector('input[name="service"]:checked').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  
  let fullName = `${bookingData.firstname} ${bookingData.middlename} ${bookingData.lastname}`;
  if (bookingData.suffix) fullName += ` ${bookingData.suffix}`;
  
  const dateObj = new Date(date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum % 12 || 12;
  const formattedTime = `${displayHour}:${minute} ${ampm}`;
  
  document.getElementById('confirmation-details').innerHTML = `
    <div class="summary-item">
      <div class="summary-content">
        <div class="summary-label">Service</div>
        <div class="summary-value">${service}</div>
      </div>
    </div>
    <div class="summary-item">
      <div class="summary-content">
        <div class="summary-label">Date & Time</div>
        <div class="summary-value">${formattedDate} at ${formattedTime}</div>
      </div>
    </div>
    <div class="summary-item">
      <div class="summary-content">
        <div class="summary-label">Name</div>
        <div class="summary-value">${fullName}</div>
      </div>
    </div>
    <div class="summary-item">
      <div class="summary-content">
        <div class="summary-label">Contact</div>
        <div class="summary-value">${bookingData.phone || 'N/A'} • ${bookingData.email}</div>
      </div>
    </div>
  `;
}

// ===============================
// Submit Booking
// ===============================
function attachFormHandler() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Submitting...';

    try {
      const res = await fetch('../api/submit_booking.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned an invalid response');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Booking failed');
      }

      alert('✅ Booking confirmed successfully!');
      form.reset();
      document.getElementById('step-3').classList.add('hidden');
      document.getElementById('step-1').classList.remove('hidden');
      currentStep = 1;

      const bookingSection = document.getElementById('booking');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
      }

    } catch (err) {
      console.error('Booking error:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}