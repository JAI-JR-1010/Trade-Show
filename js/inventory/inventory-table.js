// ============================================================================
// inventory/inventory-table.js
// Inventory: items table (fetch, grouped render, inline-edit cells, row checkboxes).
//
// Defines : fetchEventItems, changeInventoryPage, toggleInventoryCheckbox, renderInventoryTable,
//           toggleInventoryGroup, refreshInventoryTotals
// Uses    : (defined in other files)
//   core/pagination.js  ->  renderPaginationControls
//   core/ui-feedback.js  ->  showCustomAlert
//   inventory/inventory-grouping.js  ->  buildInventoryGroups
//   inventory/inventory-model.js  ->  escHtml, isInventoryListEditable, enrichInventoryRecord
//   inventory/inventory-edit.js  ->  onInlineEdit, removeInventoryItem
//   inventory/sku-details.js  ->  openSkuDetails
//   inventory/selection-panel.js  ->  onInventoryEventLoaded
// ============================================================================

window.inventoryCurrentPage = 1;
window.inventoryRowsPerPage = 10;       // kept for compatibility; the grouped list is not paginated
window.allInventoryData = [];
window.removedInventoryItems = [];
window.inventoryCollapsed = {};
window.inventoryGroups = [];

const INVENTORY_COLSPAN = 20;

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
            const lotLoad = typeof loadLotMaster === "function" ? loadLotMaster() : Promise.resolve();
            return Promise.resolve(lotLoad).then(function () {
                data.forEach(enrichInventoryRecord);
                window.allInventoryData = data;
                window.removedInventoryItems = [];
                window.inventoryCurrentPage = 1;
                renderInventoryTable(1);
                if (typeof onInventoryEventLoaded === "function") onInventoryEventLoaded(eventName);
                if (data.length === 0) {
                    showCustomAlert("No items found for the selected event.");
                    return;
                }
                showCustomAlert(`✅ Loaded ${data.length} items successfully.`);
            });
        })
        .catch(function (error) {
            console.log("Error fetching event items:", error);
            window.allInventoryData = [];
            window.removedInventoryItems = [];
            renderInventoryTable(1);
            if (typeof onInventoryEventLoaded === "function") onInventoryEventLoaded(eventName);
            showCustomAlert("❌ No items found for this event.");
        });
}
// The grouped list is not paginated any more. Kept so old callers do not break.
function changeInventoryPage() { renderInventoryTable(1); }

function toggleInventoryCheckbox(globalIndex, checked) {
    if (window.allInventoryData && window.allInventoryData[globalIndex]) {
        window.allInventoryData[globalIndex]._checked = checked;
    }
}
function toggleInventoryGroup(groupId) {
    window.inventoryCollapsed[groupId] = !window.inventoryCollapsed[groupId];
    renderInventoryTable(1);
}

function fmtWeight(n) { return n ? Number(n).toFixed(2) : "0.00"; }
function fmtMoney(n) { return n ? Number(n).toFixed(2) : "0.00"; }

function groupHeaderHtml(g, level) {
    const collapsed = !!window.inventoryCollapsed[g.id];
    const arrow = collapsed ? "▶" : "▼";
    return `<tr class="inv-group-row inv-group-l${level}" data-gid="${g.id}">
        <td colspan="20" class="inv-group-label" onclick="toggleInventoryGroup('${g.id}')">${arrow} ${escHtml(g.name)}
            <span class="inv-group-count">(${g.rows.length} item${g.rows.length === 1 ? "" : "s"})</span></td>
    </tr>`;
}

function groupTotalHtml(g) {
    return `<tr class="inv-group-total-row">
        <td colspan="6" class="inv-group-total-label">${escHtml(g.name)} Total</td>
        <td data-sum="${g.id}" data-metric="pcs">${g.sums.pcs}</td>
        <td data-sum="${g.id}" data-metric="weight">${fmtWeight(g.sums.weight)}</td>
        <td data-sum="${g.id}" data-metric="cost">${fmtMoney(g.sums.cost)}</td>
        <td data-sum="${g.id}" data-metric="price">${fmtMoney(g.sums.price)}</td>
        <td data-sum="${g.id}" data-metric="total">${fmtMoney(g.sums.total)}</td>
        <td colspan="9"></td>
    </tr>`;
}

function inputCell(idx, field, value, type, editable) {
    if (!editable) return escHtml(value);
    const extra = type === "number" ? ' step="any" min="0"' : "";
    return `<input class="inv-inline-input inv-in-${field}" type="${type}"${extra} value="${escHtml(value)}"
        onchange="onInlineEdit(${idx}, '${field}', this.value)">`;
}

