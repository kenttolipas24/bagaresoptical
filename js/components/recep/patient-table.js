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
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;color:#a0aec0;">Updating records...</td></tr>`;

    try {
        const res = await fetch('../api/get_patient_records.php');
        if (!res.ok) throw new Error("Connection Error");

        const records = await res.json();
        tbody.innerHTML = '';

        records.forEach(r => {
            // Build full name from patient data
            const fullName = `${r.firstname} ${r.middlename || ''} ${r.lastname} ${r.suffix || ''}`.trim();
            const age = calculateAge(r.birthdate);

            // Updated Minimalist Prescription UI
            const prescriptionHTML = `
                <div class="prescription-container">
                    <div><span class="prescription-label">OD</span> ${r.od_sph || '—'} / ${r.od_cyl || '—'} <small>x</small>${r.od_axis || '—'}</div>
                    <div><span class="prescription-label">OS</span> ${r.os_sph || '—'} / ${r.os_cyl || '—'} <small>x</small>${r.os_axis || '—'}</div>
                </div>
            `;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: #1a202c;">${fullName}</div>
                    <div style="font-size: 0.75rem; color: #a0aec0;">ID: #${r.patient_id}</div>
                </td>
                <td style="color: #718096; max-width: 200px;">${r.address || '—'}</td>
                <td>${age} <span style="font-size: 0.7rem; color: #cbd5e0;">YRS</span></td>
                <td>${prescriptionHTML}</td>
                <td style="color: #718096; font-size: 0.8rem;">${formatDate(r.exam_date)}</td>
                <td>
                    <button class="action-btn" onclick="toggleActionDropdown(event, ${r.patient_id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;color:#e53e3e;">Unable to sync patient data.</td></tr>`;
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
