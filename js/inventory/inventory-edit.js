// ============================================================================
// inventory/inventory-edit.js
// Inventory: inline editing of item fields and removing items.
//
// Defines : onInlineEdit, removeInventoryItem
// Uses    : (defined in other files)
//   inventory/inventory-model.js  ->  isInventoryListEditable, recalcTotal, showConfirmDialog
//   inventory/inventory-table.js  ->  renderInventoryTable, refreshInventoryTotals
//   core/ui-feedback.js  ->  showCustomAlert
// ============================================================================

const EDITABLE_FIELDS = ["Description", "Pcs", "Weight", "Cost", "Price", "Total", "COO", "Treat", "Cert_1", "Cert_2", "Cert_3", "Item_Status"];
const NUMERIC_FIELDS = ["Pcs", "Weight", "Cost", "Price", "Total"];

function onInlineEdit(idx, field, value) {
    const rec = (window.allInventoryData || [])[idx];
    if (!rec) return;
    if (!isInventoryListEditable() || EDITABLE_FIELDS.indexOf(field) === -1) {
        showCustomAlert("This list can no longer be edited.");
        renderInventoryTable(1);
        return;
    }
    if (NUMERIC_FIELDS.indexOf(field) !== -1) {
        const n = Number(value);
        const bad = value !== "" && (isNaN(n) || n < 0 || (field === "Pcs" && !Number.isInteger(n)));
        if (bad) {
            showCustomAlert(field === "Pcs" ? "Pcs must be a whole number." : field + " must be a positive number.");
            renderInventoryTable(1);
            return;
        }
    }
    rec[field] = value;
    rec._dirty = true;
    if (["Pcs", "Weight", "Price"].indexOf(field) !== -1) recalcTotal(rec);
    refreshInventoryTotals(idx);
}

function removeInventoryItem(idx) {
    const rec = (window.allInventoryData || [])[idx];
    if (!rec) return;
    if (!isInventoryListEditable()) {
        showCustomAlert("Items cannot be removed from this list.");
        return;
    }
    showConfirmDialog(`Remove lot ${rec.Lot} from this list?`, function () {
        // Inside a saved selection, "remove" only drops the item from that selection (Save Selection applies it)
        const inSelection = !!(window.currentSelection && window.currentSelection.id);
        if (rec.ID && !inSelection) window.removedInventoryItems.push({ ID: rec.ID, Lot: rec.Lot, Event: rec.Event });
        window.allInventoryData.splice(idx, 1);
        renderInventoryTable(1);
        showCustomAlert(inSelection ? "Item removed. Click Save Selection to apply."
            : (rec.ID ? "Item removed. Click Save Item to apply." : "Item removed."));
    });
}
