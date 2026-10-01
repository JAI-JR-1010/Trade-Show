// ============================================================================
// intertransfer/imt-bulk-update.js
// Inter-Movement Tracking: bulk update popup and selection helpers.
//
// Defines : openBulkUpdatePopup, closeBulkUpdatePopup, applyBulkUpdate, toggleBulkUpdateButton, clearIMTSelections
// Uses    : (defined in other files)
//   core/ui-feedback.js  ->  showCustomAlert
//   intertransfer/imt-table.js  ->  renderIMTTable
// ============================================================================

// =================================================================================
// Bulk Update Button
// =================================================================================
function openBulkUpdatePopup() {
    document.getElementById("bulkPopup")
        .style.display = "flex";
}
function closeBulkUpdatePopup() {
    clearIMTSelections();
    document.getElementById("bulkPopup")
        .style.display = "none";
    renderIMTTable(window.imtCurrentPage);
}
function applyBulkUpdate() {
    const fromLocation =
        document.getElementById("bulkFromLocation").value;
    const toLocation =
        document.getElementById("bulkToLocation").value;
    if (
        fromLocation &&
        toLocation &&
        fromLocation === toLocation
    ) {
        showCustomAlert(
            "From Location and To Location cannot be the same"
        );

        return;
    }
    Object.values(window.imtRowStates || {}).forEach(state => {
        if (state.selected) {
            if (fromLocation) state.fromLocation = fromLocation;
            if (toLocation) state.toLocation = toLocation;
        }
    });
    clearIMTSelections();
    closeBulkUpdatePopup();
    renderIMTTable(window.imtCurrentPage);
}
function toggleBulkUpdateButton() {
    const bulkBtn = document.getElementById("bulkUpdateBtn");
    if (!bulkBtn) return;
    const selectedCount = Object.values(window.imtRowStates || {}).filter(s => s.selected).length;
    bulkBtn.disabled = selectedCount < 2;
}
// Uncheck the checkbox
function clearIMTSelections() {
    Object.values(window.imtRowStates || {}).forEach(s => {
        s.selected = false;
    });
    const selectAll = document.getElementById("imtSelectAll");
    if (selectAll) selectAll.checked = false;
    toggleBulkUpdateButton();
}
