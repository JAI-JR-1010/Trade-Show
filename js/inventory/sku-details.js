// ============================================================================
// inventory/sku-details.js
// SKU details popup: notes, images, and up to ten documents per SKU.
// Everything here saves immediately (it does not wait for Save Item / Save Selection).
//
// Defines : openSkuDetails, closeSkuDetails, addSkuNote, deleteSkuNote,
//           uploadSkuImages, deleteSkuImage, uploadSkuDocuments, deleteSkuDocument
// Uses    : (defined in other files)
//   inventory/inventory-config.js  ->  INV_CFG
//   inventory/inventory-model.js  ->  creatorGet, creatorAdd, creatorDelete, extractCreatorId, escHtml, showConfirmDialog
//   core/ui-feedback.js  ->  showCustomAlert
//   core/common-utils.js  ->  getLookupDisplay, delay
// ============================================================================

let skuCtx = null;   // { lot, event }

function skuCriteria() {
    return `(SKU == "${skuCtx.lot}" && Event == "${skuCtx.event}")`;
}
function skuEl(id) { return document.getElementById(id); }

async function openSkuDetails(idx) {
    const rec = (window.allInventoryData || [])[idx];
    if (!rec || !rec.Lot) return;
    skuCtx = { lot: rec.Lot, event: rec.Event };
    skuEl("skuDetailsTitle").textContent = `SKU ${rec.Lot} - ${rec.Description || ""}`;
    skuEl("skuDetailsModal").style.display = "flex";
    refreshSkuDetails();
}
function closeSkuDetails() {
    skuEl("skuDetailsModal").style.display = "none";
    skuCtx = null;
}

function refreshSkuDetails() {
    if (!skuCtx) return;
    const ctx = skuCtx;
    Promise.all([
        creatorGet(INV_CFG.skuNoteReport, skuCriteria()),
        creatorGet(INV_CFG.skuImageReport, skuCriteria()),
        creatorGet(INV_CFG.skuDocumentReport, skuCriteria())
    ]).then(function (res) {
        if (skuCtx !== ctx) return;   // popup was closed / switched while loading
        renderSkuNotes(res[0]);
        renderSkuImages(res[1]);
        renderSkuDocuments(res[2]);
    });
}

// ---------------- Notes ----------------
function renderSkuNotes(rows) {
    skuEl("skuNotesList").innerHTML = rows.length ? rows.map(r => `<li>
        <span>${escHtml(r.Note)}<small>${escHtml(r.Added_Time || r.Added_On || "")}</small></span>
        <button class="inv-row-btn" onclick="deleteSkuNote('${r.ID}')">✕</button></li>`).join("")
        : '<li class="sku-empty">No notes yet</li>';
}
function addSkuNote() {
    const box = skuEl("skuNoteInput");
    const text = box.value.trim();
    if (!text) { showCustomAlert("Type a note first."); return; }
    creatorAdd(INV_CFG.skuNoteForm, { SKU: skuCtx.lot, Event: skuCtx.event, Note: text })
        .then(() => { box.value = ""; refreshSkuDetails(); })
        .catch(() => showCustomAlert("❌ Could not save the note"));
}
function deleteSkuNote(id) {
    showConfirmDialog("Delete this note?", function () {
        creatorDelete(INV_CFG.skuNoteReport, id).then(refreshSkuDetails);
    });
}

