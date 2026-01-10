// Load Booking Form Component
fetch('components/booking-form.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('booking-form-placeholder').innerHTML = data;
    
    // After form loads, initialize
    if (typeof initializeBooking === 'function') {
        initializeBooking();
    }
    
    // Attach form submission handler
    attachFormHandler();
    console.log('Booking form loaded');
  })
  .catch(error => console.error('Error loading booking form:', error));

function attachFormHandler() {
    const form = document.getElementById('booking-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get booking data from booking.js
            if (typeof bookingData !== 'undefined') {
                console.log('Booking Data:', bookingData);
                
                // Submit to backend
                fetch('../api/submit_booking.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('Booking request submitted successfully! We will contact you soon to confirm your appointment.');
                        
                        // Reset form
                        this.reset();
                        if (typeof resetBooking === 'function') {
                            resetBooking();
                        }
                    } else {
                        alert('Error: ' + (data.error || 'Failed to submit booking'));
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to submit booking. Please try again.');
                });
            }
        });
    }
}