// ================================================
// PATIENT TABLE - REAL DATA (NO DUMMY DATA)
// Uses get_booking_requests.php
// ================================================

// Load the patient table HTML into placeholder
fetch('../components/receptionist/patient-table.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('patient_table-placeholder').innerHTML = html;
    initializePatientTable();
  })
  .catch(err => console.error('Error loading patient table:', err));

// -----------------------------------------------
// INITIALIZE TABLE
// -----------------------------------------------
function initializePatientTable() {
  setTimeout(() => {
    updatePatientTable();
    setupSearch();
    if (typeof setupDropdownListeners === 'function') {
      setupDropdownListeners();
    }
  }, 100);
}

// -----------------------------------------------
// SEARCH FUNCTIONALITY
// -----------------------------------------------
function setupSearch() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.patient-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });
}

// -----------------------------------------------
// UPDATE PATIENT TABLE (REAL API)
// -----------------------------------------------
window.updatePatientTable = async function () {
  const tbody = document.querySelector('.patient-table tbody');
  if (!tbody) {
    console.error('Patient table body not found');
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center;padding:2rem;color:#6b7280;">
        Loading patient records...
      </td>
    </tr>
  `;

  try {
    const res = await fetch('../api/get_booking_requests.php?status=all');
    if (!res.ok) throw new Error(res.status);

    const patients = await res.json();
    tbody.innerHTML = '';

    if (!patients.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:2rem;color:#6b7280;">
            No patient records found
          </td>
        </tr>
      `;
      return;
    }

    patients.forEach(p => {
      const fullName = `${p.firstname} ${p.middlename || ''} ${p.lastname} ${p.suffix || ''}`.trim();
      const age = calculateAge(p.birthdate);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${fullName}</td>
        <td>${p.address || 'N/A'}</td>
        <td>${age}</td>
        <td>No prescription yet</td>
        <td>${formatDate(p.date)}</td>
        <td>
          <div class="action-btn-container">
            <button class="action-btn" onclick="toggleActionDropdown(event, ${p.id})">⋮</button>
          </div>
        </td>
      `;

      tbody.appendChild(row);
    });

  } catch (err) {
    console.error('Failed to load patient records:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:red;">
          Failed to load patient records
        </td>
      </tr>
    `;
  }
};

// -----------------------------------------------
// AGE CALCULATION
// -----------------------------------------------
function calculateAge(birthdate) {
  if (!birthdate) return 'N/A';

  const birth = new Date(birthdate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

// -----------------------------------------------
// DATE FORMATTER
// -----------------------------------------------
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString();
}
