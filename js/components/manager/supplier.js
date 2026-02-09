/**
 * supplier.js - Bagares Optical Clinic
 */

// Global data store to allow filtering without refetching from the server
let allSuppliers = [];

// FIX: Prevent "Identifier has already been declared" error
if (typeof window.supplierData === 'undefined') {
    window.supplierData = [];
}

// ==========================================================================
// 1. INITIALIZATION & COMPONENT LOADING
// ==========================================================================

fetch('../components/manager/supplier.html')
    .then(res => res.text())
    .then(html => {
        const placeholder = document.getElementById('supplier-placeholder');
        if (placeholder) {
            placeholder.innerHTML = html;
            loadSuppliers(); // Fetch real data from DB
        }
    })
    .catch(err => console.error('Error loading supplier component:', err));

async function loadSuppliers() {
    try {
        const res = await fetch('../api/get_suppliers.php');
        const data = await res.json();
        
        // Cache the full list for filtering
        allSuppliers = data; 
        window.supplierData = data;
        
        renderSupplierTable(data);
    } catch (err) {
        console.warn('API not ready, showing empty state.');
        renderSupplierTable([]);
    }
}

// ==========================================================================
// 2. TABLE RENDERING, SEARCH & FILTERS
// ==========================================================================

function getInitials(name) {
    if (!name) return "??";
    const parts = name.split(' ').filter(part => part.length > 0);
    return parts.length > 1 
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
        : name.substring(0, 2).toUpperCase();
}

/**
 * Main Search Function - Triggered by search input
 */
function filterSuppliers() {
    const searchTerm = document.getElementById('searchSupplierInput').value.toLowerCase();
    applySupplierFilters(searchTerm);
}

/**
 * Advanced Filter Function - Handles Category and Status dropdowns
 */
function applySupplierFilters(searchTerm = "") {
    if (!searchTerm) {
        searchTerm = document.getElementById('searchSupplierInput')?.value.toLowerCase() || "";
    }
    
    const statusFilter = document.getElementById('statusFilterSupplier')?.value || "all";
    const categoryFilter = document.getElementById('categoryFilterSupplier')?.value || "all";

    const filtered = allSuppliers.filter(sup => {
        const matchesSearch = sup.supplier_name.toLowerCase().includes(searchTerm) || 
                              sup.contact_person.toLowerCase().includes(searchTerm);
        
        const matchesStatus = (statusFilter === "all" || sup.status.toLowerCase() === statusFilter);
        const matchesCategory = (categoryFilter === "all" || sup.category.toLowerCase() === categoryFilter);

        return matchesSearch && matchesStatus && matchesCategory;
    });

    renderSupplierTable(filtered);
}

/**
 * Sorting Function
 */
let supplierSortDirection = true;
function sortSupplierTable(column) {
    supplierSortDirection = !supplierSortDirection;
    
    const sorted = [...allSuppliers].sort((a, b) => {
        let valA, valB;
        switch(column) {
            case 'name': valA = a.supplier_name.toLowerCase(); valB = b.supplier_name.toLowerCase(); break;
            case 'contact': valA = a.contact_person.toLowerCase(); valB = b.contact_person.toLowerCase(); break;
            case 'orders': valA = parseInt(a.total_orders || 0); valB = parseInt(b.total_orders || 0); break;
            default: return 0;
        }

        if (valA < valB) return supplierSortDirection ? -1 : 1;
        if (valA > valB) return supplierSortDirection ? 1 : -1;
        return 0;
    });

    renderSupplierTable(sorted);
}

function renderSupplierTable(suppliers) {
    const tbody = document.getElementById('supplierTableBody');
    if (!tbody) return;

    if (!suppliers || suppliers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #6b7280;">No suppliers found matching criteria.</td></tr>';
        return;
    }

    tbody.innerHTML = suppliers.map(sup => {
        const categorySlug = sup.category ? sup.category.toLowerCase() : 'none';
        const statusSlug = sup.status ? sup.status.toLowerCase() : 'inactive';

        return `
        <tr data-category="${categorySlug}" data-status="${statusSlug}">
            <td><div class="supplier-logo">${getInitials(sup.supplier_name)}</div></td>
            <td><span class="supplier-name">${sup.supplier_name}</span></td>
            <td>${sup.contact_person}</td>
            <td>${sup.email}</td>
            <td>${sup.phone}</td>
            <td><span class="category-badge ${categorySlug}">${sup.category}</span></td>
            <td><strong>${sup.total_orders || 0}</strong></td>
            <td><span class="status-badge ${statusSlug}">${sup.status}</span></td>
            <td>
                <div class="menu-container">
                    <button class="menu-dot-btn" onclick="toggleMenu(event, ${sup.supplier_id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                    <div id="dropdown-${sup.supplier_id}" class="menu-dropdown">
                        <button onclick="viewSupplier(${sup.supplier_id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            View Details
                        </button>
                        <button onclick="editSupplier(${sup.supplier_id})">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit Supplier
                        </button>
                    </div>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ==========================================================================
// 3. MODAL MANAGEMENT & CRUD
// ==========================================================================

function openAddSupplierModal() {
    const modal = document.getElementById('addSupplierModal');
    if (modal) modal.style.display = 'block';
}

function closeSupplierModal() {
    const modal = document.getElementById('addSupplierModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('addSupplierForm').reset();
    }
}

async function handleCreateSupplier(event) {
    event.preventDefault();
    
    const payload = {
        supplier_name: document.getElementById('supName').value,
        contact_person: document.getElementById('supContact').value,
        email: document.getElementById('supEmail').value,
        phone: document.getElementById('supPhone').value,
        category: document.getElementById('supCategory').value,
        status: 'Active'
    };

    try {
        const res = await fetch('../api/create_suppliers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
        }

        const result = await res.json();
        if (result.status === 'success') {
            alert("Supplier added successfully!");
            closeSupplierModal();
            loadSuppliers(); // Refreshes and updates allSuppliers cache
        } else {
            alert("Database Error: " + result.message);
        }
    } catch (err) {
        console.error("Critical Error:", err);
        alert("Failed to save. Check console (F12) for the server error.");
    }
}

//
// Toggles the visibility of the 3-dot dropdown menu
//

function toggleMenu(event, id) {
    event.stopPropagation();
    
    // Close all other open menus
    document.querySelectorAll('.menu-dropdown').forEach(el => {
        if (el.id !== `dropdown-${id}`) el.classList.remove('show');
    });

    const menu = document.getElementById(`dropdown-${id}`);
    menu.classList.toggle('show');
}

// Close menu if user clicks anywhere else on the screen
window.addEventListener('click', () => {
    document.querySelectorAll('.menu-dropdown').forEach(el => el.classList.remove('show'));
});