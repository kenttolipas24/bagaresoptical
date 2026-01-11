let selectedRequestId = null;
let allRequestsData = [];
let requestsData = [];

// Load the request HTML component and initialize
fetch('../components/receptionist/request.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('request-placeholder').innerHTML = data;
    loadRequests();
  })
  .catch(error => console.error('Error loading request component:', error));

// Fetch booking requests from database
function loadRequests() {
  console.log('📥 Loading requests...');
  fetch('../api/get_booking_requests.php')
    .then(res => res.json())
    .then(data => {
      console.log('✅ Requests loaded:', data);
      allRequestsData = data;
      requestsData = data;
      renderRequests();
      setupSearch();
    })
    .catch(error => {
      console.error('❌ Error loading requests:', error);
      const tbody = document.getElementById('requestsTable');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; color:#999; padding:40px;">
              Error loading requests. Please try again.
            </td>
          </tr>`;
      }
    });
}

// Render table rows
function renderRequests() {
  const tbody = document.getElementById('requestsTable');
  if (!tbody) return;

  if (requestsData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:#999; padding:40px;">
          No booking requests found
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = requestsData.map(request => {
    const fullName = `${request.firstname} ${request.middlename || ''} ${request.lastname}${request.suffix ? ' ' + request.suffix : ''}`.trim();

    return `
      <tr>
        <td>${fullName}</td>
        <td>${formatDate(request.date)}</td>
        <td>${formatTime(request.time)}</td>
        <td>${request.service}</td>
        <td>${request.address || 'N/A'}</td>
        <td>
          <button class="action-btn" onclick="toggleActionDropdown(event, '${request.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Toggle action dropdown
function toggleActionDropdown(event, requestId) {
  event.stopPropagation();
  
  console.log('🎯 Selected request ID:', requestId, 'Type:', typeof requestId);
  selectedRequestId = requestId;
  const dropdown = document.getElementById('requestActionDropdown');
  const overlay = document.getElementById('dropdownOverlay');
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  
  // Position dropdown
  dropdown.style.top = `${rect.bottom + 5}px`;
  dropdown.style.left = `${rect.left - 150}px`;
  
  // Toggle visibility
  dropdown.classList.add('show');
  overlay.classList.add('show');
}

// Close action dropdown
function closeActionDropdown() {
  const dropdown = document.getElementById('requestActionDropdown');
  const overlay = document.getElementById('dropdownOverlay');
  
  dropdown.classList.remove('show');
  overlay.classList.remove('show');
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('requestSearchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (term === '') {
      requestsData = allRequestsData;
    } else {
      requestsData = allRequestsData.filter(req => {
        const name = `${req.firstname} ${req.middlename || ''} ${req.lastname} ${req.suffix || ''}`.toLowerCase();
        const service = req.service.toLowerCase();
        const address = (req.address || '').toLowerCase();
        const date = formatDate(req.date).toLowerCase();

        return name.includes(term) ||
               service.includes(term) ||
               address.includes(term) ||
               date.includes(term);
      });
    }
    renderRequests();
  });
}

// Date & Time formatting
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// ==================== MODALS ====================

// Confirm Modal
function openConfirmModal() {
  // Hide dropdown without resetting selectedRequestId
  const dropdown = document.getElementById('requestActionDropdown');
  const overlay = document.getElementById('dropdownOverlay');
  dropdown.classList.remove('show');
  overlay.classList.remove('show');
  
  console.log('🔍 Looking for request with ID:', selectedRequestId);
  console.log('📋 All requests:', allRequestsData);
  
  const request = allRequestsData.find(r => r.id == selectedRequestId);
  console.log('✅ Found request:', request);
  
  if (!request) {
    console.error('❌ Request not found!');
    return;
  }

  const fullName = `${request.firstname} ${request.middlename || ''} ${request.lastname}${request.suffix ? ' ' + request.suffix : ''}`.trim();

  const modalBody = document.getElementById('confirmModalBody');
  modalBody.innerHTML = `
    <div style="display: grid; gap: 0.875rem;">
      <div style="display: flex; gap: 0.5rem;">
        <span style="font-weight: 600; color: #374151;">Patient:</span>
        <span style="color: #6b7280;">${fullName}</span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <span style="font-weight: 600; color: #374151;">Service:</span>
        <span style="color: #6b7280;">${request.service}</span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <span style="font-weight: 600; color: #374151;">Date & Time:</span>
        <span style="color: #6b7280;">${formatDate(request.date)} at ${formatTime(request.time)}</span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <span style="font-weight: 600; color: #374151;">Address:</span>
        <span style="color: #6b7280;">${request.address || 'N/A'}</span>
      </div>
    </div>
    <p style="margin-top: 1rem; color: #6b7280; font-size: 0.875rem;">
      This will confirm the appointment and add it to the schedule.
    </p>
  `;

  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('show');
  selectedRequestId = null;
}

function confirmAppointment() {
  if (!selectedRequestId) {
    console.error('❌ No request selected!');
    return;
  }

  console.log('🚀 Confirming appointment with ID:', selectedRequestId);

  fetch('../api/confirm_booking.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: selectedRequestId })
  })
  .then(res => {
    console.log('📡 Response status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('📥 Response data:', data);
    
    if (data.success) {
      console.log('✅ Success! Removing from list...');
      closeConfirmModal();
      
      // Remove the confirmed request from the list immediately
      console.log('Before filter:', allRequestsData.length);
      allRequestsData = allRequestsData.filter(r => r.id != selectedRequestId);
      console.log('After filter:', allRequestsData.length);
      
      requestsData = allRequestsData;
      renderRequests();
      
      // Refresh appointments in the Appointment section
      console.log('🔄 Refreshing appointments...');
      if (typeof window.refreshAppointments === 'function') {
        setTimeout(() => {
          window.refreshAppointments();
        }, 300);
      } else {
        console.warn('⚠️ refreshAppointments function not found');
      }
      
      alert('Appointment confirmed successfully!');
    } else {
      console.error('❌ Error:', data.error);
      alert('Error: ' + (data.error || 'Failed to confirm'));
    }
  })
  .catch(err => {
    console.error('❌ Fetch error:', err);
    alert('Failed to confirm appointment.');
  });
}

// Reschedule Modal
function openRescheduleModal() {
  const dropdown = document.getElementById('requestActionDropdown');
  const overlay = document.getElementById('dropdownOverlay');
  dropdown.classList.remove('show');
  overlay.classList.remove('show');
  
  document.getElementById('rescheduleModal').classList.add('show');
}

function closeRescheduleModal() {
  document.getElementById('rescheduleModal').classList.remove('show');
  document.getElementById('rescheduleDate').value = '';
  document.getElementById('rescheduleTime').value = '';
  document.getElementById('rescheduleReason').value = '';
  selectedRequestId = null;
}

function rescheduleAppointment() {
  if (!selectedRequestId) return;

  const newDate = document.getElementById('rescheduleDate').value;
  const newTime = document.getElementById('rescheduleTime').value;
  const reason = document.getElementById('rescheduleReason').value.trim();

  if (!newDate || !newTime) {
    alert('Please select both date and time');
    return;
  }

  fetch('../api/reschedule_booking.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: selectedRequestId,
      new_date: newDate,
      new_time: newTime,
      reason: reason
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      closeRescheduleModal();
      loadRequests();
      alert('Appointment rescheduled successfully!');
    } else {
      alert('Error: ' + (data.error || 'Failed to reschedule'));
    }
  })
  .catch(err => {
    console.error(err);
    alert('Failed to reschedule appointment.');
  });
}

