/* ===============================
   GLOBAL STATE
================================ */
let selectedRequestId = null;
let allRequestsData = [];
let requestsData = [];

// Auto-refresh tracking
let lastRequestId = null;
let isInitialLoad = true;

/* ===============================
   LOAD REQUEST COMPONENT
================================ */
fetch('../components/receptionist/request.html')
  .then(res => res.text())
  .then(html => {
    const holder = document.getElementById('request-placeholder');
    if (holder) {
      holder.innerHTML = html;
      loadRequests();
    }
  })
  .catch(err => console.error('❌ Error loading request component:', err));

/* ===============================
   LOAD REQUESTS (SAFE + SMART)
================================ */
function loadRequests(isAutoRefresh = false) {
  fetch('../api/get_booking_requests.php')
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data)) {
        console.warn('⚠️ Request API did not return array');
        return;
      }

      // First load
      if (isInitialLoad) {
        allRequestsData = data;
        requestsData = data;
        lastRequestId = data.length ? data[0].id : null;
        renderRequests();
        setupSearch();
        isInitialLoad = false;
        return;
      }

      // Auto-refresh: detect new booking
      const newestId = data.length ? data[0].id : null;
      if (newestId && newestId !== lastRequestId) {
        console.log('🆕 New booking detected');
        lastRequestId = newestId;
        allRequestsData = data;
        requestsData = data;
        renderRequests();
      }

      // Manual reload
      if (!isAutoRefresh) {
        allRequestsData = data;
        requestsData = data;
        renderRequests();
      }
    })
    .catch(err => console.error('❌ Load request error:', err));
}

/* ===============================
   RENDER TABLE (SAFE)
================================ */
function renderRequests() {
  const tbody = document.getElementById('requestsTable');
  if (!tbody) return;

  if (!Array.isArray(requestsData) || requestsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:#999;">
          No booking requests found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = requestsData.map(req => `
    <tr>
      <td>${req.patient_name || '—'}</td>
      <td>${req.appointment_date ? formatDate(req.appointment_date) : '—'}</td>
      <td>${req.appointment_time ? formatTime(req.appointment_time) : '—'}</td>
      <td>${req.service || '—'}</td>
      <td>${req.address || 'N/A'}</td>
      <td>
        <button class="action-btn"
          onclick="toggleActionDropdown(event, '${req.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}



/* ===============================
   SEARCH
================================ */
function setupSearch() {
  const input = document.getElementById('requestSearchInput');
  if (!input) return;

  input.addEventListener('input', e => {
    const term = e.target.value.toLowerCase().trim();

    requestsData = term === ''
      ? allRequestsData
      : allRequestsData.filter(r =>
          `${r.firstname} ${r.lastname}`.toLowerCase().includes(term) ||
          (r.service || '').toLowerCase().includes(term) ||
          (r.address || '').toLowerCase().includes(term)
        );

    renderRequests();
  });
}

/* ===============================
   ACTION DROPDOWN
================================ */
function toggleActionDropdown(event, id) {
  event.stopPropagation();
  selectedRequestId = id;

  const dropdown = document.getElementById('requestActionDropdown');
  const overlay = document.getElementById('dropdownOverlay');
  if (!dropdown || !overlay) return;

  const rect = event.currentTarget.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + 5}px`;
  dropdown.style.left = `${rect.left - 150}px`;

  dropdown.classList.add('show');
  overlay.classList.add('show');
}

function closeActionDropdown() {
  document.getElementById('requestActionDropdown')?.classList.remove('show');
  document.getElementById('dropdownOverlay')?.classList.remove('show');
}

/* ===============================
   CONFIRM
================================ */
function openConfirmModal() {
  closeActionDropdown();
  const req = allRequestsData.find(r => r.id == selectedRequestId);
  if (!req) return;

  document.getElementById('confirmModalBody').innerHTML = `
    <p><b>Patient:</b> ${req.firstname} ${req.lastname}</p>
    <p><b>Service:</b> ${req.service}</p>
    <p><b>Date & Time:</b> ${formatDate(req.date)} ${formatTime(req.time)}</p>
  `;

  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal() {
  document.getElementById('confirmModal')?.classList.remove('show');
}

function confirmAppointment() {
  if (!selectedRequestId) return;

  fetch('../api/confirm_booking.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: selectedRequestId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      allRequestsData = allRequestsData.filter(r => r.id != selectedRequestId);
      requestsData = allRequestsData;
      renderRequests();
      closeConfirmModal();
      alert('✅ Appointment confirmed');
    }
  });
}

/* ===============================
   RESCHEDULE / CANCEL
================================ */
function openRescheduleModal() {
  closeActionDropdown();
  document.getElementById('rescheduleModal')?.classList.add('show');
}

function closeRescheduleModal() {
  document.getElementById('rescheduleModal')?.classList.remove('show');
}

function openCancelModal() {
  closeActionDropdown();
  document.getElementById('cancelModal')?.classList.add('show');
}

function closeCancelModal() {
  document.getElementById('cancelModal')?.classList.remove('show');
}

/* ===============================
   SAFE FORMATTERS (IMPORTANT)
================================ */
function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d + 'T00:00:00');
  if (isNaN(date)) return '—';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(t) {
  if (!t) return '—';

  const [h, m] = t.split(':');
  if (!h || !m) return '—';

  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}


/* ===============================
   AUTO REFRESH
================================ */
const requestAutoRefresh = setInterval(() => {
  loadRequests(true);
}, 10000);

window.addEventListener('beforeunload', () => {
  clearInterval(requestAutoRefresh);
});

/* ===============================
   EXPOSE FUNCTIONS
================================ */
window.toggleActionDropdown = toggleActionDropdown;
window.closeActionDropdown = closeActionDropdown;
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.confirmAppointment = confirmAppointment;
window.openRescheduleModal = openRescheduleModal;
window.closeRescheduleModal = closeRescheduleModal;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
