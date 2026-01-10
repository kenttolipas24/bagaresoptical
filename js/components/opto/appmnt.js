// Load the appointment HTML content first
fetch('../components/optometrists/appmnt.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('Cal&Det-placeholder').innerHTML = data;
    
    // Initialize everything AFTER the HTML is loaded
    initializeAppointment();
  })
  .catch(error => {
    console.error('Error loading appointment content:', error);
  });

function initializeAppointment() {
  let currentDate = new Date();
  let selectedDate = null;

  // Load appointments from database
  function loadAppointments(searchTerm = '') {
    const tbody = document.getElementById('appointmentTable');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:#999;padding:20px">
          Loading appointments...
        </td>
      </tr>`;

    // Fetch confirmed appointments from database
    fetch('../api/get_appointments.php')
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align:center;color:#999;padding:20px">
                No appointments found
              </td>
            </tr>`;
          return;
        }

        // Filter by search term if provided
        let filteredData = data;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredData = data.filter(appt =>
            appt.patient_name.toLowerCase().includes(term) ||
            appt.date.includes(term) ||
            appt.time.toLowerCase().includes(term) ||
            appt.service.toLowerCase().includes(term)
          );
        }

        if (filteredData.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align:center;color:#999;padding:20px">
                No appointments match your search
              </td>
            </tr>`;
          return;
        }

        // Render appointments
        tbody.innerHTML = filteredData.map(appt => `
          <tr data-appointment-id="${appt.id}">
            <td>${appt.patient_name}</td>
            <td>${formatDate(appt.date)}</td>
            <td>${formatTime(appt.time)}</td>
            <td>${appt.service}</td>
            <td>
              <button class="action-btn" onclick="openAppointmentActionModal(event, '${appt.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1" fill="currentColor"></circle>
                  <circle cx="12" cy="5" r="1" fill="currentColor"></circle>
                  <circle cx="12" cy="19" r="1" fill="currentColor"></circle>
                </svg>
              </button>
            </td>
          </tr>
        `).join('');
      })
      .catch(error => {
        console.error('Error loading appointments:', error);
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;color:#ef4444;padding:20px">
              Error loading appointments. Please try again.
            </td>
          </tr>`;
      });
  }

  // Format date helper
  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format time helper
  function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Calendar generation
  function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');
    if (!grid || !title) return;

    grid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];

    title.textContent = `${year} ${monthNames[month]}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = document.createElement('div');
      d.className = 'calendar-day other-month';
      d.textContent = daysInPrevMonth - i;
      grid.appendChild(d);
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = document.createElement('div');
      d.className = 'calendar-day';
      
      // Highlight today
      if (year === today.getFullYear() && 
          month === today.getMonth() && 
          day === today.getDate()) {
        d.classList.add('today');
      }
      
      d.textContent = day;
      d.onclick = () => selectDay(year, month, day);
      grid.appendChild(d);
    }
  }

  function selectDay(year, month, day) {
    selectedDate = new Date(year, month, day);
    
    // Remove previous selection
    document.querySelectorAll('.calendar-day').forEach(d => {
      d.classList.remove('selected');
    });
    
    // Add selection to clicked day
    event.target.classList.add('selected');
    
    showAppointmentsForDay(year, month, day);
  }

  function showAppointmentsForDay(year, month, day) {
    const detail = document.getElementById('appointmentDetail');
    if (!detail) return;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    detail.innerHTML = '<div style="color:#999;">Loading...</div>';

    // Fetch appointments for selected date
    fetch(`../api/get_appointments.php?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          detail.innerHTML = `
            <div class="appointment-detail-header">
              <strong>${day}</strong>
              <span>No appointments</span>
            </div>`;
          return;
        }

        detail.innerHTML = `
          <div class="appointment-detail-header">
            <strong>${day}</strong>
            <span>${data.length} appointment${data.length > 1 ? 's' : ''}</span>
          </div>
          <div style="margin-top: 10px;">
            ${data.map(appt => `
              <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <div style="font-weight: 500;">${appt.patient_name}</div>
                <div style="font-size: 12px; color: #666;">${formatTime(appt.time)} - ${appt.service}</div>
              </div>
            `).join('')}
          </div>`;
      })
      .catch(error => {
        console.error('Error loading day appointments:', error);
        detail.innerHTML = '<div style="color:#ef4444;">Error loading appointments</div>';
      });
  }

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      loadAppointments(e.target.value);
    });
  }

  // Calendar navigation
  window.changeMonth = function(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar();
  };

  // Make loadAppointments globally accessible for refresh after confirm
  window.refreshAppointments = loadAppointments;

  // Initial load
  loadAppointments();
  generateCalendar();
}