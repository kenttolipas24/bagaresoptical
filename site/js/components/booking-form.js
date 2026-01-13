fetch('components/booking-form.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('booking-form-placeholder').innerHTML = html;
    attachFormHandler();
  });

function attachFormHandler() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        'https://bagares-api.onrender.com/api/submit_booking.php',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      alert('Booking submitted successfully');
      form.reset();

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });
}
