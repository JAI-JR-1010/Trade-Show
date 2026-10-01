// ============================================================================
// intertransfer-log/intertransfer-log.js
// InterTracking Movement Log tab: event filter, fetch, render, pagination.
//
// Defines : fetchInterTransferLog, changeInterTransferLogPage, renderInterTransferLogTable
// Uses    : (defined in other files)
//   core/pagination.js  ->  renderPaginationControls
//   core/ui-feedback.js  ->  showCustomAlert
//   inventory/event-selector.js  ->  allEventData
// ============================================================================

window.interTransferLogCurrentPage = 1;
window.interTransferLogRowsPerPage = 10;
window.allInterTransferLogData = [];

document.getElementById("logStatusSelect").addEventListener("change", function () {
    const status = this.value;
    const eventDropdown = document.getElementById("logEventName");
    eventDropdown.innerHTML = '<option value="">Select Event</option>';
    if (!status) return;
    const filtered = allEventData.filter(e => e.Event_Status === status);
    filtered.forEach(record => {
        const option = document.createElement("option");
        option.value = record.Trade_Show_Name;
        option.textContent = record.Trade_Show_Name;
        eventDropdown.appendChild(option);
    });
});

function fetchInterTransferLog() {
    const eventName = document.getElementById("logEventName").value;
    if (!eventName) {
        showCustomAlert("Please select an Event Name first.");
        return;
    }
    const config = {
        app_name: "feiny-app",
        report_name: "All_Intertranfer_Trackings",
        criteria: `(Event_Name == "${eventName}")`
    };
    ZOHO.CREATOR.DATA.getRecords(config)
        .then(function (response) {
            console.log("InterTransfer Log Records:", response);
            const data = response.data || [];
            window.allInterTransferLogData = data;
            window.interTransferLogCurrentPage = 1;
            if (data.length === 0) {
                renderInterTransferLogTable(1);
                showCustomAlert("No InterTracking records found for this event.");
                return;
            }
            renderInterTransferLogTable(1);
            showCustomAlert(`✅ Loaded ${data.length} InterTracking records`);
        })
        .catch(function (error) {
            console.log("Error fetching InterTransfer logs:", error);
            window.allInterTransferLogData = [];
            renderInterTransferLogTable(1);
            showCustomAlert("❌ No InterTracking records found for this event");
        });
}
function changeInterTransferLogPage(newPage) {
    const totalPages = Math.ceil((window.allInterTransferLogData || []).length / window.interTransferLogRowsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    renderInterTransferLogTable(newPage);
}
function renderInterTransferLogTable(page) {
    const tbody = document.getElementById("interTransferLogBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const data = window.allInterTransferLogData || [];
    if (data.length === 0) {
        renderPaginationControls("interTransferLogPagination", 1, 0, "changeInterTransferLogPage");
        return;
    }
    const totalPages = Math.ceil(data.length / window.interTransferLogRowsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    window.interTransferLogCurrentPage = currentPage;
    const startIdx = (currentPage - 1) * window.interTransferLogRowsPerPage;
    const endIdx = Math.min(startIdx + window.interTransferLogRowsPerPage, data.length);
    const pageRecords = data.slice(startIdx, endIdx);
    pageRecords.forEach((record, sliceIdx) => {
        const globalIdx = startIdx + sliceIdx;
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${globalIdx + 1}</td>
            <td>${record.Event_Name || record.Event || ""}</td>
            <td>${record.Trade_Show_ID || ""}</td>
            <td>${record.Lot_Master || record.Lot || ""}</td>
            <td>${record.Description || ""}</td>
            <td>${record.Lot_Status || ""}</td>
            <td>${record.From_Location || ""}</td>
            <td>${record.To_Location || ""}</td>
            <td>${record.Handover_By || ""}</td>
            <td>${record.Date_field || record.Date || ""}</td>
            <td>${record.Notes || ""}</td>
        `;
    });
    renderPaginationControls("interTransferLogPagination", currentPage, totalPages, "changeInterTransferLogPage");
}
