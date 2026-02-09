/**
 * purchase.js - Bagares Optical Clinic
 */

if (typeof window.inventoryData === 'undefined') {
    window.inventoryData = [];
}

// 1. Initialization
fetch('../components/manager/purchase.html')
    .then(res => res.text())
    .then(html => {
        const placeholder = document.getElementById('purchase-placeholder');
        if (placeholder) {
            placeholder.innerHTML = html;
            loadPurchaseOrders();
        }
    })
    .catch(err => console.error('Error loading purchase component:', err));

async function loadPurchaseOrders() {
    try {
        const res = await fetch('../api/get_purchase_orders.php');
        const data = await res.json();
        renderPurchaseTable(data);
    } catch (err) {
        renderPurchaseTable([]);
    }
}

function renderPurchaseTable(orders) {
    const tbody = document.getElementById('purchaseTableBody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No purchase orders found.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><span class="po-number">${order.po_number}</span></td>
            <td>${order.supplier_name}</td>
            <td>${order.order_date}</td>
            <td>${order.delivery_date}</td>
            <td>${order.item_count || 0} items</td>
            <td><strong>₱${parseFloat(order.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
            <td><button class="action-btn" onclick="viewOrderDetails(${order.po_id})">View</button></td>
        </tr>
    `).join('');
}

// 2. Modal Logic
async function openAddOrderModal() {
    try {
        const [invRes, supRes] = await Promise.all([
            fetch('../api/get_inventory.php'),
            fetch('../api/get_suppliers.php')
        ]);

        window.inventoryData = await invRes.json();
        const suppliers = await supRes.json();

        const supplierSelect = document.getElementById('poSupplier');
        if (supplierSelect) {
            supplierSelect.innerHTML = '<option value="">Select a supplier</option>' + 
                suppliers.map(sup => `<option value="${sup.supplier_id}">${sup.supplier_name}</option>`).join('');
        }

        const modal = document.getElementById('createOrderModal');
        if (modal) {
            modal.style.display = 'block';
            // Set order date to today's local date string
            document.getElementById('poOrderDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('poItemsBody').innerHTML = ''; 
            document.getElementById('poGrandTotal').textContent = '₱0.00';
            addItemRow(); 
        }
    } catch (err) {
        alert("Failed to initialize modal. Check supplier data.");
    }
}

function closeOrderModal() {
    document.getElementById('createOrderModal').style.display = 'none';
    document.getElementById('purchaseOrderForm').reset();
}

function addItemRow() {
    const tbody = document.getElementById('poItemsBody');
    const rowId = Date.now();
    
    const productOptions = window.inventoryData.map(item => `
        <option value="${item.inventory_id}" data-price="${item.price}">
            ${item.product_name} (${item.sku})
        </option>
    `).join('');

    const tr = document.createElement('tr');
    tr.id = `row-${rowId}`;
    tr.innerHTML = `
        <td><select class="item-select" required onchange="autoFillPrice(${rowId})">
            <option value="">-- Select Product --</option>${productOptions}</select></td>
        <td><input type="number" class="qty-input" value="1" min="1" oninput="calculateTotals()"></td>
        <td><input type="number" class="cost-input" value="0" step="0.01" oninput="calculateTotals()"></td>
        <td class="row-subtotal">₱0.00</td>
        <td><button type="button" class="action-btn delete" onclick="removeRow(${rowId})">&times;</button></td>
    `;
    tbody.appendChild(tr);
}

function autoFillPrice(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    const select = row.querySelector('.item-select');
    const price = select.options[select.selectedIndex].getAttribute('data-price');
    if (price) row.querySelector('.cost-input').value = price;
    calculateTotals();
}

function calculateTotals() {
    let grandTotal = 0;
    document.querySelectorAll('#poItemsBody tr').forEach(row => {
        const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
        const cost = parseFloat(row.querySelector('.cost-input').value) || 0;
        const subtotal = qty * cost;
        row.querySelector('.row-subtotal').textContent = `₱${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        grandTotal += subtotal;
    });
    document.getElementById('poGrandTotal').textContent = `₱${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

// 3. Database Save
async function handleCreateOrder(event) {
    event.preventDefault();

    const payload = {
        supplier_id: document.getElementById('poSupplier').value,
        order_date: document.getElementById('poOrderDate').value,
        delivery_date: document.getElementById('poDeliveryDate').value,
        total_amount: document.getElementById('poGrandTotal').textContent.replace(/[₱,]/g, ''),
        status: 'pending',
        items: []
    };

    const rows = document.querySelectorAll('#poItemsBody tr');
    rows.forEach(row => {
        payload.items.push({
            inventory_id: row.querySelector('.item-select').value,
            quantity: row.querySelector('.qty-input').value,
            unit_cost: row.querySelector('.cost-input').value
        });
    });

    try {
        const res = await fetch('../api/create_purchase_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.status === 'success') {
            alert("Order Saved!");
            closeOrderModal();
            loadPurchaseOrders();
        } else {
            alert("Error: " + result.message);
        }
    } catch (err) {
        alert("Submission failed.");
    }
}