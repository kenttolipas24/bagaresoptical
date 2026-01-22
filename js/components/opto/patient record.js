// // ===============================
// // LOAD PATIENT RECORD HTML (ONCE)
// // ===============================
// fetch('../components/optometrists/patient record.html')
//   .then(res => res.text())
//   .then(html => {
//     document.getElementById('patient-record-placeholder').innerHTML = html;
//     initializePatientRecords();
//   })
//   .catch(err => console.error('Failed to load patient record HTML:', err));


// // ==================================
// // PATIENT RECORD LOGIC (DATA ONLY)
// // ==================================
// function initializePatientRecords() {
//   const tbody = document.getElementById('patientTable');
//   const searchInput = document.getElementById('searchPatient');

//   let patients = [];

//   // 🔹 INITIAL LOAD
//   fetchPatientRecords();

//   // =====================
//   // FETCH FROM DATABASE
//   // =====================
//   function fetchPatientRecords() {
//     fetch('../api/get_patient_records.php')
//       .then(res => res.json())
//       .then(data => {
//         console.log('✅ Patient records loaded:', data);
//         patients = data;
//         renderTable();
//       })
//       .catch(err => {
//         console.error('❌ Failed to fetch patient records:', err);
//         tbody.innerHTML = `
//           <tr>
//             <td colspan="7" style="text-align:center;color:#ef4444;padding:20px">
//               Error loading patient records. Please refresh.
//             </td>
//           </tr>`;
//       });
//   }

//   // =====================
//   // RENDER TABLE
//   // =====================
//   function renderTable() {
//     tbody.innerHTML = '';

//     if (!patients || patients.length === 0) {
//       const row = tbody.insertRow();
//       const cell = row.insertCell(0);
//       cell.colSpan = 7;
//       cell.textContent = 'No patient records found.';
//       cell.style.textAlign = 'center';
//       cell.style.padding = '20px';
//       cell.style.color = '#999';
//       return;
//     }

//     patients.forEach(p => {
//       const row = tbody.insertRow();

//       // Build patient name
//       const fullName = `${p.firstname} ${p.middlename || ''} ${p.lastname} ${p.suffix || ''}`.trim();

//       row.insertCell(0).textContent = fullName;
//       row.insertCell(1).textContent = p.exam_date || 'N/A';
//       row.insertCell(2).textContent = `${p.od_sph || '—'} / ${p.od_cyl || '—'} / ${p.od_axis || '—'}`;
//       row.insertCell(3).textContent = `${p.os_sph || '—'} / ${p.os_cyl || '—'} / ${p.os_axis || '—'}`;
//       row.insertCell(4).textContent = p.od_add || '-';
//       row.insertCell(5).textContent = p.pd || '-';

//       const actionCell = row.insertCell(6);
//       actionCell.innerHTML = '<button class="actions-btn">⋯</button>';
//     });
//   }

//   // =====================
//   // LIVE SEARCH (NO RELOAD)
//   // =====================
//   if (searchInput) {
//     searchInput.addEventListener('input', e => {
//       const query = e.target.value.toLowerCase();
//       const rows = tbody.querySelectorAll('tr');

//       rows.forEach(row => {
//         const name = row.cells[0]?.textContent.toLowerCase() || '';
//         row.style.display = name.includes(query) ? '' : 'none';
//       });
//     });
//   }
// }




// ===============================
// LOAD PATIENT RECORD HTML (ONCE)
// ===============================
fetch('../components/optometrists/patient record.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('patient-record-placeholder').innerHTML = html;
    initializePatientTable();
  })
  .catch(err => console.error('Failed to load patient record HTML:', err));

// -----------------------------------------------
// INITIALIZE TABLE
// -----------------------------------------------
function initializePatientTable() {
  setTimeout(() => {
    // Load with "No Eye Exam" filter by default
    updatePatientTable('no-exam');
    setupSearch();
    if (typeof setupDropdownListeners === 'function') {
      setupDropdownListeners();
    }
  }, 100);
}

// -----------------------------------------------
// FILTER DROPDOWN TOGGLE
// -----------------------------------------------
window.toggleFilterDropdown = function(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('filterDropdown');
  const container = document.querySelector('.filter-dropdown-container');
  
  dropdown.classList.toggle('show');
  container.classList.toggle('active');
};

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('filterDropdown');
  const container = document.querySelector('.filter-dropdown-container');
  
  if (dropdown && !event.target.closest('.filter-dropdown-container')) {
    dropdown.classList.remove('show');
    if (container) container.classList.remove('active');
  }
});

// -----------------------------------------------
// SELECT FILTER
// -----------------------------------------------
let currentFilter = 'no-exam'; // Default to "No Eye Exam"

window.selectFilter = function(filterType, filterText, event) {
  event.stopPropagation();
  currentFilter = filterType;
  
  // Update button text
  document.getElementById('current-filter-text').textContent = filterText;
  
  // Update active state
  document.querySelectorAll('.filter-dropdown-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
  
  // Close dropdown
  document.getElementById('filterDropdown').classList.remove('show');
  document.querySelector('.filter-dropdown-container').classList.remove('active');
  
  // Update table
  updatePatientTable(filterType);
};

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
// UPDATE PATIENT TABLE (REAL API WITH FILTER)
// -----------------------------------------------
window.updatePatientTable = async function (filter = 'no-exam') {
    const tbody = document.querySelector('.patient-table tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:#a0aec0;">Loading records...</td></tr>`;

    try {
        // Pass filter to API
        const res = await fetch(`../api/get_patient_records.php?filter=${filter}`);
        if (!res.ok) throw new Error("Connection Error");

        const records = await res.json();
        tbody.innerHTML = '';

        if (!records || records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:#a0aec0;">No patient records found</td></tr>`;
            return;
        }

        records.forEach(r => {
            const fullName = `${r.firstname} ${r.middlename || ''} ${r.lastname} ${r.suffix || ''}`.trim();
            const age = calculateAge(r.birthdate);
            
            // Patient Type Badge
            const patientTypeBadge = r.patient_type === 'online' 
                ? '<span class="patient-type-badge badge-online">Online</span>'
                : '<span class="patient-type-badge badge-walk-in">Walk-in</span>';

            // Check if patient has eye exam
            const hasExam = r.exam_date !== null;
            
            const prescriptionHTML = hasExam ? `
                <div class="prescription-container">
                    <div><span class="prescription-label">OD</span> ${r.od_sph || '—'} / ${r.od_cyl || '—'} <small>x</small>${r.od_axis || '—'}</div>
                    <div><span class="prescription-label">OS</span> ${r.os_sph || '—'} / ${r.os_cyl || '—'} <small>x</small>${r.os_axis || '—'}</div>
                </div>
            ` : '<span class="patient-type-badge badge-no-exam">No Exam Yet</span>';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: #1a202c;">${fullName}</div>
                    <div style="font-size: 0.75rem; color: #a0aec0;">ID: #${r.patient_id}</div>
                </td>
                <td>${patientTypeBadge}</td>
                <td style="color: #718096; max-width: 200px;">${r.address || '—'}</td>
                <td>${age} <span style="font-size: 0.7rem; color: #cbd5e0;">YRS</span></td>
                <td>${prescriptionHTML}</td>
                <td style="color: #718096; font-size: 0.8rem;">${formatDate(r.exam_date)}</td>
                <td>
                    <button class="action-btn" onclick="openAppointmentActionModal(event, ${r.patient_id})">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading patient records:', err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;color:#e53e3e;">Unable to sync patient data.</td></tr>`;
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
