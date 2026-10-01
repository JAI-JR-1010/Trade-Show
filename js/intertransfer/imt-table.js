// ============================================================================
// intertransfer/imt-table.js
// Inter-Movement Tracking: table render, pagination, select-all.
//
// Defines : changeIMTPage, renderIMTTable, updateSelectAllHeader
// Uses    : (defined in other files)
//   core/date-utils.js  ->  getCurrentDate
//   core/pagination.js  ->  renderPaginationControls
//   intertransfer/imt-bulk-update.js  ->  toggleBulkUpdateButton
//   intertransfer/imt-lot-master.js  ->  getLotMasterLocation
//   intertransfer/imt-user.js  ->  loginUserName, loginuserid
// ============================================================================

function changeIMTPage(newPage) {
    const totalPages = Math.ceil((window.filteredIMTData || []).length / window.imtRowsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    renderIMTTable(newPage);
}
function renderIMTTable(page) {
    const tbody = document.getElementById("itmTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const data = window.filteredIMTData || [];
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="imt-empty-state">
                    No Items Found
                </td>
            </tr>
        `;
        renderPaginationControls("imtPagination", 1, 0, "changeIMTPage");
        toggleBulkUpdateButton();
        return;
    }
    const totalPages = Math.ceil(data.length / window.imtRowsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    window.imtCurrentPage = currentPage;
    const startIdx = (currentPage - 1) * window.imtRowsPerPage;
    const endIdx = Math.min(startIdx + window.imtRowsPerPage, data.length);
    const pageRecords = data.slice(startIdx, endIdx);
    const locationOptions = ["USA", "Dubai", "Jaipur"];
    pageRecords.forEach(record => {
        const lotNo = record.Lot || "";
        const state = window.imtRowStates[lotNo] || {
            lotNo: lotNo,
            description: record.Description || "",
            lotStatus: record.Item_Status || "",
            fromLocation: getLotMasterLocation(lotNo) || "",
            toLocation: "",
            handoverBy: loginUserName || loginuserid || "",
            date: getCurrentDate(),
            notes: "",
            selected: false
        };
        const row = document.createElement("tr");
        const fromOptionsHtml = locationOptions.map(loc => `
                        <option value="${loc}" ${state.fromLocation === loc ? "selected" : ""}>${loc}</option>
                    `).join("");
        const toOptionsHtml = locationOptions.map(loc => `
                        <option value="${loc}" ${state.toLocation === loc ? "selected" : ""}>${loc}</option>
                    `).join("");
        row.innerHTML = `
            <td>
                <input type="checkbox" class="imt-checkbox" ${state.selected ? "checked" : ""}>
            </td>
            <td>${lotNo}</td>
            <td>${record.Description || ""}</td>
            <td>${record.Item_Status || ""}</td>
            <td>
                <select class="imt-fromloc">
                    <option value="">Select From</option>
                    ${fromOptionsHtml}
                </select>
            </td>
            <td>
                <select class="imt-toloc">
                    <option value="">Select To</option>
                    ${toOptionsHtml}
                </select>
            </td>
            <td>
                <input type="text" class="imt-handover" value="${state.handoverBy || loginUserName || loginuserid}" readonly>
            </td>
            <td>
                <input type="date" class="imt-date" value="${state.date || getCurrentDate()}">
            </td>
            <td>
                <textarea class="imt-notes" placeholder="Notes">${state.notes || ""}</textarea>
            </td>
        `;
        const cb = row.querySelector(".imt-checkbox");
        cb.onchange = (e) => {
            state.selected = e.target.checked;
            toggleBulkUpdateButton();
            updateSelectAllHeader();
        };
        const fromLoc = row.querySelector(".imt-fromloc");
        fromLoc.onchange = (e) => { state.fromLocation = e.target.value; };
        const toLoc = row.querySelector(".imt-toloc");
        toLoc.onchange = (e) => { state.toLocation = e.target.value; };
        const handover = row.querySelector(".imt-handover");
        handover.oninput = (e) => { state.handoverBy = e.target.value; };
        const dateEl = row.querySelector(".imt-date");
        dateEl.onchange = (e) => { state.date = e.target.value; };
        const notesEl = row.querySelector(".imt-notes");
        notesEl.oninput = (e) => { state.notes = e.target.value; };
        tbody.appendChild(row);
    });
    updateSelectAllHeader();
    toggleBulkUpdateButton();
    renderPaginationControls("imtPagination", currentPage, totalPages, "changeIMTPage");
}
function updateSelectAllHeader() {
    const selectAll = document.getElementById("imtSelectAll");
    if (!selectAll) return;
    const currentData = window.filteredIMTData || [];
    if (currentData.length === 0) {
        selectAll.checked = false;
        return;
    }
    const allSelected = currentData.every(r => window.imtRowStates[r.Lot] && window.imtRowStates[r.Lot].selected);
    selectAll.checked = allSelected;
}
// Select all checkbox
document.addEventListener("change", function (e) {
    if (e.target.id === "imtSelectAll") {
        const checked = e.target.checked;
        (window.filteredIMTData || []).forEach(record => {
            const lotNo = record.Lot || "";
            if (window.imtRowStates[lotNo]) {
                window.imtRowStates[lotNo].selected = checked;
            }
        });
        renderIMTTable(window.imtCurrentPage);
    }
});
