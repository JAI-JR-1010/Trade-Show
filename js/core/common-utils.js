// ============================================================================
// core/common-utils.js
// Small generic helpers (delay, Zoho lookup display value).
//
// Defines : delay, getLookupDisplay
// Uses    : (nothing from other files)
// ============================================================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==============================
// Lookup Display Helper (shared)
// ==============================
// Lookup for treatment
function getLookupDisplay(val) {
    if (typeof val === "object" && val !== null) {
        return val.display_value || val.zc_display_value || val.Name || val.name || val.Lab_Name || val.Description1 || "";
    }
    return val || "";
}
