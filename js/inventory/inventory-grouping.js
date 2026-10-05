// ============================================================================
// inventory/inventory-grouping.js
// Inventory: groups the list by Category, then by Species, with Pcs / Weight / Total sums.
//
// Defines : buildInventoryGroups, categoryRank
// Uses    : (defined in other files)
//   inventory/inventory-model.js  ->  toNum, round2
//   inventory/inventory-config.js  ->  INV_CFG
// ============================================================================

function categoryRank(name) {
    const index = INV_CFG.categoryOrder.indexOf(name);
    return index === -1 ? 100 : index;
}

function normalizeInventoryCategory(value) {
    const category = String(value || "").trim();
    const normalized = category.toLowerCase();
    if (normalized.startsWith("diamond")) return "Diamond";
    if (normalized.startsWith("jewel")) return "Jewelry";
    if (/^colou?rs?\s+stones?\b/.test(normalized)) return "Color Stone";
    return category || "Uncategorised";
}

function sumRows(data, idxList) {
    let pcs = 0, weight = 0, total = 0;
    idxList.forEach(i => {
        pcs += toNum(data[i].Pcs);
        weight += toNum(data[i].Weight);
        total += toNum(data[i].Total);
    });
    return { pcs: pcs, weight: round2(weight), total: round2(total) };
}

// Returns [{id, name, rows:[idx], sums}].
// "rows" are indexes into the data array, so row handlers keep working.
function buildInventoryGroups(data) {
    const cats = {};
    data.forEach((rec, idx) => {
        enrichInventoryRecord(rec);
        const cat = normalizeInventoryCategory(rec.Category_Name);
        if (!cats[cat]) cats[cat] = { name: cat, rows: [] };
        cats[cat].rows.push(idx);
    });
    const groups = Object.values(cats).sort((a, b) =>
        categoryRank(a.name) - categoryRank(b.name) || a.name.localeCompare(b.name));
    return groups.map((g, gi) => {
        const rows = g.rows.slice().sort((a, b) => String(data[a].Lot).localeCompare(String(data[b].Lot)));
        return { id: `g${gi}`, name: g.name, rows: rows, subgroups: [], sums: sumRows(data, rows) };
    });
}
