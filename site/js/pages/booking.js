/**
 * js/pages/booking.js - Bagares Optical Clinic
 * Enhanced Version with Conflict Protection
 */

// Use a conditional check to prevent "already declared" errors
if (typeof currentStep === 'undefined') {
    window.currentStep = 1;
}

// Ensure bookingData is globally available but not re-declared
if (typeof bookingData === 'undefined') {
    window.bookingData = {};
}

document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure HTML from components is fully injected
    setTimeout(initializeBooking, 200);
});

function initializeBooking() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
    }

    const birthdateInput = document.getElementById('birthdate');
    if (birthdateInput) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        birthdateInput.max = oneYearAgo.toISOString().split('T')[0];
    }

    document.querySelectorAll('input[name="service"]').forEach(radio => {
        radio.addEventListener('change', handleServiceSelection);
    });
}

function handleServiceSelection(event) {
    document.querySelectorAll('.check-icon').forEach(icon => {
        icon.style.opacity = '0';
        icon.style.transform = 'scale(0.8)';
    });

    const selectedLabel = event.target.nextElementSibling;
    if (selectedLabel) {
        const checkIcon = selectedLabel.querySelector('.check-icon');
        if (checkIcon) {
            checkIcon.style.opacity = '1';
            checkIcon.style.transform = 'scale(1)';
        }
    }
}

window.nextStep = function(step) {
    if (currentStep === 1 && step === 2) {
        const service = document.querySelector('input[name="service"]:checked');
        const date = document.getElementById('date');
        const time = document.getElementById('time');

        if (!service || !date.value || !time.value) {
            alert('Please complete all fields before proceeding');
            return;
        }

        bookingData.service = service.value;
        bookingData.date = date.value;
        bookingData.time = time.value;
    }

    if (currentStep === 2 && step === 3) {
        const firstname = document.getElementById('firstname');
        const middlename = document.getElementById('middlename');
        const lastname = document.getElementById('lastname');
        const address = document.getElementById('address');
        const birthdate = document.getElementById('birthdate');
        const email = document.getElementById('email');

        if (!firstname.value.trim() || !lastname.value.trim() || 
            !address.value.trim() || !birthdate.value || !email.value.trim()) {
            alert('Please complete all required fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            alert('Please enter a valid email address');
            return;
        }

        bookingData.firstname = firstname.value.trim();
        bookingData.middlename = middlename.value.trim() || '';
        bookingData.lastname = lastname.value.trim();
        bookingData.suffix = document.getElementById('suffix')?.value.trim() || '';
        bookingData.fullname = `${bookingData.firstname} ${bookingData.middlename} ${bookingData.lastname} ${bookingData.suffix}`.trim();
        bookingData.address = address.value.trim();
        bookingData.birthdate = birthdate.value;
        bookingData.email = email.value.trim();

        generateConfirmation();
    }

    document.getElementById(`step-${currentStep}`)?.classList.add('hidden');
    currentStep = step;
    document.getElementById(`step-${step}`)?.classList.remove('hidden');

    updateSidebarSteps(step);

    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.prevStep = function() {
    if (currentStep > 1) {
        const previousStep = currentStep - 1;
        document.getElementById(`step-${currentStep}`)?.classList.add('hidden');
        currentStep = previousStep;
        document.getElementById(`step-${previousStep}`)?.classList.remove('hidden');

        updateSidebarSteps(previousStep);

        const bookingSection = document.getElementById('booking');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
};

function updateSidebarSteps(step) {
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (indicator) {
            if (i < step) {
                indicator.classList.remove('inactive');
                indicator.classList.add('completed');
            } else if (i === step) {
                indicator.classList.remove('inactive', 'completed');
            } else {
                indicator.classList.add('inactive');
                indicator.classList.remove('completed');
            }
        }
    }
}

function generateConfirmation() {
    const confirmationDiv = document.getElementById('confirmation-details');
    if (!confirmationDiv) return;

    const dateObj = new Date(bookingData.date + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const [hours, minutes] = bookingData.time.split(':');
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const formattedTime = `${parseInt(hours) % 12 || 12}:${minutes} ${ampm}`;

    confirmationDiv.innerHTML = `
        <h3>Booking Summary</h3>
        <div class="summary-item">
            <div class="summary-content">
                <div class="summary-label">Service</div>
                <div class="summary-value">${bookingData.service}</div>
            </div>
        </div>
        <div class="summary-item">
            <div class="summary-content">
                <div class="summary-label">Appointment</div>
                <div class="summary-value">${formattedDate} at ${formattedTime}</div>
            </div>
        </div>
        <div class="summary-item">
            <div class="summary-content">
                <div class="summary-label">Patient</div>
                <div class="summary-value">${bookingData.fullname}</div>
            </div>
        </div>
        <div class="summary-item">
            <div class="summary-content">
                <div class="summary-label">Address</div>
                <div class="summary-value">${bookingData.address}</div>
            </div>
        </div>
    `;
}