// ---------------- Images ----------------
function fileUrl(val) {
    if (!val) return "";
    const u = (typeof val === "object") ? (val.download_url || val.url || val.content || "") : String(val);
    return u.charAt(0) === "/" ? "https://creatorapp.zoho.com" + u : u;
}
function renderSkuImages(rows) {
    skuEl("skuImgList").innerHTML = rows.length ? rows.map(r => {
        const url = fileUrl(r[INV_CFG.skuImageField]);
        return `<div class="sku-img">
            ${url ? `<a href="${escHtml(url)}" target="_blank"><img src="${escHtml(url)}" onerror="this.style.display='none'"><span>Open</span></a>` : "<span>(no file)</span>"}
            <button onclick="deleteSkuImage('${r.ID}')">✕</button></div>`;
    }).join("") : '<span class="sku-empty">No images yet</span>';
}
async function uploadSkuImages(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const bad = files.find(f => !/^image\//.test(f.type));
    if (bad) { showCustomAlert(bad.name + " is not an image."); return; }
    showCustomAlert(`Uploading ${files.length} image(s)...`);
    try {
        for (const file of files) {
            // one record per image, then attach the file to it (same pattern as trade show documents)
            const res = await creatorAdd(INV_CFG.skuImageForm, { SKU: skuCtx.lot, Event: skuCtx.event });
            const id = extractCreatorId(res);
            if (!id) throw new Error("image record not created");
            await ZOHO.CREATOR.FILE.uploadFile({
                app_name: INV_CFG.app, report_name: INV_CFG.skuImageReport,
                id: id, field_name: INV_CFG.skuImageField, file: file
            });
            await delay(500);
        }
        showCustomAlert("✅ Images uploaded");
    } catch (err) {
        console.error("image upload failed", err);
        showCustomAlert("❌ Image upload failed");
    }
    skuEl("skuImgInput").value = "";
    refreshSkuDetails();
}
function deleteSkuImage(id) {
    showConfirmDialog("Delete this image?", function () {
        creatorDelete(INV_CFG.skuImageReport, id).then(refreshSkuDetails);
    });
}

// ---------------- Documents ----------------
function renderSkuDocuments(rows) {
    skuEl("skuDocumentCount").textContent = `${rows.length}/10`;
    skuEl("skuDocumentInput").disabled = rows.length >= 10;
    skuEl("skuDocumentList").innerHTML = rows.length ? rows.map(row => {
        const value = row[INV_CFG.skuDocumentField];
        const url = fileUrl(value);
        const name = typeof value === "object" && value
            ? (value.name || value.filename || value.display_value || "Open document")
            : (url.split("/").pop().split("?")[0] || "Open document");
        return `<div class="sku-document-row">
            ${url ? `<a href="${escHtml(url)}" target="_blank" rel="noopener">${escHtml(name)}</a>` : `<span>${escHtml(name)}</span>`}
            <button type="button" title="Delete document" onclick="deleteSkuDocument('${row.ID}')">✕</button>
        </div>`;
    }).join("") : '<span class="sku-empty">No documents yet</span>';
}

async function uploadSkuDocuments(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length || !skuCtx) return;
    const context = { lot: skuCtx.lot, event: skuCtx.event };
    const input = skuEl("skuDocumentInput");
    try {
        const criteria = `(SKU == "${context.lot}" && Event == "${context.event}")`;
        const existing = await creatorGet(INV_CFG.skuDocumentReport, criteria);
        const remaining = Math.max(0, 10 - existing.length);
        if (files.length > remaining) {
            showCustomAlert(`You can upload ${remaining} more document(s) for this SKU (maximum 10).`);
            return;
        }
        showCustomAlert(`Uploading ${files.length} document(s)...`);
        for (const file of files) {
            const res = await creatorAdd(INV_CFG.skuDocumentForm, { SKU: context.lot, Event: context.event });
            const id = extractCreatorId(res);
            if (!id) throw new Error("document record not created");
            await ZOHO.CREATOR.FILE.uploadFile({
                app_name: INV_CFG.app, report_name: INV_CFG.skuDocumentReport,
                id: id, field_name: INV_CFG.skuDocumentField, file: file
            });
            await delay(500);
        }
        showCustomAlert("✅ Documents uploaded");
    } catch (err) {
        console.error("document upload failed", err);
        showCustomAlert("❌ Document upload failed");
    } finally {
        input.value = "";
        if (skuCtx && skuCtx.lot === context.lot && skuCtx.event === context.event) refreshSkuDetails();
    }
}

function deleteSkuDocument(id) {
    showConfirmDialog("Delete this document?", function () {
        creatorDelete(INV_CFG.skuDocumentReport, id).then(refreshSkuDetails);
    });
}
