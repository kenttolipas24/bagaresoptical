// ================================================
// SALES & BILLING - REAL DATA VERSION
// Fetches inventory from database
// January 2026
// ================================================

// ────────────────────────────────────────────────
// GLOBAL STATE
// ────────────────────────────────────────────────
let saleItems = [];
let selectedPaymentMethod = null;
let salesInitialized = false;
let inventoryData = []; // Will be populated from database

// ────────────────────────────────────────────────
// LOAD HTML COMPONENT ONLY (NO INIT HERE)
// ────────────────────────────────────────────────
fetch('../components/receptionist/sale-billing.html')
  .then(res => res.text())
  .then(html => {
    const holder = document.getElementById('sales-placeholder');
    if (!holder) return;
    holder.innerHTML = html;
    console.log('✅ Sales HTML loaded');
  })
  .catch(console.error);

// ────────────────────────────────────────────────
// EXPOSE INIT FOR TAB NAVIGATION
// ────────────────────────────────────────────────
window.initSalesBilling = async function () {
  if (salesInitialized) {
    console.log('⚠️ Sales already initialized');
    return;
  }
  salesInitialized = true;

  console.log('🔄 Initializing Sales & Billing...');

  // Load inventory from database
  await loadInventoryFromDB();

  setupHeaderFields();
  setupCategoryFilter();
  setupInventorySearch();
  setupInventoryClick();
  setupButtons();
  setupPaymentModal();
  
  // Render frames by default
  renderInventory('frames');

  // ⚠️ IMPORTANT: Wait for modal HTML to be in DOM before setting up listeners
  setTimeout(() => {
    setupPatientModalSearch();
    console.log('✅ Patient modal listeners set up');
  }, 500);

  console.log('✅ Sales billing initialized with real data');
};

// ────────────────────────────────────────────────
// LOAD INVENTORY FROM DATABASE
// ────────────────────────────────────────────────
async function loadInventoryFromDB() {
  const list = document.getElementById('inventoryList');
  if (list) {
    list.innerHTML = `
      <div style="text-align:center; padding:40px; color:#666;">
        <div class="spinner" style="margin:0 auto 15px;"></div>
        Loading inventory...
      </div>
    `;
  }

  try {
    console.log('📦 Fetching inventory from database...');
    const res = await fetch('../api/get_inventory.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Transform and sanitize data
    inventoryData = data.map(item => ({
      id: item.inventory_id,
      name: item.product_name,
      category: item.category ? item.category.toLowerCase().trim() : '', 
      price: parseFloat(item.price) || 0,
      sku: item.sku,
      stock: parseInt(item.stock) || 0,
      initials: item.initials
    }));

    console.log(`✅ Successfully loaded ${inventoryData.length} items`);

  } catch (err) {
    console.error('❌ Error loading inventory:', err);
    inventoryData = [];
    if (list) {
      list.innerHTML = `
        <div class="empty-cart" style="color:#e74c3c;">
          ⚠️ Error loading inventory<br>
          <small>${err.message}</small>
        </div>
      `;
    }
  }
}

// ────────────────────────────────────────────────
// PATIENT SEARCH MODAL
// ────────────────────────────────────────────────
function setupPatientModalSearch() {
  const input = document.getElementById('patientName');
  const modal = document.getElementById('salesPatientModal');
  const modalInput = document.getElementById('salesPatientSearch');
  const list = document.getElementById('salesPatientList');

  if (!input || !modal || !modalInput || !list) {
    console.error('❌ Patient modal elements missing:', {
      input: !!input,
      modal: !!modal,
      modalInput: !!modalInput,
      list: !!list
    });
    return;
  }

  let debounce;

  input.addEventListener('input', () => {
    // Clear previously selected patient ID
    document.getElementById('patientId').value = '';

    const term = input.value.trim();

    // Show modal even on 1 character
    if (term.length < 1) {
      modal.style.display = 'none';
      return;
    }

    modal.style.display = 'flex';
    modalInput.value = term;
    modalInput.focus();
    fetchPatients(term);
  });

  modalInput.addEventListener('input', () => {
    document.getElementById('patientId').value = ''; // reset ID
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      fetchPatients(modalInput.value.trim());
    }, 300);
  });

  document.getElementById('closePatientModal').onclick =
  document.getElementById('btnCancelPatient').onclick = () => {
    modal.style.display = 'none';
    input.blur();
  };

  modal.onclick = e => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// ────────────────────────────────────────────────
