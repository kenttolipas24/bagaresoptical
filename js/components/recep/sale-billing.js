// ================================================
// SALES & BILLING - ENHANCED VERSION
// Features: Discount, Void/Refund, Staff Tracking,
// Exam Linking, Cash Tendering
// ================================================

// ────────────────────────────────────────────────
// GLOBAL STATE
// ────────────────────────────────────────────────
let saleItems = [];
let selectedPaymentMethod = null;
let salesInitialized = false;
let inventoryData = [];
let currentStaff = null;
let discountInfo = { type: 'none', value: 0, idNumber: '' };
let currentVoidSaleId = null;

// ────────────────────────────────────────────────
// LOAD HTML COMPONENT
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

  await getCurrentStaff();
  await loadInventoryFromDB();

  setupHeaderFields();
  setupCategoryFilter();
  setupInventorySearch();
  setupInventoryClick();
  setupButtons();
  setupPaymentModal();
  setupDiscountHandlers();
  setupSalesHistoryModal();
  setupVoidModal();
  setupViewSaleModal();
  
  renderInventory('frames');

  setTimeout(() => {
    setupPatientModalSearch();
    console.log('✅ Patient modal listeners set up');
  }, 500);

  console.log('✅ Sales billing initialized with enhanced features');
};

// ────────────────────────────────────────────────
// GET CURRENT STAFF (Feature 5: Staff Tracking)
// ────────────────────────────────────────────────
async function getCurrentStaff() {
  try {
    const res = await fetch('../api/get_current_user.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (data.success && data.user) {
      currentStaff = {
        id: data.user.user_id || data.user.id,
        name: data.user.fullname || data.user.name || 'Unknown Staff'
      };
      console.log('✅ Current staff:', currentStaff.name);
    }
  } catch (err) {
    console.warn('⚠️ Could not get current staff:', err);
    currentStaff = { id: null, name: 'Unknown Staff' };
  }
}

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
    const res = await fetch('../api/get_inventory.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    inventoryData = data.map(item => ({
      id: item.inventory_id,
      name: item.product_name,
      category: item.category ? item.category.toLowerCase().trim() : '', 
      price: parseFloat(item.price) || 0,
      sku: item.sku,
      stock: parseInt(item.stock) || 0,
      initials: item.initials
    }));

    console.log(`✅ Loaded ${inventoryData.length} inventory items`);

  } catch (err) {
    console.error('❌ Error loading inventory:', err);
    inventoryData = [];
    if (list) {
      list.innerHTML = `<div class="empty-cart" style="color:#e74c3c;">⚠️ Error loading inventory</div>`;
    }
  }
}

// ────────────────────────────────────────────────
// PATIENT SEARCH MODAL
// ────────────────────────────────────────────────
function setupPatientModalSearch() {
  const dropdownBtn = document.getElementById('patientDropdownBtn');
  const modal = document.getElementById('salesPatientModal');
  const modalInput = document.getElementById('salesPatientSearch');
  const list = document.getElementById('salesPatientList');

  if (!dropdownBtn || !modal || !modalInput || !list) {
    console.error('❌ Patient dropdown elements missing');
    return;
  }

  let debounce;

  dropdownBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    modal.classList.add('show');
    dropdownBtn.classList.add('open');
    modalInput.value = '';
    modalInput.focus();
    fetchPatients('');
  });

  modalInput.addEventListener('input', () => {
    document.getElementById('patientId').value = '';
    clearTimeout(debounce);
    debounce = setTimeout(() => fetchPatients(modalInput.value.trim()), 300);
  });

  const closeModal = () => {
    modal.style.display = 'none';
    modal.classList.remove('show');
    dropdownBtn.classList.remove('open');
  };

  document.getElementById('closePatientModal').onclick = closeModal;
  document.getElementById('btnCancelPatient').onclick = closeModal;
  modal.onclick = e => { if (e.target === modal) closeModal(); };
}

async function fetchPatients(term) {
  const container = document.getElementById('salesPatientList');
  if (!container) return;

  container.innerHTML = `<div class="loading-state"><div class="spinner"></div>Loading patients...</div>`;

  try {
    const res = await fetch(`../api/search_patients.php?search=${encodeURIComponent(term)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

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
          <div class="meta">ID: ${p.id}</div>
        </div>
      `;
      card.onclick = () => selectPatient(p);
      container.appendChild(card);
    });

  } catch (err) {
    console.error('❌ fetchPatients error:', err);
    container.innerHTML = `<div class="no-results">Error loading patients</div>`;
  }
}