// Cancel Modal
function openCancelModal() {
  const dropdown = document.getElementById('requestActionDropdown');
  const overlay = document.getElementById('dropdownOverlay');
  dropdown.classList.remove('show');
  overlay.classList.remove('show');
  
  document.getElementById('cancelModal').classList.add('show');
}

function closeCancelModal() {
  document.getElementById('cancelModal').classList.remove('show');
  document.getElementById('cancelReason').value = '';
  selectedRequestId = null;
}

function cancelAppointment() {
  if (!selectedRequestId) return;

  const reason = document.getElementById('cancelReason').value.trim();

  fetch('../api/cancel_booking.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: selectedRequestId, reason })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      closeCancelModal();
      loadRequests();
      alert('Appointment cancelled successfully!');
    } else {
      alert('Error: ' + (data.error || 'Failed to cancel'));
    }
  })
  .catch(err => {
    console.error(err);
    alert('Failed to cancel appointment.');
  });
}

// Make functions global
window.toggleActionDropdown = toggleActionDropdown;
window.closeActionDropdown = closeActionDropdown;
window.openConfirmModal = openConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.confirmAppointment = confirmAppointment;
window.openRescheduleModal = openRescheduleModal;
window.closeRescheduleModal = closeRescheduleModal;
window.rescheduleAppointment = rescheduleAppointment;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.cancelAppointment = cancelAppointment;

// Auto-refresh requests every 30 seconds
let requestAutoRefresh = setInterval(() => {
  console.log('🔄 Auto-refreshing booking requests...');
  loadRequests();
}, 30000);

// Stop auto-refresh when leaving the page
window.addEventListener('beforeunload', () => {
  clearInterval(requestAutoRefresh);
});