// ============================================================================
// trade-show/trade-show-history.js
// Overview: event history table (load, render, pagination state).
//
// Defines : loadEventHistory, changeOverviewPage, renderEventHistoryTable
// Uses    : (defined in other files)
//   core/pagination.js  ->  renderPaginationControls
// ============================================================================

// Pagination State - Overview (Event History)
window.overviewCurrentPage = 1;
window.overviewRowsPerPage = 10;
window.allEventHistoryData = [];

// ==============================
// LOAD HISTORY
// ==============================
function loadEventHistory() {
    var config = {
        app_name: "feiny-app",
        report_name: "All_Trade_Show_Masters"
    };
    ZOHO.CREATOR.DATA.getRecords(config)
        .then(function (response) {
            console.log("Records:", response);
            window.allEventHistoryData = response.data || [];
            window.overviewCurrentPage = 1;
            renderEventHistoryTable(1);
        })
        .catch(function (error) {
            console.log("Error fetching data:", error);
            window.allEventHistoryData = [];
            renderEventHistoryTable(1);
        });
}
function changeOverviewPage(newPage) {
    const totalPages = Math.ceil((window.allEventHistoryData || []).length / window.overviewRowsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    renderEventHistoryTable(newPage);
}
function renderEventHistoryTable(page) {
    const tbody = document.getElementById("eventHistoryBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const data = window.allEventHistoryData || [];
    if (data.length === 0) {
        renderPaginationControls("overviewPagination", 1, 0, "changeOverviewPage");
        return;
    }
    const totalPages = Math.ceil(data.length / window.overviewRowsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    window.overviewCurrentPage = currentPage;
    const startIdx = (currentPage - 1) * window.overviewRowsPerPage;
    const endIdx = Math.min(startIdx + window.overviewRowsPerPage, data.length);
    const pageRecords = data.slice(startIdx, endIdx);
    function getStatusClass(status) {
        const map = {
            "Planned": "status-upcoming",
            "Active": "status-ongoing",
            "Closed": "status-completed"
        };
        return map[status] || "";
    }
    function formatDisplayDate(dateStr) {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "-";
        const day = String(date.getDate()).padStart(2, '0');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
    }
    pageRecords.forEach(record => {
        let statusClass = getStatusClass(record.Event_Status);
        const row = `          
        <tr onclick="editTradeShow('${record.ID}')" style="cursor: pointer;" class="clickable-row">
            <td>${record.Trade_Show_ID || ""}</td>
            <td>${record.Trade_Show_Name || ""}</td>
            <td>${record.Trade_Show_Location || ""}</td>
            <td>${formatDisplayDate(record.Start_Date)}</td>
            <td>${formatDisplayDate(record.End_Date)}</td>
            <td>${record.Responsible_Team || "-"}</td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${record.Event_Status || ""} 
                </span>
            </td>
        </tr>
        `;
        tbody.innerHTML += row;
    });

    renderPaginationControls("overviewPagination", currentPage, totalPages, "changeOverviewPage");
}
