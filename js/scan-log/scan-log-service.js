// ============================================================================
// scan-log/scan-log-service.js
// Scan Log data access: scan count, last scan time, save scan to Creator.
//
// Defines : getExistingScanCount, getLastScanTimestamp, saveSingleScan
// Uses    : (nothing from other files)
// ============================================================================

// ========================================================================================================================
// Scan Log
// ========================================================================================================================
// Helper: fetch existing scan log and count filled timestamp fields
function getExistingScanCount(eventName, lot) {
    return new Promise(function (resolve, reject) {
        try {
            const config = {
                app_name: "feiny-app",
                report_name: "All_Scan_Logs",
                criteria: `(Event_Name == "${eventName}" && Lot == "${lot}")`
            };
            ZOHO.CREATOR.DATA.getRecords(config).then(function (response) {
                if (!response || !response.data || response.data.length === 0) {
                    resolve(0);
                    return;
                }
                const rec = response.data[0];
                let count = 0;
                if (rec.Warehouse_Out) count++;
                if (rec.Trade_Show_In) count++;
                if (rec.Trade_Show_Out) count++;
                if (rec.Warehouse_In) count++;
                resolve(count);
            }).catch(function (err) {
                reject(err);
            });
        } catch (ex) {
            reject(ex);
        }
    });
}
// Helper: get the most recent timestamp (ms) from scan log for an event+lot
function getLastScanTimestamp(eventName, lot) {
    return new Promise(function (resolve, reject) {
        try {
            const config = {
                app_name: "feiny-app",
                report_name: "All_Scan_Logs",
                criteria: `(Event_Name == "${eventName}" && Lot == "${lot}")`
            };
            ZOHO.CREATOR.DATA.getRecords(config).then(function (response) {
                if (!response || !response.data || response.data.length === 0) {
                    resolve(null);
                    return;
                }
                const rec = response.data[0];
                const times = [rec.Warehouse_Out, rec.Trade_Show_In, rec.Trade_Show_Out, rec.Warehouse_In];
                let max = 0;
                times.forEach(function (t) {
                    if (!t) return;
                    const parsed = Date.parse(t);
                    if (!isNaN(parsed) && parsed > max) max = parsed;
                });
                if (max === 0) resolve(null); else resolve(new Date(max));
            }).catch(function (err) {
                reject(err);
            });
        } catch (ex) {
            reject(ex);
        }
    });
}

// ===========================
// save
// ===========================
function saveSingleScan(event, tradeShowId, lot, description, itemStatus, scanCount) {
    const step = (scanCount - 1) % 4;
    function getTime() {
        const now = new Date();
        return now.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }
    const time = getTime();
    let recordData = {
        Event_Name: event,
        Trade_Show_ID: tradeShowId,
        Lot: lot,
        Description: description,
        Item_Status: itemStatus
    };
    if (step === 0) recordData.Warehouse_Out = time;
    if (step === 1) recordData.Trade_Show_In = time;
    if (step === 2) recordData.Trade_Show_Out = time;
    if (step === 3) recordData.Warehouse_In = time;
    console.log("📤 Saving/Updating Single Scan:", recordData);
    const searchConfig = {
        app_name: "feiny-app",
        report_name: "All_Scan_Logs",
        criteria: `(Event_Name == "${event}" && Lot == "${lot}")`
    };
    ZOHO.CREATOR.DATA.getRecords(searchConfig)
        .then(function (response) {
            if (response && response.data && response.data.length > 0) {
                // Record exists, update it
                const existingRecordId = response.data[0].ID;
                const updateConfig = {
                    app_name: "feiny-app",
                    report_name: "All_Scan_Logs",
                    id: existingRecordId,
                    payload: { "data": recordData }
                };
                ZOHO.CREATOR.DATA.updateRecordById(updateConfig)
                    .then(res => console.log("✅ Scan Updated:", res))
                    .catch(err => console.log("❌ Error updating scan:", err));
            } else {
                addNewScanLog();
            }
        })
        .catch(function (error) {
            // Assume no records found or API error, fallback to initial Add
            console.log("No existing scan log found or error, adding new:", error);
            addNewScanLog();
        });
    function addNewScanLog() {
        var addConfig = {
            app_name: "feiny-app",
            form_name: "Scan_log",
            payload: { "data": recordData }
        };
        ZOHO.CREATOR.DATA.addRecords(addConfig)
            .then(res => console.log("✅ Scan Added:", res))
            .catch(err => console.log("❌ Error adding scan:", err));
    }
}
