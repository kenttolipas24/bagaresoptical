// ===============================
// Load Booking Form HTML
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
  if (!form) {
    console.error('Booking form not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (typeof bookingData === 'undefined') {
      alert('Booking data is missing');
      return;
    }

    try {
      const res = await fetch(
        'https://bagares-api.onrender.com/api/submit_booking.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bookingData)
        }
      );

      // Read as text FIRST (prevents JSON crash)
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Server returned non-JSON:', text);
        throw new Error('Server error: invalid JSON response');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Booking submission failed');
      }

      alert('Booking submitted successfully!');
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
