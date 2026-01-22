// ================================================
// EYE EXAMINATION RESULTS - TABLE WITH PAGINATION & AUTO-REFRESH
// ================================================

// Load HTML Component
fetch('../components/optometrists/eye-exam-results.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('eye-exam-results-placeholder').innerHTML = html;
    initializeExamResults();
  })
  .catch(err => console.error('Failed to load eye exam results HTML:', err));

// Pagination & Filter state - USE UNIQUE NAMES
let allExamResults = [];
let filteredExamResults = [];
let currentExamPage = 1;
const examResultsPerPage = 5;
let currentExamFilter = 'all';     
let currentExamSearchTerm = '';

// Auto-refresh settings
let examAutoRefreshInterval = null;
const EXAM_AUTO_REFRESH_INTERVAL = 8000; // 8 seconds

// ────────────────────────────────────────────────
// INITIALIZE
// ────────────────────────────────────────────────
function initializeExamResults() {
  loadExamResults(currentExamFilter, currentExamSearchTerm);
  setupExamSearch();
  setupDateFilter();
  
  // Start auto-refresh immediately
  startAutoRefresh();
}

// Stop refresh when leaving the page
window.addEventListener('beforeunload', () => {
  if (examAutoRefreshInterval) {
    clearInterval(examAutoRefreshInterval);
    examAutoRefreshInterval = null;
  }
});

// ────────────────────────────────────────────────
// LOAD EXAM RESULTS FROM API
// ────────────────────────────────────────────────
async function loadExamResults(filterDate = 'all', searchTerm = '') {
  const tbody = document.getElementById('examResultsBody');
  if (!tbody) return;

  // Show loading only on first load or manual filter change
  const isInitialOrFilterChange = !examAutoRefreshInterval || filterDate !== currentExamFilter || searchTerm !== currentExamSearchTerm;
  if (isInitialOrFilterChange) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="exam-loading-row">Loading examination results...</td>
      </tr>
    `;
  }

  try {
    const res = await fetch('../api/get_exam_result.php');
    if (!res.ok) throw new Error('Failed to fetch exam results');

    allExamResults = await res.json();
    
    // Update current filter/search state
    currentExamFilter = filterDate;
    currentExamSearchTerm = searchTerm.trim();
    
    // Apply filters
    filteredExamResults = allExamResults;
    
    if (filterDate !== 'all') {
      filteredExamResults = filterByDate(filteredExamResults, filterDate);
    }

    if (currentExamSearchTerm) {
      filteredExamResults = filterBySearch(filteredExamResults, currentExamSearchTerm);
    }

    // Reset pagination only on actual filter/search change
    if (isInitialOrFilterChange) {
      currentExamPage = 1;
    }
    
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

  if (filteredExamResults.length === 0) {
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

  const startIndex = (currentExamPage - 1) * examResultsPerPage;
  const endIndex = startIndex + examResultsPerPage;
  const pageResults = filteredExamResults.slice(startIndex, endIndex);

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
  const totalPages = Math.ceil(filteredExamResults.length / examResultsPerPage);
  const startIndex = (currentExamPage - 1) * examResultsPerPage + 1;
  const endIndex = Math.min(currentExamPage * examResultsPerPage, filteredExamResults.length);

  const infoElement = document.getElementById('paginationInfo');
  if (infoElement) {
    infoElement.textContent = `Showing ${startIndex} to ${endIndex} of ${filteredExamResults.length} results`;
  }

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) prevBtn.disabled = currentExamPage === 1;
  if (nextBtn) nextBtn.disabled = currentExamPage === totalPages || totalPages === 0;

  const pageNumbersContainer = document.getElementById('pageNumbers');
  if (!pageNumbersContainer) return;

  pageNumbersContainer.innerHTML = '';

  if (totalPages <= 1) return;

  let startPage = Math.max(1, currentExamPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `exam-page-number ${i === currentExamPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => goToPage(i);
    pageNumbersContainer.appendChild(pageBtn);
  }
}

// ────────────────────────────────────────────────
// PAGINATION CONTROLS
// ────────────────────────────────────────────────
function goToPage(page) {
  currentExamPage = page;
  renderTable();
  renderPagination();
}

function previousPage() {
  if (currentExamPage > 1) {
    currentExamPage--;
    renderTable();
    renderPagination();
  }
}

function nextPage() {
  const totalPages = Math.ceil(filteredExamResults.length / examResultsPerPage);
  if (currentExamPage < totalPages) {
    currentExamPage++;
    renderTable();
    renderPagination();
  }
}

window.previousPage = previousPage;
window.nextPage = nextPage;

// ────────────────────────────────────────────────
// SEARCH & FILTER SETUP
// ────────────────────────────────────────────────
function setupExamSearch() {
  const searchInput = document.querySelector('.exam-search-input');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentExamSearchTerm = e.target.value.trim();
      loadExamResults(currentExamFilter, currentExamSearchTerm);
    }, 300);
  });
}

function setupDateFilter() {
  const dateFilter = document.getElementById('dateFilter');
  if (!dateFilter) return;

  dateFilter.addEventListener('change', (e) => {
    currentExamFilter = e.target.value;
    loadExamResults(currentExamFilter, currentExamSearchTerm);
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
        return examDate.toDateString() === today.toDateString();
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
  if (!searchTerm) return results;
  const term = searchTerm.toLowerCase();
  return results.filter(result => {
    const patientName = `${result.firstname} ${result.middlename || ''} ${result.lastname}`.toLowerCase();
    const patientId = `#${result.patient_id}`;
    return patientName.includes(term) || patientId.includes(term);
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

// ────────────────────────────────────────────────
// CLEANUP
// ────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (examAutoRefreshInterval) {
    clearInterval(examAutoRefreshInterval);
  }
});