// ============================================================================
// inventory/selection-service.js
// Selections: a selection = one customer + one visit (date) for one event.
// Saves the CHECKED rows of the trade show list (with their edited Pcs / Weight / Price /
// Description) as Selection_Items. Comment is stored once on the Selection, not per SKU.
//
// Defines : currentSelection (window), eventSelections (window), customerList (window),
//           toCreatorDate, fromCreatorDate, loadCustomers, loadEventSelections,
//           saveSelection, loadSelection, finalizeSelection
// Uses    : (defined in other files)
//   inventory/inventory-config.js  ->  INV_CFG
//   inventory/inventory-model.js  ->  creatorGet, creatorAdd, creatorUpdate, creatorDelete,
//                                      extractCreatorId, enrichInventoryRecord, firstField
//   inventory/inventory-table.js  ->  renderInventoryTable
//   core/ui-feedback.js  ->  showCustomAlert, showSavingPopup, hideSavingPopup
//   core/common-utils.js  ->  getLookupDisplay
// ============================================================================

window.currentSelection = null;   // { id, customerId, customerName, visitDate(yyyy-mm-dd), comment, status }
window.eventSelections = [];
window.customerList = [];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function toCreatorDate(iso) {            // 2026-10-05 -> 05-Oct-2026
    if (!iso) return "";
    const p = iso.split("-");
    return `${p[2]}-${MONTHS[parseInt(p[1], 10) - 1]}-${p[0]}`;
}
function fromCreatorDate(str) {          // 05-Oct-2026 -> 2026-10-05
    if (!str) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const p = String(str).split("-");
    const m = MONTHS.indexOf(p[1]) + 1;
    return m ? `${p[2]}-${String(m).padStart(2, "0")}-${p[0]}` : "";
}

function loadCustomers() {
    return creatorGet(INV_CFG.customerReport).then(function (rows) {
        window.customerList = rows.map(r => ({ id: r.ID, name: firstField(r, INV_CFG.customerNameFields) }))
            .filter(c => c.name).sort((a, b) => a.name.localeCompare(b.name));
        return window.customerList;
    });
}

function parseSelectionRecord(r) {
    const cust = r.Customer;
    return {
        id: r.ID,
        customerId: (cust && typeof cust === "object") ? cust.ID : cust,
        customerName: getLookupDisplay(cust),
        visitDate: fromCreatorDate(r.Visit_Date),
        comment: r.Comment || "",
        status: r.Status || "Open"
    };
}

function loadEventSelections(eventName) {
    return creatorGet(INV_CFG.selectionReport, `(Event == "${eventName}")`).then(function (rows) {
        window.eventSelections = rows.map(parseSelectionRecord)
            .sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""));
        return window.eventSelections;
    });
}

function checkedIndexes() {
    const out = [];
    (window.allInventoryData || []).forEach((r, i) => { if (r._checked) out.push(i); });
    return out;
}

