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
                
                // Validate required fields match your PHP
                const required = ['service', 'date', 'time', 'firstname', 'middlename', 
                                'lastname', 'address', 'birthdate', 'email'];
                
                const missing = required.filter(field => !bookingData[field]);
                if (missing.length > 0) {
                    alert('Please fill in all required fields: ' + missing.join(', '));
                    return;
                }
                
                // Determine correct API path based on environment
                const apiUrl = window.location.hostname === 'localhost' 
                    ? 'api/submit_booking.php'  // Localhost
                    : 'api/submit_booking.php'; // Live site (same path)
                
                console.log('Submitting to:', apiUrl);
                console.log('Data being sent:', bookingData);
                
                // Submit to backend
                fetch(apiUrl, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(bookingData)
                })
                .then(res => {
                    console.log('Response status:', res.status);
                    console.log('Response headers:', res.headers);
                    
                    // Check if response is OK
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    
                    // Try to parse as JSON
                    return res.text().then(text => {
                        console.log('Raw response:', text);
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            console.error('Failed to parse JSON:', text);
                            throw new Error('Server returned invalid JSON');
                        }
                    });
                })
                .then(data => {
                    console.log('Response data:', data);
                    
                    if (data.success) {
                        alert('Booking request submitted successfully! We will contact you soon to confirm your appointment.');
                        
                        // Reset form
                        form.reset();
                        if (typeof resetBooking === 'function') {
                            resetBooking();
                        }
                        
                        // Optionally redirect
                        // window.location.href = 'confirmation.html';
                    } else {
                        alert('Error: ' + (data.error || 'Failed to submit booking'));
                    }
                })
                .catch(error => {
                    console.error('Error details:', error);
                    alert('Failed to submit booking. Please check your connection and try again.\n\nError: ' + error.message);
                });
            } else {
                console.error('bookingData is undefined');
                alert('Please complete all booking steps before submitting.');
            }
        });
    } else {
        console.error('Booking form not found');
    }
}