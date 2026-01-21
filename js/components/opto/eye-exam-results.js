// ================================================
// EYE EXAMINATION RESULTS - TABLE WITH PAGINATION
// ================================================

// Load HTML Component
fetch('../components/optometrists/eye-exam-results.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('eye-exam-results-placeholder').innerHTML = html;
    initializeExamResults();
  })
  .catch(err => console.error('Failed to load eye exam results HTML:', err));

// Pagination state
let allResults = [];
let filteredResults = [];
let currentPage = 1;
const resultsPerPage = 5;

// ────────────────────────────────────────────────
// INITIALIZE
// ────────────────────────────────────────────────
function initializeExamResults() {
  loadExamResults();
  setupExamSearch();
  setupDateFilter();
}

// ────────────────────────────────────────────────
// LOAD EXAM RESULTS FROM API
// ────────────────────────────────────────────────
async function loadExamResults(filterDate = 'all', searchTerm = '') {
  const tbody = document.getElementById('examResultsBody');
  if (!tbody) return;

  // Show loading state
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="exam-loading-row">Loading examination results...</td>
    </tr>
  `;

  try {
    const res = await fetch('../api/get_exam_result.php');
    if (!res.ok) throw new Error('Failed to fetch exam results');

    allResults = await res.json();
    
    // Apply filters
    filteredResults = allResults;
    
    if (filterDate !== 'all') {
      filteredResults = filterByDate(filteredResults, filterDate);
    }

    if (searchTerm) {
      filteredResults = filterBySearch(filteredResults, searchTerm);
    }

    // Reset to page 1 when filters change
    currentPage = 1;
    
    // Render results
    renderTable();
    renderPagination();

  } catch (error) {
    console.error('Error loading exam results:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="exam-empty-row">
          <div class="exam-empty-content">
            <p style="color: #e53e3e;">Failed to load examination results</p>
          </div>
        </td>
      </tr>
    `;
  }
}

// ────────────────────────────────────────────────
// RENDER TABLE
// ────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('examResultsBody');
  if (!tbody) return;

  if (filteredResults.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="exam-empty-row">
          <div class="exam-empty-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p>No examination results found</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const pageResults = filteredResults.slice(startIndex, endIndex);

  // Render rows
  tbody.innerHTML = pageResults.map(result => createTableRow(result)).join('');
}

// ────────────────────────────────────────────────
// CREATE TABLE ROW
// ────────────────────────────────────────────────
function createTableRow(result) {
  const patientName = `${result.firstname} ${result.middlename || ''} ${result.lastname}`.trim();
  const examDate = formatDate(result.exam_date);
  
  return `
    <tr>
      <td>
        <div class="exam-patient-name-cell">${patientName}</div>
        <span class="exam-patient-id-small">ID: #${result.patient_id}</span>
      </td>
      <td class="exam-date-cell">${examDate}</td>
      <td class="exam-prescription-cell">
        <span class="exam-prescription-line">
          <span class="exam-rx-label">SPH:</span>
          <span class="exam-rx-value">${result.od_sph || '—'}</span>
        </span>
        <span class="exam-prescription-line">
          <span class="exam-rx-label">CYL:</span>
          <span class="exam-rx-value">${result.od_cyl || '—'}</span>
        </span>
        <span class="exam-prescription-line">
          <span class="exam-rx-label">AXIS:</span>
          <span class="exam-rx-value">${result.od_axis || '—'}°</span>
        </span>
        <span class="exam-prescription-line">
          <span class="exam-rx-label">ADD:</span>
          <span class="exam-rx-value">${result.od_add || '—'}</span>
        </span>
      </td>
      <td class="exam-prescription-cell">
        <span class="exam-prescription-line">
          <span class="exam-rx-label">SPH:</span>
          <span class="exam-rx-value">${result.os_sph || '—'}</span>
        </span>
        <span class="exam-prescription-line">
          <span class="exam-rx-label">CYL:</span>
          <span class="exam-rx-value">${result.os_cyl || '—'}</span>
        </span>
        <span class="exam-prescription-line">
          <span class="exam-rx-label">AXIS:</span>
          <span class="exam-rx-value">${result.os_axis || '—'}°</span>
        </span>
        <span class="exam-prescription-line">
          <span class="exam-rx-label">ADD:</span>
          <span class="exam-rx-value">${result.os_add || '—'}</span>
        </span>
      </td>
      <td class="exam-value-cell">${result.pd || '—'} mm</td>
      <td class="exam-value-cell">${result.lens_type || '—'}</td>
    </tr>
  `;
}

// ────────────────────────────────────────────────
// RENDER PAGINATION
// ────────────────────────────────────────────────
function renderPagination() {
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage + 1;
  const endIndex = Math.min(currentPage * resultsPerPage, filteredResults.length);

  // Update info text
  const infoElement = document.getElementById('paginationInfo');
  if (infoElement) {
    infoElement.textContent = `Showing ${startIndex} to ${endIndex} of ${filteredResults.length} results`;
  }

  // Update buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  }

  // Render page numbers
  const pageNumbersContainer = document.getElementById('pageNumbers');
  if (!pageNumbersContainer) return;

  pageNumbersContainer.innerHTML = '';
  
  if (totalPages <= 1) return;

  // Show max 5 page numbers
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `exam-page-number ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => goToPage(i);
    pageNumbersContainer.appendChild(pageBtn);
  }
}

// ────────────────────────────────────────────────
// PAGINATION CONTROLS
// ────────────────────────────────────────────────
function goToPage(page) {
  currentPage = page;
  renderTable();
  renderPagination();
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
    renderPagination();
  }
}

function nextPage() {
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
    renderPagination();
  }
}

// Make functions global
window.previousPage = previousPage;
window.nextPage = nextPage;

// ────────────────────────────────────────────────
// SEARCH FUNCTIONALITY
// ────────────────────────────────────────────────
function setupExamSearch() {
  const searchInput = document.querySelector('.exam-search-input');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const searchTerm = e.target.value.toLowerCase();
      const filterDate = document.getElementById('dateFilter')?.value || 'all';
      loadExamResults(filterDate, searchTerm);
    }, 300);
  });
}

// ────────────────────────────────────────────────
// DATE FILTER
// ────────────────────────────────────────────────
function setupDateFilter() {
  const dateFilter = document.getElementById('dateFilter');
  if (!dateFilter) return;

  dateFilter.addEventListener('change', (e) => {
    const searchTerm = document.querySelector('.exam-search-input')?.value || '';
    loadExamResults(e.target.value, searchTerm);
  });
}

// ────────────────────────────────────────────────
// FILTER HELPERS
// ────────────────────────────────────────────────
function filterByDate(results, filter) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return results.filter(result => {
    const examDate = new Date(result.exam_date);
    
    switch(filter) {
      case 'today':
        return examDate >= today;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return examDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return examDate >= monthAgo;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return examDate >= yearAgo;
      default:
        return true;
    }
  });
}

function filterBySearch(results, searchTerm) {
  return results.filter(result => {
    const patientName = `${result.firstname} ${result.middlename || ''} ${result.lastname}`.toLowerCase();
    const patientId = `#${result.patient_id}`;
    return patientName.includes(searchTerm) || patientId.includes(searchTerm);
  });
}

// ────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}