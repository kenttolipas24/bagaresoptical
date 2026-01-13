// ===============================
// Load Booking Form HTML
// ===============================
fetch('components/booking-form.html')
  .then(res => {
    if (!res.ok) throw new Error('Failed to load booking form');
    return res.text();
  })
  .then(html => {
    document.getElementById('booking-form-placeholder').innerHTML = html;

    if (typeof initializeBooking === 'function') {
      initializeBooking();
    }

    attachFormHandler();
  })
  .catch(err => {
    console.error('Booking form load error:', err);
  });


// ===============================
// Submit Booking
// ===============================
function attachFormHandler() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (typeof bookingData === 'undefined') {
      alert('Booking data missing');
      return;
    }

    try {
      const response = await fetch(
        'https://bagares-api.onrender.com/api/submit_booking.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        }
      );

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON response:', text);
        throw new Error('Server returned invalid JSON');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Booking failed');
      }

      alert('Booking request submitted successfully!');
      form.reset();

      if (typeof resetBooking === 'function') {
        resetBooking();
      }

    } catch (err) {
      console.error('Booking submit error:', err);
      alert(err.message);
    }
  });
}
