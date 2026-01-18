// ============================================================
// RESTOCK MODAL - restock-modal.js (FIXED)
// ============================================================

// Load the modal HTML
fetch('../components/modals/manager/restock-modal.html')
    .then(res => res.text())
    .then(data => {
        const placeholder = document.getElementById('restock-modal-placeholder');
        if (placeholder) {
            placeholder.innerHTML = data;
        }
    })
    .catch(error => console.error('Error loading restock-modal.html:', error));

let currentRestockProduct = null;

// Open Restock Modal
window.restockItem = function(itemId) {
    console.log('Opening restock for inventory_id:', itemId);
    console.log('Available inventory data:', window.inventoryData);
    
    // Try to find product in global inventoryData
    let product = null;
    
    if (window.inventoryData && Array.isArray(window.inventoryData)) {
        product = window.inventoryData.find(item => {
            // FIXED: Check inventory_id specifically
            return item.inventory_id == itemId || 
                   item.id == itemId || 
                   item.sku == itemId;
        });
    }

    // If not found, try to get from the table row directly
    if (!product) {
        const tableRows = document.querySelectorAll('#inventoryTableBody tr');
        for (let row of tableRows) {
            const rowInventoryId = row.dataset.inventoryId;
            if (rowInventoryId == itemId) {
                product = extractProductFromRow(row);
                break;
            }
        }
    }

    if (!product) {
        console.error('Product not found for inventory_id:', itemId);
        alert('Product not found. Please try again.');
        return;
    }

    console.log('Found product:', product);
    currentRestockProduct = product;

    // Populate modal with product data
    populateRestockModal(product);

    // Show modal
    const modal = document.getElementById('restockModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Reset form
    const form = document.getElementById('restockForm');
    if (form) {
        form.reset();
    }
}

// Extract product data from table row (fallback method)
function extractProductFromRow(row) {
    const cells = row.cells;
    const productNameElement = cells[0]?.querySelector('.product-cell span');
    const initialsElement = cells[0]?.querySelector('.product-image');
    
    return {
        inventory_id: row.dataset.inventoryId,
        product_name: productNameElement?.textContent.trim() || 'Unknown',
        initials: initialsElement?.textContent.trim() || '??',
        sku: cells[1]?.textContent.trim() || 'N/A',
        stock: cells[4]?.textContent.trim() || '0'
    };
}

// Populate modal with product data
function populateRestockModal(product) {
    // Product initials/image
    const initials = product.initials || product.product_name?.substring(0, 2).toUpperCase() || '??';
    const initialsElement = document.getElementById('restockProductInitials');
    if (initialsElement) {
        initialsElement.textContent = initials;
    }

    // Basic info
    const nameElement = document.getElementById('restockProductName');
    if (nameElement) {
        nameElement.textContent = product.product_name || product.name || 'Unknown';
    }

    const skuElement = document.getElementById('restockProductSKU');
    if (skuElement) {
        skuElement.textContent = product.sku || 'N/A';
    }

    // Current stock
    const currentStock = parseInt(product.stock || 0);
    const stockElement = document.getElementById('restockCurrentStock');
    if (stockElement) {
        stockElement.textContent = currentStock;
    }

    // Status
    const statusBadge = document.getElementById('restockCurrentStatus');
    if (statusBadge) {
        if (currentStock > 10) {
            statusBadge.textContent = 'In Stock';
            statusBadge.className = 'status-badge in-stock';
        } else if (currentStock > 0) {
            statusBadge.textContent = 'Low Stock';
            statusBadge.className = 'status-badge low-stock';
        } else {
            statusBadge.textContent = 'Out of Stock';
            statusBadge.className = 'status-badge out-of-stock';
        }
    }
}

// Handle restock form submission
window.handleRestockSubmit = async function(event) {
    event.preventDefault();

    if (!currentRestockProduct) {
        alert('No product selected');
        return;
    }

    const quantityInput = document.getElementById('restockQuantity');
    const quantity = parseInt(quantityInput.value);

    // Validate quantity
    if (quantity <= 0 || isNaN(quantity)) {
        alert('Please enter a valid quantity');
        return;
    }

    const restockData = {
        sku: currentRestockProduct.sku,
        quantity: quantity
    };

    console.log('Restock data:', restockData);

    try {
        // Call API to update stock
        const response = await fetch('../api/restock_item.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(restockData)
        });

        const text = await response.text();
        console.log('Response:', text);

        const result = JSON.parse(text);

        if (result.success) {
            const newStock = result.new_stock || (parseInt(currentRestockProduct.stock || 0) + quantity);
            alert(`Successfully restocked ${quantity} units!\nNew stock: ${newStock}`);
            
            // Refresh inventory table
            if (window.fetchInventoryFromDB) {
                await window.fetchInventoryFromDB();
            }

            closeRestockModal();
        } else {
            alert('Error restocking item: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Restock error:', error);
        alert('Error restocking item. Please try again.');
    }
}

// Close Restock Modal
window.closeRestockModal = function() {
    const modal = document.getElementById('restockModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    currentRestockProduct = null;
}

// Close modal on ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeRestockModal();
    }
});