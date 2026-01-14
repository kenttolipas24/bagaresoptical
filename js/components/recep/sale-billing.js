// ================================
// SALES & BILLING - JAVASCRIPT
// ================================

// Load sales & billing
fetch('../components/receptionist/sale-billing.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('sales-placeholder').innerHTML = data;
  })
  .catch(error => {
    console.error('Error loading sales & billing:', error);
  });

// State
let saleItems = [];
let selectedPaymentMethod = null;

// Sample inventory data
const inventoryData = [
  { id: 1, name: 'Blue Light Blocking Glasses', category: 'frames', price: 100.00 },
  { id: 2, name: 'Designer Reading Glasses', category: 'frames', price: 70.00 },
  { id: 3, name: 'Ray-Ban Aviator', category: 'frames', price: 400.00 },
  { id: 4, name: 'Progressive Lenses', category: 'lenses', price: 300.00 },
  { id: 5, name: 'Anti-Reflective Coating', category: 'lenses', price: 150.00 },
  { id: 6, name: 'Bifocal Lenses', category: 'lenses', price: 250.00 },
  { id: 7, name: 'Sports Glasses', category: 'frames', price: 320.00 },
  { id: 8, name: 'Blue Light Lenses', category: 'lenses', price: 180.00 }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initSalesBilling();
});

function initSalesBilling() {
  setupCategoryFilter();
  setupInventorySearch();
  setupInventoryClick();
  setupButtons();
  setupModal();
  renderInventory('all');
}

// ================================
// CATEGORY FILTER
// ================================

function setupCategoryFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const category = this.getAttribute('data-category');
      renderInventory(category);
    });
  });
}

// ================================
// INVENTORY SEARCH
// ================================

function setupInventorySearch() {
  const searchInput = document.getElementById('inventorySearch');
  
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const activeCategory = document.querySelector('.filter-btn.active').getAttribute('data-category');
      renderInventory(activeCategory, searchTerm);
    });
  }
}

// ================================
// RENDER INVENTORY
// ================================

function renderInventory(category = 'all', searchTerm = '') {
  const inventoryList = document.getElementById('inventoryList');
  
  if (!inventoryList) return;
  
  // Filter inventory
  let filteredItems = inventoryData;
  
  if (category !== 'all') {
    filteredItems = filteredItems.filter(item => item.category === category);
  }
  
  if (searchTerm) {
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm)
    );
  }
  
  // Clear and render
  inventoryList.innerHTML = '';
  
  filteredItems.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.setAttribute('data-item-id', item.id);
    
    itemDiv.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-category">${item.category}</span>
      </div>
      <div class="item-price">₱${item.price.toFixed(2)}</div>
    `;
    
    inventoryList.appendChild(itemDiv);
  });
}

// ================================
// INVENTORY CLICK
// ================================

function setupInventoryClick() {
  document.addEventListener('click', function(e) {
    const inventoryItem = e.target.closest('.inventory-item');
    
    if (inventoryItem) {
      const itemId = parseInt(inventoryItem.getAttribute('data-item-id'));
      addToSale(itemId);
    }
  });
}

function addToSale(itemId) {
  const item = inventoryData.find(i => i.id === itemId);
  
  if (!item) return;
  
  // Check if item already in sale
  const existingItem = saleItems.find(i => i.id === itemId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    saleItems.push({
      ...item,
      quantity: 1
    });
  }
  
  renderSaleItems();
  updateTotal();
}

// ================================
// RENDER SALE ITEMS
// ================================

function renderSaleItems() {
  const tableBody = document.getElementById('saleItemsBody');
  const emptyState = document.getElementById('emptyState');
  
  if (!tableBody) return;
  
  // Clear
  tableBody.innerHTML = '';
  
  if (saleItems.length === 0) {
    tableBody.innerHTML = `
      <div class="empty-state" id="emptyState">
        <p>No items added</p>
      </div>
    `;
    return;
  }
  
  // Render items
  saleItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'sale-item-row';
    
    const itemTotal = item.price * item.quantity;
    
    row.innerHTML = `
      <div class="sale-item-name">${item.name}</div>
      <div class="sale-item-price">₱${item.price.toFixed(2)}</div>
      <div class="quantity-controls">
        <button class="qty-btn qty-decrease" data-item-id="${item.id}">−</button>
        <span class="qty-value">${item.quantity}</span>
        <button class="qty-btn qty-increase" data-item-id="${item.id}">+</button>
      </div>
      <div class="sale-item-total">₱${itemTotal.toFixed(2)}</div>
      <button class="btn-remove" data-item-id="${item.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Setup button events
  setupSaleItemButtons();
}

