// ============================================================
// VIEW DETAILS MODAL WITH STOCK HISTORY - view-details-modal.js
// ============================================================

// Load the modal HTML
fetch('../components/modals/manager/view-details-modal.html')
    .then(res => res.text())
    .then(data => {
        const placeholder = document.getElementById('action-viewdetails-modal');
        if (placeholder) {
            placeholder.innerHTML = data;
        }
    })
    .catch(error => console.error('Error loading view-details-modal.html:', error));

let currentViewingProduct = null;

// Open View Details Modal
window.openViewDetails = function (itemId) {
    console.log('Opening view details for:', itemId);
    console.log('Available inventory data:', window.inventoryData);

    let product = null;

    // ✅ FIND PRODUCT USING inventory_id FIRST
    if (window.inventoryData && Array.isArray(window.inventoryData)) {
        product = window.inventoryData.find(item => {
            return item.inventory_id == itemId ||
                   item.sku == itemId ||
                   item.product_name == itemId;
        });
    }

    // ❌ DO NOT FALL BACK TO TABLE ROW (it loses inventory_id)
    if (!product) {
        console.error('Product not found in inventoryData:', itemId);
        alert('Product not found. Please refresh the page.');
        return;
    }

    console.log('Found product:', product);

    // Save current product
    currentViewingProduct = product;

    // Populate modal
    populateViewDetailsModal(product);

    // Show modal
    const modal = document.getElementById('viewDetailsModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};


// Extract product data from table row (fallback method)
function extractProductFromRow(row) {
    const cells = row.cells;
    const productNameElement = cells[0]?.querySelector('.product-cell span');
    const initialsElement = cells[0]?.querySelector('.product-image');
    
    return {
        product_name: productNameElement?.textContent.trim() || 'Unknown',
        initials: initialsElement?.textContent.trim() || '??',
        sku: cells[1]?.textContent.trim() || 'N/A',
        category: cells[2]?.querySelector('.category-badge')?.textContent.trim() || 'N/A',
        price: cells[3]?.textContent.replace('₱', '').replace(',', '').trim() || '0',
        stock: cells[4]?.textContent.trim() || '0',
        brand: 'N/A'
    };
}

// Populate modal with product data
function populateViewDetailsModal(product) {
    // Product initials/image
    const initials = product.initials || product.product_name?.substring(0, 2).toUpperCase() || '??';
    const initialsElement = document.getElementById('viewProductInitials');
    if (initialsElement) {
        initialsElement.textContent = initials;
    }

    // Product name
    const nameElement = document.getElementById('viewProductName');
    if (nameElement) {
        nameElement.textContent = product.product_name || product.name || 'Unknown';
    }

    // SKU
    const skuElement = document.getElementById('viewProductSKU');
    if (skuElement) {
        skuElement.textContent = product.sku || 'N/A';
    }

    // Price
    const priceElement = document.getElementById('viewProductPrice');
    if (priceElement) {
        priceElement.textContent = formatCurrency(product.price || 0);
    }

    // Category
    const categoryBadge = document.getElementById('viewProductCategory');
    if (categoryBadge) {
        categoryBadge.textContent = product.category || 'N/A';
        categoryBadge.className = `category-badge ${product.category || ''}`;
    }

    // Brand
    const brandElement = document.getElementById('viewProductBrand');
    if (brandElement) {
        brandElement.textContent = product.brand || 'N/A';
    }

    // Current Stock
    const stock = parseInt(product.stock || 0);
    const stockElement = document.getElementById('viewProductStock');
    if (stockElement) {
        stockElement.textContent = stock;
    }

    // Status
    const statusBadge = document.getElementById('viewProductStatus');
    if (statusBadge) {
        if (stock > 10) {
            statusBadge.textContent = 'In Stock';
            statusBadge.className = 'status-badge in-stock';
        } else if (stock > 0) {
            statusBadge.textContent = 'Low Stock';
            statusBadge.className = 'status-badge low-stock';
        } else {
            statusBadge.textContent = 'Out of Stock';
            statusBadge.className = 'status-badge out-of-stock';
        }
    }

    // Stock In/Out totals (placeholder - will be calculated from history)
    const totalStockIn = document.getElementById('totalStockIn');
    const totalStockOut = document.getElementById('totalStockOut');
    
    if (totalStockIn) totalStockIn.textContent = product.total_stock_in || 25;
    if (totalStockOut) totalStockOut.textContent = product.total_stock_out || 5;

    // Populate stock history
    populateStockHistory(product);
}

// Populate stock movement history table
function populateStockHistory(product) {
    const historyBody = document.getElementById('stockHistoryBody');
    if (!historyBody) return;

    historyBody.innerHTML = `
        <tr class="empty-state">
            <td colspan="4">Loading stock history...</td>
        </tr>
    `;

    if (!product.inventory_id) {
        historyBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="4">No inventory ID found</td>
            </tr>
        `;
        return;
    }

    fetch(`../api/get_stock_history.php?inventory_id=${product.inventory_id}`)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                historyBody.innerHTML = `
                    <tr class="empty-state">
                        <td colspan="4">No stock movement history available</td>
                    </tr>
                `;
                return;
            }

            historyBody.innerHTML = data.map(entry => {
                const typeClass = entry.type === 'Stock In' ? 'stock-in' : 'stock-out';
                const quantityDisplay =
                    entry.type === 'Stock In'
                        ? `+${entry.quantity}`
                        : `-${Math.abs(entry.quantity)}`;

                const dateDisplay = entry.created_at
                    ? entry.created_at.split(' ')[0]
                    : '—';

                return `
                    <tr>
                        <td>${dateDisplay}</td>
                        <td>
                            <span class="stock-type ${typeClass}">
                                ${entry.type}
                            </span>
                        </td>
                        <td>${quantityDisplay}</td>
                        <td>${entry.reason || '—'}</td>
                    </tr>
                `;
            }).join('');
        })
        .catch(err => {
            console.error(err);
            historyBody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="4">Failed to load stock history</td>
                </tr>
            `;
        });
}



// Close View Details Modal
window.closeViewDetailsModal = function() {
    const modal = document.getElementById('viewDetailsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    currentViewingProduct = null;
}

// Edit product from view modal
window.editProductFromView = function() {
    if (currentViewingProduct) {
        closeViewDetailsModal();
        // Open edit modal with product data
        console.log('Edit product:', currentViewingProduct);
        alert('Edit functionality - integrate with your add-item-modal.js');
    }
}

// Helper function for currency formatting
function formatCurrency(num) {
    return "₱" + parseFloat(num).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Close modal on ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeViewDetailsModal();
    }
});