/**
 * reports.js - Bagares Optical Clinic
 */

let allReportLogs = [];

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
  fetchReportData(); 
}

async function fetchReportData() {
  try {
    const res = await fetch('../api/get_stock_logs.php');
    const data = await res.json();
    
    if (data.status === 'error') throw new Error(data.message);
    
    allReportLogs = data;
    renderReportTable(data);
  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}

/**
 * renderReportTable - Bagares Optical Clinic
 * Maps real database history to your requested columns.
 */
function renderReportTable(logs) {
  const tbody = document.getElementById('reportTableBody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem;">No logs found.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(log => {
    // Determine color based on Stock In or Stock Out/Condemned
    const qtyClass = log.trans_type === 'Stock In' ? 'qty-positive' : 'qty-negative';
    const symbol = log.trans_type === 'Stock In' ? '+' : '';

    return `
      <tr>
        <td><strong>${log.product_name}</strong></td>
        <td><span class="category-badge ${log.category.toLowerCase()}">${log.category}</span></td>
        <td>${log.current_inventory}</td>
        <td><span class="status-badge ${log.trans_type.toLowerCase().replace(' ', '-')}">${log.trans_type}</span></td>
        <td>${log.trans_date}</td>
        <td><span class="${qtyClass}">${symbol}${log.quantity}</span></td>
        <td>
            <div class="user-cell">
                <span class="reason-text" style="display:block; font-size: 0.85rem;">${log.reason || '-'}</span>
                <span class="processed-by" style="display:block; font-size: 0.75rem; color: #9ca3af;">${log.processed_by || 'Staff'}</span>
            </div>
        </td>
      </tr>
    `;
  }).join('');

  updateFooterCount(logs.length, allReportLogs.length);
}

// ================= FILTER LOGIC =================

function attachFilterListeners() {
  document.getElementById('reportSearch')?.addEventListener('input', filterReportTable);
  document.getElementById('inventoryCategory')?.addEventListener('change', filterReportTable);
  document.getElementById('inventoryStock')?.addEventListener('change', filterReportTable);
  document.getElementById('inventoryDate')?.addEventListener('change', filterReportTable);
}

function filterReportTable() {
  const searchValue = document.getElementById('reportSearch')?.value.toLowerCase() || '';
  const categoryValue = document.getElementById('inventoryCategory')?.value || 'all';
  const stockValue = document.getElementById('inventoryStock')?.value || 'all';
  const dateValue = document.getElementById('inventoryDate')?.value || '';

  const filtered = allReportLogs.filter(log => {
    const matchesSearch = log.product_name.toLowerCase().includes(searchValue);
    const matchesCategory = categoryValue === 'all' || log.category.toLowerCase() === categoryValue;
    const matchesStock = stockValue === 'all' || getStockStatus(log.current_inventory).class === stockValue;
    const matchesDate = !dateValue || log.trans_date.startsWith(dateValue);

    return matchesSearch && matchesCategory && matchesStock && matchesDate;
  });

  renderReportTable(filtered);
}

// ================= UTILITIES =================

function getStockStatus(stock) {
  if (stock > 10) return { class: 'in-stock', text: 'In Stock' };
  if (stock > 0) return { class: 'low-stock', text: 'Low Stock' };
  return { class: 'out-of-stock', text: 'Out of Stock' };
}

function setDefaultDate() {
  const dateInput = document.getElementById('inventoryDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

function updateReportDate() {
  const reportDateEl = document.getElementById('reportDate');
  if (reportDateEl) {
    reportDateEl.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}

function updateFooterCount(visible, total) {
  const entryCount = document.getElementById('entryCount');
  if (entryCount) entryCount.innerHTML = `Showing <strong>${visible}</strong> of <strong>${total}</strong> entries`;
}