// ============================================================================
// inventory/lot-master.js
// Inventory: Lot Master loading, lot dropdown, auto-fill of lot fields, certificates.
//
// Defines : lotChoices, allLotData, loadLotMaster, lotSelectElement, getCertificatesBySKU, clearLotFields
// Uses    : (defined in other files)
//   core/common-utils.js  ->  getLookupDisplay
// ============================================================================

// check
let lotChoices;
let allLotData = []; // Store fetched lot mapping data

// ==============================
// Get Lot Master Details
// ==============================
function loadLotMaster() {
    var config = {
        app_name: "feiny-app",
        report_name: "All_Lot_Master",
        max_records: 1000
    };
    ZOHO.CREATOR.DATA.getRecords(config)
        .then(function (response) {
            console.log("Lot Master Data:", response);
            const data = response.data;
            allLotData = data || [];
            const lotDropdown = document.getElementById("lot");
            if (!lotDropdown) return;
            if (typeof lotChoices !== "undefined" && lotChoices) {
                lotChoices.destroy();
            }
            lotDropdown.innerHTML = '<option value="">Select Lot</option>';
            if (data && data.length > 0) {
                data.forEach(record => {
                    if (record.In_SKU && record.Status === "Available") {
                        const option = document.createElement("option");
                        option.value = record.In_SKU;
                        option.textContent = record.In_SKU;
                        lotDropdown.appendChild(option);
                    }
                });
            }
            lotChoices = new Choices(lotDropdown, {
                searchEnabled: true,
                shouldSort: false,
                removeItemButton: true
            });
        })
        .catch(function (error) {
            console.log("Error loading Lot Master:", error);
        });
}

// ==============================
// Map Lot Data on Selection
// ==============================
const lotSelectElement = document.getElementById('lot');
if (lotSelectElement) {
    lotSelectElement.addEventListener('change', async function (e) {
        const selectedSKU = e.target.value;
        const selectedRecord = allLotData.find(record => record.In_SKU === selectedSKU);
        console.log("FULL RECORD:", selectedRecord);
        lotSelectElement.addEventListener('removeItem', function () {
            console.log("Lot removed → clearing fields");
            clearLotFields();
        });
        if (selectedRecord) {
            // Short / Long description handling
            const shortDescription = selectedRecord.Name1 || selectedRecord.Jewel_Short_Description || selectedRecord.Short_Description1 || "";
            const longDescription = selectedRecord.Long_Description || selectedRecord.Jewel_Long_Description || selectedRecord.Long_Description2 || "";
            if (document.getElementById('description'))
                document.getElementById('description').value = shortDescription;
            if (document.getElementById('long_description'))
                document.getElementById('long_description').value = longDescription;
            // Pcs = Stock On Hand (same as invoice_creation)
            if (document.getElementById('pcs'))
                document.getElementById('pcs').value = selectedRecord.Stock_On_Hand || "";
            // Weight — multi-field fallback matching invoice_creation
            if (document.getElementById('weight'))
                document.getElementById('weight').value = selectedRecord.Weight_Ct || selectedRecord.Weight_grams || selectedRecord.weight || "";
            // Cost — Price_Per_carat / Final_Cost / Cost_Amount fallback (invoice_creation pattern)
            if (document.getElementById('cost'))
                document.getElementById('cost').value = selectedRecord.Cost_Amount || "";
            // COO — handle object or string, multi-field fallback (invoice_creation pattern)
            if (document.getElementById('coo')) {
                if (typeof selectedRecord.Origin === "object" && selectedRecord.Origin !== null) {
                    document.getElementById('coo').value = selectedRecord.Origin.display_value || selectedRecord.Origin.zc_display_value || "";
                } else {
                    document.getElementById('coo').value = selectedRecord.COO || selectedRecord.Origin || selectedRecord.Country_Of_Origin1 || "";
                }
            }
            // Treatment
            if (document.getElementById('treat')) {
                const rawTreat = selectedRecord.Treat || selectedRecord.Treatment;
                console.log(" Raw Treat Value:", rawTreat);
                const parsedTreat = getLookupDisplay(rawTreat);
                console.log(" Parsed Treat Value:", parsedTreat);
                document.getElementById('treat').value = parsedTreat;
            }
            // Item Status
            if (document.getElementById('itemstatus'))
                document.getElementById('itemstatus').value = selectedRecord.Status || "";
            // Cert 1 / 2 / 3 — fetch from All_Certificate_Details
            let certData = await getCertificatesBySKU(selectedSKU);
            console.log("Fetched Cert Data:", certData);
            let certValues = certData.map(row => getLookupDisplay(row.Lab));
            document.getElementById('cert1').value = certValues[0] || "";
            document.getElementById('cert2').value = certValues[1] || "";
            document.getElementById('cert3').value = certValues[2] || "";
        }
    });
}
async function getCertificatesBySKU(SKU) {
    let response = await ZOHO.CREATOR.DATA.getRecords({
        app_name: "feiny-app",
        report_name: "All_Certificate_Details",
        criteria: `(SKU == "${SKU}")`
    });
    console.log("API Response:", response);
    return response.data || [];
}
// ==============================
// Clear Inventory Form
// ==============================
function clearLotFields() {
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
}
