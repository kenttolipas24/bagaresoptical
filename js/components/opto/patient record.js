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

  // 🔹 AUTO REFRESH DATA EVERY 5 SECONDS
  setInterval(fetchPatientRecords, 5000);

  // =====================
  // FETCH FROM DATABASE
  // =====================
  function fetchPatientRecords() {
    fetch('../api/get_patient_records.php')
      .then(res => res.json())
      .then(data => {
        patients = data;
        renderTable();
      })
      .catch(err => {
        console.error('Failed to fetch patient records:', err);
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
      return;
    }

    patients.forEach(p => {
      const row = tbody.insertRow();

      row.insertCell(0).textContent = p.patient_name;
      row.insertCell(1).textContent = p.exam_date;
      row.insertCell(2).textContent = `${p.od_sph} / ${p.od_cyl} / ${p.od_axis}`;
      row.insertCell(3).textContent = `${p.os_sph} / ${p.os_cyl} / ${p.os_axis}`;
      row.insertCell(4).textContent = p.od_add ?? '-';
      row.insertCell(5).textContent = p.pd ?? '-';

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
