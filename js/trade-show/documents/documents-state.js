// ============================================================================
// trade-show/documents/documents-state.js
// Document state: queued files, existing files, deletion tracking, reset.
//
// Defines : insuranceFiles, shippingFiles, additionalFiles, existingInsuranceDocs, existingShippingDocs, existingAdditionalDocs, initialInsuranceDocsCount, initialShippingDocsCount, initialAdditionalDocsCount, deletedDocFields, removedDocItems, resetFileStorage, filePayload
// Uses    : (defined in other files)
//   trade-show/documents/documents-queue.js  ->  clearUploadStatusPanel
// ============================================================================

let insuranceFiles = [];
let shippingFiles = [];
let additionalFiles = [];
let existingInsuranceDocs = [];
let existingShippingDocs = [];
let existingAdditionalDocs = [];
let initialInsuranceDocsCount = 0;
let initialShippingDocsCount = 0;
let initialAdditionalDocsCount = 0;

let deletedDocFields = new Set();
let removedDocItems = [];

function resetFileStorage() {
    insuranceFiles = [];
    shippingFiles = [];
    additionalFiles = [];
    document.getElementById("insuranceDocsList").innerHTML = "";
    document.getElementById("shippingDocsList").innerHTML = "";
    document.getElementById("additionalDocsList").innerHTML = "";
    document.getElementById("insuranceCount").innerText = "(0)";
    document.getElementById("shippingCount").innerText = "(0)";
    document.getElementById("additionalCount").innerText = "(0)";
    existingInsuranceDocs = [];
    existingShippingDocs = [];
    existingAdditionalDocs = [];
    initialInsuranceDocsCount = 0;
    initialShippingDocsCount = 0;
    initialAdditionalDocsCount = 0;
    if (typeof deletedDocFields !== "undefined") {
        deletedDocFields = new Set();
    }
    removedDocItems = [];
    clearUploadStatusPanel();
}

let filePayload = {};
if (insuranceFiles.length > 0) {
    filePayload["Insurance_Document"] = insuranceFiles;
}
if (shippingFiles.length > 0) {
    filePayload["Shipping_Documents"] = shippingFiles;
}
if (additionalFiles.length > 0) {
    filePayload["Additional_Documents"] = additionalFiles;
}
console.log(filePayload);
