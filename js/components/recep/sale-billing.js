// ================================================
// SALES & BILLING - COMPLETE JAVASCRIPT
// ================================================

let saleItems = [];
let selectedPaymentMethod = null;

const inventoryData = [
    { id: 1, name: 'Blue Light Blocking Glasses', category: 'frames', price: 100.00 },
    { id: 2, name: 'Designer Reading Glasses',     category: 'frames', price:  70.00 },
    { id: 3, name: 'Ray-Ban Aviator',              category: 'frames', price: 400.00 },
    { id: 4, name: 'Progressive Lenses',           category: 'lenses', price: 300.00 },
    { id: 5, name: 'Anti-Reflective Coating',      category: 'lenses', price: 150.00 },
    { id: 6, name: 'Bifocal Lenses',               category: 'lenses', price: 250.00 },
    { id: 7, name: 'Sports Glasses',               category: 'frames', price: 320.00 },
    { id: 8, name: 'Blue Light Lenses',            category: 'lenses', price: 180.00 }
];

// Load sales & billing HTML then initialize
fetch('../components/receptionist/sale-billing.html')
    .then(res => res.text())
    .then(data => {
        document.getElementById('sales-placeholder').innerHTML = data;
        initSalesBilling();
    })
    .catch(error => {
        console.error('Error loading sales & billing:', error);
    });

function initSalesBilling() {
    setupHeaderFields();
    setupCategoryFilter();
    setupInventorySearch();
    setupInventoryClick();
    setupButtons();
    setupModal();
    renderInventory('frames');
}

function setupHeaderFields() {
    const dateInput = document.getElementById('saleDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
}

function validateHeaderFields() {
    const patientName = document.getElementById('patientName')?.value.trim();
    const saleDate = document.getElementById('saleDate')?.value;

    if (!patientName) {
        alert('Please enter patient name');
        return false;
    }
    if (!saleDate) {
        alert('Please select a date');
        return false;
    }
    return true;
}

function setupCategoryFilter() {
    document.querySelectorAll('.filter-btn, .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn, .tab-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            renderInventory(category);
        });
    });
}

function setupInventorySearch() {
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const activeCategory = document.querySelector('.filter-btn.active, .tab-btn.active')?.dataset.category || 'frames';
            renderInventory(activeCategory, term);
        });
    }
}

function renderInventory(category = 'frames', searchTerm = '') {
    const container = document.getElementById('inventoryList');
    if (!container) return;

    let items = inventoryData.filter(i => i.category === category);
    
    if (searchTerm) {
        items = items.filter(i => i.name.toLowerCase().includes(searchTerm));
    }

    container.innerHTML = items.length === 0 
        ? '<div class="empty-cart"><p>No items found</p></div>'
        : '';

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.dataset.itemId = item.id;
        div.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-category">${item.category}</div>
            </div>
            <div class="item-price">₱${item.price.toFixed(2)}</div>
        `;
        container.appendChild(div);
    });
}

function setupInventoryClick() {
    document.addEventListener('click', e => {
        const item = e.target.closest('.inventory-item');
        if (item) {
            const id = parseInt(item.dataset.itemId);
            addToSale(id);
        }
    });
}

function addToSale(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) return;

    const existing = saleItems.find(i => i.id === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        saleItems.push({ ...item, quantity: 1 });
    }

    renderSaleItems();
    updateTotal();
}

function renderSaleItems() {
    const container = document.getElementById('saleItemsBody');
    if (!container) return;

    if (saleItems.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-icon">🛒</div>
                <p>No items added yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    saleItems.forEach(item => {
        const total = item.price * item.quantity;
        const row = document.createElement('div');
        row.className = 'sale-item-row';
        row.innerHTML = `
            <div class="sale-item-name">${item.name}</div>
            <div class="sale-item-price">₱${item.price.toFixed(2)}</div>
            <div class="quantity-controls">
                <button class="qty-btn qty-decrease" data-item-id="${item.id}">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn qty-increase" data-item-id="${item.id}">+</button>
            </div>
            <div class="sale-item-total">₱${total.toFixed(2)}</div>
            <button class="btn-remove" data-item-id="${item.id}">×</button>
        `;
        container.appendChild(row);
    });

    setupSaleItemControls();
}

function setupSaleItemControls() {
    document.querySelectorAll('.qty-decrease').forEach(btn => {
        btn.addEventListener('click', () => changeQuantity(parseInt(btn.dataset.itemId), -1));
    });
    
    document.querySelectorAll('.qty-increase').forEach(btn => {
        btn.addEventListener('click', () => changeQuantity(parseInt(btn.dataset.itemId), 1));
    });
    
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => removeItem(parseInt(btn.dataset.itemId)));
    });
}

function changeQuantity(itemId, delta) {
    const item = saleItems.find(i => i.id === itemId);
    if (!item) return;

    item.quantity = Math.max(0, item.quantity + delta);
    
    if (item.quantity === 0) {
        removeItem(itemId);
    } else {
        renderSaleItems();
        updateTotal();
    }
}

function removeItem(itemId) {
    saleItems = saleItems.filter(i => i.id !== itemId);
    renderSaleItems();
    updateTotal();
}

function updateTotal() {
    const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('totalAmount').textContent = `₱${total.toFixed(2)}`;
    
    const okBtn = document.getElementById('btnOk');
    if (okBtn) okBtn.disabled = saleItems.length === 0;
}

function setupButtons() {
    document.getElementById('btnCancel')?.addEventListener('click', () => {
        if (saleItems.length > 0 && confirm('Cancel this sale?')) {
            saleItems = [];
            renderSaleItems();
            updateTotal();
        }
    });

    document.getElementById('btnOk')?.addEventListener('click', () => {
        if (saleItems.length === 0) return;
        if (!validateHeaderFields()) return;
        document.getElementById('paymentModal').style.display = 'flex';
    });
}

function setupModal() {
    const modal = document.getElementById('paymentModal');
    if (!modal) return;

    document.getElementById('closeModal')?.addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('btnModalCancel')?.addEventListener('click', () => modal.style.display = 'none');
    modal.querySelector('.modal-backdrop, .modal-overlay')?.addEventListener('click', () => modal.style.display = 'none');

    document.querySelectorAll('.payment-option, .payment-btn').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-option, .payment-btn').forEach(o => o.classList.remove('selected', 'active'));
            opt.classList.add('selected', 'active');
            selectedPaymentMethod = opt.dataset.method;
            document.getElementById('btnModalConfirm').disabled = false;
        });
    });

    document.getElementById('btnModalConfirm')?.addEventListener('click', () => {
        if (selectedPaymentMethod) {
            completeSale();
        }
    });
}

function completeSale() {
    const patientName = document.getElementById('patientName')?.value.trim() || 'Walk-in';
    const saleDate = document.getElementById('saleDate')?.value || new Date().toISOString().split('T')[0];
    const total = saleItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const saleRecord = {
        patientName,
        date: saleDate,
        items: [...saleItems],
        total,
        paymentMethod: selectedPaymentMethod,
        timestamp: new Date().toISOString()
    };

    console.log('Sale completed:', saleRecord);
    alert(`Sale completed!\nPatient: ${patientName}\nTotal: ₱${total.toFixed(2)}\nPayment: ${selectedPaymentMethod?.toUpperCase()}`);

    saleItems = [];
    document.getElementById('patientName').value = '';
    document.getElementById('paymentModal').style.display = 'none';
    renderSaleItems();
    updateTotal();
}