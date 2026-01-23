// reports.js

const API_BASE = '../api/reports/';  // Adjust this path to match your actual folder structure

// Load the reports HTML component
fetch('../components/optometrists/reports.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('reports-placeholder').innerHTML = html;
        initializeReports();
    })
    .catch(err => {
        console.error("Failed to load reports HTML:", err);
    });

function initializeReports() {
    // Make switchTab available globally for onclick=""
    window.switchTab = switchTab;

    // Load default tab
    loadInventoryReport();

    // Tab switching with data loading
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', function () {
            const tabId = this.getAttribute('onclick').match(/'([^']+)'/)[1];

            // Update active states
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId + '-tab').classList.add('active');

            // Load data for the selected tab
            if (tabId === 'inventory')        loadInventoryReport();
            if (tabId === 'sales')            loadSalesReport();
            if (tabId === 'patient-records')  loadPatientReport();
            if (tabId === 'condemnation')     loadCondemnationReport();
        });
    });

    initializeLiveSearch();
}

// ────────────────────────────────────────────────
// Tab switching (required for onclick handlers)
// ────────────────────────────────────────────────
function switchTab(tabId) {
    document.querySelectorAll('.tab-button, .tab-content').forEach(el => {
        el.classList.remove('active');
    });

    const button = [...document.querySelectorAll('.tab-button')].find(
        b => b.getAttribute('onclick')?.includes(`'${tabId}'`)
    );
    if (button) button.classList.add('active');

    const content = document.getElementById(`${tabId}-tab`);
    if (content) content.classList.add('active');
}

// ────────────────────────────────────────────────
// Client-side live search (works on all tabs)
// ────────────────────────────────────────────────
function initializeLiveSearch() {
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('input', function () {
            const term = this.value.toLowerCase().trim();
            const tabContent = this.closest('.tab-content');
            if (!tabContent) return;

            const rows = tabContent.querySelectorAll('tbody tr');
            rows.forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
            });
        });
    });
}

// ────────────────────────────────────────────────
// INVENTORY REPORT
// ────────────────────────────────────────────────
async function loadInventoryReport() {
    const tbody = document.querySelector('#inventory-tab tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading inventory...</td></tr>';

    try {
        const res = await fetch('../api/get_inventory_report.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();

        if (!result.success) throw new Error(result.error || 'API error');

        tbody.innerHTML = '';

        if (result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No products found</td></tr>';
            return;
        }

        result.data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.product_name || '—'}</td>
                <td>${item.sku || '—'}</td>
                <td>${item.category || '—'}</td>
                <td class="text-center">${item.current_stock ?? 0}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(item.total_value)}</td>
                <td>
                    <span class="status-badge ${item.status?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}">
                        ${item.status || 'Unknown'}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Inventory load error:", err);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading inventory</td></tr>';
    }
}

// ────────────────────────────────────────────────
// SALES REPORT
// ────────────────────────────────────────────────
async function loadSalesReport() {
    const tbody = document.querySelector('#sales-tab tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading sales...</td></tr>';

    try {
        const res = await fetch('../api/get_sales_report.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.success) throw new Error(data.error || 'API error');

        tbody.innerHTML = '';

        if (data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No sales records found</td></tr>';
            return;
        }

        data.data.forEach(sale => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sale.sale_id}</td>
                <td>${sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('en-PH') : '—'}</td>
                <td>${sale.patient_name || '—'}</td>
                <td class="text-center">${sale.total_quantity || 0}</td>
                <td>${sale.product_summary || '—'}</td>  <!-- ONLY product names, no quantity -->
                <td>${formatCurrency(sale.total_amount)}</td>
                <td>${sale.payment_status || '—'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Sales load error:", err);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading sales</td></tr>';
    }
}

// ────────────────────────────────────────────────
// PATIENT RECORDS
// ────────────────────────────────────────────────
async function loadPatientReport() {
    const tbody = document.querySelector('#patient-records-tab tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Loading patient records...</td></tr>';

    try {
        // Use the absolute path you confirmed works in browser
        const res = await fetch('/bagares/api/get_patient_report.php');

        if (!res.ok) {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }

        const result = await res.json();

        if (!result.success) {
            throw new Error(result.error || 'API returned success: false');
        }

        tbody.innerHTML = '';

        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No patient records found</td></tr>';
            return;
        }

        result.data.forEach(p => {
            // Safe formatting for last exam date
            let examDate = 'No exam';
            if (p.last_exam_date && p.last_exam_date !== 'No exam') {
                const dateObj = new Date(p.last_exam_date);
                if (!isNaN(dateObj.getTime())) {
                    examDate = dateObj.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.full_name || '—'}</td>
                <td>${p.address || '—'}</td>
                <td>${examDate}</td>
                <td>${p.add || '—'}</td>
                <td>${p.pd || '—'}</td>
                <td>${p.age || '—'}</td>
                <td>
                    <button class="btn-icon more-actions-btn" 
                            data-patient-id="${p.patient_id}" 
                            title="More actions">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Click handler for 3-dot buttons
        document.querySelectorAll('.more-actions-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const patientId = this.getAttribute('data-patient-id');
                alert(`More actions for Patient #${patientId}\n(You can add View, Edit, Delete, etc. here)`);
            });
        });

    } catch (err) {
        console.error('Patient report failed:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    Failed to load patient records<br>
                    <small style="color:#666;">Error: ${err.message}</small><br>
                    <small>Check console (F12) or <a href="/bagares/api/get_patient_report.php" target="_blank">test API directly</a></small>
                </td>
            </tr>
        `;
    }
}

// ────────────────────────────────────────────────
// CONDEMNATION REPORT
// ────────────────────────────────────────────────
async function loadCondemnationReport() {
    const tbody = document.querySelector('#condemnation-tab tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4">Loading condemnation records...</td></tr>';

    try {
        const res = await fetch('../api/get_condemnation_report.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();

        if (!result.success) throw new Error(result.error || 'API error');

        tbody.innerHTML = '';

        if (result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">No condemned items found</td></tr>';
            return;
        }

        result.data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(item.condemned_date).toLocaleDateString('en-PH')}</td>
                <td>${item.product_name || '—'}</td>
                <td>${item.sku || '—'}</td>
                <td>${item.category || '—'}</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(item.total_loss)}</td>
                <td>${item.reason || '—'}</td>
                <td>${item.condemned_by || '—'}</td>
                <td>${item.notes || '—'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Condemnation load error:", err);
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-danger">Failed to load condemnation report</td></tr>';
    }
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function formatCurrency(value) {
    if (value == null) return '₱ 0.00';
    return '₱ ' + Number(value).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}