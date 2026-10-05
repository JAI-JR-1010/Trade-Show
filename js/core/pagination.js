// ============================================================================
// core/pagination.js
// Shared pagination button renderer used by every table.
//
// Defines : renderPaginationControls
// Uses    : (nothing from other files)
// ============================================================================

// ==============================
// UNIVERSAL PAGINATION CONTROL HELPER
// ==============================
function renderPaginationControls(containerId, currentPage, totalPages, onPageChangeFnName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!totalPages || totalPages <= 1) {
        container.innerHTML = "";
        return;
    }
    let html = "";
    // Previous Button
    const prevDisabled = currentPage <= 1 ? "disabled" : "";
    html += `<button class="pg-btn" ${prevDisabled} onclick="${onPageChangeFnName}(${currentPage - 1})">Previous</button>`;
    // Page numbers algorithm with smart ellipsis
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (currentPage <= 3) {
        endPage = Math.min(totalPages, 5);
    } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }
    if (startPage > 1) {
        html += `<button class="pg-btn" onclick="${onPageChangeFnName}(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pg-ellipsis">...</span>`;
        }
    }
    for (let p = startPage; p <= endPage; p++) {
        const activeClass = p === currentPage ? "active" : "";
        html += `<button class="pg-btn ${activeClass}" onclick="${onPageChangeFnName}(${p})">${p}</button>`;
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pg-ellipsis">...</span>`;
        }
        html += `<button class="pg-btn" onclick="${onPageChangeFnName}(${totalPages})">${totalPages}</button>`;
    }
    // Next Button
    const nextDisabled = currentPage >= totalPages ? "disabled" : "";
    html += `<button class="pg-btn" ${nextDisabled} onclick="${onPageChangeFnName}(${currentPage + 1})">Next</button>`;
    container.innerHTML = html;
}
