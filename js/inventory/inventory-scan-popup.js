// ============================================================================
// inventory/inventory-scan-popup.js
// Inventory: "Scan Item" popup (open/close) and addItem with 10-minute scan rule.
//
// Defines : openPopup, closePopup, getExistingInventoryRecordTimestamp, addItem
// Uses    : (defined in other files)
//   core/ui-feedback.js  ->  showCustomAlert
//   inventory/event-selector.js  ->  allEventData
//   inventory/inventory-table.js  ->  renderInventoryTable
//   inventory/lot-master.js  ->  loadLotMaster
//   scan-log/scan-log-service.js  ->  getExistingScanCount, getLastScanTimestamp
//   scan-log/scan-log-table.js  ->  updateScanLog
// ============================================================================

// popup event name in Inventory form
function openPopup() {
    const eventNameInput = document.getElementById("eventName");
    if (!eventNameInput || !eventNameInput.value || eventNameInput.value.trim() === "") {
        showCustomAlert("Please select an Event Name before scanning an item.");
        return; // Stop execution
    }
    const selectedEvent = eventNameInput.value;
    let tsid = "";
    if (typeof allEventData !== "undefined") {
        const eventRecord = allEventData.find(e => e.Trade_Show_Name === selectedEvent);
        if (eventRecord && eventRecord.Trade_Show_ID) {
            tsid = eventRecord.Trade_Show_ID;
        }
    }
    document.getElementById("popupForm").style.display = "flex";
    if (document.getElementById("eventformname")) {
        document.getElementById("eventformname").value = selectedEvent;
    }
    if (document.getElementById("Trade_Show_ID")) {
        document.getElementById("Trade_Show_ID").value = tsid;
    }
    console.log("Event Name:", selectedEvent);
    console.log("Trade Show ID:", tsid);
    loadLotMaster();
}
document.getElementById("popupForm").addEventListener("click", function (e) {
    if (e.target === this) closePopup();
});
function closePopup() {
    document.getElementById('eventformname').value = "";
    document.getElementById('Trade_Show_ID').value = "";
    document.getElementById('lot').value = "";
    document.getElementById('description').value = "";
    document.getElementById('pcs').value = "";
    document.getElementById('weight').value = "";
    document.getElementById('cost').value = "";
    document.getElementById('price').value = "";
    document.getElementById('total').value = "";
    document.getElementById('coo').value = "";
    document.getElementById('treat').value = "";
    document.getElementById('cert1').value = "";
    document.getElementById('cert2').value = "";
    document.getElementById('cert3').value = "";
    document.getElementById('itemstatus').value = "";
    document.getElementById("popupForm").style.display = "none";
}

// Helper: get the Created/added timestamp (Date) for an inventory record on the server
function getExistingInventoryRecordTimestamp(eventName, lot) {
    return new Promise(function (resolve, reject) {
        try {
            const config = {
                app_name: "feiny-app",
                report_name: "All_Inventory_Items",
                criteria: `(Event == "${eventName}" && Lot == "${lot}")`
            };
            ZOHO.CREATOR.DATA.getRecords(config).then(function (response) {
                if (!response || !response.data || response.data.length === 0) {
                    resolve(null);
                    return;
                }
                const rec = response.data[0];
                const candidates = [rec.Created_Time, rec.created_time, rec.Date_field, rec.Date, rec.date];
                let parsed = null;
                for (let i = 0; i < candidates.length; i++) {
                    const v = candidates[i];
                    if (!v) continue;
                    const p = Date.parse(v);
                    if (!isNaN(p)) { parsed = new Date(p); break; }
                }
                resolve(parsed);
            }).catch(function (err) {
                reject(err);
            });
        } catch (ex) {
            reject(ex);
        }
    });
}

