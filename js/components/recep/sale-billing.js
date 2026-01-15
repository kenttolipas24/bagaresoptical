// ================================================
// SALES & BILLING - FINAL WORKING VERSION
// Fixes tab-navigation timing issue
// January 2026
// ================================================

// ────────────────────────────────────────────────
// GLOBAL STATE
// ────────────────────────────────────────────────
let saleItems = [];
let selectedPaymentMethod = null;
let salesInitialized = false;

// ────────────────────────────────────────────────
// INVENTORY (STATIC DEMO DATA)
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// LOAD HTML COMPONENT ONLY (NO INIT HERE)
// ────────────────────────────────────────────────
fetch('../components/receptionist/sale-billing.html')
  .then(res => res.text())
  .then(html => {
    const holder = document.getElementById('sales-placeholder');
    if (!holder) return;
    holder.innerHTML = html;
  })
  .catch(console.error);

// ────────────────────────────────────────────────
// EXPOSE INIT FOR TAB NAVIGATION
// ────────────────────────────────────────────────
window.initSalesBilling = function () {
  if (salesInitialized) return;
  salesInitialized = true;

  setupHeaderFields();
  setupPatientModalSearch();
  setupCategoryFilter();
  setupInventorySearch();
  setupInventoryClick();
  setupButtons();
  setupPaymentModal();
  renderInventory('frames');

  console.log('Sales billing initialized');
};

// ────────────────────────────────────────────────
// PATIENT SEARCH MODAL (FIXED)
// ────────────────────────────────────────────────
function setupPatientModalSearch() {
  const input = document.getElementById('patientName');
  const modal = document.getElementById('patientSearchModal');
  const modalInput = document.getElementById('modalPatientSearch');
  const list = document.getElementById('patientListContainer');

  if (!input || !modal || !modalInput || !list) {
    console.error('Patient modal elements missing');
    return;
  }

  let debounce;

  input.addEventListener('input', () => {
    const term = input.value.trim();
    if (term.length < 2) {
      modal.style.display = 'none';
      return;
    }
    modal.style.display = 'flex';
    modalInput.value = term;
    modalInput.focus();
    fetchPatients(term);
  });

  modalInput.addEventListener('input', () => {
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
  const container = document.getElementById('patientListContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      Loading patients...
    </div>
  `;

  try {
    const res = await fetch(`../api/search_patients.php?search=${encodeURIComponent(term)}`);
    if (!res.ok) throw new Error(res.status);

    const patients = await res.json();
    container.innerHTML = '';

    if (!patients.length) {
      container.innerHTML = `<div class="no-results">No patients found</div>`;
      return;
    }

    patients.forEach(p => {
      const card = document.createElement('div');
      card.className = 'patient-card';
      card.innerHTML = `
        <div class="patient-avatar">${getInitials(p.name)}</div>
        <div class="patient-info">
          <h4>${p.name}</h4>
          <div class="meta">ID: ${p.id} • ${p.appointment_date || 'No appointment'}</div>
        </div>
      `;
      card.onclick = () => {
        document.getElementById('patientName').value = p.name;
        document.getElementById('patientSearchModal').style.display = 'none';
        document.getElementById('patientName').blur();
      };
      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
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
  if (!document.getElementById('patientName').value.trim()) {
    alert('Please select a patient');
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

  const items = inventoryData.filter(i =>
    i.category === category && i.name.toLowerCase().includes(search)
  );

  list.innerHTML = '';

  if (!items.length) {
    list.innerHTML = `<div class="empty-cart">No items found</div>`;
    return;
  }

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'inventory-item';
    el.dataset.id = item.id;
    el.innerHTML = `
      <div>
        <div class="item-name">${item.name}</div>
        <div class="item-category">${item.category}</div>
      </div>
      <div class="item-price">₱${item.price.toFixed(2)}</div>
    `;
    list.appendChild(el);
  });
}

function setupInventoryClick() {
  document.addEventListener('click', e => {
    const item = e.target.closest('.inventory-item');
    if (item) addToSale(+item.dataset.id);
  });
}

// ────────────────────────────────────────────────
// SALE LOGIC
// ────────────────────────────────────────────────
function addToSale(id) {
  const item = inventoryData.find(i => i.id === id);
  if (!item) return;

  const existing = saleItems.find(i => i.id === id);
  existing ? existing.quantity++ : saleItems.push({ ...item, quantity: 1 });

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
  item.quantity += d;
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
  alert('Sale completed successfully!');
  saleItems = [];
  selectedPaymentMethod = null;
  document.getElementById('patientName').value = '';
  document.getElementById('paymentModal').style.display = 'none';
  renderSaleItems();
  updateTotal();
}