function setupSaleItemButtons() {
  document.querySelectorAll('.qty-decrease').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const itemId = parseInt(this.getAttribute('data-item-id'));
      decreaseQuantity(itemId);
    });
  });
  
  document.querySelectorAll('.qty-increase').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const itemId = parseInt(this.getAttribute('data-item-id'));
      increaseQuantity(itemId);
    });
  });
  
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const itemId = parseInt(this.getAttribute('data-item-id'));
      removeItem(itemId);
    });
  });
}

function decreaseQuantity(itemId) {
  const item = saleItems.find(i => i.id === itemId);
  
  if (!item) return;
  
  if (item.quantity > 1) {
    item.quantity -= 1;
  } else {
    removeItem(itemId);
    return;
  }
  
  renderSaleItems();
  updateTotal();
}

function increaseQuantity(itemId) {
  const item = saleItems.find(i => i.id === itemId);
  
  if (!item) return;
  
  item.quantity += 1;
  renderSaleItems();
  updateTotal();
}

function removeItem(itemId) {
  saleItems = saleItems.filter(i => i.id !== itemId);
  renderSaleItems();
  updateTotal();
}

// ================================
// UPDATE TOTAL
// ================================

function updateTotal() {
  const total = saleItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  document.getElementById('totalAmount').textContent = `₱${total.toFixed(2)}`;
  
  // Enable/disable OK button
  const btnOk = document.getElementById('btnOk');
  if (btnOk) {
    btnOk.disabled = saleItems.length === 0;
  }
}

// ================================
// BUTTONS
// ================================

function setupButtons() {
  const btnCancel = document.getElementById('btnCancel');
  const btnOk = document.getElementById('btnOk');
  
  if (btnCancel) {
    btnCancel.addEventListener('click', function() {
      if (saleItems.length === 0) return;
      
      if (confirm('Cancel this sale?')) {
        clearSale();
      }
    });
  }
  
  if (btnOk) {
    btnOk.addEventListener('click', function() {
      if (saleItems.length === 0) return;
      openPaymentModal();
    });
  }
}

function clearSale() {
  saleItems = [];
  renderSaleItems();
  updateTotal();
}

// ================================
// PAYMENT MODAL
// ================================

function setupModal() {
  const modal = document.getElementById('paymentModal');
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('btnModalCancel');
  const confirmBtn = document.getElementById('btnModalConfirm');
  const overlay = modal.querySelector('.modal-overlay');
  
  // Close modal handlers
  if (closeBtn) {
    closeBtn.addEventListener('click', closePaymentModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closePaymentModal);
  }
  
  if (overlay) {
    overlay.addEventListener('click', closePaymentModal);
  }
  
  // Payment option selection
  document.querySelectorAll('.payment-option').forEach(option => {
    option.addEventListener('click', function() {
      document.querySelectorAll('.payment-option').forEach(opt => 
        opt.classList.remove('selected')
      );
      this.classList.add('selected');
      selectedPaymentMethod = this.getAttribute('data-method');
      
      // Enable confirm button
      if (confirmBtn) {
        confirmBtn.disabled = false;
      }
    });
  });
  
  // Confirm payment
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
      }
      
      completeSale();
    });
  }
}

function openPaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.style.display = 'flex';
    selectedPaymentMethod = null;
    
    // Reset selections
    document.querySelectorAll('.payment-option').forEach(opt => 
      opt.classList.remove('selected')
    );
    
    // Disable confirm button
    const confirmBtn = document.getElementById('btnModalConfirm');
    if (confirmBtn) {
      confirmBtn.disabled = true;
    }
  }
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ================================
// COMPLETE SALE
// ================================

function completeSale() {
  const total = saleItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  
  const saleData = {
    items: saleItems,
    total: total,
    paymentMethod: selectedPaymentMethod,
    timestamp: new Date().toISOString()
  };
  
  console.log('Sale completed:', saleData);
  
  // TODO: Send to API
  // fetch('/api/sales', { method: 'POST', body: JSON.stringify(saleData) })
  
  // Show success
  alert(`Payment successful!\nTotal: ₱${total.toFixed(2)}\nMethod: ${selectedPaymentMethod.toUpperCase()}`);
  
  // Close modal and clear sale
  closePaymentModal();
  clearSale();
}

// ================================
// EXPORT
// ================================

window.SalesSimple = {
  addToSale: addToSale,
  clearSale: clearSale,
  getSaleItems: () => saleItems
};