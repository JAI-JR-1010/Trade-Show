// ============================================================================
// core/date-utils.js
// Date formatting / parsing helpers.
//
// Defines : formatDate, getISOFormat, getCurrentDate
// Uses    : (nothing from other files)
// ============================================================================

// ==============================
// Date Format
// ==============================
function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function getISOFormat(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// =================================================================================
// GET CURRENT DATE
// =================================================================================
function getCurrentDate(dateValue = null) {
    const today = dateValue
        ? new Date(dateValue)
        : new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1)
        .padStart(2, "0");
    const day = String(today.getDate())
        .padStart(2, "0");
    return `${year}-${month}-${day}`;
}
