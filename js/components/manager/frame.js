// ============================================================
// FRAME / INVENTORY COMPONENT - frame.js
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

window.fetchInventoryFromDB = async function() {
    try {
        const response = await fetch('../api/get_inventory.php', {
            method: 'GET',
            credentials: 'omit' 
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const text = await response.text();
        
        if (text.trim().startsWith('<')) {
            console.error("PHP Error detected. Server sent HTML instead of JSON:", text);
            return;
        }

        const data = JSON.parse(text);
        if (data.error) {
            console.error("Database Error:", data.error);
            return;
        }

        inventoryData = data;

        renderInventoryTable();

        window.filterByCategory('frames');
            
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

function initializeInventory() {
    window.fetchInventoryFromDB();
    
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.action-cell')) {
            closeAllActionMenus();
        }
    });
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = ''; 
    
    inventoryData.forEach(item => {
        const formattedItem = {
            name: item.product_name || item.name || "Unknown",
            initials: item.initials || "??",
            sku: item.sku || "N/A",
            category: item.category || "none",
            price: parseFloat(item.price || 0),
            stock: parseInt(item.stock || 0)
        };
        tbody.appendChild(createTableRow(formattedItem));
    });

    updateResultCount();
    applyCurrentView();
}

function createTableRow(item) {
    const row = document.createElement('tr');
    row.dataset.category = item.category;
    row.dataset.price = item.price;
    row.dataset.stock = item.stock;
    
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
                <button class="action-menu-btn" onclick="toggleActionMenu(event, this)">⋮</button>
                <div class="action-menu">
                    <button class="action-menu-item" onclick="openViewDetails(this)">View</button>
                    <button class="action-menu-item" onclick="editItem(this)">Edit</button>
                    <button class="action-menu-item danger" onclick="deleteItem(this)">Delete</button>
                </div>
            </div>
        </td>
    `;
    return row;
}

function applyCurrentView() {
    const searchInput = document.getElementById('searchInput');
    const searchValue = (searchInput ? searchInput.value : '').toLowerCase();
    
    const stockDropdown = document.getElementById('stockFilter');
    const stockFilter = stockDropdown ? stockDropdown.value : 'all';
    
    const rows = document.querySelectorAll('#inventoryTableBody tr');

    rows.forEach(row => {
        const rowText = row.innerText.toLowerCase();
        const rowCategory = row.dataset.category;
        const rowStock = parseInt(row.dataset.stock || 0);

        const matchesSearch = rowText.includes(searchValue);

        const matchesCategory = (currentCategory === 'all' || rowCategory === currentCategory);
        
        let matchesStock = true;
        if (stockFilter === 'in-stock') matchesStock = rowStock > 10;
        else if (stockFilter === 'low-stock') matchesStock = rowStock > 0 && rowStock <= 10;
        else if (stockFilter === 'out-of-stock') matchesStock = rowStock === 0;

        if (matchesSearch && matchesCategory && matchesStock) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });

    updateResultCount();
}

window.filterByCategory = function(category) {
    currentCategory = category;

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('onclick').includes(`'${category}'`)) {
            tab.classList.add('active');
        }
    });

    applyCurrentView();
}

window.filterTable = () => applyCurrentView();
window.applyFilters = () => applyCurrentView();

function getStockStatus(stock) {
    if (stock > 10) return { class: 'in-stock', text: 'In Stock' };
    if (stock > 0) return { class: 'low-stock', text: 'Low Stock' };
    return { class: 'out-of-stock', text: 'Out of Stock' };
}

function toggleActionMenu(event, button) {
    event.stopPropagation();
    const menu = button.nextElementSibling;
    const isShowing = menu.classList.contains('show');
    closeAllActionMenus();
    if (!isShowing) menu.classList.add('show');
}

function closeAllActionMenus() {
    document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
}

function updateResultCount() {
    const visible = Array.from(document.querySelectorAll('#inventoryTableBody tr')).filter(r => r.style.display !== 'none');
    if (document.getElementById('showingEnd')) document.getElementById('showingEnd').textContent = visible.length;
    if (document.getElementById('totalItems')) document.getElementById('totalItems').textContent = visible.length;
}

//-----------------------------------------------------------
//   ------------   SORTING    ------------
//----------------------------------------------------------- 
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

// ... Additional functions like editItem, deleteItem, openViewDetails would follow here ...