// ================================================
// CONDEMNATION MANAGEMENT - Fixed & Complete
// ================================================

let condemnationRecords = [];
let condemnInventoryData = [];
let filteredRecords = [];
let condemnCurrentPage = 1;
const condemnItemsPerPage = 10;
let condemnationInitialized = false;

// Initialize
window.initCondemnation = async function() {
  if (condemnationInitialized) {
    console.log('⚠️ Condemnation already initialized');
    return;
  }

  console.log('🔄 Initializing Condemnation...');

  const holder = document.getElementById('condemnation-placeholder');
  if (!holder) {
    console.error('❌ condemnation-placeholder not found');
    return;
  }

  try {
    const res = await fetch('../components/manager/condemnation.html');
    const html = await res.text();
    holder.innerHTML = html;
    console.log('✅ Condemnation HTML loaded');

    await new Promise(resolve => setTimeout(resolve, 50));

    // Load data
    await loadCondemnationData();
    await loadCondemnInventoryData();
    
    // Setup
    setupCondemnModals();
    setupCondemnForm();
    setupCondemnFilters();
    
    // Render
    applyCondemnFilters();
    
    condemnationInitialized = true;
    console.log('✅ Condemnation ready');

  } catch (err) {
    console.error('❌ Error:', err);
  }
};

// ────────────────────────────────────────────────
// DATA LOADING
// ────────────────────────────────────────────────
async function loadCondemnationData() {
  try {
    const res = await fetch('../api/get_condemnations.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    condemnationRecords = Array.isArray(data) ? data : [];
    filteredRecords = [...condemnationRecords];
    console.log(`✅ Loaded ${condemnationRecords.length} condemnations`);
  } catch (err) {
    console.error('❌ Error loading condemnations:', err);
    condemnationRecords = [];
    filteredRecords = [];
  }
}

async function loadCondemnInventoryData() {
  try {
    const res = await fetch('../api/get_inventory.php');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    condemnInventoryData = Array.isArray(data) ? data.filter(item => parseInt(item.stock) > 0) : [];
    console.log(`✅ Loaded ${condemnInventoryData.length} inventory items`);
  } catch (err) {
    console.error('❌ Error loading inventory:', err);
    condemnInventoryData = [];
  }
}

// ────────────────────────────────────────────────
// MODAL SETUP
// ────────────────────────────────────────────────
function setupCondemnModals() {
  const condemnModal = document.getElementById('condemnationModal');
  const productModal = document.getElementById('productSelectionModal');
  
  if (!condemnModal || !productModal) {
    console.error('❌ Modals not found');
    return;
  }

  // Open main modal
  const btnOpen = document.getElementById('btnOpenCondemnModal');
  if (btnOpen) {
    btnOpen.addEventListener('click', function(e) {
      e.preventDefault();
      resetCondemnForm();
      condemnModal.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close main modal - X button
  const btnClose = document.getElementById('closeCondemnModal');
  if (btnClose) {
    btnClose.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeCondemnModal();
    });
  }

  // Close main modal - Cancel button
  const btnCancel = document.getElementById('btnCancelCondemn');
  if (btnCancel) {
    btnCancel.addEventListener('click', function(e) {
      e.preventDefault();
      closeCondemnModal();
    });
  }

  // Close on overlay click
  condemnModal.addEventListener('click', function(e) {
    if (e.target === condemnModal) {
      closeCondemnModal();
    }
  });

  // Open product modal
  const productBtn = document.getElementById('productDropdownBtn');
  if (productBtn) {
    productBtn.addEventListener('click', function(e) {
      e.preventDefault();
      productModal.classList.add('show');
      renderProductList();
      const searchInput = document.getElementById('productSearch');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
    });
  }

  // Close product modal - X button
  const btnCloseProduct = document.getElementById('closeProductModal');
  if (btnCloseProduct) {
    btnCloseProduct.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      productModal.classList.remove('show');
    });
  }

  // Close product modal on overlay click
  productModal.addEventListener('click', function(e) {
    if (e.target === productModal) {
      productModal.classList.remove('show');
    }
  });

  // Product search
  const productSearch = document.getElementById('productSearch');
  if (productSearch) {
    productSearch.addEventListener('input', function(e) {
      renderProductList(e.target.value.toLowerCase());
    });
  }

  // ESC key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (productModal.classList.contains('show')) {
        productModal.classList.remove('show');
      } else if (condemnModal.classList.contains('show')) {
        closeCondemnModal();
      }
    }
  });
}

