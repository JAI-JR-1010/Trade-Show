// ============================================================================
// inventory/inventory-model.js
// Inventory: shared helpers for the trade show list (numbers, totals, category/species,
// editable rule) plus thin Creator API wrappers used by selections and SKU details.
//
// Defines : toNum, round2, escHtml, firstField, recalcTotal, enrichInventoryRecord,
//           isInventoryListEditable, extractCreatorId, creatorGet, creatorAdd,
//           creatorUpdate, creatorDelete, showConfirmDialog
// Uses    : (defined in other files)
//   inventory/inventory-config.js  ->  INV_CFG
//   core/common-utils.js  ->  getLookupDisplay
//   inventory/lot-master.js  ->  allLotData
// ============================================================================

function toNum(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}
function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
function escHtml(v) {
    return String(v === undefined || v === null ? "" : v)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
// First non-empty value among candidate field names (handles Zoho lookup objects).
function firstField(record, names) {
    for (let i = 0; i < names.length; i++) {
        const raw = record[names[i]];
        if (raw === undefined || raw === null || raw === "") continue;
        const val = getLookupDisplay(raw);
        if (val !== "" && val !== null && val !== undefined) return val;
    }
    return "";
}

// Total = Price x Weight (if weight > 0) else Price x Pcs.  Cost is never touched.
function recalcTotal(rec) {
    const price = toNum(rec.Price);
    const weight = toNum(rec.Weight);
    const pcs = toNum(rec.Pcs);
    if (!price) { rec.Total = ""; return rec.Total; }
    rec.Total = round2(price * (weight > 0 ? weight : pcs));
    return rec.Total;
}

// Adds Category / Species (from Lot Master) to an inventory record. Safe to call twice.
function enrichInventoryRecord(rec) {
    const lots = (typeof allLotData !== "undefined" && allLotData) ? allLotData : [];
    const itemLot = getLookupDisplay(rec.Lot);
    const lot = lots.find(l => getLookupDisplay(l.In_SKU) === itemLot);
    if (lot) {
        if (!rec.Category_Name) rec.Category_Name = firstField(lot, INV_CFG.categoryFields);
        if (!rec.Species_Name) rec.Species_Name = firstField(lot, INV_CFG.speciesFields);
    }
    if (!rec.Category_Name) rec.Category_Name = firstField(rec, INV_CFG.categoryFields);
    if (!rec.Species_Name) rec.Species_Name = firstField(rec, INV_CFG.speciesFields);
    if ((rec.Total === "" || rec.Total === undefined) && rec.Price) recalcTotal(rec);
    return rec;
}

// Fields can be edited while the event is Planned/Active and the selection is not finalized.
function isInventoryListEditable() {
    const st = document.getElementById("statusSelect");
    const status = st ? st.value : "";
    if (!INV_CFG.editableEventStatuses.includes(status)) return false;
    if (window.currentSelection && window.currentSelection.status === "Finalized") return false;
    return true;
}

// ---------------- Creator API wrappers ----------------
function extractCreatorId(res) {
    if (!res) return "";
    const d = res.data;
    if (Array.isArray(d)) return (d[0] && (d[0].ID || (d[0].data && d[0].data.ID))) || "";
    if (d && d.ID) return d.ID;
    return res.ID || "";
}
function creatorGet(report, criteria) {
    const cfg = { app_name: INV_CFG.app, report_name: report, max_records: 1000 };
    if (criteria) cfg.criteria = criteria;
    return ZOHO.CREATOR.DATA.getRecords(cfg)
        .then(r => r.data || [])
        .catch(() => []);   // Creator rejects with an error when nothing matches
}
function creatorAdd(form, data) {
    return ZOHO.CREATOR.DATA.addRecords({
        app_name: INV_CFG.app, form_name: form, payload: { data: data }
    });
}
function creatorUpdate(report, id, data) {
    return ZOHO.CREATOR.DATA.updateRecordById({
        app_name: INV_CFG.app, report_name: report, id: id, payload: { data: data }
    });
}
function creatorDelete(report, id) {
    return ZOHO.CREATOR.DATA.deleteRecords({
        app_name: INV_CFG.app, report_name: report, criteria: `(ID == ${id})`
    });
}

// Widget iframes may block window.confirm, so use our own dialog.
function showConfirmDialog(message, onYes) {
    const old = document.getElementById("invConfirmOverlay");
    if (old) old.remove();
    const ov = document.createElement("div");
    ov.id = "invConfirmOverlay";
    ov.className = "inv-confirm-overlay";
    ov.innerHTML = `<div class="inv-confirm-box"><p>${escHtml(message)}</p>
        <div class="inv-confirm-actions">
            <button class="btn-save" id="invConfirmYes">Yes</button>
            <button class="btn-cancel" id="invConfirmNo">Cancel</button>
        </div></div>`;
    document.body.appendChild(ov);
    document.getElementById("invConfirmNo").onclick = () => ov.remove();
    document.getElementById("invConfirmYes").onclick = () => { ov.remove(); onYes(); };
}
