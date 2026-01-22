// ================================================
// CONDEMNATION MANAGEMENT
// ================================================

let condemnationRecords = [];
let condemnInventoryData = [];
let condemnCurrentPage = 1;
const condemnItemsPerPage = 10;
let condemnationInitialized = false; // ✅ Track if already initialized

// ✅ REMOVE THE IMMEDIATE FETCH - We'll load HTML when needed

// Initialize - Now also loads HTML
window.initCondemnation = async function() {
  // ✅ Prevent multiple initializations
  if (condemnationInitialized) {
    console.log('⚠️ Condemnation already initialized');
    return;
  }

  console.log('🔄 Initializing Condemnation Management...');

  // ✅ Load HTML first
  const holder = document.getElementById('condemnation-placeholder');
  if (!holder) {
    console.error('❌ condemnation-placeholder not found in DOM');
    return;
  }

  try {
    const res = await fetch('../components/manager/condemnation.html');
    const html = await res.text();
    holder.innerHTML = html;
    console.log('✅ Condemnation HTML loaded');

    // ✅ Wait a moment for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // ✅ Now initialize everything
    await loadCondemnationData();
    await loadInventoryData();
    
    setupModalHandlers();
    setupFormHandlers();
    setupFilters();
    
    renderTable();
    updateStats();
    
    condemnationInitialized = true;
    console.log('✅ Condemnation initialized');

  } catch (err) {
    console.error('❌ Error loading condemnation HTML:', err);
  }
};