// ==============================
// Inventory Table
// ==============================
function addItem() {
    const event = document.getElementById("eventformname").value;
    const tradeShowId = document.getElementById("Trade_Show_ID").value;
    const lot = document.getElementById("lot").value;
    if (!lot || lot === "Select Lot" || lot.trim() === "") {
        showCustomAlert("No Lot is selected. Please select a Lot before saving.");
        return;
    }

    // Enforce 10-minute restriction before saving:
    // - if the item was scanned within 10 minutes, block
    // - if the item was added/saved to inventory within 10 minutes (local or server), block
    // First check local last-scan timestamp to avoid race with server
    if (window.allInventoryData && Array.isArray(window.allInventoryData)) {
        const localRec = window.allInventoryData.find(r => r.Event === event && r.Lot === lot);
        if (localRec && localRec._lastScanAt) {
            const now = Date.now();
            const tenMin = 10 * 60 * 1000;
            if (now - localRec._lastScanAt < tenMin) {
                const remain = Math.ceil((tenMin - (now - localRec._lastScanAt)) / 60000);
                showCustomAlert(`This item was scanned recently. Try again in ${remain} minute(s).`);
                return;
            }
        }
    }

    Promise.all([getLastScanTimestamp(event, lot), getExistingInventoryRecordTimestamp(event, lot)]).then(function (results) {
        const lastDate = results[0];
        const serverInvDate = results[1];
        const tenMin = 10 * 60 * 1000;
        const now = Date.now();

        // Check local added timestamp (same session double-save)
        let localAddedAt = null;
        if (window.allInventoryData && Array.isArray(window.allInventoryData)) {
            const localRec = window.allInventoryData.find(r => r.Event === event && r.Lot === lot);
            if (localRec && localRec._addedAt) localAddedAt = localRec._addedAt;
        }

        // If any timestamp is within the cooldown, block save
        if (lastDate && (now - lastDate.getTime() < tenMin)) {
            const remain = Math.ceil((tenMin - (now - lastDate.getTime())) / 60000);
            showCustomAlert(`This item was scanned recently. Try again in ${remain} minute(s).`);
            return;
        }
        if (serverInvDate && (now - serverInvDate.getTime() < tenMin)) {
            const remain = Math.ceil((tenMin - (now - serverInvDate.getTime())) / 60000);
            showCustomAlert(`This item was added recently on server. Try again in ${remain} minute(s).`);
            return;
        }
        if (localAddedAt && (now - localAddedAt < tenMin)) {
            const remain = Math.ceil((tenMin - (now - localAddedAt)) / 60000);
            showCustomAlert(`This item was saved recently. Try again in ${remain} minute(s).`);
            return;
        }

        // proceed with original add logic
        const description = document.getElementById("description").value;
        const pcs = document.getElementById("pcs").value;
        const weight = document.getElementById("weight").value;
        const cost = document.getElementById("cost").value;
        const price = document.getElementById("price").value;
        const total = document.getElementById("total").value;
        const coo = document.getElementById("coo").value;
        const treat = document.getElementById("treat").value;
        console.log(treat);
        const cert1 = document.getElementById("cert1").value;
        const cert2 = document.getElementById("cert2").value;
        const cert3 = document.getElementById("cert3").value;
        const status = document.getElementById("itemstatus").value;
        const eventStatus = document.getElementById("statusSelect").value;
        if (!window.allInventoryData) window.allInventoryData = [];
        let existingRecord = window.allInventoryData.find(r => r.Event === event && r.Lot === lot);
        if (existingRecord) {
            // Determine the correct next scan count by consulting the server-side scan log
            getExistingScanCount(event, lot).then(function (serverCount) {
                let currentScanCount = (typeof existingRecord._scanCount === 'number') ? existingRecord._scanCount : (serverCount || 0);
                if (serverCount > currentScanCount) currentScanCount = serverCount;
                currentScanCount = currentScanCount + 1;
                existingRecord._scanCount = currentScanCount;
                existingRecord._scanUpdated = true;
                existingRecord._lastScanAt = Date.now();
                const logStatus = (currentScanCount % 2 !== 0) ? "Check-Out" : "Check-In";
                existingRecord.Log_Status = logStatus;
                updateScanLog(event, tradeShowId, lot, description, status, currentScanCount);
                renderInventoryTable(window.inventoryCurrentPage);
                showCustomAlert(`Status updated for Lot ${lot} (${logStatus})`);
            }).catch(function (err) {
                console.log('Error fetching existing scan count, falling back:', err);
                let currentScanCount = existingRecord._scanCount || (existingRecord.Log_Status === "Check-In" ? 2 : 1);
                currentScanCount++;
                existingRecord._scanCount = currentScanCount;
                existingRecord._scanUpdated = true;
                existingRecord._lastScanAt = Date.now();
                const logStatus = (currentScanCount % 2 !== 0) ? "Check-Out" : "Check-In";
                existingRecord.Log_Status = logStatus;
                updateScanLog(event, tradeShowId, lot, description, status, currentScanCount);
                renderInventoryTable(window.inventoryCurrentPage);
                showCustomAlert(`Status updated for Lot ${lot} (${logStatus})`);
            });
        } else {
            if (eventStatus === "Active" || eventStatus === "Closed") {
                showCustomAlert("Cannot add new items when Event Status is " + eventStatus + ".");
                return;
            }
            const logStatus = "Check-Out";
            const newRecord = {
                Event: event,
                Trade_Show_ID: tradeShowId,
                Lot: lot,
                Description: description,
                Pcs: pcs,
                Weight: weight,
                Cost: cost,
                Price: price,
                Total: total,
                COO: coo,
                Treat: treat,
                Cert_1: cert1,
                Cert_2: cert2,
                Cert_3: cert3,
                Item_Status: status,
                Log_Status: logStatus,
                _scanCount: 1,
                _scanUpdated: true,
                _checked: false,
                _addedAt: Date.now(),
                _lastScanAt: Date.now()
            };
            enrichInventoryRecord(newRecord);
            window.allInventoryData.push(newRecord);
            updateScanLog(event, tradeShowId, lot, description, status, 1);
            const newPage = Math.ceil(window.allInventoryData.length / window.inventoryRowsPerPage);
            renderInventoryTable(newPage);
        }

        // Clear form except the read-only event name
        document.querySelectorAll("#popupForm input:not(#eventformname, #Trade_Show_ID)").forEach(input => input.value = "");
        // Close popup
        closePopup();

    }).catch(function (err) {
        // If check fails, allow action but log error
        console.log('Error checking last scan timestamp:', err);
        // fallback: proceed as normal without restriction
        // (call addItem again without the timestamp guard could loop; instead duplicate minimal proceed)
        const description = document.getElementById("description").value;
        const pcs = document.getElementById("pcs").value;
        const weight = document.getElementById("weight").value;
        const cost = document.getElementById("cost").value;
        const price = document.getElementById("price").value;
        const total = document.getElementById("total").value;
        const coo = document.getElementById("coo").value;
        const treat = document.getElementById("treat").value;
        const cert1 = document.getElementById("cert1").value;
        const cert2 = document.getElementById("cert2").value;
        const cert3 = document.getElementById("cert3").value;
        const status = document.getElementById("itemstatus").value;
        const eventStatus = document.getElementById("statusSelect").value;
        if (!window.allInventoryData) window.allInventoryData = [];
        let existingRecord = window.allInventoryData.find(r => r.Event === event && r.Lot === lot);
        if (existingRecord) {
            let currentScanCount = existingRecord._scanCount || (existingRecord.Log_Status === "Check-In" ? 2 : 1);
            currentScanCount++;
            existingRecord._scanCount = currentScanCount;
            existingRecord._scanUpdated = true;
            const logStatus = (currentScanCount % 2 !== 0) ? "Check-Out" : "Check-In";
            existingRecord.Log_Status = logStatus;
            updateScanLog(event, tradeShowId, lot, description, status, currentScanCount);
            renderInventoryTable(window.inventoryCurrentPage);
            showCustomAlert(`Status updated for Lot ${lot} (${logStatus})`);
        } else {
            if (eventStatus === "Active" || eventStatus === "Closed") {
                showCustomAlert("Cannot add new items when Event Status is " + eventStatus + ".");
                return;
            }
            const logStatus = "Check-Out";
            const newRecord = {
                Event: event,
                Trade_Show_ID: tradeShowId,
                Lot: lot,
                Description: description,
                Pcs: pcs,
                Weight: weight,
                Cost: cost,
                Price: price,
                Total: total,
                COO: coo,
                Treat: treat,
                Cert_1: cert1,
                Cert_2: cert2,
                Cert_3: cert3,
                Item_Status: status,
                Log_Status: logStatus,
                _scanCount: 1,
                _scanUpdated: true,
                _checked: false,
                _addedAt: Date.now(),
                _lastScanAt: Date.now()
            };
            enrichInventoryRecord(newRecord);
            window.allInventoryData.push(newRecord);
            updateScanLog(event, tradeShowId, lot, description, status, 1);
            const newPage = Math.ceil(window.allInventoryData.length / window.inventoryRowsPerPage);
            renderInventoryTable(newPage);
        }
        document.querySelectorAll("#popupForm input:not(#eventformname, #Trade_Show_ID)").forEach(input => input.value = "");
        closePopup();
    });
}
