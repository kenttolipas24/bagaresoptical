// ================================
// Load Booking Form Component
// ================================
fetch('components/booking-form.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('booking-form-placeholder').innerHTML = html;

        if (typeof initializeBooking === 'function') {
            initializeBooking();
        }

        attachFormHandler();
        console.log('Booking form loaded');
    })
    .catch(err => console.error('Error loading booking form:', err));


// ================================
// Form Submit Handler
// ================================
function attachFormHandler() {
    const form = document.getElementById('booking-form');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (typeof bookingData === 'undefined') {
            alert('Booking data is missing');
            return;
        }

        console.log('Booking Data:', bookingData);

        fetch('https://bagares-api.onrender.com/api/submit_booking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Server error');
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                alert('Booking request submitted successfully!');

                form.reset();
                if (typeof resetBooking === 'function') {
                    resetBooking();
                }
            } else {
                alert('Error: ' + data.error);
            }
        })
        .catch(err => {
            console.error('Fetch error:', err);
            alert('Failed to connect to server.');
        });
    });
}