// ────────────────────────────────────────────────
// DATA LOADING
// ────────────────────────────────────────────────
async function loadCondemnationData() {
  try {
    const res = await fetch('../api/get_condemnations.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    condemnationRecords = await res.json();
    console.log(`✅ Loaded ${condemnationRecords.length} condemnations`);
  } catch (err) {
    console.error('❌ Error loading condemnations:', err);
    condemnationRecords = [];
  }
}

async function loadInventoryData() {
  try {
    const res = await fetch('../api/get_inventory.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    condemnInventoryData = data.filter(item => item.stock > 0);
    console.log(`✅ Loaded ${condemnInventoryData.length} inventory items`);
  } catch (err) {
    console.error('❌ Error loading inventory:', err);
    condemnInventoryData = [];
  }
}

// ────────────────────────────────────────────────
// MODAL HANDLERS
// ────────────────────────────────────────────────
function setupModalHandlers() {
  const condemnModal = document.getElementById('condemnationModal');
  const productModal = document.getElementById('productSelectionModal');
  const productDropdownBtn = document.getElementById('productDropdownBtn');
  
  if (!condemnModal || !productModal || !productDropdownBtn) {
    console.error('❌ Modal elements not found');
    return;
  }
  
  // Open condemn modal
  const btnOpen = document.getElementById('btnOpenCondemnModal');
  if (btnOpen) {
    btnOpen.onclick = () => {
      condemnModal.classList.add('show');
      resetForm();
    };
  }
  
  // Close condemn modal
  const btnClose = document.getElementById('closeCondemnModal');
  const btnCancel = document.getElementById('btnCancelCondemn');
  
  if (btnClose) btnClose.onclick = () => condemnModal.classList.remove('show');
  if (btnCancel) btnCancel.onclick = () => condemnModal.classList.remove('show');
  
  // Open product selection
  productDropdownBtn.onclick = () => {
    productModal.classList.add('show');
    productDropdownBtn.classList.add('open');
    const searchInput = document.getElementById('productSearch');
    if (searchInput) searchInput.value = '';
    renderProductList();
  };
  
  // Close product selection
  const btnCloseProduct = document.getElementById('closeProductModal');
  if (btnCloseProduct) {
    btnCloseProduct.onclick = () => {
      productModal.classList.remove('show');
      productDropdownBtn.classList.remove('open');
    };
  }
  
  // Product search
  const productSearch = document.getElementById('productSearch');
  if (productSearch) {
    productSearch.oninput = (e) => {
      renderProductList(e.target.value.toLowerCase());
    };
  }
  
  // Close on overlay click
  condemnModal.onclick = (e) => {
    if (e.target === condemnModal) condemnModal.classList.remove('show');
  };
  productModal.onclick = (e) => {
    if (e.target === productModal) {
      productModal.classList.remove('show');
      productDropdownBtn.classList.remove('open');
    }
  };
}

// ────────────────────────────────────────────────
// FORM HANDLERS
// ────────────────────────────────────────────────
function setupFormHandlers() {
  const form = document.getElementById('condemnationForm');
  const qtyInput = document.getElementById('condemnQuantity');
  
  if (!form || !qtyInput) {
    console.error('❌ Form elements not found');
    return;
  }
  
  // Calculate loss on quantity change
  qtyInput.oninput = calculateEstimatedLoss;
  
  // Form submit
  form.onsubmit = async (e) => {
    e.preventDefault();
    await submitCondemnation();
  };
}

function calculateEstimatedLoss() {
  const productId = document.getElementById('selectedProductId')?.value;
  const qty = parseInt(document.getElementById('condemnQuantity')?.value) || 0;
  const lossEl = document.getElementById('estimatedLoss');
  
  if (!productId || !qty || !lossEl) {
    if (lossEl) lossEl.textContent = '₱0.00';
    return;
  }
  
  const product = condemnInventoryData.find(p => p.inventory_id == productId);
  if (!product) return;
  
  const loss = product.price * qty;
  lossEl.textContent = `₱${loss.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

async function submitCondemnation() {
  const productId = document.getElementById('selectedProductId')?.value;
  const quantity = parseInt(document.getElementById('condemnQuantity')?.value);
  const reason = document.getElementById('condemnReason')?.value;
  const notes = document.getElementById('condemnNotes')?.value;
  
  if (!productId || !quantity || !reason) {
    alert('Please fill in all required fields');
    return;
  }
  
  const product = condemnInventoryData.find(p => p.inventory_id == productId);
  if (!product) {
    alert('Invalid product selected');
    return;
  }
  
  if (quantity > product.stock) {
    alert(`Only ${product.stock} units available in stock`);
    return;
  }
  
  const payload = {
    inventory_id: productId,
    quantity: quantity,
    reason: reason,
    notes: notes || '',
    unit_price: product.price,
    total_loss: product.price * quantity
  };
  
  try {
    const res = await fetch('../api/create_condemnation.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    
    if (!data.success) {
      alert(data.error || 'Failed to condemn item');
      return;
    }
    
    alert('Item condemned successfully');
    const modal = document.getElementById('condemnationModal');
    if (modal) modal.classList.remove('show');
    
    // Refresh data
    await loadCondemnationData();
    await loadInventoryData();
    renderTable();
    updateStats();
    
  } catch (err) {
    console.error('❌ Error:', err);
    alert('Server error while condemning item');
  }
}

// ────────────────────────────────────────────────
// PRODUCT SELECTION
// ────────────────────────────────────────────────
function renderProductList(search = '') {
  const container = document.getElementById('productList');
  if (!container) return;
  
  container.innerHTML = '';
  
  const filtered = condemnInventoryData.filter(p => 
    p.product_name.toLowerCase().includes(search) ||
    p.sku.toLowerCase().includes(search)
  );
  
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state">No products found</div>';
    return;
  }
  
  filtered.forEach(product => {
    const item = document.createElement('div');
    item.className = 'product-item';
    item.innerHTML = `
      <div class="product-item-name">${product.product_name}</div>
      <div class="product-item-meta">
        <span>SKU: ${product.sku}</span>
        <span>${product.category}</span>
        <span>Stock: ${product.stock}</span>
        <span>₱${parseFloat(product.price).toFixed(2)}</span>
      </div>
    `;
    
    item.onclick = () => selectProduct(product);
    container.appendChild(item);
  });
}

function selectProduct(product) {
  const selectedIdEl = document.getElementById('selectedProductId');
  const displayEl = document.getElementById('productDisplay');
  const dropdownBtn = document.getElementById('productDropdownBtn');
  
  if (selectedIdEl) selectedIdEl.value = product.inventory_id;
  if (displayEl) displayEl.textContent = product.product_name;
  if (dropdownBtn) dropdownBtn.classList.add('has-selection');
  
  // Show product info
  const skuEl = document.getElementById('displaySKU');
  const catEl = document.getElementById('displayCategory');
  const stockEl = document.getElementById('displayStock');
  const priceEl = document.getElementById('displayPrice');
  const infoCard = document.getElementById('productInfoCard');
  
  if (skuEl) skuEl.textContent = product.sku;
  if (catEl) catEl.textContent = product.category;
  if (stockEl) stockEl.textContent = product.stock;
  if (priceEl) priceEl.textContent = `₱${parseFloat(product.price).toFixed(2)}`;
  if (infoCard) infoCard.style.display = 'block';
  
  // Set max quantity
  const qtyInput = document.getElementById('condemnQuantity');
  if (qtyInput) qtyInput.max = product.stock;
  
  // Close modal
  const modal = document.getElementById('productSelectionModal');
  if (modal) modal.classList.remove('show');
  if (dropdownBtn) dropdownBtn.classList.remove('open');
  
  console.log('✅ Selected product:', product.product_name);
}

// ────────────────────────────────────────────────
// TABLE RENDERING
// ────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('condemnationTableBody');
  const emptyState = document.getElementById('emptyState');
  
  if (!tbody || !emptyState) {
    console.error('❌ Table elements not found');
    return;
  }
  
  if (!condemnationRecords.length) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  tbody.innerHTML = '';
  
  const start = (condemnCurrentPage - 1) * condemnItemsPerPage;
  const end = start + condemnItemsPerPage;
  const pageData = condemnationRecords.slice(start, end);
  
  pageData.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(item.condemned_date)}</td>
      <td><strong>${item.product_name}</strong></td>
      <td>${item.sku}</td>
      <td><span class="badge">${item.category}</span></td>
      <td>${item.quantity}</td>
      <td>₱${parseFloat(item.unit_price).toFixed(2)}</td>
      <td><strong>₱${parseFloat(item.total_loss).toFixed(2)}</strong></td>
      <td>${item.reason}</td>
      <td>${item.condemned_by || 'System'}</td>
    `;
    tbody.appendChild(row);
  });
  
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(condemnationRecords.length / condemnItemsPerPage);
  const pageNumbers = document.getElementById('pageNumbers');
  
  if (!pageNumbers) return;
  
  pageNumbers.innerHTML = '';
  
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = 'page-num';
    btn.textContent = i;
    if (i === condemnCurrentPage) btn.classList.add('active');
    btn.onclick = () => {
      condemnCurrentPage = i;
      renderTable();
    };
    pageNumbers.appendChild(btn);
  }
  
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  
  if (prevBtn) {
    prevBtn.disabled = condemnCurrentPage === 1;
    prevBtn.onclick = () => {
      if (condemnCurrentPage > 1) {
        condemnCurrentPage--;
        renderTable();
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.disabled = condemnCurrentPage === totalPages;
    nextBtn.onclick = () => {
      if (condemnCurrentPage < totalPages) {
        condemnCurrentPage++;
        renderTable();
      }
    };
  }
}

// ────────────────────────────────────────────────
// STATS UPDATE
// ────────────────────────────────────────────────
function updateStats() {
  const total = condemnationRecords.length;
  const totalLoss = condemnationRecords.reduce((sum, item) => sum + parseFloat(item.total_loss || 0), 0);
  
  const now = new Date();
  const thisMonth = condemnationRecords.filter(item => {
    const date = new Date(item.condemned_date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  
  const totalCondemnedEl = document.getElementById('totalCondemned');
  const totalValueLostEl = document.getElementById('totalValueLost');
  const monthlyCondemnedEl = document.getElementById('monthlyCondemned');
  
  if (totalCondemnedEl) totalCondemnedEl.textContent = total;
  if (totalValueLostEl) totalValueLostEl.textContent = `₱${totalLoss.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
  if (monthlyCondemnedEl) monthlyCondemnedEl.textContent = thisMonth;
}

// ────────────────────────────────────────────────
// FILTERS
// ────────────────────────────────────────────────
function setupFilters() {
  const categoryFilter = document.getElementById('categoryFilter');
  const dateFilter = document.getElementById('dateFilter');
  const searchInput = document.getElementById('condemnSearch');
  
  if (categoryFilter) categoryFilter.onchange = applyFilters;
  if (dateFilter) dateFilter.onchange = applyFilters;
  if (searchInput) searchInput.oninput = applyFilters;
}

function applyFilters() {
  // Filter logic here
  renderTable();
}

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────
function resetForm() {
  const form = document.getElementById('condemnationForm');
  if (form) form.reset();
  
  const selectedId = document.getElementById('selectedProductId');
  const display = document.getElementById('productDisplay');
  const dropdownBtn = document.getElementById('productDropdownBtn');
  const infoCard = document.getElementById('productInfoCard');
  const loss = document.getElementById('estimatedLoss');
  
  if (selectedId) selectedId.value = '';
  if (display) display.textContent = 'Select a product...';
  if (dropdownBtn) dropdownBtn.classList.remove('has-selection');
  if (infoCard) infoCard.style.display = 'none';
  if (loss) loss.textContent = '₱0.00';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}