function closeCondemnModal() {
  const modal = document.getElementById('condemnationModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// ────────────────────────────────────────────────
// FORM SETUP
// ────────────────────────────────────────────────
function setupCondemnForm() {
  const form = document.getElementById('condemnationForm');
  const qtyInput = document.getElementById('condemnQuantity');
  
  if (qtyInput) {
    qtyInput.addEventListener('input', calculateLoss);
  }
  
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await submitCondemnation();
    });
  }
}

function calculateLoss() {
  const productId = document.getElementById('selectedProductId')?.value;
  const qty = parseInt(document.getElementById('condemnQuantity')?.value) || 0;
  const lossEl = document.getElementById('estimatedLoss');
  
  if (!lossEl) return;
  
  if (!productId || !qty) {
    lossEl.textContent = '₱0.00';
    return;
  }
  
  const product = condemnInventoryData.find(p => p.inventory_id == productId);
  if (!product) {
    lossEl.textContent = '₱0.00';
    return;
  }
  
  const loss = parseFloat(product.price) * qty;
  lossEl.textContent = '₱' + loss.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

async function submitCondemnation() {
  const productId = document.getElementById('selectedProductId')?.value;
  const quantity = parseInt(document.getElementById('condemnQuantity')?.value);
  const reason = document.getElementById('condemnReason')?.value;
  const notes = document.getElementById('condemnNotes')?.value || '';
  
  // Validate
  if (!productId) {
    alert('Please select a product');
    return;
  }
  
  if (!quantity || quantity < 1) {
    alert('Please enter a valid quantity');
    return;
  }
  
  if (!reason) {
    alert('Please select a reason');
    return;
  }
  
  const product = condemnInventoryData.find(p => p.inventory_id == productId);
  if (!product) {
    alert('Invalid product');
    return;
  }
  
  if (quantity > parseInt(product.stock)) {
    alert('Only ' + product.stock + ' units available');
    return;
  }
  
  const payload = {
    inventory_id: parseInt(productId),
    quantity: quantity,
    reason: reason,
    notes: notes,
    unit_price: parseFloat(product.price),
    total_loss: parseFloat(product.price) * quantity
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
    
    alert('Item condemned successfully!');
    closeCondemnModal();
    
    // Refresh
    await loadCondemnationData();
    await loadCondemnInventoryData();
    applyCondemnFilters();
    
    // Refresh inventory table if exists
    if (typeof window.fetchInventoryFromDB === 'function') {
      window.fetchInventoryFromDB();
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
    alert('Server error');
  }
}

// ────────────────────────────────────────────────
// PRODUCT SELECTION
// ────────────────────────────────────────────────
function renderProductList(search = '') {
  const container = document.getElementById('productList');
  if (!container) return;
  
  container.innerHTML = '';
  
  const filtered = condemnInventoryData.filter(p => {
    const name = (p.product_name || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    return name.includes(search) || sku.includes(search);
  });
  
  if (!filtered.length) {
    container.innerHTML = '<div class="condemn-product-empty">No products found</div>';
    return;
  }
  
  filtered.forEach(product => {
    const item = document.createElement('div');
    item.className = 'condemn-product-item';
    item.innerHTML = `
      <div class="condemn-product-name">${product.product_name}</div>
      <div class="condemn-product-meta">
        <span>SKU: ${product.sku}</span>
        <span>${product.category}</span>
        <span>Stock: ${product.stock}</span>
        <span>₱${parseFloat(product.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
      </div>
    `;
    
    item.addEventListener('click', function() {
      selectProduct(product);
    });
    
    container.appendChild(item);
  });
}

function selectProduct(product) {
  // Set hidden value
  const idEl = document.getElementById('selectedProductId');
  if (idEl) idEl.value = product.inventory_id;
  
  // Update display
  const displayEl = document.getElementById('productDisplay');
  if (displayEl) displayEl.textContent = product.product_name;
  
  // Update button style
  const btn = document.getElementById('productDropdownBtn');
  if (btn) btn.classList.add('selected');
  
  // Show info card
  const infoCard = document.getElementById('productInfoCard');
  const skuEl = document.getElementById('displaySKU');
  const catEl = document.getElementById('displayCategory');
  const stockEl = document.getElementById('displayStock');
  const priceEl = document.getElementById('displayPrice');
  
  if (skuEl) skuEl.textContent = product.sku;
  if (catEl) catEl.textContent = product.category;
  if (stockEl) stockEl.textContent = product.stock;
  if (priceEl) priceEl.textContent = '₱' + parseFloat(product.price).toLocaleString(undefined, {minimumFractionDigits: 2});
  if (infoCard) infoCard.classList.add('show');
  
  // Set max quantity
  const qtyInput = document.getElementById('condemnQuantity');
  if (qtyInput) {
    qtyInput.max = product.stock;
    qtyInput.value = '';
  }
  
  // Reset loss
  const lossEl = document.getElementById('estimatedLoss');
  if (lossEl) lossEl.textContent = '₱0.00';
  
  // Close product modal
  const productModal = document.getElementById('productSelectionModal');
  if (productModal) productModal.classList.remove('show');
  
  console.log('✅ Selected:', product.product_name);
}

// ────────────────────────────────────────────────
// TABLE RENDERING
// ────────────────────────────────────────────────
function renderCondemnTable() {
  const tbody = document.getElementById('condemnationTableBody');
  const emptyState = document.getElementById('emptyState');
  
  if (!tbody || !emptyState) return;
  
  if (!filteredRecords.length) {
    tbody.innerHTML = '';
    emptyState.classList.add('show');
    renderPagination();
    return;
  }
  
  emptyState.classList.remove('show');
  tbody.innerHTML = '';
  
  const start = (condemnCurrentPage - 1) * condemnItemsPerPage;
  const end = start + condemnItemsPerPage;
  const pageData = filteredRecords.slice(start, end);
  
  pageData.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(item.condemned_date)}</td>
      <td><span class="product-name">${item.product_name || 'Unknown'}</span></td>
      <td>${item.sku || 'N/A'}</td>
      <td><span class="category-badge">${item.category || 'N/A'}</span></td>
      <td>${item.quantity}</td>
      <td>₱${parseFloat(item.unit_price || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      <td><span class="loss-amount">₱${parseFloat(item.total_loss || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span></td>
      <td>${item.reason || 'N/A'}</td>
      <td>${item.condemned_by || 'System'}</td>
    `;
    tbody.appendChild(row);
  });
  
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredRecords.length / condemnItemsPerPage) || 1;
  const pageNumbers = document.getElementById('pageNumbers');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  
  if (pageNumbers) {
    pageNumbers.innerHTML = '';
    
    let startPage = Math.max(1, condemnCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.className = 'page-num' + (i === condemnCurrentPage ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', function() {
        condemnCurrentPage = i;
        renderCondemnTable();
      });
      pageNumbers.appendChild(btn);
    }
  }
  
  if (prevBtn) {
    prevBtn.disabled = condemnCurrentPage === 1;
    prevBtn.onclick = function() {
      if (condemnCurrentPage > 1) {
        condemnCurrentPage--;
        renderCondemnTable();
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.disabled = condemnCurrentPage >= totalPages;
    nextBtn.onclick = function() {
      if (condemnCurrentPage < totalPages) {
        condemnCurrentPage++;
        renderCondemnTable();
      }
    };
  }
}

// ────────────────────────────────────────────────
// FILTERS
// ────────────────────────────────────────────────
function setupCondemnFilters() {
  const categoryFilter = document.getElementById('categoryFilter');
  const searchInput = document.getElementById('condemnSearch');
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyCondemnFilters);
  }
  
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(timeout);
      timeout = setTimeout(applyCondemnFilters, 300);
    });
  }
}

function applyCondemnFilters() {
  const category = document.getElementById('categoryFilter')?.value || 'all';
  const search = (document.getElementById('condemnSearch')?.value || '').toLowerCase().trim();
  
  filteredRecords = condemnationRecords.filter(item => {
    // Category
    if (category !== 'all') {
      if ((item.category || '').toLowerCase() !== category.toLowerCase()) {
        return false;
      }
    }
    
    // Search
    if (search) {
      const name = (item.product_name || '').toLowerCase();
      const sku = (item.sku || '').toLowerCase();
      const reason = (item.reason || '').toLowerCase();
      
      if (!name.includes(search) && !sku.includes(search) && !reason.includes(search)) {
        return false;
      }
    }
    
    return true;
  });
  
  condemnCurrentPage = 1;
  renderCondemnTable();
}

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────
function resetCondemnForm() {
  const form = document.getElementById('condemnationForm');
  if (form) form.reset();
  
  const selectedId = document.getElementById('selectedProductId');
  const display = document.getElementById('productDisplay');
  const btn = document.getElementById('productDropdownBtn');
  const infoCard = document.getElementById('productInfoCard');
  const loss = document.getElementById('estimatedLoss');
  
  if (selectedId) selectedId.value = '';
  if (display) display.textContent = 'Select a product...';
  if (btn) btn.classList.remove('selected');
  if (infoCard) infoCard.classList.remove('show');
  if (loss) loss.textContent = '₱0.00';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Reset for page navigation
window.resetCondemnation = function() {
  condemnationInitialized = false;
  condemnationRecords = [];
  condemnInventoryData = [];
  filteredRecords = [];
  condemnCurrentPage = 1;
};