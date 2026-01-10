// Enhanced Booking Page JavaScript

let currentStep = 1;
const bookingData = {};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the form to be loaded via fetch
    setTimeout(initializeBooking, 100);
});

function initializeBooking() {
    // Set minimum date to today for appointment date
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Set maximum date for birthdate (must be at least 1 year old)
    const birthdateInput = document.getElementById('birthdate');
    if (birthdateInput) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        birthdateInput.max = oneYearAgo.toISOString().split('T')[0];
    }

    // Add radio button listeners for visual feedback
    const radioInputs = document.querySelectorAll('input[name="service"]');
    radioInputs.forEach(radio => {
        radio.addEventListener('change', handleServiceSelection);
    });

    console.log('Booking form initialized');
}

function handleServiceSelection(event) {
    // Hide all check icons first
    document.querySelectorAll('.check-icon').forEach(icon => {
        icon.style.opacity = '0';
        icon.style.transform = 'scale(0.8)';
    });

    // Show check icon for selected service
    const selectedLabel = event.target.nextElementSibling;
    if (selectedLabel) {
        const checkIcon = selectedLabel.querySelector('.check-icon');
        if (checkIcon) {
            checkIcon.style.opacity = '1';
            checkIcon.style.transform = 'scale(1)';
        }
    }
}

