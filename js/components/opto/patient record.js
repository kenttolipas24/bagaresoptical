// ===============================
// LOAD PATIENT RECORD HTML (ONCE)
// ===============================
fetch('../components/optometrists/patient record.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('patient-record-placeholder').innerHTML = html;
    initializePatientRecords();
  })
  .catch(err => console.error('Failed to load patient record HTML:', err));


// ==================================
// PATIENT RECORD LOGIC (DATA ONLY)
// ==================================
function initializePatientRecords() {
  const tbody = document.getElementById('patientTable');
  const searchInput = document.getElementById('searchPatient');

  let patients = [];

  // 🔹 INITIAL LOAD
  fetchPatientRecords();

  // =====================
  // FETCH FROM DATABASE
  // =====================
  function fetchPatientRecords() {
    fetch('../api/get_patient_records.php')
      .then(res => res.json())
      .then(data => {
        console.log('✅ Patient records loaded:', data);
        patients = data;
        renderTable();
      })
      .catch(err => {
        console.error('❌ Failed to fetch patient records:', err);
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center;color:#ef4444;padding:20px">
              Error loading patient records. Please refresh.
            </td>
          </tr>`;
      });
  }

  // =====================
  // RENDER TABLE
  // =====================
  function renderTable() {
    tbody.innerHTML = '';

    if (!patients || patients.length === 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 7;
      cell.textContent = 'No patient records found.';
      cell.style.textAlign = 'center';
      cell.style.padding = '20px';
      cell.style.color = '#999';
      return;
    }

    patients.forEach(p => {
      const row = tbody.insertRow();

      // Build patient name
      const fullName = `${p.firstname} ${p.middlename || ''} ${p.lastname} ${p.suffix || ''}`.trim();

      row.insertCell(0).textContent = fullName;
      row.insertCell(1).textContent = p.exam_date || 'N/A';
      row.insertCell(2).textContent = `${p.od_sph || '—'} / ${p.od_cyl || '—'} / ${p.od_axis || '—'}`;
      row.insertCell(3).textContent = `${p.os_sph || '—'} / ${p.os_cyl || '—'} / ${p.os_axis || '—'}`;
      row.insertCell(4).textContent = p.od_add || '-';
      row.insertCell(5).textContent = p.pd || '-';

      const actionCell = row.insertCell(6);
      actionCell.innerHTML = '<button class="actions-btn">⋯</button>';
    });
  }

  // =====================
  // LIVE SEARCH (NO RELOAD)
  // =====================
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const query = e.target.value.toLowerCase();
      const rows = tbody.querySelectorAll('tr');

      rows.forEach(row => {
        const name = row.cells[0]?.textContent.toLowerCase() || '';
        row.style.display = name.includes(query) ? '' : 'none';
      });
    });
  }
}