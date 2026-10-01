// ============================================================================
// intertransfer/imt-lot-master.js
// Inter-Movement Tracking: lot master data + location lookup (runs at load).
//
// Defines : lotMasterData, lotMasterInitPromise, loadLotMasterData, getLotMasterLocation, getLotMasterLocationOptions
// Uses    : (defined in other files)
//   inventory/lot-master.js  ->  allLotData
// ============================================================================

let lotMasterData = [];
let lotMasterInitPromise = loadLotMasterData();

function loadLotMasterData() {
    if (typeof allLotData !== "undefined" && Array.isArray(allLotData) && allLotData.length) {
        lotMasterData = allLotData;
        return Promise.resolve();
    }
    return ZOHO.CREATOR.DATA.getRecords({
        app_name: "feiny-app",
        report_name: "All_Lot_Master",
        max_records: 1000
    })
        .then(function (response) {
            lotMasterData = response.data || [];
            console.log("Lot Master Data Loaded:", lotMasterData.length);
        })
        .catch(function (error) {
            console.log("Lot Master Fetch Error:", error);
            lotMasterData = [];
        });
}
function getLotMasterLocation(lotNo) {
    if (!lotNo) return "";
    const normalizedLot = lotNo.toString();
    const record = lotMasterData.find(rec => {
        const sku = (rec.In_SKU || rec.Lot || "").toString();
        return sku === normalizedLot;
    });
    return record ? (record.Location || "") : "";
}
function getLotMasterLocationOptions() {
    const locations = new Set();
    lotMasterData.forEach(rec => {
        const loc = (rec.Location || "").toString().trim();
        if (loc) locations.add(loc);
    });
    return Array.from(locations);
}
