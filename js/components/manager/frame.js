// ============================================================
// FRAME / INVENTORY COMPONENT - frame.js (FIXED & STABLE)
// ============================================================

fetch('../components/manager/frame.html')
    .then(res => res.text())
    .then(data => {
        const placeholder = document.getElementById('frame-placeholder');
        if (placeholder) {
            placeholder.innerHTML = data;
            initializeInventory();
        }
    })
    .catch(error => console.error('Error loading frame.html:', error));

let inventoryData = [];
let currentCategory = 'all';
let currentSort = { column: null, direction: 'asc' };

function formatCurrency(num) {
    return "₱" + parseFloat(num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// ================= FETCH INVENTORY =================
window.fetchInventoryFromDB = async function () {
    try {
        const response = await fetch('../api/get_inventory.php');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        inventoryData = data;
        window.inventoryData = data; // ✅ GLOBAL (IMPORTANT)

        renderInventoryTable();
        window.filterByCategory('frames');

    } catch (error) {
        console.error('Inventory fetch failed:', error);
    }
};

function initializeInventory() {
    window.fetchInventoryFromDB();

    document.addEventListener('click', function (event) {
        if (!event.target.closest('details')) {
            document.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'));
        }
    });
}

// ================= TABLE RENDER =================
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    inventoryData.forEach(item => {
        tbody.appendChild(createTableRow({
            inventory_id: item.inventory_id, // ✅ KEEP ID
            name: item.product_name || 'Unknown',
            initials: item.initials || item.product_name?.substring(0, 2).toUpperCase() || '??',
            sku: item.sku || 'N/A',
            category: item.category || 'none',
            price: parseFloat(item.price || 0),
            stock: parseInt(item.stock || 0)
        }));
    });

    updateResultCount();
    applyCurrentView();
}

// ================= ROW CREATION =================
function createTableRow(item) {
    const row = document.createElement('tr');
    row.dataset.category = item.category;
    row.dataset.price = item.price;
    row.dataset.stock = item.stock;
    row.dataset.inventoryId = item.inventory_id;

    const status = getStockStatus(item.stock);

    row.innerHTML = `
        <td>
            <div class="product-cell">
                <div class="product-image">${item.initials}</div>
                <span>${item.name}</span>
            </div>
        </td>
        <td>${item.sku}</td>
        <td><span class="category-badge ${item.category}">${item.category}</span></td>
        <td>${formatCurrency(item.price)}</td>
        <td>${item.stock}</td>
        <td><span class="status-badge ${status.class}">${status.text}</span></td>
        <td>
            <div class="action-cell">
                <details class="action-dropdown">
                    <summary class="action-menu-btn">⋮</summary>
                    <div class="action-menu">
                        <button class="action-menu-item"
                            onclick="openViewDetails(${item.inventory_id})">
                            View
                        </button>
                        <button class="action-menu-item"
                            onclick="restockItem(${item.inventory_id})">
                            Restock
                        </button>
                        <button class="action-menu-item danger"
                            onclick="removeItem(${item.inventory_id})">
                            Remove
                        </button>
                    </div>
                </details>
            </div>
        </td>
    `;
    return row;
}

// ================= FILTERING =================
function applyCurrentView() {
    const searchValue = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const stockFilter = document.getElementById('stockFilter')?.value || 'all';

    document.querySelectorAll('#inventoryTableBody tr').forEach(row => {
        const rowText = row.innerText.toLowerCase();
        const rowCategory = row.dataset.category;
        const rowStock = parseInt(row.dataset.stock);

        const matchesSearch = rowText.includes(searchValue);
        const matchesCategory = currentCategory === 'all' || rowCategory === currentCategory;

        let matchesStock = true;
        if (stockFilter === 'in-stock') matchesStock = rowStock > 10;
        else if (stockFilter === 'low-stock') matchesStock = rowStock > 0 && rowStock <= 10;
        else if (stockFilter === 'out-of-stock') matchesStock = rowStock === 0;

        row.style.display = matchesSearch && matchesCategory && matchesStock ? '' : 'none';
    });

    updateResultCount();
}

window.filterByCategory = function (category) {
    currentCategory = category;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.onclick?.toString().includes(`'${category}'`));
    });
    applyCurrentView();
};

window.filterTable = applyCurrentView;
window.applyFilters = applyCurrentView;

// ================= UTILITIES =================
function getStockStatus(stock) {
    if (stock > 10) return { class: 'in-stock', text: 'In Stock' };
    if (stock > 0) return { class: 'low-stock', text: 'Low Stock' };
    return { class: 'out-of-stock', text: 'Out of Stock' };
}

function updateResultCount() {
    const visible = [...document.querySelectorAll('#inventoryTableBody tr')]
        .filter(r => r.style.display !== 'none').length;

    if (document.getElementById('showingEnd')) document.getElementById('showingEnd').textContent = visible;
    if (document.getElementById('totalItems')) document.getElementById('totalItems').textContent = visible;
}


window.sortTable = function(column) {
    const tbody = document.getElementById('inventoryTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    const columnMap = { product: 0, sku: 1, category: 2, price: 3, stock: 4 };
    const index = columnMap[column];

    rows.sort((a, b) => {
        let aVal = a.cells[index].innerText.replace('₱', '').replace(',', '').trim();
        let bVal = b.cells[index].innerText.replace('₱', '').replace(',', '').trim();

        if (column === 'price' || column === 'stock') {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }

        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    rows.forEach(row => tbody.appendChild(row));
}

// Action menu functions (implement these based on your needs)
window.openViewDetails = function(itemId) {
    console.log('View details for item:', itemId);
    // Implement view details functionality
}

window.restockItem = function(itemId) {
    console.log('Restock item:', itemId);
    // Implement restock functionality
}

window.removeItem = function(itemId) {
    console.log('Remove item:', itemId);
    // Implement remove functionality
}