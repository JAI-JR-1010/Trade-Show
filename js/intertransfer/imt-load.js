// ============================================================================
// intertransfer/imt-load.js
// Inter-Movement Tracking: load active event and its inventory/tracking rows.
//
// Defines : loadActiveEventName, loadIntertransferItems
// Uses    : (defined in other files)
//   core/date-utils.js  ->  getCurrentDate
//   core/ui-feedback.js  ->  showCustomAlert
//   intertransfer/imt-lot-master.js  ->  getLotMasterLocation, lotMasterInitPromise
//   intertransfer/imt-search.js  ->  loadIMTSearchOptions, lotNumbers
//   intertransfer/imt-state.js  ->  intertransferData
//   intertransfer/imt-table.js  ->  renderIMTTable
//   intertransfer/imt-user.js  ->  loginUserInitPromise, loginUserName, loginuserid
// ============================================================================

// =================================================================================
// LOAD ACTIVE EVENT NAME
// =================================================================================
function loadActiveEventName() {
    return ZOHO.CREATOR.DATA.getRecords({
        app_name: "feiny-app",
        report_name: "All_Trade_Show_Masters",
        criteria: '(Event_Status == "Active")'
    })
        .then(function (response) {
            console.log("Active Event Response:", response);
            const data = response.data || [];
            if (data.length === 0) {
                document.getElementById("event_name").value = "";
                document.getElementById("trade_show_id").value = "";
                showCustomAlert("No Active Event Found");
                return;
            }
            const activeEvent = data[0];
            document.getElementById("event_name").value =
                activeEvent.Trade_Show_Name || "";
            document.getElementById("trade_show_id").value =
                activeEvent.Trade_Show_ID || "";
            console.log("✅ Active Event Loaded");
        })
        .catch(function (error) {
            console.error("❌ Error loading active event:", error);
        });
}

// =================================================================================
// LOAD INTERTRANSFER ITEMS BASED ON ACTIVE EVENT
// =================================================================================
async function loadIntertransferItems() {
    await Promise.all([loginUserInitPromise, lotMasterInitPromise]);
    console.log("📦 Loading Intertransfer Items...");
    const tbody =
        document.getElementById("itmTableBody");
    const eventName =
        document.getElementById("event_name")?.value;
    const tradeShowId =
        document.getElementById("trade_show_id")?.value;
    if (!tbody) {
        console.error("❌ itmTableBody not found");
        return;
    }
    if (!eventName) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="imt-empty-state">
                    No Active Event Selected
                </td>
            </tr>
        `;
        return;
    }
    tbody.innerHTML = "";
    try {
        // =====================================================
        // LOAD INVENTORY ITEMS
        // =====================================================
        const inventoryResponse =
            await ZOHO.CREATOR.DATA.getRecords({
                app_name: "feiny-app",
                report_name: "All_Inventory_Items",
                criteria: `(Event == "${eventName}")`
            });
        const inventoryData =
            inventoryResponse.data || [];
        // =====================================================
        // LOAD SAVED INTERTRANSFER RECORDS
        // =====================================================
        let trackingData = [];
        try {
            const trackingResponse =
                await ZOHO.CREATOR.DATA.getRecords({
                    app_name: "feiny-app",
                    report_name: "All_Intertranfer_Trackings",
                    criteria:
                        `(Event_Name == "${eventName}")`
                });
            trackingData =
                trackingResponse.data || [];
        }
        catch (error) {
            console.log(
                "⚠️ No Existing Tracking Records"
            );
        }
        // =====================================================
        // CREATE TRACKING MAP USING LOT NO
        // =====================================================
        const trackingMap = {};
        trackingData.forEach(record => {
            trackingMap[record.Lot_Master] = record;
        });
        intertransferData = inventoryData;
        window.imtRowStates = {};
        inventoryData.forEach(record => {
            const lotNo = record.Lot || "";
            const existing = trackingMap[lotNo] || {};
            const defaultFrom = existing.From_Location || getLotMasterLocation(lotNo) || "";
            window.imtRowStates[lotNo] = {
                lotNo: lotNo,
                description: record.Description || "",
                lotStatus: record.Item_Status || "",
                fromLocation: defaultFrom,
                toLocation: existing.To_Location || "",
                handoverBy: existing.Handover_By || loginUserName || loginuserid || "",
                date: existing.Date_field ? getCurrentDate(existing.Date_field) : getCurrentDate(),
                notes: existing.Notes || "",
                selected: false
            };
        });
        window.allIMTData = inventoryData || [];
        window.filteredIMTData = inventoryData || [];
        window.imtCurrentPage = 1;

        lotNumbers = inventoryData
            .map(record => record.Lot || "")
            .filter(lot => lot.trim() !== "");
        loadIMTSearchOptions(inventoryData);
        renderIMTTable(1);
        console.log(`✅ Loaded ${inventoryData.length} Inventory Items`);
        console.log(`✅ Loaded ${trackingData.length} Existing Tracking Records`);
    }
    catch (error) {
        console.error(
            "❌ Error loading Intertransfer Items:",
            error
        );
        showCustomAlert(
            "No Active Items records found"
        );
    }
}
