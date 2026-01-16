// ============================================================
// ADD ITEM MODAL COMPONENT - add-item-modal.js
// ============================================================

// 1. Load the add-item-modal.html content
fetch('../components/modals/manager/add-item-modal.html')
  .then(res => res.text())
  .then(data => {
    const placeholder = document.getElementById('add-item-modal-placeholder');
    if (placeholder) {
        placeholder.innerHTML = data;
        initializeAddItemModal();
    }
  })
  .catch(error => console.error('Error loading add item modal:', error));

/**
 * INITIALIZE MODAL LOGIC
 */
function initializeAddItemModal() {
    const form = document.getElementById('addItemForm');
    const modal = document.getElementById('addItemModal');
    const submitBtn = document.getElementById('addItemBtn');

    if (!form || !modal || !submitBtn) return;

    /**
     * OPEN MODAL
     * Attached to window so it can be called from the "Add Item" button in frame.html
     */
    window.openAddItemModal = function() {
        modal.classList.add('show');
        form.reset();
        // Clear all previous error states
        document.querySelectorAll('.error-text').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.form-input').forEach(el => el.style.borderColor = '#d1d5db');
    };

    /**
     * CLOSE MODAL
     */
    window.closeAddItemModal = function() {
        modal.classList.remove('show');
        form.reset();
    };

    /**
     * VALIDATION LOGIC
     */
    function validateField(field) {
        const value = field.value.trim();
        const errorEl = document.getElementById(field.id + 'Error');

        if (field.hasAttribute('required') && !value) {
            field.style.borderColor = '#dc2626'; // Red border
            if (errorEl) errorEl.classList.remove('hidden');
            return false;
        } else {
            field.style.borderColor = '#d1d5db'; // Reset border
            if (errorEl) errorEl.classList.add('hidden');
            return true;
        }
    }

    /**
     * FORM SUBMISSION
     */
    submitBtn.addEventListener('click', async function(e) {
        e.preventDefault();

        // 1. Validate all required fields before sending
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) isValid = false;
        });

        if (!isValid) return;

        // 2. Show loading state & disable button to prevent double-clicks
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        if (btnText) btnText.classList.add('hidden');
        if (btnLoading) btnLoading.classList.remove('hidden');

        // 3. Prepare Data for PHP (Must match your DB column names)
        const formData = new FormData();
        formData.append('product_name', document.getElementById('addProductName').value.trim());
        formData.append('sku', document.getElementById('addSKU').value.trim());
        formData.append('category', document.getElementById('addCategory').value);
        formData.append('price', document.getElementById('addUnitPrice').value);
        formData.append('stock', document.getElementById('addStockQuantity').value);

        try {
            // 4. API Call to backend
            const response = await fetch('../api/add_inventory_item.php', {
                method: 'POST',
                body: formData
            });

            // Ensure the response is valid JSON
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                throw new Error("Server sent invalid response: " + text);
            }

            if (result.status === 'success') {
                alert('Item added successfully!');
                closeAddItemModal();
                
                // 5. REFRESH the main inventory table if frame.js is loaded
                if (window.fetchInventoryFromDB) {
                    window.fetchInventoryFromDB();
                } else {
                    location.reload(); 
                }
            } else {
                alert('Error: ' + (result.message || 'Failed to save item.'));
            }

        } catch (error) {
            console.error('Submission error:', error);
            alert('A server error occurred. Please check your connection and try again.');
        } finally {
            // 6. Restore button state
            submitBtn.disabled = false;
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoading) btnLoading.classList.add('hidden');
        }
    });

    /**
     * REAL-TIME UI FEEDBACK
     */
    form.querySelectorAll('input, select').forEach(field => {
        // Clear error when user starts typing again
        field.addEventListener('input', () => {
            if (field.value.trim() !== "") {
                field.style.borderColor = '#d1d5db';
                const errorEl = document.getElementById(field.id + 'Error');
                if (errorEl) errorEl.classList.add('hidden');
            }
        });
        
        // Validate when user leaves the field
        field.addEventListener('blur', () => validateField(field));
    });

    /**
     * ACCESSIBILITY & UX
     */
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAddItemModal();
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeAddItemModal();
        }
    });
}