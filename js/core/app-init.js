// ============================================================================
// core/app-init.js
// Startup: initial DOMContentLoaded loads (history, TS-ID, planned events, lot master).
//
// Defines : (event listeners / load-time code only)
// Uses    : (defined in other files)
//   inventory/event-selector.js  ->  loadPlannedEvents
//   inventory/lot-master.js  ->  loadLotMaster
//   trade-show/trade-show-form.js  ->  getCurrentTSIDFromServer
//   trade-show/trade-show-history.js  ->  loadEventHistory
// ============================================================================

document.addEventListener("DOMContentLoaded", function () {
    if (typeof ZOHO === "undefined") {
        console.error("ZOHO not loaded");
        return;
    }
    // console.log("Zoho Ready ");
    loadEventHistory();
});

document.addEventListener("DOMContentLoaded", async function () {
    let tsid = await getCurrentTSIDFromServer();
    document.getElementById("tsid").value = tsid;
    loadPlannedEvents();
    loadLotMaster();
});
