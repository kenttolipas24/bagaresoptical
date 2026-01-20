// ===============================
// LOAD APPOINTMENT HTML
// ===============================
fetch('../components/optometrists/appmnt.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('Cal&Det-placeholder').innerHTML = data;
    initializeAppointment();
  })
  .catch(error => {
    console.error('Error loading appointment content:', error);
  });

function initializeAppointment() {
  let currentDate = new Date();
  let selectedDate = null;
  let autoRefreshTimer = null;

  // ===============================
  // LOAD APPOINTMENTS (MAIN TABLE)
  // ===============================
  function loadAppointments(searchTerm = '') {
    const tbody = document.getElementById('appointmentTable');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:#999;padding:20px">
          Loading appointments...
        </td>
      </tr>`;

    fetch('../api/get_appointments.php')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align:center;color:#999;padding:20px">
                No appointments found
              </td>
            </tr>`;
          return;
        }

        let filtered = data;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = data.filter(a =>
            a.patient_name.toLowerCase().includes(term) ||
            a.service.toLowerCase().includes(term)
          );
        }

        if (filtered.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align:center;color:#999;padding:20px">
                No appointments match your search
              </td>
            </tr>`;
          return;
        }

        tbody.innerHTML = filtered.map(appt => `
          <tr data-id="${appt.appointment_id}">
            <td>${appt.patient_name}</td>
            <td>${formatDate(appt.appointment_date)}</td>
            <td>${formatTime(appt.appointment_time)}</td>
            <td>${appt.service}</td>
            <td>
              <button class="action-btn"
                onclick="openAppointmentActionModal(event, '${appt.appointment_id}')">
                ⋮
              </button>
            </td>
          </tr>
        `).join('');
      })
      .catch(err => {
        console.error('Appointment load error:', err);
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center;color:#ef4444;padding:20px">
              Error loading appointments. Please refresh.
            </td>
          </tr>`;
      });
  }

  // ===============================
  // FORMATTERS
  // ===============================
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  }

  // ===============================
  // CALENDAR
  // ===============================
  function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');
    if (!grid || !title) return;

    grid.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    title.textContent = `${year} ${currentDate.toLocaleString('default', { month: 'long' })}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      grid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      cell.textContent = day;
      cell.onclick = () => selectDay(year, month, day);
      grid.appendChild(cell);
    }
  }

  function selectDay(year, month, day) {
    selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    showAppointmentsForDay(selectedDate);
  }

  function showAppointmentsForDay(dateStr) {
    const detail = document.getElementById('appointmentDetail');
    if (!detail) return;

    detail.innerHTML = '<div style="color:#999;">Loading...</div>';

    fetch(`../api/get_appointments.php?date=${dateStr}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) {
          detail.innerHTML = `<div>No appointments for this day</div>`;
          return;
        }

        detail.innerHTML = data.map(a => `
          <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <strong>${a.patient_name}</strong><br>
            <small>${formatTime(a.appointment_time)} – ${a.service}</small>
          </div>
        `).join('');
      })
      .catch(err => {
        console.error('Error loading day appointments:', err);
        detail.innerHTML = '<div style="color:#ef4444;">Error loading appointments</div>';
      });
  }

  // ===============================
  // SEARCH
  // ===============================
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      loadAppointments(e.target.value);
    });
  }

  // ===============================
  // NAVIGATION
  // ===============================
  window.changeMonth = function(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar();
  };

  // ===============================
  // AUTO-REFRESH (KEY PART)
  // ===============================
  function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);

    autoRefreshTimer = setInterval(() => {
      loadAppointments(searchInput?.value || '');

      if (selectedDate) {
        showAppointmentsForDay(selectedDate);
      }
    }, 5000); // every 5 seconds
  }

  // ===============================
  // INIT
  // ===============================
  loadAppointments();
  generateCalendar();
  startAutoRefresh();

  // Expose refresh if needed
  window.refreshAppointments = loadAppointments;
}