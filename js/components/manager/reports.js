// Load reports component
fetch('../components/manager/reports.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('reports-placeholder').innerHTML = data;
    initializeReports();
  })
  .catch(error => console.error('Error loading reports:', error));

function initializeReports() {
  setDefaultDate();
  updateReportDate();
  attachFilterListeners();
}

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('inventoryDate');
  if (dateInput) {
    dateInput.value = today;
  }
}

function updateReportDate() {
  const reportDateEl = document.getElementById('reportDate');
  if (reportDateEl) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    reportDateEl.textContent = new Date().toLocaleDateString('en-US', options);
  }
}

function attachFilterListeners() {
  const searchInput = document.getElementById('reportSearch');
  if (searchInput) {
    searchInput.addEventListener('input', filterReportTable);
  }

  const categorySelect = document.getElementById('inventoryCategory');
  if (categorySelect) {
    categorySelect.addEventListener('change', filterReportTable);
  }

  const stockSelect = document.getElementById('inventoryStock');
  if (stockSelect) {
    stockSelect.addEventListener('change', filterReportTable);
  }

  const dateInput = document.getElementById('inventoryDate');
  if (dateInput) {
    dateInput.addEventListener('change', filterReportTable);
  }
}

function filterReportTable() {
  const searchValue = document.getElementById('reportSearch')?.value.toLowerCase() || '';
  const categoryValue = document.getElementById('inventoryCategory')?.value || 'all';
  const stockValue = document.getElementById('inventoryStock')?.value || 'all';

  const rows = document.querySelectorAll('#reportTableBody tr');
  let visibleCount = 0;

  rows.forEach(row => {
    const productName = row.cells[0]?.textContent.toLowerCase() || '';
    const category = row.cells[1]?.textContent.toLowerCase() || '';
    const statusEl = row.querySelector('.status-badge');
    const status = statusEl ? statusEl.classList[1] : '';

    const matchesSearch = productName.includes(searchValue) || category.includes(searchValue);
    const matchesCategory = categoryValue === 'all' || category.includes(categoryValue);
    const matchesStock = stockValue === 'all' || status === stockValue;

    if (matchesSearch && matchesCategory && matchesStock) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  updateFooterCount(visibleCount, rows.length);
}

function updateFooterCount(visible, total) {
  const entryCount = document.getElementById('entryCount');
  if (entryCount) {
    entryCount.innerHTML = `Showing <strong>${visible}</strong> of <strong>${total}</strong> entries`;
  }
}

function generateCustomReport() {
  const choice = confirm('Export current report as PDF?\n\nClick OK for PDF or Cancel for more options.');

  if (choice) {
    alert('Generating PDF report...\n\nThis feature will export the current filtered data.');
  }
}