function itemRowHtml(idx, sr, editable) {
    const record = window.allInventoryData[idx];
    const scanCount = record._scanCount || (record.Log_Status === "Check-In" ? 2 : 1);
    const logStatusColor = (record.Log_Status === "Check-Out" || record.Log_Status === "Check Out") ? "red" : "green";
    const isChecked = record._checked ? "checked" : "";
    const removeBtn = editable
        ? `<button class="inv-row-btn inv-row-remove" title="Remove from list" onclick="removeInventoryItem(${idx})">✕</button>` : "";
    const customerVisitCount = (record._customerVisitDrafts || []).length;
    return `<tr class="inv-item-row${record._dirty ? " inv-dirty" : ""}" data-scan-count="${scanCount}" data-idx="${idx}">
        <td><input type="checkbox" class="rowCheckbox" ${isChecked} onchange="toggleInventoryCheckbox(${idx}, this.checked)"></td>
        <td>${sr}</td>
        <td>${escHtml(record.Event)}</td>
        <td>${escHtml(record.Trade_Show_ID)}</td>
        <td>${escHtml(record.Lot)}</td>
        <td>${inputCell(idx, "Description", record.Description || "", "text", editable)}</td>
        <td>${inputCell(idx, "Pcs", record.Pcs || "", "number", editable)}</td>
        <td>${inputCell(idx, "Weight", record.Weight || "", "number", editable)}</td>
        <td>${inputCell(idx, "Cost", record.Cost || "", "number", editable)}</td>
        <td>${inputCell(idx, "Price", record.Price || "", "number", editable)}</td>
        <td id="tot-${idx}">${inputCell(idx, "Total", record.Total || "", "number", editable)}</td>
        <td>${inputCell(idx, "COO", record.COO || "", "text", editable)}</td>
        <td>${inputCell(idx, "Treat", record.Treat || "", "text", editable)}</td>
        <td>${inputCell(idx, "Cert_1", record.Cert_1 || "", "text", editable)}</td>
        <td>${inputCell(idx, "Cert_2", record.Cert_2 || "", "text", editable)}</td>
        <td>${inputCell(idx, "Cert_3", record.Cert_3 || "", "text", editable)}</td>
        <td>${inputCell(idx, "Item_Status", record.Item_Status || "", "text", editable)}</td>
        <td class="log-status" style="color: ${logStatusColor}; font-weight: bold;">${escHtml(record.Log_Status)}</td>
        <td class="inv-actions"><button class="inv-row-btn" title="Notes, images, documents" onclick="openSkuDetails(${idx})">📝</button>${removeBtn}</td>
        <td><button class="inv-customer-action" onclick="openCustomerAction(${idx})">Customer Action${customerVisitCount ? ` (${customerVisitCount})` : ""}</button></td>
    </tr>`;
}

function renderInventoryTable(page) {
    const tbody = document.getElementById("tableBody");
    if (!tbody) return;
    const data = window.allInventoryData || [];
    renderPaginationControls("inventoryPagination", 1, 0, "changeInventoryPage"); // clears old buttons
    if (data.length === 0) {
        tbody.innerHTML = "";
        window.inventoryGroups = [];
        return;
    }
    const editable = isInventoryListEditable();
    const groups = buildInventoryGroups(data);
    window.inventoryGroups = groups;
    let html = "";
    let sr = 0;
    const rowsHtml = (rows) => rows.map(i => itemRowHtml(i, ++sr, editable)).join("");
    groups.forEach(g => {
        html += groupHeaderHtml(g, 1);
        if (window.inventoryCollapsed[g.id]) { sr += g.rows.length; return; }
        if (g.subgroups.length) {
            g.subgroups.forEach(s => {
                html += groupHeaderHtml(s, 2);
                if (window.inventoryCollapsed[s.id]) { sr += s.rows.length; return; }
                html += rowsHtml(s.rows);
            });
        } else {
            html += rowsHtml(g.rows);
        }
        html += groupTotalHtml(g);
    });
    tbody.innerHTML = html;
}

// Updates one row's Total and every group header sum WITHOUT re-rendering (keeps input focus).
function refreshInventoryTotals(changedIdx) {
    const data = window.allInventoryData || [];
    if (changedIdx !== undefined && data[changedIdx]) {
        const cell = document.getElementById("tot-" + changedIdx);
        if (cell) {
            const totalInput = cell.querySelector("input");
            if (totalInput) totalInput.value = data[changedIdx].Total === "" ? "" : data[changedIdx].Total;
            else cell.textContent = data[changedIdx].Total === "" ? "" : data[changedIdx].Total;
        }
        const row = cell && cell.parentElement;
        if (row) row.classList.add("inv-dirty");
    }
    const groups = buildInventoryGroups(data);
    window.inventoryGroups = groups;
    const setSum = (g) => {
        const q = (m) => document.querySelector(`[data-sum="${g.id}"][data-metric="${m}"]`);
        if (q("pcs")) q("pcs").textContent = g.sums.pcs;
        if (q("weight")) q("weight").textContent = fmtWeight(g.sums.weight);
        if (q("cost")) q("cost").textContent = fmtMoney(g.sums.cost);
        if (q("price")) q("price").textContent = fmtMoney(g.sums.price);
        if (q("total")) q("total").textContent = fmtMoney(g.sums.total);
    };
    groups.forEach(g => { setSum(g); g.subgroups.forEach(setSum); });
}