function nextStep(step) {
    // Validation for step 1 - ONLY when moving forward to step 2
    if (currentStep === 1 && step === 2) {
        const service = document.querySelector('input[name="service"]:checked');
        const date = document.getElementById('date');
        const time = document.getElementById('time');

        if (!service || !date.value || !time.value) {
            alert('Please complete all fields before proceeding');
            return;
        }

        // Store step 1 data
        bookingData.service = service.value;
        bookingData.date = date.value;
        bookingData.time = time.value;
    }

    // Validation for step 2 - ONLY when moving forward to step 3
if (currentStep === 2 && step === 3) {
    const firstname = document.getElementById('firstname');
    const middlename = document.getElementById('middlename');
    const lastname = document.getElementById('lastname');
    const address = document.getElementById('address');
    const birthdate = document.getElementById('birthdate');
    const email = document.getElementById('email');

    // Check if all required fields are filled (NO PHONE)
    if (!firstname.value.trim() || !middlename.value.trim() || !lastname.value.trim() || 
        !address.value.trim() || !birthdate.value || !email.value.trim()) {
        alert('Please complete all required fields');
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        alert('Please enter a valid email address');
        return;
    }

    // Store step 2 data (NO PHONE)
    bookingData.firstname = firstname.value.trim();
    bookingData.middlename = middlename.value.trim();
    bookingData.lastname = lastname.value.trim();
    bookingData.suffix = document.getElementById('suffix').value.trim();
    bookingData.fullname = `${bookingData.firstname} ${bookingData.middlename} ${bookingData.lastname}${bookingData.suffix ? ' ' + bookingData.suffix : ''}`;
    bookingData.address = address.value.trim();
    bookingData.birthdate = birthdate.value;
    bookingData.email = email.value.trim();
    // NO PHONE stored

    // Generate confirmation summary
    generateConfirmation();
}

    // Hide current step
    const currentStepEl = document.getElementById(`step-${currentStep}`);
    if (currentStepEl) {
        currentStepEl.classList.add('hidden');
    }

    // Update current step BEFORE showing new step
    currentStep = step;

    // Show new step
    const nextStepEl = document.getElementById(`step-${step}`);
    if (nextStepEl) {
        nextStepEl.classList.remove('hidden');
    }

    // Update sidebar indicators
    updateSidebarSteps(step);

    // Scroll to top of booking section
    const bookingSection = document.querySelector('.booking-section');
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function prevStep() {
    if (currentStep > 1) {
        // Simply go back without validation
        const previousStep = currentStep - 1;
        
        // Hide current step
        const currentStepEl = document.getElementById(`step-${currentStep}`);
        if (currentStepEl) {
            currentStepEl.classList.add('hidden');
        }

        // Update current step
        currentStep = previousStep;

        // Show previous step
        const prevStepEl = document.getElementById(`step-${previousStep}`);
        if (prevStepEl) {
            prevStepEl.classList.remove('hidden');
        }

        // Update sidebar indicators
        updateSidebarSteps(previousStep);

        // Scroll to top of booking section
        const bookingSection = document.querySelector('.booking-section');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function updateSidebarSteps(step) {
    // Update sidebar step indicators
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (indicator) {
            if (i < step) {
                // Completed step
                indicator.classList.remove('inactive');
                indicator.classList.add('completed');
            } else if (i === step) {
                // Current step
                indicator.classList.remove('inactive', 'completed');
            } else {
                // Future step
                indicator.classList.add('inactive');
                indicator.classList.remove('completed');
            }
        }
    }
}

function generateConfirmation() {
    const confirmationDiv = document.getElementById('confirmation-details');
    if (!confirmationDiv) return;

    // Format appointment date
    const dateObj = new Date(bookingData.date + 'T00:00:00');
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString('en-US', dateOptions);

    // Format appointment time
    const timeValue = bookingData.time;
    const [hours, minutes] = timeValue.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const formattedTime = `${displayHour}:${minutes} ${ampm}`;

    // Format birthdate
    const birthdateObj = new Date(bookingData.birthdate + 'T00:00:00');
    const formattedBirthdate = birthdateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let html = `
        <h3>Booking Summary</h3>
        
        <div class="summary-item">
            <div class="summary-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <div class="summary-content">
                <div class="summary-label">Service</div>
                <div class="summary-value">${bookingData.service}</div>
            </div>
        </div>

        <div class="summary-item">
            <div class="summary-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>
            <div class="summary-content">
                <div class="summary-label">Appointment Date & Time</div>
                <div class="summary-value">${formattedDate} at ${formattedTime}</div>
            </div>
        </div>

        <div class="summary-item">
            <div class="summary-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </div>
            <div class="summary-content">
                <div class="summary-label">Full Name</div>
                <div class="summary-value">${bookingData.fullname}</div>
            </div>
        </div>

        <div class="summary-item">
            <div class="summary-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            </div>
            <div class="summary-content">
                <div class="summary-label">Address</div>
                <div class="summary-value">${bookingData.address}</div>
            </div>
        </div>

        <div class="summary-item">
            <div class="summary-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>
            <div class="summary-content">
                <div class="summary-label">Date of Birth</div>
                <div class="summary-value">${formattedBirthdate}</div>
            </div>
        </div>

        <div class="summary-item">
            <div class="summary-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
            </div>
            <div class="summary-content">
                <div class="summary-label">Email</div>
                <div class="summary-value">${bookingData.email}</div>
            </div>
        </div>

        <div class="summary-item">
            <div class="summary-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
            </div>
            <div class="summary-content">
                <div class="summary-label">Phone</div>
                <div class="summary-value">${bookingData.phone}</div>
            </div>
        </div>
    `;

    if (bookingData.notes) {
        html += `
            <div class="summary-item">
                <div class="summary-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <div class="summary-content">
                    <div class="summary-label">Additional Notes</div>
                    <div class="summary-value">${bookingData.notes}</div>
                </div>
            </div>
        `;
    }

    confirmationDiv.innerHTML = html;
}

function displayConfirmation() {
    // Legacy function - kept for compatibility
    generateConfirmation();
}

function resetBooking() {
    // Reset form
    const form = document.getElementById('booking-form');
    if (form) {
        form.reset();
    }

    // Clear booking data
    Object.keys(bookingData).forEach(key => delete bookingData[key]);

    // Reset to step 1
    currentStep = 1;

    // Hide all steps
    for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`step-${i}`);
        if (stepEl) {
            stepEl.classList.add('hidden');
        }
    }

    // Show step 1
    const step1 = document.getElementById('step-1');
    if (step1) {
        step1.classList.remove('hidden');
    }

    // Reset sidebar
    updateSidebarSteps(1);

    // Reset check icons
    document.querySelectorAll('.check-icon').forEach(icon => {
        icon.style.opacity = '0';
        icon.style.transform = 'scale(0.8)';
    });

    console.log('Booking form reset');
}

// Export functions globally
window.nextStep = nextStep;
window.prevStep = prevStep;
window.resetBooking = resetBooking;
window.bookingData = bookingData;
window.initializeBooking = initializeBooking;
window.displayConfirmation = displayConfirmation;