function selectPatient(patient) {
  const dropdownBtn = document.getElementById('patientDropdownBtn');
  const displaySpan = document.getElementById('patientNameDisplay');
  
  displaySpan.textContent = patient.name;
  document.getElementById('patientName').value = patient.name;
  document.getElementById('patientId').value = patient.id;
  dropdownBtn.classList.add('has-selection');
  
  document.getElementById('salesPatientModal').style.display = 'none';
  document.getElementById('salesPatientModal').classList.remove('show');
  dropdownBtn.classList.remove('open');
  
  loadPatientExams(patient.id);
  console.log('✅ Selected patient:', patient.name);
}

// ────────────────────────────────────────────────
// EXAM/PRESCRIPTION LINKING (Feature 6)
// ────────────────────────────────────────────────
async function loadPatientExams(patientId) {
  const examRow = document.getElementById('examLinkingRow');
  const examSelect = document.getElementById('examSelect');
  
  if (!examRow || !examSelect) return;

  try {
    const res = await fetch(`../api/get_patient_exams.php?patient_id=${patientId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const exams = await res.json();
    
    examSelect.innerHTML = '<option value="">-- No prescription --</option>';
    
    if (exams.length > 0) {
      exams.forEach(exam => {
        const date = new Date(exam.exam_date).toLocaleDateString();
        const option = document.createElement('option');
        option.value = exam.exam_id;
        option.textContent = `${date} - ${exam.diagnosis || 'Eye Exam'} (Dr. ${exam.doctor_name || 'N/A'})`;
        examSelect.appendChild(option);
      });
      examRow.style.display = 'block';
    } else {
      examRow.style.display = 'none';
    }
  } catch (err) {
    console.warn('⚠️ Could not load patient exams:', err);
    examRow.style.display = 'none';
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

// ────────────────────────────────────────────────
// DISCOUNT HANDLERS (Feature 4)
// ────────────────────────────────────────────────
function setupDiscountHandlers() {
  const discountType = document.getElementById('discountType');
  const customRow = document.getElementById('customDiscountRow');
  const idRow = document.getElementById('discountIdRow');
  const customValue = document.getElementById('customDiscountValue');
  const customUnit = document.getElementById('customDiscountUnit');

  if (!discountType) return;

  discountType.addEventListener('change', () => {
    const type = discountType.value;
    
    customRow.style.display = (type === 'promo' || type === 'custom') ? 'block' : 'none';
    idRow.style.display = (type === 'senior' || type === 'pwd') ? 'block' : 'none';
    
    discountInfo.type = type;
    
    if (type === 'senior' || type === 'pwd') {
      discountInfo.value = 20;
    } else if (type === 'none') {
      discountInfo.value = 0;
    }
    
    updateTotal();
  });

  if (customValue) {
    customValue.addEventListener('input', () => {
      discountInfo.value = parseFloat(customValue.value) || 0;
      updateTotal();
    });
  }

  if (customUnit) {
    customUnit.addEventListener('change', updateTotal);
  }

  const idInput = document.getElementById('discountIdNumber');
  if (idInput) {
    idInput.addEventListener('input', () => {
      discountInfo.idNumber = idInput.value;
    });
  }
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

  body.innerHTML = saleItems.length ? '' : `<div class="empty-cart">🛒 No items added</div>`;

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
  const subtotal = saleItems.reduce((s, i) => s + i.price * i.quantity, 0);
  
  let discountAmount = 0;
  const discountType = document.getElementById('discountType')?.value || 'none';
  const customUnit = document.getElementById('customDiscountUnit')?.value || 'percent';
  
  if (discountType === 'senior' || discountType === 'pwd') {
    discountAmount = subtotal * 0.20;
  } else if ((discountType === 'promo' || discountType === 'custom') && discountInfo.value > 0) {
    if (customUnit === 'percent') {
      discountAmount = subtotal * (discountInfo.value / 100);
    } else {
      discountAmount = discountInfo.value;
    }
  }
  
  discountAmount = Math.min(discountAmount, subtotal);
  const total = subtotal - discountAmount;
  
  const subtotalEl = document.getElementById('subtotalAmount');
  const discountRowEl = document.getElementById('discountRowDisplay');
  const discountLabelEl = document.getElementById('discountLabel');
  const discountAmountEl = document.getElementById('discountAmount');
  const totalEl = document.getElementById('totalAmount');
  
  if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
  
  if (discountRowEl && discountLabelEl && discountAmountEl) {
    if (discountAmount > 0) {
      discountRowEl.style.display = 'flex';
      
      if (discountType === 'senior') discountLabelEl.textContent = 'Senior 20%';
      else if (discountType === 'pwd') discountLabelEl.textContent = 'PWD 20%';
      else if (customUnit === 'percent') discountLabelEl.textContent = `${discountInfo.value}%`;
      else discountLabelEl.textContent = 'Fixed';
      
      discountAmountEl.textContent = `-₱${discountAmount.toFixed(2)}`;
    } else {
      discountRowEl.style.display = 'none';
    }
  }
  
  if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
  
  const btnProcess = document.getElementById('btnProcess');
  if (btnProcess) btnProcess.disabled = !saleItems.length;
  
  window.currentSaleSubtotal = subtotal;
  window.currentSaleDiscount = discountAmount;
  window.currentSaleTotal = total;
}

// ────────────────────────────────────────────────
// BUTTONS
// ────────────────────────────────────────────────
function setupButtons() {
  document.getElementById('btnProcess').onclick = openPaymentModal;
  document.getElementById('btnCancel').onclick = () => {
    if (confirm('Cancel sale?')) resetSale();
  };
  
  const historyBtn = document.getElementById('btnSalesHistory');
  if (historyBtn) historyBtn.onclick = openSalesHistoryModal;
}

function resetSale() {
  saleItems = [];
  selectedPaymentMethod = null;
  discountInfo = { type: 'none', value: 0, idNumber: '' };
  
  const dropdownBtn = document.getElementById('patientDropdownBtn');
  const displaySpan = document.getElementById('patientNameDisplay');
  
  if (displaySpan) displaySpan.textContent = 'Select a patient...';
  if (document.getElementById('patientName')) document.getElementById('patientName').value = '';
  if (document.getElementById('patientId')) document.getElementById('patientId').value = '';
  if (dropdownBtn) dropdownBtn.classList.remove('has-selection');
  
  if (document.getElementById('discountType')) document.getElementById('discountType').value = 'none';
  if (document.getElementById('customDiscountRow')) document.getElementById('customDiscountRow').style.display = 'none';
  if (document.getElementById('discountIdRow')) document.getElementById('discountIdRow').style.display = 'none';
  if (document.getElementById('customDiscountValue')) document.getElementById('customDiscountValue').value = '';
  if (document.getElementById('discountIdNumber')) document.getElementById('discountIdNumber').value = '';
  
  if (document.getElementById('examLinkingRow')) document.getElementById('examLinkingRow').style.display = 'none';
  if (document.getElementById('examSelect')) document.getElementById('examSelect').value = '';
  
  renderSaleItems();
  updateTotal();
}

// ────────────────────────────────────────────────
// PAYMENT MODAL (Feature 7: Cash Tendering)
// ────────────────────────────────────────────────
function setupPaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (!modal) return;

  document.getElementById('closeModal').onclick =
  document.getElementById('btnModalCancel').onclick = () => modal.style.display = 'none';

  modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPaymentMethod = btn.dataset.method;
      
      const cashSection = document.getElementById('cashTenderingSection');
      const refSection = document.getElementById('referenceSection');
      
      if (selectedPaymentMethod === 'cash') {
        cashSection.style.display = 'block';
        refSection.style.display = 'none';
        document.getElementById('amountTendered').focus();
      } else {
        cashSection.style.display = 'none';
        refSection.style.display = 'block';
        document.getElementById('referenceNumber').focus();
      }
      
      validatePayment();
    };
  });

  const amountInput = document.getElementById('amountTendered');
  if (amountInput) {
    amountInput.addEventListener('input', () => {
      calculateChange();
      validatePayment();
    });
  }

  document.querySelectorAll('.quick-cash').forEach(btn => {
    btn.onclick = () => {
      const amount = btn.dataset.amount;
      if (amount === 'exact') {
        document.getElementById('amountTendered').value = window.currentSaleTotal.toFixed(2);
      } else {
        document.getElementById('amountTendered').value = amount;
      }
      calculateChange();
      validatePayment();
    };
  });

  const refInput = document.getElementById('referenceNumber');
  if (refInput) refInput.addEventListener('input', validatePayment);

  document.getElementById('btnModalConfirm').onclick = completeSale;
}

function openPaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (!modal) return;
  
  document.getElementById('modalSubtotal').textContent = `₱${window.currentSaleSubtotal.toFixed(2)}`;
  document.getElementById('modalTotal').textContent = `₱${window.currentSaleTotal.toFixed(2)}`;
  
  const discountRow = document.getElementById('modalDiscountRow');
  if (window.currentSaleDiscount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('modalDiscount').textContent = `-₱${window.currentSaleDiscount.toFixed(2)}`;
  } else {
    discountRow.style.display = 'none';
  }
  
  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
  selectedPaymentMethod = null;
  document.getElementById('cashTenderingSection').style.display = 'none';
  document.getElementById('referenceSection').style.display = 'none';
  document.getElementById('amountTendered').value = '';
  document.getElementById('referenceNumber').value = '';
  document.getElementById('btnModalConfirm').disabled = true;
  
  document.getElementById('changeAmount').textContent = '₱0.00';
  document.getElementById('changeDisplay').classList.remove('insufficient');
  
  modal.style.display = 'flex';
}

function calculateChange() {
  const tendered = parseFloat(document.getElementById('amountTendered').value) || 0;
  const total = window.currentSaleTotal;
  const change = tendered - total;
  
  const changeDisplay = document.getElementById('changeDisplay');
  const changeAmount = document.getElementById('changeAmount');
  
  if (tendered > 0 && change < 0) {
    changeDisplay.classList.add('insufficient');
    changeAmount.textContent = `₱${Math.abs(change).toFixed(2)} short`;
  } else {
    changeDisplay.classList.remove('insufficient');
    changeAmount.textContent = `₱${Math.max(0, change).toFixed(2)}`;
  }
}

function validatePayment() {
  const confirmBtn = document.getElementById('btnModalConfirm');
  if (!confirmBtn || !selectedPaymentMethod) {
    if (confirmBtn) confirmBtn.disabled = true;
    return;
  }
  
  if (selectedPaymentMethod === 'cash') {
    const tendered = parseFloat(document.getElementById('amountTendered').value) || 0;
    confirmBtn.disabled = tendered < window.currentSaleTotal;
  } else {
    confirmBtn.disabled = false;
  }
}

// ────────────────────────────────────────────────
// COMPLETE SALE
// ────────────────────────────────────────────────
function completeSale() {
  const patientId = document.getElementById('patientId').value || null;
  const patientName = document.getElementById('patientName').value || 'Walk-in Customer';
  const saleDate = document.getElementById('saleDate').value;
  const examId = document.getElementById('examSelect')?.value || null;
  
  const discountType = document.getElementById('discountType')?.value || 'none';
  const discountIdNumber = document.getElementById('discountIdNumber')?.value || '';
  
  const amountTendered = selectedPaymentMethod === 'cash' 
    ? parseFloat(document.getElementById('amountTendered').value) || 0 : null;
  const referenceNumber = selectedPaymentMethod !== 'cash' 
    ? document.getElementById('referenceNumber')?.value || '' : null;

  const payload = {
    patient_id: patientId,
    patient_name: patientName,
    sale_date: saleDate,
    exam_id: examId,
    payment_method: selectedPaymentMethod,
    subtotal: window.currentSaleSubtotal,
    discount_type: discountType,
    discount_amount: window.currentSaleDiscount,
    discount_id_number: discountIdNumber,
    total_amount: window.currentSaleTotal,
    amount_tendered: amountTendered,
    change_amount: amountTendered ? amountTendered - window.currentSaleTotal : null,
    reference_number: referenceNumber,
    staff_id: currentStaff?.id,
    staff_name: currentStaff?.name,
    items: saleItems.map(i => ({
      inventory_id: i.id,
      quantity: i.quantity,
      price: i.price
    }))
  };

  console.log('💾 Saving sale:', payload);

  const confirmBtn = document.getElementById('btnModalConfirm');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Processing...';

  fetch('../api/create_sale.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      alert(data.error || 'Failed to save sale');
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Payment';
      return;
    }

    if (selectedPaymentMethod === 'cash' && payload.change_amount > 0) {
      alert(`Sale completed!\n\nChange: ₱${payload.change_amount.toFixed(2)}`);
    } else {
      alert('Sale saved successfully');
    }
    
    console.log('✅ Sale saved, ID:', data.sale_id);

    document.getElementById('paymentModal').style.display = 'none';
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Payment';
    
    resetSale();
    
    loadInventoryFromDB().then(() => {
      const cat = document.querySelector('.category-btn.active')?.dataset.category || 'frames';
      renderInventory(cat);
    });
  })
  .catch(err => {
    console.error('❌ Error saving sale:', err);
    alert('Server error while saving sale');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Payment';
  });
}

// ────────────────────────────────────────────────
// SALES HISTORY MODAL
// ────────────────────────────────────────────────
function setupSalesHistoryModal() {
  const modal = document.getElementById('salesHistoryModal');
  if (!modal) return;

  document.getElementById('closeHistoryModal').onclick = () => modal.style.display = 'none';
  modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  document.getElementById('historyDateTo').value = today.toISOString().split('T')[0];
  document.getElementById('historyDateFrom').value = thirtyDaysAgo.toISOString().split('T')[0];

  document.getElementById('btnFilterHistory').onclick = loadSalesHistory;
}

function openSalesHistoryModal() {
  document.getElementById('salesHistoryModal').style.display = 'flex';
  loadSalesHistory();
}

async function loadSalesHistory() {
  const tbody = document.getElementById('historyTableBody');
  const dateFrom = document.getElementById('historyDateFrom').value;
  const dateTo = document.getElementById('historyDateTo').value;
  const status = document.getElementById('historyStatus').value;

  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem;"><div class="spinner" style="margin:0 auto;"></div>Loading...</td></tr>`;

  try {
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo, status: status });
    const res = await fetch(`../api/get_sales_history.php?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const sales = await res.json();
    tbody.innerHTML = '';

    if (!sales.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:#6b7280;">No sales found</td></tr>`;
      return;
    }

    sales.forEach(sale => {
      const row = document.createElement('tr');
      const statusClass = sale.payment_status === 'voided' ? 'status-voided' : 'status-paid';
      const isVoided = sale.payment_status === 'voided';
      
      row.innerHTML = `
        <td>#${sale.sale_id}</td>
        <td>${formatDate(sale.sale_date)}</td>
        <td>${sale.patient_name || 'Walk-in'}</td>
        <td>${sale.item_count} item(s)</td>
        <td>₱${parseFloat(sale.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        <td>${capitalizeFirst(sale.payment_method || 'N/A')}</td>
        <td>${sale.staff_name || 'N/A'}</td>
        <td><span class="status-badge ${statusClass}">${sale.payment_status}</span></td>
        <td class="history-actions">
          <button class="btn-icon view" title="View" data-sale-id="${sale.sale_id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn-icon void" title="Void" data-sale-id="${sale.sale_id}" ${isVoided ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('.btn-icon.view').forEach(btn => {
      btn.onclick = () => viewSaleDetails(btn.dataset.saleId);
    });

    tbody.querySelectorAll('.btn-icon.void:not([disabled])').forEach(btn => {
      btn.onclick = () => openVoidModal(btn.dataset.saleId);
    });

  } catch (err) {
    console.error('❌ Error loading sales history:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:#e74c3c;">Error loading sales</td></tr>`;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ────────────────────────────────────────────────
// VIEW SALE DETAILS MODAL
// ────────────────────────────────────────────────
function setupViewSaleModal() {
  const modal = document.getElementById('viewSaleModal');
  if (!modal) return;

  document.getElementById('closeViewSaleModal').onclick =
  document.getElementById('btnCloseViewSale').onclick = () => modal.style.display = 'none';

  modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  document.getElementById('btnPrintReceipt').onclick = () => {
    const saleId = document.getElementById('viewSaleId').textContent.replace('#', '');
    window.open(`../api/print_receipt.php?sale_id=${saleId}`, '_blank', 'width=400,height=600');
  };
}

async function viewSaleDetails(saleId) {
  try {
    const res = await fetch(`../api/get_sale_details.php?sale_id=${saleId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    const sale = data.sale;
    const items = data.items;
    
    document.getElementById('viewSaleId').textContent = `#${sale.sale_id}`;
    document.getElementById('viewSaleDate').textContent = formatDate(sale.sale_date);
    document.getElementById('viewPatientName').textContent = sale.patient_name || 'Walk-in Customer';
    document.getElementById('viewStaffName').textContent = sale.staff_name || 'N/A';
    document.getElementById('viewPaymentMethod').textContent = capitalizeFirst(sale.payment_method || 'N/A');
    
    const statusEl = document.getElementById('viewStatus');
    statusEl.textContent = capitalizeFirst(sale.payment_status);
    statusEl.className = sale.payment_status === 'voided' ? 'status-badge status-voided' : 'status-badge status-paid';
    
    const itemsBody = document.getElementById('viewSaleItems');
    itemsBody.innerHTML = '';
    
    let subtotal = 0;
    items.forEach(item => {
      const row = document.createElement('tr');
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      
      row.innerHTML = `
        <td>${item.product_name || 'Unknown Item'}</td>
        <td>₱${parseFloat(item.price).toFixed(2)}</td>
        <td>${item.quantity}</td>
        <td>₱${itemSubtotal.toFixed(2)}</td>
      `;
      itemsBody.appendChild(row);
    });
    
    document.getElementById('viewSubtotal').textContent = `₱${subtotal.toFixed(2)}`;
    
    const discountRow = document.getElementById('viewDiscountRow');
    if (sale.discount_amount && parseFloat(sale.discount_amount) > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('viewDiscount').textContent = `-₱${parseFloat(sale.discount_amount).toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }
    
    document.getElementById('viewTotal').textContent = `₱${parseFloat(sale.total_amount).toFixed(2)}`;
    document.getElementById('viewSaleModal').style.display = 'flex';
    
  } catch (err) {
    console.error('❌ Error loading sale details:', err);
    alert('Error loading sale details');
  }
}

// ────────────────────────────────────────────────
// VOID SALE MODAL (Feature 3: Void/Refund)
// ────────────────────────────────────────────────
function setupVoidModal() {
  const modal = document.getElementById('voidSaleModal');
  if (!modal) return;

  document.getElementById('closeVoidModal').onclick =
  document.getElementById('btnCancelVoid').onclick = () => {
    modal.style.display = 'none';
    currentVoidSaleId = null;
  };

  modal.onclick = e => {
    if (e.target === modal) {
      modal.style.display = 'none';
      currentVoidSaleId = null;
    }
  };

  document.getElementById('voidReason').onchange = (e) => {
    document.getElementById('voidNotesGroup').style.display = e.target.value === 'other' ? 'block' : 'none';
    document.getElementById('btnConfirmVoid').disabled = !e.target.value;
  };

  document.getElementById('btnConfirmVoid').onclick = confirmVoidSale;
}

async function openVoidModal(saleId) {
  currentVoidSaleId = saleId;
  
  try {
    const res = await fetch(`../api/get_sale_details.php?sale_id=${saleId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    const sale = data.sale;
    
    document.getElementById('voidSaleId').textContent = `#${sale.sale_id}`;
    document.getElementById('voidPatientName').textContent = sale.patient_name || 'Walk-in Customer';
    document.getElementById('voidAmount').textContent = `₱${parseFloat(sale.total_amount).toFixed(2)}`;
    document.getElementById('voidDate').textContent = formatDate(sale.sale_date);
    
    document.getElementById('voidReason').value = '';
    document.getElementById('voidNotes').value = '';
    document.getElementById('voidNotesGroup').style.display = 'none';
    document.getElementById('btnConfirmVoid').disabled = true;
    
    document.getElementById('voidSaleModal').style.display = 'flex';
    
  } catch (err) {
    console.error('❌ Error loading sale for void:', err);
    alert('Error loading sale details');
  }
}

async function confirmVoidSale() {
  if (!currentVoidSaleId) return;
  
  const reason = document.getElementById('voidReason').value;
  const notes = document.getElementById('voidNotes').value;
  
  if (!reason) {
    alert('Please select a reason for voiding');
    return;
  }
  
  const confirmBtn = document.getElementById('btnConfirmVoid');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Processing...';

  try {
    const res = await fetch('../api/void_sale.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sale_id: currentVoidSaleId,
        reason: reason,
        notes: notes,
        voided_by: currentStaff?.id,
        voided_by_name: currentStaff?.name
      })
    });

    const data = await res.json();
    
    if (!data.success) throw new Error(data.error || 'Failed to void sale');

    alert('Sale voided successfully. Stock has been restored.');
    
    document.getElementById('voidSaleModal').style.display = 'none';
    currentVoidSaleId = null;
    
    loadSalesHistory();
    
    loadInventoryFromDB().then(() => {
      const cat = document.querySelector('.category-btn.active')?.dataset.category || 'frames';
      renderInventory(cat);
    });

  } catch (err) {
    console.error('❌ Error voiding sale:', err);
    alert('Error: ' + err.message);
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirm Void';
  }
}