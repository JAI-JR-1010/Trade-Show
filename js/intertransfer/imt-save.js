// ============================================================================
// intertransfer/imt-save.js
// Inter-Movement Tracking: validate and save tracking records.
//
// Defines : saveInterTransferTracking
// Uses    : (defined in other files)
//   core/date-utils.js  ->  formatDate
//   core/ui-feedback.js  ->  hideSavingPopup, showCustomAlert, showSavingPopup
//   intertransfer/imt-bulk-update.js  ->  clearIMTSelections
// ============================================================================

// =================================================================================
// SAVE INTERTRANSFER TRACKING
// =================================================================================
async function saveInterTransferTracking() {
    console.log("🚀 Saving InterTransfer Tracking...");
    const allStates = Object.values(window.imtRowStates || {});
    if (allStates.length === 0) {
        showCustomAlert("No records found");
        return;
    }
    const tradeShowId =
        document.getElementById("trade_show_id").value;
    const eventName =
        document.getElementById("event_name").value;
    let recordsToSave = [];
    // VALIDATE ALL RECORDS FIRST
    for (const state of allStates) {
        const { lotNo, description, lotStatus, fromLocation, toLocation, handoverBy, date: rawDate, notes } = state;
        const date = formatDate(rawDate);
        // SKIP EMPTY RECORDS
        if (!fromLocation && !toLocation) {
            continue;
        }
        // VALIDATE BOTH LOCATIONS REQUIRED
        if (fromLocation && !toLocation) {
            showCustomAlert(
                `Please select To Location for Lot: ${lotNo}`
            );
            return;
        }
        if (!fromLocation && toLocation) {
            showCustomAlert(
                `Please select From Location for Lot: ${lotNo}`
            );
            return;
        }
        // VALIDATE SAME LOCATION
        if (fromLocation === toLocation) {
            showCustomAlert(
                `From and To Location cannot be same for Lot: ${lotNo}`
            );
            return;
        }
        // STORE VALID RECORD
        recordsToSave.push({
            lotNo,
            description,
            lotStatus,
            fromLocation,
            toLocation,
            handoverBy,
            date,
            notes
        });
    }
    // NO VALID RECORDS
    if (recordsToSave.length === 0) {
        showCustomAlert(
            "Please select From and To Location for at least one record"
        );
        return;
    }
    // SHOW LOADING ONLY AFTER VALIDATION SUCCESS
    showSavingPopup("Saving InterTransfer Items...");
    let processedCount = 0;
    try {
        // SAVE RECORDS
        for (const item of recordsToSave) {
            let existingData = [];
            try {
                const existingResponse =
                    await ZOHO.CREATOR.DATA.getRecords({
                        app_name: "feiny-app",
                        report_name: "All_Intertranfer_Trackings",
                        criteria:
                            `(Event_Name == "${eventName}") && (Lot_Master == "${item.lotNo}")`
                    });
                existingData =
                    existingResponse.data || [];
            }
            catch (fetchError) {
                if (
                    fetchError.responseText &&
                    fetchError.responseText.includes('"code":9280')
                ) {
                    existingData = [];
                }
                else {

                    throw fetchError;
                }
            }
            const recordData = {
                "Trade_Show_ID": tradeShowId,
                "Event_Name": eventName,
                "Lot_Master": item.lotNo,
                "Description": item.description,
                "Lot_Status": item.lotStatus,
                "From_Location": item.fromLocation,
                "To_Location": item.toLocation,
                "Handover_By": item.handoverBy,
                "Date_field": item.date,
                "Notes": item.notes
            };
            // UPDATE EXISTING
            if (existingData.length > 0) {
                const existingId =
                    existingData[0].ID;
                await ZOHO.CREATOR.DATA.updateRecordById({
                    app_name: "feiny-app",
                    report_name: "All_Intertranfer_Trackings",
                    id: existingId,
                    payload: {
                        data: recordData
                    }
                });
            }
            // ADD NEW
            else {
                await ZOHO.CREATOR.DATA.addRecords({
                    app_name: "feiny-app",
                    form_name: "InterTranfer_Tracking",
                    payload: {
                        data: recordData
                    }
                });
            }
            processedCount++;
        }
        // SUCCESS        
        clearIMTSelections();
        showCustomAlert(
            `✅ ${processedCount} Record(s) Saved Successfully`
        );
        console.log("✅ InterTransfer Save Completed");
    }
    catch (error) {
        console.error("❌ Save Error:", error);
        let errorMessage = "Unknown error occurred";
        if (error?.message) {
            errorMessage = error.message;
        }
        else if (error?.responseText) {
            try {
                const parsed =
                    JSON.parse(error.responseText);
                errorMessage =
                    parsed.message || error.responseText;
            }
            catch {
                errorMessage = error.responseText;
            }
        }
        showCustomAlert(
            `❌ Failed to save records.\n\nError: ${errorMessage}`
        );
    }
    finally {
        hideSavingPopup();
    }
}