// ---------------- Save ----------------
// header = { customerId, visitDate, comment }
async function saveSelection(header) {
    const sel = window.currentSelection;
    if (sel && sel.status === "Finalized") {
        showCustomAlert("This selection is finalized and cannot be changed.");
        return null;
    }
    const idxs = checkedIndexes();
    if (!header.customerId) { showCustomAlert("Please choose a customer."); return null; }
    if (!header.visitDate) { showCustomAlert("Please choose the visit date."); return null; }
    if (!idxs.length) { showCustomAlert("Tick at least one item for this selection."); return null; }

    const eventName = document.getElementById("eventName").value;
    const data = window.allInventoryData;
    const tsid = (data[idxs[0]] && data[idxs[0]].Trade_Show_ID) || "";
    showSavingPopup("Saving selection...");
    try {
        // Same customer + same visit date = same selection. A different date = a NEW selection.
        let id = sel && sel.id;
        if (!id) {
            const dup = window.eventSelections.find(s =>
                String(s.customerId) === String(header.customerId) && s.visitDate === header.visitDate);
            if (dup) {
                if (dup.status === "Finalized") {
                    showCustomAlert("A finalized selection already exists for this customer and date.");
                    return null;
                }
                id = dup.id;
            }
        }
        const fields = { Customer: header.customerId, Visit_Date: toCreatorDate(header.visitDate), Comment: header.comment || "" };
        if (id) {
            await creatorUpdate(INV_CFG.selectionReport, id, fields);
        } else {
            const res = await creatorAdd(INV_CFG.selectionForm,
                Object.assign({ Event: eventName, Trade_Show_ID: tsid, Status: "Open" }, fields));
            id = extractCreatorId(res);
            if (!id) throw new Error("Selection was not created. Check the Selection form fields.");
        }

        // Items: update existing, add new, delete the ones no longer ticked
        const existing = await creatorGet(INV_CFG.selectionItemReport, `(Selection == ${id})`);
        const byLot = {};
        existing.forEach(e => { byLot[getLookupDisplay(e.Lot)] = e; });
        const keepLots = {};
        const toAdd = [], jobs = [];
        idxs.forEach(i => {
            const r = data[i];
            keepLots[r.Lot] = true;
            const payload = {
                Description: r.Description || "", Pcs: r.Pcs || "", Weight: r.Weight || "",
                Cost: r.Cost || "", Price: r.Price || "", Total: r.Total || ""
            };
            if (byLot[r.Lot]) jobs.push(creatorUpdate(INV_CFG.selectionItemReport, byLot[r.Lot].ID, payload));
            else toAdd.push(Object.assign({ Selection: id, Event: eventName, Lot: r.Lot }, payload));
        });
        Object.keys(byLot).forEach(lot => {
            if (!keepLots[lot]) jobs.push(creatorDelete(INV_CFG.selectionItemReport, byLot[lot].ID));
        });
        if (toAdd.length) jobs.push(creatorAdd(INV_CFG.selectionItemForm, toAdd));
        await Promise.all(jobs);

        window.currentSelection = Object.assign({}, header, {
            id: id, status: "Open",
            customerName: (window.customerList.find(c => String(c.id) === String(header.customerId)) || {}).name || ""
        });
        await loadEventSelections(eventName);
        showCustomAlert(`✅ Selection saved (${idxs.length} items).`);
        return id;
    } catch (err) {
        console.error("saveSelection failed", err);
        showCustomAlert("❌ Error while saving the selection");
        return null;
    } finally {
        hideSavingPopup();
    }
}

async function finalizeSelection(header) {
    const id = await saveSelection(header);
    if (!id) return false;
    try {
        await creatorUpdate(INV_CFG.selectionReport, id, { Status: "Finalized" });
        window.currentSelection.status = "Finalized";
        await loadEventSelections(document.getElementById("eventName").value);
        renderInventoryTable(1);
        showCustomAlert("✅ Selection finalized.");
        return true;
    } catch (err) {
        console.error("finalizeSelection failed", err);
        showCustomAlert("❌ Could not finalize the selection");
        return false;
    }
}

// ---------------- Load ----------------
async function loadSelection(id) {
    const sel = window.eventSelections.find(s => String(s.id) === String(id));
    if (!sel) return false;
    const eventName = document.getElementById("eventName").value;
    // Start from the saved event list so values of another selection do not leak in
    const fresh = await creatorGet(INV_CFG.inventoryReport, `(Event == "${eventName}")`);
    fresh.forEach(enrichInventoryRecord);
    window.allInventoryData = fresh;
    window.removedInventoryItems = [];
    const items = await creatorGet(INV_CFG.selectionItemReport, `(Selection == ${id})`);
    let missing = 0;
    items.forEach(it => {
        const lot = getLookupDisplay(it.Lot);
        const rec = fresh.find(r => r.Lot === lot);
        if (!rec) { missing++; return; }
        ["Description", "Pcs", "Weight", "Price", "Total"].forEach(f => { if (it[f] !== undefined) rec[f] = it[f]; });
        rec._checked = true;
    });
    window.currentSelection = sel;
    renderInventoryTable(1);
    if (missing) showCustomAlert(`${missing} item(s) in this selection are no longer on the event list.`);
    return true;
}
