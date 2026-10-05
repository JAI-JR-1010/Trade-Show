// ============================================================================
// inventory/inventory-save.js
// Inventory: save/update items to Creator (All_Inventory_Items).
//
// Defines : saveitem
// Uses    : (defined in other files)
//   core/common-utils.js  ->  getLookupDisplay
//   core/ui-feedback.js  ->  showCustomAlert
//   inventory/event-selector.js  ->  eventChoices
//   scan-log/scan-log-service.js  ->  saveSingleScan
//   inventory/inventory-model.js  ->  creatorDelete
//   inventory/selection-panel.js  ->  resetSelectionState
// ============================================================================

// ==============================
// Save Data for Inventory Item
// ==============================
function saveitem() {
    console.log("saveitem Function Triggered");
    const data = window.allInventoryData || [];
    if (window.currentSelection && window.currentSelection.id) {
        showCustomAlert("A selection is open. Use Save Selection, or start a New Selection to save the event list.");
        return;
    }
    const removedItems = window.removedInventoryItems || [];
    if (data.length === 0 && removedItems.length === 0) {
        showCustomAlert("No items in the table to save.");
        return;
    }
    let recordsData = [];
    let uniqueEvents = new Set();
    data.forEach((record, index) => {
        if (record.Event) uniqueEvents.add(record.Event);
        const row = {
            "Sr": (index + 1).toString(),
            "Event": record.Event || "",
            "Trade_Show_ID": record.Trade_Show_ID || "",
            "Lot": record.Lot || "",
            "Description": record.Description || "",
            "Pcs": record.Pcs || "",
            "Weight": record.Weight || "",
            "Cost": record.Cost || "",
            "Price": record.Price || "",
            "Total": record.Total || "",
            "COO": record.COO || "",
            "Treat": record.Treat || "",
            "Cert_1": record.Cert_1 || "",
            "Cert_2": record.Cert_2 || "",
            "Cert_3": record.Cert_3 || "",
            "Item_Status": record.Item_Status || "",
            "Log_Status": record.Log_Status || ""
        };
        const visitDrafts = record._customerVisitDrafts || [];
        if (visitDrafts.length) row.Customer_Visit = visitDrafts;
        recordsData.push(row);
    });

    // Prepare promises to fetch existing records for all unique events in the table
    let eventsArray = Array.from(uniqueEvents);
    let fetchPromises = eventsArray.map(evt => {
        return ZOHO.CREATOR.DATA.getRecords({
            app_name: "feiny-app",
            report_name: "All_Inventory_Items",
            criteria: `(Event == "${evt}")`
        }).then(res => res.data || []).catch(err => {
            console.log("Error fetching records for event", evt, err);
            return [];
        });
    });
    // Wait for fetch completion, then process adds/updates
    Promise.all(fetchPromises).then(existingResults => {
        let allExistingRecords = [];
        existingResults.forEach(arr => {
            allExistingRecords = allExistingRecords.concat(arr);
        });
        let updatePromises = [];
        let recordsToAdd = [];
        recordsData.forEach(row => {
            let matchingRecord = allExistingRecords.find(ex => {
                let exEvent = getLookupDisplay(ex.Event) || ex.Event || "";
                let exLot = getLookupDisplay(ex.Lot) || ex.Lot || "";
                return (exEvent === row.Event && exLot === row.Lot);
            });
            if (matchingRecord && matchingRecord.ID) {
                // Determine update map
                let updateData = {
                    "Description": row.Description,
                    "Pcs": row.Pcs,
                    "Weight": row.Weight,
                    "Cost": row.Cost,
                    "Price": row.Price,
                    "Total": row.Total,
                    "COO": row.COO,
                    "Treat": row.Treat,
                    "Cert_1": row.Cert_1,
                    "Cert_2": row.Cert_2,
                    "Cert_3": row.Cert_3,
                    "Item_Status": row.Item_Status,
                    "Log_Status": row.Log_Status
                };
                if (row.Customer_Visit) updateData.Customer_Visit = row.Customer_Visit;
                let updateConfig = {
                    app_name: "feiny-app",
                    report_name: "All_Inventory_Items",
                    id: matchingRecord.ID, // Target record ID
                    payload: { "data": updateData }
                };
                // Push update promise
                updatePromises.push(ZOHO.CREATOR.DATA.updateRecordById(updateConfig));
            } else {
                // No match found -> we need to ADD
                recordsToAdd.push(row);
            }
        });
        // Items removed from the open list: delete their saved records
        removedItems.forEach(r => {
            updatePromises.push(creatorDelete("All_Inventory_Items", r.ID));
        });
        let addPromise = Promise.resolve();
        if (recordsToAdd.length > 0) {
            let addConfig = {
                app_name: "feiny-app",
                form_name: "Inventory_items",
                payload: { "data": recordsToAdd }
            };
            addPromise = ZOHO.CREATOR.DATA.addRecords(addConfig);
        }
        Promise.all([addPromise, ...updatePromises]).then(results => {
            console.log("Updates and Adds completed:", results);
            showCustomAlert("✅ " + recordsData.length + " Items Saved/Updated" + (removedItems.length ? ", " + removedItems.length + " removed" : "") + " Successfully");
            window.removedInventoryItems = [];
            data.forEach(r => {
                r._dirty = false;
                delete r._customerVisitDrafts;
            });
            if (typeof resetSelectionState === "function") resetSelectionState();
            if (typeof eventChoices !== "undefined" && eventChoices) {
                eventChoices.setChoiceByValue("");
            }
            if (document.getElementById("eventName")) {
                document.getElementById("eventName").value = "";
            }
            if (document.getElementById("statusSelect")) {
                document.getElementById("statusSelect").value = "Select Status";
            }
            tableBody.innerHTML = ""; // Clear table on success
            // Persist scan log entries only for items that were scanned or changed locally.
            data.filter(record => record._scanUpdated && record._scanCount > 0).forEach(record => {
                saveSingleScan(record.Event, record.Trade_Show_ID, record.Lot, record.Description, record.Item_Status, record._scanCount);
                record._scanUpdated = false;
            });
        }).catch(err => {
            console.log("Error during Add/Update processes:", err);
            showCustomAlert("❌ Error while saving items");
        });
    }).catch(err => {
        console.log("Critical Error verifying existing items:", err);
        showCustomAlert("❌ Error verifying items");
    });
}