// FETCH PATIENTS
// ────────────────────────────────────────────────
async function fetchPatients(term) {
  const container = document.getElementById('salesPatientList');
  if (!container) {
    console.error('❌ salesPatientList not found');
    return;
  }

  try {
    const res = await fetch(`../api/search_patients.php?search=${encodeURIComponent(term)}`);
    if (!res.ok) throw new Error(res.status);

    const patients = await res.json();
    container.innerHTML = '';

    // ❌ No results
    if (!patients.length) {
      document.getElementById('patientId').value = '';
      container.innerHTML = `<div class="no-results">No patients found</div>`;
      return;
    }

    // ✅ 1️⃣ AUTO-SELECT IF EXACT MATCH (BEST)
    const exact = patients.find(p =>
      p.name.toLowerCase() === term.toLowerCase()
    );

    if (exact) {
      document.getElementById('patientName').value = exact.name;
      document.getElementById('patientId').value = exact.id;
      document.getElementById('salesPatientModal').style.display = 'none';
      console.log('✅ Auto-selected exact match:', exact.name);
      return;
    }

    // ✅ 2️⃣ AUTO-SELECT IF ONLY ONE RESULT
    if (patients.length === 1) {
      const p = patients[0];
      document.getElementById('patientName').value = p.name;
      document.getElementById('patientId').value = p.id;
      document.getElementById('salesPatientModal').style.display = 'none';
      console.log('✅ Auto-selected single result:', p.name);
      return;
    }

    // 🟡 3️⃣ MULTIPLE RESULTS → USER MUST CLICK
    patients.forEach(p => {
      const card = document.createElement('div');
      card.className = 'patient-card';
      card.innerHTML = `
        <div class="patient-avatar">${getInitials(p.name)}</div>
        <div class="patient-info">
          <h4>${p.name}</h4>
          <div class="meta">ID: ${p.id}</div>
        </div>
      `;

      card.onclick = () => {
        document.getElementById('patientName').value = p.name;
        document.getElementById('patientId').value = p.id;
        document.getElementById('salesPatientModal').style.display = 'none';
      };

      container.appendChild(card);
    });

  } catch (err) {
    console.error('❌ fetchPatients error:', err);
    container.innerHTML = `<div class="no-results">Error loading patients</div>`;
  }
}



function getInitials(name) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] || '')).toUpperCase();
}

// ────────────────────────────────────────────────
// HEADER
// ────────────────────────────────────────────────
function setupHeaderFields() {
  const date = document.getElementById('saleDate');
  if (date) date.value = new Date().toISOString().split('T')[0];
}

function validateHeaderFields() {
  const patientName = document.getElementById('patientName').value;
  if (!patientName) {
    alert('Please select a patient from the list');
    return false;
  }
  return true;
}

// ────────────────────────────────────────────────
// INVENTORY
// ────────────────────────────────────────────────
function setupCategoryFilter() {
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderInventory(btn.dataset.category);
    };
  });
}

function setupInventorySearch() {
  const search = document.getElementById('inventorySearch');
  if (!search) return;

  search.oninput = e => {
    const cat = document.querySelector('.category-btn.active')?.dataset.category || 'frames';
    renderInventory(cat, e.target.value.toLowerCase());
  };
}

function renderInventory(category, search = '') {
  const list = document.getElementById('inventoryList');
  if (!list) return;

  const searchTerm = search.toLowerCase().trim();
  const targetCategory = category.toLowerCase().trim();

  const items = inventoryData.filter(i =>
    i.category === targetCategory && i.name.toLowerCase().includes(searchTerm)
  );

  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = `<div class="empty-cart">No ${category} found</div>`;
    return;
  }

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'inventory-item';
    el.dataset.id = item.id;
    
    const stockClass = item.stock <= 0 ? 'out-of-stock' : item.stock < 10 ? 'low-stock' : '';
    const stockText = item.stock <= 0 ? 'Out of Stock' : `${item.stock} in stock`;
    
    el.innerHTML = `
      <div>
        <div class="item-name">${item.name}</div>
        <div class="item-category">${item.category} • SKU: ${item.sku}</div>
        <div class="item-stock ${stockClass}">${stockText}</div>
      </div>
      <div class="item-price">₱${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
    `;
    
    if (item.stock <= 0) {
      el.style.opacity = '0.5';
      el.style.cursor = 'not-allowed';
    }
    
    list.appendChild(el);
  });
}

function setupInventoryClick() {
  document.addEventListener('click', e => {
    const item = e.target.closest('.inventory-item');
    if (!item) return;
    
    const id = +item.dataset.id;
    const inventoryItem = inventoryData.find(i => i.id === id);
    
    // Check stock before adding
    if (inventoryItem && inventoryItem.stock > 0) {
      addToSale(id);
    } else {
      alert('This item is out of stock');
    }
  });
}

