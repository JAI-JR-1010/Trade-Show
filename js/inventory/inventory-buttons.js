// ============================================================================
// inventory/inventory-buttons.js
// Inventory: enable/disable action buttons based on Status + Event.
//
// Defines : updateActionButtonsState
// Uses    : (nothing from other files)
// ============================================================================

// ==========================================
// Action Buttons Enable/Disable Logic
// ==========================================
function updateActionButtonsState() {
    const statusSelect = document.getElementById("statusSelect");
    const eventNameSelect = document.getElementById("eventName");
    const btnSave = document.getElementById("btnSaveItem");
    const btnInvoice = document.getElementById("btnGenInvoice");
    const btnMemo = document.getElementById("btnGenMemo");
    const btnScan = document.getElementById("btnScanItem");
    const btnExport = document.getElementById("inventoryExportBtn");
    if (!btnSave || !btnInvoice || !btnMemo || !btnScan || !btnExport) return;
    const status = statusSelect ? statusSelect.value : "";
    const eventName = eventNameSelect ? eventNameSelect.value : "";
    const isStatusValid = status && status !== "Select Status";
    const isEventValid = eventName && eventName !== "Select Event" && eventName !== "";
    if (!isStatusValid || !isEventValid) {
        btnSave.disabled = true;
        btnInvoice.disabled = true;
        btnMemo.disabled = true;
        btnScan.disabled = true;
        btnExport.disabled = true;
        return;
    }
    if (status === "Planned") {
        btnSave.disabled = false;
        btnScan.disabled = false;
        btnExport.disabled = false;
        btnInvoice.disabled = true;
        btnMemo.disabled = true;
    } else if (status === "Active") {
        btnSave.disabled = false;
        btnScan.disabled = false;
        btnExport.disabled = false;
        btnInvoice.disabled = false;
        btnMemo.disabled = false;
    } else if (status === "Closed") {
        btnSave.disabled = false;
        btnScan.disabled = false;
        btnInvoice.disabled = true;
        btnMemo.disabled = true;
        btnExport.disabled = false;
    } else {
        btnSave.disabled = true;
        btnInvoice.disabled = true;
        btnMemo.disabled = true;
        btnScan.disabled = true;
        btnExport.disabled = true;
    }
}
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(updateActionButtonsState, 500);
    const statusSelect = document.getElementById("statusSelect");
    const eventNameSelect = document.getElementById("eventName");
    if (statusSelect) {
        statusSelect.addEventListener("change", function () {
            setTimeout(updateActionButtonsState, 100);
        });
    }
    if (eventNameSelect) {
        eventNameSelect.addEventListener("change", updateActionButtonsState);
        eventNameSelect.addEventListener("addItem", updateActionButtonsState);
        eventNameSelect.addEventListener("removeItem", updateActionButtonsState);
    }
});
