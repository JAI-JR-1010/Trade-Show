// ============================================================================
// inventory/inventory-invoice-memo.js
// Inventory: Generate Invoice / Generate Memo (opens Creator pages).
//
// Defines : createInvoice, createMemo
// Uses    : (defined in other files)
//   core/ui-feedback.js  ->  showCustomAlert
//   inventory/inventory-table.js  ->  renderInventoryTable
// ============================================================================

// ==============================
// Create Invoice
// ==============================
function createInvoice() {
    const status = document.getElementById("statusSelect").value;
    if (status === "Planned" || status === "Closed") {
        showCustomAlert(
            "Generate Invoice is restricted for this Event Status."
        );
        return;
    }
    console.log("Invoice creation Function Triggered");
    let recordsData = [];
    let tsid = "";
    (window.allInventoryData || []).forEach(record => {
        if (record._checked) {
            if (record.Trade_Show_ID) tsid = record.Trade_Show_ID;
            recordsData.push(record);
            record._checked = false;
        }
    });
    if (recordsData.length === 0) {
        showCustomAlert("Please select at least one item using the checkboxes.");
        return;
    }
    // Re-render current page to uncheck checkboxes visually
    renderInventoryTable(window.inventoryCurrentPage);
    let lots = recordsData
        .map(record => encodeURIComponent(record.Lot))
        .join(",");
    showCustomAlert("✅ Preparing Invoice...");
    const url = `https://creatorapp.zoho.com/ankit_feiny/feiny-app#Page:Invoice?Trade_Show_ID=${encodeURIComponent(tsid)}&SKU=${lots}`;
    window.open(url, "_blank");
}
function createMemo() {
    const status = document.getElementById("statusSelect").value;
    if (status === "Planned" || status === "Closed") {
        showCustomAlert("Generate Memo is restricted for this Event Status.");
        return;
    }
    console.log("memo creation Function Triggered");
    let recordsData = [];
    let tsid = "";
    (window.allInventoryData || []).forEach(record => {
        if (record._checked) {
            if (record.Trade_Show_ID) tsid = record.Trade_Show_ID;
            recordsData.push(record);
            record._checked = false;
        }
    });
    if (recordsData.length === 0) {
        showCustomAlert("Please select at least one item using the checkboxes.");
        return;
    }
    // Re-render current page to uncheck checkboxes visually
    renderInventoryTable(window.inventoryCurrentPage);
    let lots = recordsData.map(record => encodeURIComponent(record.Lot)).join(",");
    showCustomAlert("✅ Preparing Memo...");
    const url = `https://creatorapp.zoho.com/ankit_feiny/feiny-app#Page:Test_Memo?Trade_Show_ID=${encodeURIComponent(tsid)}&SKU=${lots}`;
    window.open(url, "_blank");
}