// ────────────────────────────────────────────────
// SALE LOGIC
// ────────────────────────────────────────────────
function addToSale(id) {
  const item = inventoryData.find(i => i.id === id);
  if (!item) return;

  const existing = saleItems.find(i => i.id === id);
  
  if (existing) {
    // Check if we have enough stock
    if (existing.quantity >= item.stock) {
      alert(`Only ${item.stock} units available in stock`);
      return;
    }
    existing.quantity++;
  } else {
    saleItems.push({ ...item, quantity: 1 });
  }

  renderSaleItems();
  updateTotal();
}

function renderSaleItems() {
  const body = document.getElementById('saleItemsBody');
  if (!body) return;

  body.innerHTML = saleItems.length
    ? ''
    : `<div class="empty-cart">🛒 No items added</div>`;

  saleItems.forEach(item => {
    const row = document.createElement('div');
    row.className = 'sale-item-row';
    row.innerHTML = `
      <div>${item.name}</div>
      <div>₱${item.price.toFixed(2)}</div>
      <div>
        <button class="qty" data-id="${item.id}" data-d="-1">−</button>
        ${item.quantity}
        <button class="qty" data-id="${item.id}" data-d="1">+</button>
      </div>
      <div>₱${(item.price * item.quantity).toFixed(2)}</div>
      <button class="remove" data-id="${item.id}">×</button>
    `;
    body.appendChild(row);
  });

  document.querySelectorAll('.qty').forEach(b =>
    b.onclick = () => changeQuantity(b.dataset.id, +b.dataset.d)
  );
  document.querySelectorAll('.remove').forEach(b =>
    b.onclick = () => removeItem(b.dataset.id)
  );
}

function changeQuantity(id, d) {
  const item = saleItems.find(i => i.id == id);
  if (!item) return;
  
  const inventoryItem = inventoryData.find(i => i.id == id);
  const newQty = item.quantity + d;
  
  // Check stock limit when increasing
  if (d > 0 && inventoryItem && newQty > inventoryItem.stock) {
    alert(`Only ${inventoryItem.stock} units available in stock`);
    return;
  }
  
  item.quantity = newQty;
  if (item.quantity <= 0) removeItem(id);
  
  renderSaleItems();
  updateTotal();
}

function removeItem(id) {
  saleItems = saleItems.filter(i => i.id != id);
  renderSaleItems();
  updateTotal();
}

function updateTotal() {
  const total = saleItems.reduce((s, i) => s + i.price * i.quantity, 0);
  document.getElementById('totalAmount').textContent = `₱${total.toFixed(2)}`;
  document.getElementById('btnProcess').disabled = !saleItems.length;
}

// ────────────────────────────────────────────────
// PAYMENT
// ────────────────────────────────────────────────
function setupButtons() {
  document.getElementById('btnProcess').onclick = () => {
    if (validateHeaderFields())
      document.getElementById('paymentModal').style.display = 'flex';
  };

  document.getElementById('btnCancel').onclick = () => {
    if (confirm('Cancel sale?')) {
      saleItems = [];
      renderSaleItems();
      updateTotal();
    }
  };
}

function setupPaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (!modal) return;

  document.getElementById('closeModal').onclick =
  document.getElementById('btnModalCancel').onclick = () => {
    modal.style.display = 'none';
  };

  modal.onclick = e => {
    if (e.target === modal) modal.style.display = 'none';
  };

  document.querySelectorAll('.payment-methods button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.payment-methods button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPaymentMethod = btn.dataset.method;
      document.getElementById('btnModalConfirm').disabled = false;
    };
  });

  document.getElementById('btnModalConfirm').onclick = completeSale;
}

function completeSale() {
  const patientId = document.getElementById('patientId').value;
  const saleDate = document.getElementById('saleDate').value;

  if (!patientId) {
    alert('Please select a patient');
    return;
  }

  const payload = {
    patient_id: patientId,  // ← CHANGED from patient_request_id
    sale_date: saleDate,
    payment_method: selectedPaymentMethod,
    total_amount: saleItems.reduce((s, i) => s + i.price * i.quantity, 0),
    items: saleItems.map(i => ({
      inventory_id: i.id,
      quantity: i.quantity,
      price: i.price
    }))
  };

  console.log('💾 Saving sale:', payload);

  fetch('../api/create_sale.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      alert(data.error || 'Failed to save sale');
      return;
    }

    alert('Sale saved successfully');
    console.log('✅ Sale saved successfully');

    // Reset UI
    saleItems = [];
    selectedPaymentMethod = null;
    document.getElementById('patientName').value = '';
    document.getElementById('patientId').value = '';
    document.getElementById('paymentModal').style.display = 'none';

    renderSaleItems();
    updateTotal();
    
    // Refresh inventory
    loadInventoryFromDB().then(() => {
      const cat = document.querySelector('.category-btn.active')?.dataset.category || 'frames';
      renderInventory(cat);
    });
  })
  .catch(err => {
    console.error('❌ Error saving sale:', err);
    alert('Server error while saving sale');
  });
}