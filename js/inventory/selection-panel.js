// ============================================================================
// inventory/selection-panel.js
// Selections: the panel above the trade show list (customer, visit date, comment,
// Save / Finalize / New). Also resets everything when the event or status changes.
//
// Defines : onInventoryEventLoaded, resetSelectionState, newSelection
// Uses    : (defined in other files)
//   inventory/selection-service.js  ->  currentSelection, eventSelections, customerList,
//        loadCustomers, loadEventSelections, saveSelection, finalizeSelection, loadSelection
//   inventory/inventory-model.js  ->  showConfirmDialog, escHtml
//   inventory/inventory-table.js  ->  renderInventoryTable, fetchEventItems
//   core/ui-feedback.js  ->  showCustomAlert
// ============================================================================

let selCustomerChoices = null;

function selEl(id) { return document.getElementById(id); }

function readSelectionHeader() {
    return {
        customerId: selEl("selCustomer").value,
        visitDate: selEl("selVisitDate").value,
        comment: selEl("selComment").value.trim()
    };
}

function fillCustomerDropdown() {
    const sel = selEl("selCustomer");
    if (!sel) return;
    if (selCustomerChoices) selCustomerChoices.destroy();
    sel.innerHTML = '<option value="">Select Customer</option>' +
        window.customerList.map(c => `<option value="${escHtml(c.id)}">${escHtml(c.name)}</option>`).join("");
    selCustomerChoices = new Choices(sel, { searchEnabled: true, shouldSort: false, removeItemButton: true });
}

function fillExistingSelections() {
    const sel = selEl("selExisting");
    if (!sel) return;
    const current = window.currentSelection && window.currentSelection.id;
    sel.innerHTML = '<option value="">New selection</option>' + window.eventSelections.map(s =>
        `<option value="${escHtml(s.id)}">${escHtml(s.customerName)} - ${escHtml(s.visitDate)} (${escHtml(s.status)})</option>`).join("");
    sel.value = current || "";
}

// Mirrors window.currentSelection into the panel inputs and locks them when finalized.
function syncPanel() {
    const s = window.currentSelection;
    const finalized = !!(s && s.status === "Finalized");
    if (s) {
        if (selCustomerChoices) selCustomerChoices.setChoiceByValue(String(s.customerId));
        selEl("selVisitDate").value = s.visitDate || "";
        selEl("selComment").value = s.comment || "";
    }
    ["selVisitDate", "selComment", "btnSaveSelection", "btnFinalizeSelection"].forEach(id => { selEl(id).disabled = finalized; });
    if (selCustomerChoices) { finalized ? selCustomerChoices.disable() : selCustomerChoices.enable(); }
    const badge = selEl("selStatusBadge");
    badge.textContent = s ? s.status : "New";
    badge.className = "sel-badge " + (finalized ? "sel-final" : "sel-open");
    fillExistingSelections();
}

function resetSelectionState() {
    window.currentSelection = null;
    window.eventSelections = [];
    if (!selEl("selectionPanel")) return;
    selEl("selVisitDate").value = "";
    selEl("selComment").value = "";
    if (selCustomerChoices) { selCustomerChoices.removeActiveItems(); selCustomerChoices.enable(); }
    selEl("selectionPanel").classList.add("hidden");
    syncPanel();
}

// Called by fetchEventItems() once the list for the event is on screen.
function onInventoryEventLoaded(eventName) {
    resetSelectionState();
    if (!eventName || !selEl("selectionPanel")) return;
    selEl("selectionPanel").classList.remove("hidden");
    const ready = window.customerList.length ? Promise.resolve() : loadCustomers().then(fillCustomerDropdown);
    ready.then(() => loadEventSelections(eventName)).then(syncPanel);
}

// Clears the current customer / visit / comment and reloads the saved event list.
function newSelection() {
    const go = function () { fetchEventItems(); };
    const hasEdits = (window.allInventoryData || []).some(r => r._dirty || r._checked);
    if (hasEdits) showConfirmDialog("Start a new selection? Unsaved ticks and edits will be discarded.", go);
    else go();
}

document.addEventListener("DOMContentLoaded", function () {
    if (!selEl("selectionPanel")) return;
    selEl("btnSaveSelection").addEventListener("click", function () { saveSelection(readSelectionHeader()).then(syncPanel); });
    selEl("btnFinalizeSelection").addEventListener("click", function () {
        showConfirmDialog("Finalize this selection? It cannot be edited afterwards.", function () {
            finalizeSelection(readSelectionHeader()).then(syncPanel);
        });
    });
    selEl("btnNewSelection").addEventListener("click", newSelection);
    selEl("selExisting").addEventListener("change", function () {
        if (!this.value) { newSelection(); return; }
        loadSelection(this.value).then(syncPanel);
    });
    // Leaving the event / changing status closes the panel
    const statusSelect = selEl("statusSelect"), eventSelect = selEl("eventName");
    if (statusSelect) statusSelect.addEventListener("change", resetSelectionState);
    if (eventSelect) {
        eventSelect.addEventListener("removeItem", resetSelectionState);
        eventSelect.addEventListener("change", function () { if (!this.value) resetSelectionState(); });
    }
});
