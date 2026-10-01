// ============================================================================
// inventory/inventory-table.js
// Inventory: items table (fetch, render, pagination state, row checkboxes).
//
// Defines : fetchEventItems, changeInventoryPage, toggleInventoryCheckbox, renderInventoryTable
// Uses    : (defined in other files)
//   core/pagination.js  ->  renderPaginationControls
//   core/ui-feedback.js  ->  showCustomAlert
// ============================================================================

window.inventoryCurrentPage = 1;
window.inventoryRowsPerPage = 10;
window.allInventoryData = [];

// ==============================
// Page Loader
// ==============================
function fetchEventItems() {
    const eventDropdown = document.getElementById("eventName");
    let eventName = eventDropdown.value;
    if (!eventName) {
        showCustomAlert("Please select an event name first.");
        return;
    }
    var config = {
        app_name: "feiny-app",
        report_name: "All_Inventory_Items",
        criteria: `(Event == "${eventName}")`
    };
    ZOHO.CREATOR.DATA.getRecords(config)
        .then(function (response) {
            console.log("Fetched event items:", response);
            const data = response.data || [];
            window.allInventoryData = data;
            window.inventoryCurrentPage = 1;
            if (data.length === 0) {
                renderInventoryTable(1);
                showCustomAlert("No items found for the selected event.");
                return;
            }
            renderInventoryTable(1);
            showCustomAlert(`✅ Loaded ${data.length} items successfully.`);
        })
        .catch(function (error) {
            console.log("Error fetching event items:", error);
            window.allInventoryData = [];
            renderInventoryTable(1);
            showCustomAlert("❌ No items found for this event.");
        });
}
function changeInventoryPage(newPage) {
    const totalPages = Math.ceil((window.allInventoryData || []).length / window.inventoryRowsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    renderInventoryTable(newPage);
}
function toggleInventoryCheckbox(globalIndex, checked) {
    if (window.allInventoryData && window.allInventoryData[globalIndex]) {
        window.allInventoryData[globalIndex]._checked = checked;
    }
}
function renderInventoryTable(page) {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const data = window.allInventoryData || [];
    if (data.length === 0) {
        renderPaginationControls("inventoryPagination", 1, 0, "changeInventoryPage");
        return;
    }
    const totalPages = Math.ceil(data.length / window.inventoryRowsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    window.inventoryCurrentPage = currentPage;
    const startIdx = (currentPage - 1) * window.inventoryRowsPerPage;
    const endIdx = Math.min(startIdx + window.inventoryRowsPerPage, data.length);
    const pageRecords = data.slice(startIdx, endIdx);
    pageRecords.forEach((record, sliceIdx) => {
        const globalIdx = startIdx + sliceIdx;
        const newRow = tbody.insertRow();
        let scanCount = record._scanCount || (record.Log_Status === "Check-In" ? 2 : 1);
        newRow.setAttribute("data-scan-count", scanCount);
        let logStatusColor = (record.Log_Status === "Check-Out" || record.Log_Status === "Check Out") ? "red" : "green";
        const isChecked = record._checked ? "checked" : "";
        newRow.innerHTML = `
            <td><input type="checkbox" class="rowCheckbox" ${isChecked} onchange="toggleInventoryCheckbox(${globalIdx}, this.checked)"></td>
            <td>${globalIdx + 1}</td>
            <td>${record.Event || ""}</td>
            <td>${record.Trade_Show_ID || ""}</td>
            <td>${record.Lot || ""}</td>
            <td>${record.Description || ""}</td>
            <td>${record.Pcs || ""}</td>
            <td>${record.Weight || ""}</td>
            <td>${record.Cost || ""}</td>
            <td>${record.Price || ""}</td>
            <td>${record.Total || ""}</td>
            <td>${record.COO || ""}</td>
            <td>${record.Treat || ""}</td>
            <td>${record.Cert_1 || ""}</td>
            <td>${record.Cert_2 || ""}</td>
            <td>${record.Cert_3 || ""}</td>
            <td>${record.Item_Status || ""}</td>
            <td class="log-status" style="color: ${logStatusColor}; font-weight: bold;">${record.Log_Status || ""}</td>
        `;
    });
    renderPaginationControls("inventoryPagination", currentPage, totalPages, "changeInventoryPage");
}
