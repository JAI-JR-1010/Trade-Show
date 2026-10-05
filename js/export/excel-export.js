// ============================================================================
// export/excel-export.js
// Excel (XLSX) export buttons: Inventory, Scan Log, InterTracking Movement Log.
//
// Defines : (event listeners / load-time code only)
// Uses    : (defined in other files)
//   core/ui-feedback.js  ->  showCustomAlert
//   inventory/inventory-grouping.js  ->  buildInventoryGroups
//   inventory/selection-service.js  ->  currentSelection
// ============================================================================

// ==============================
// Export data
// ==============================
document.addEventListener("DOMContentLoaded", function () {
    // ---------------- INVENTORY EXPORT ----------------
    const exportBtn = document.getElementById("inventoryExportBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", function () {
            console.log("🔥 Inventory Export Clicked");
            const items = window.allInventoryData || [];
            if (items.length === 0) {
                showCustomAlert("No data to export");
                return;
            }
            // Grouped export: Category -> Species, with sums, plus selection info if one is open
            let data = [];
            const sel = window.currentSelection;
            if (sel) {
                data.push(["Customer", sel.customerName || "", "Visit Date", sel.visitDate || "", "Status", sel.status || ""]);
                data.push(["Comment", sel.comment || ""]);
                data.push([]);
            }
            data.push([
                "Sr", "Category", "Species", "Event", "Trade Show ID", "Lot", "Description",
                "Pcs", "Weight", "Cost", "Price", "Total",
                "COO", "Treat", "Cert 1", "Cert 2", "Cert 3",
                "Item Status", "Log Status"
            ]);
            let sr = 0;
            const itemRow = (i, cat, sp) => {
                const r = items[i];
                return [++sr, cat, sp, r.Event || "", r.Trade_Show_ID || "", r.Lot || "", r.Description || "",
                    r.Pcs || "", r.Weight || "", r.Cost || "", r.Price || "", r.Total || "",
                    r.COO || "", r.Treat || "", r.Cert_1 || "", r.Cert_2 || "", r.Cert_3 || "",
                    r.Item_Status || "", r.Log_Status || ""];
            };
            const sumRow = (label, g) => ["", label, "", "", "", "", "", g.sums.pcs, g.sums.weight, "", "", g.sums.total];
            buildInventoryGroups(items).forEach(g => {
                if (g.subgroups.length) {
                    g.subgroups.forEach(s => {
                        s.rows.forEach(i => data.push(itemRow(i, g.name, s.name)));
                        data.push(sumRow(g.name + " / " + s.name + " total", s));
                    });
                } else {
                    g.rows.forEach(i => data.push(itemRow(i, g.name, "")));
                }
                data.push(sumRow(g.name + " total", g));
            });
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventory");
            XLSX.writeFile(wb, "Inventory.xlsx");
            console.log("✅ Inventory Export success");
        });
    }
    // ---------------- SCAN LOG EXPORT ----------------
    const scanExportBtn = document.getElementById("scanExportBtn");
    if (scanExportBtn) {
        scanExportBtn.addEventListener("click", function () {
            console.log("🔥 Scan Log Export Clicked");
            const logs = window.allScanLogData || [];
            if (logs.length === 0) {
                showCustomAlert("No data to export");
                return;
            }
            let data = [];
            const headers = [
                "Sr",
                "Event",
                "Trade Show ID",
                "Lot",
                "Description",
                "Item Status",
                "Warehouse Out",
                "Trade Show In",
                "Trade Show Out",
                "Warehouse In"
            ];
            data.push(headers);
            logs.forEach((record, index) => {
                data.push([
                    index + 1,
                    record.Event_Name || record.Event || "",
                    record.Trade_Show_ID || "",
                    record.Lot || "",
                    record.Description || "",
                    record.Item_Status || "",
                    record.Warehouse_Out || "",
                    record.Trade_Show_In || "",
                    record.Trade_Show_Out || "",
                    record.Warehouse_In || ""
                ]);
            });
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Scan Log");
            XLSX.writeFile(wb, "Scan_Log.xlsx");
            console.log("✅ Scan Log Export success");
        });
    }
    // InterTracking Movement Log 
    const logExportBtn = document.getElementById("logExportBtn");
    if (logExportBtn) {
        logExportBtn.addEventListener("click", function () {
            console.log("🔥 InterTracking Movement Log Export Clicked");
            const logs = window.allInterTransferLogData || [];
            if (logs.length === 0) {
                showCustomAlert("No data to export");
                return;
            }
            let data = [];
            const headers = [
                "Sr",
                "Event",
                "Trade Show ID",
                "Lot",
                "Description",
                "Lot Status",
                "From Location",
                "To Location",
                "Handover By",
                "Date",
                "Notes"
            ];
            data.push(headers);
            logs.forEach((record, index) => {
                data.push([
                    index + 1,
                    record.Event_Name || record.Event || "",
                    record.Trade_Show_ID || "",
                    record.Lot_Master || record.Lot || "",
                    record.Description || "",
                    record.Lot_Status || "",
                    record.From_Location || "",
                    record.To_Location || "",
                    record.Handover_By || "",
                    record.Date_field || record.Date || "",
                    record.Notes || ""
                ]);
            });
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "InterTracking Movement Log");
            XLSX.writeFile(wb, "All_Intertranfer_Trackings.xlsx");
            console.log("✅ InterTracking Movement Log Export success");
        });
    }
});
