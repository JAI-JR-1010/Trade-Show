// ============================================================================
// scan-log/scan-log-table.js
// Scan Log tab: in-memory log update, event filter, fetch, render, pagination.
//
// Defines : updateScanLog, fetchScanLogs, changeScanLogPage, renderScanLogTable
// Uses    : (defined in other files)
//   core/pagination.js  ->  renderPaginationControls
//   core/ui-feedback.js  ->  showCustomAlert
//   inventory/event-selector.js  ->  allEventData
// ============================================================================

window.scanLogCurrentPage = 1;
window.scanLogRowsPerPage = 10;
window.allScanLogData = [];

function updateScanLog(event, tradeShowId, lot, description, itemStatus, scanCount) {
    const table = document.getElementById("scanLogBody");
    if (!table) return;
    let existingRow = null;
    for (let i = 0; i < table.rows.length; i++) {
        let row = table.rows[i];
        if (row.cells[1].innerText === event && row.cells[3].innerText === lot) {
            existingRow = row;
            break;
        }
    }
    const step = (scanCount - 1) % 4;
    function getTime() {
        const now = new Date();
        return now.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
    function setCellValue(cell, value, color) {
        if (!cell.innerText) {
            cell.innerHTML = `<span style="color:${color}; font-weight:bold;">${value}</span>`;
        } else {
            cell.innerHTML += ` | <span style="color:${color}; font-weight:bold;">${value}</span>`;
        }
    }
    if (existingRow) {
        if (step === 0) setCellValue(existingRow.cells[6], getTime(), "red");   // Warehouse Out
        if (step === 1) setCellValue(existingRow.cells[7], getTime(), "green"); // Trade In
        if (step === 2) setCellValue(existingRow.cells[8], getTime(), "red");   // Trade Out
        if (step === 3) setCellValue(existingRow.cells[9], getTime(), "green"); // Warehouse In
    } else {
        const newRow = table.insertRow();
        let warehouseOut = "";
        let tradeIn = "";
        let tradeOut = "";
        let warehouseIn = "";
        const time = getTime();
        if (step === 0) warehouseOut = `<span style="color:red;font-weight:bold;">${time}</span>`;
        if (step === 1) tradeIn = `<span style="color:green;font-weight:bold;">${time}</span>`;
        if (step === 2) tradeOut = `<span style="color:red;font-weight:bold;">${time}</span>`;
        if (step === 3) warehouseIn = `<span style="color:green;font-weight:bold;">${time}</span>`;
        let statusColor = "black";
        if (itemStatus === "Available") statusColor = "blue";
        else if (itemStatus === "Memo") statusColor = "orange";
        else if (itemStatus === "Invoice") statusColor = "purple";
        newRow.innerHTML = `
            <td>${table.rows.length}</td>
            <td>${event}</td>
            <td>${tradeShowId}</td>
            <td>${lot}</td>
            <td>${description}</td> 
            <td style="color:${statusColor}; font-weight:bold;">${itemStatus}</td>
            <td>${warehouseOut}</td>
            <td>${tradeIn}</td>
            <td>${tradeOut}</td>
            <td>${warehouseIn}</td>
        `;
    }
}
// ===========================================================
// Auto populate Event Name BAsed on the Ststus
// ===========================================================
document.getElementById("scanStatusSelect").addEventListener("change", function () {
    const status = this.value;
    const eventDropdown = document.getElementById("scanEventName");
    // reset dropdown
    eventDropdown.innerHTML = '<option value="">Select Event</option>';
    if (!status) return;
    // filter from All_Trade_Show_Masters data
    const filtered = allEventData.filter(e => e.Event_Status === status);
    filtered.forEach(record => {
        const option = document.createElement("option");
        option.value = record.Trade_Show_Name;
        option.textContent = record.Trade_Show_Name;
        eventDropdown.appendChild(option);
    });
});

function fetchScanLogs() {
    const eventName = document.getElementById("scanEventName").value;
    if (!eventName) {
        showCustomAlert("Please select an Event Name first.");
        return;
    }
    const config = {
        app_name: "feiny-app",
        report_name: "All_Scan_Logs",
        criteria: `(Event_Name == "${eventName}")`
    };
    ZOHO.CREATOR.DATA.getRecords(config)
        .then(function (response) {
            console.log("Scan Logs:", response);
            const data = response.data || [];
            window.allScanLogData = data;
            window.scanLogCurrentPage = 1;
            if (data.length === 0) {
                renderScanLogTable(1);
                showCustomAlert("No scan logs found for this event.");
                return;
            }
            renderScanLogTable(1);
            showCustomAlert(`✅ Loaded ${data.length} scan logs`);
        })
        .catch(function (error) {
            console.log("Error fetching scan logs:", error);
            window.allScanLogData = [];
            renderScanLogTable(1);
            showCustomAlert("❌ No scan logs found for this event");
        });
}
function changeScanLogPage(newPage) {
    const totalPages = Math.ceil((window.allScanLogData || []).length / window.scanLogRowsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    renderScanLogTable(newPage);
}
function renderScanLogTable(page) {
    const tbody = document.getElementById("scanLogBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const data = window.allScanLogData || [];
    if (data.length === 0) {
        renderPaginationControls("scanLogPagination", 1, 0, "changeScanLogPage");
        return;
    }
    const totalPages = Math.ceil(data.length / window.scanLogRowsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    window.scanLogCurrentPage = currentPage;
    const startIdx = (currentPage - 1) * window.scanLogRowsPerPage;
    const endIdx = Math.min(startIdx + window.scanLogRowsPerPage, data.length);
    const pageRecords = data.slice(startIdx, endIdx);
    pageRecords.forEach((record, sliceIdx) => {
        const globalIdx = startIdx + sliceIdx;
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${globalIdx + 1}</td>
            <td>${record.Event_Name || record.Event || ""}</td>
            <td>${record.Trade_Show_ID || ""}</td>
            <td>${record.Lot || ""}</td>
            <td>${record.Description || ""}</td>
            <td style="font-weight:bold;">${record.Item_Status || ""}</td>
            <td style="color:red; font-weight:bold;">
                ${record.Warehouse_Out || ""}
            </td>
            <td style="color:green; font-weight:bold;">
                ${record.Trade_Show_In || ""}
            </td>
            <td style="color:red; font-weight:bold;">
                ${record.Trade_Show_Out || ""}
            </td>
            <td style="color:green; font-weight:bold;">
                ${record.Warehouse_In || ""}
            </td>
        `;
    });
    renderPaginationControls("scanLogPagination", currentPage, totalPages, "changeScanLogPage");
}
