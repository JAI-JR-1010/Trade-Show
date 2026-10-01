// ============================================================================
// trade-show/documents/documents-existing.js
// Existing (already saved) documents: parse, list, remove, toggle list.
//
// Defines : extractFilepathFromUrl, renderExistingDocuments, normalizeDocumentEntries, renderDocumentList, removeExistingDocument, parseDocumentField, extractFileName, toggleDocList
// Uses    : (defined in other files)
//   trade-show/documents/documents-queue.js  ->  removeQueuedFile
//   trade-show/documents/documents-state.js  ->  deletedDocFields, existingAdditionalDocs, existingInsuranceDocs, existingShippingDocs, initialAdditionalDocsCount, initialInsuranceDocsCount, initialShippingDocsCount, removedDocItems
// ============================================================================

function extractFilepathFromUrl(item) {
    if (!item) return "";
    let url = item;
    if (typeof item === "object") {
        url = item.download_url || item.file_url || item.url || item.content || item.filepath || item.File || item.file || "";
    }
    if (typeof url !== "string") return "";
    try {
        const decoded = decodeURIComponent(url);
        const match = decoded.match(/[?&]filepath=([^&]+)/i);
        if (match && match[1]) {
            return match[1];
        }
        const clean = decoded.split("?")[0];
        return clean.split("/").pop() || "";
    } catch (e) {
        return "";
    }
}
function renderExistingDocuments(record) {
    deletedDocFields = new Set();
    removedDocItems = [];
    existingInsuranceDocs = normalizeDocumentEntries(record.Insurance_Document);
    existingShippingDocs = normalizeDocumentEntries(record.Shipping_Documents);
    existingAdditionalDocs = normalizeDocumentEntries(record.Additional_Documents);
    initialInsuranceDocsCount = existingInsuranceDocs.length;
    initialShippingDocsCount = existingShippingDocs.length;
    initialAdditionalDocsCount = existingAdditionalDocs.length;
    renderDocumentList(existingInsuranceDocs, "insuranceDocsList", "insuranceCount", "insurance");
    renderDocumentList(existingShippingDocs, "shippingDocsList", "shippingCount", "shipping");
    renderDocumentList(existingAdditionalDocs, "additionalDocsList", "additionalCount", "additional");
}
function normalizeDocumentEntries(fileField) {
    if (!fileField) return [];
    if (Array.isArray(fileField)) {
        return fileField.filter(Boolean);
    }
    if (typeof fileField === "string") {
        return fileField.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (typeof fileField === "object") {
        return [fileField];
    }
    return [];
}
function renderDocumentList(entries, listId, countId, type) {
    const listElement = document.getElementById(listId);
    const countElement = document.getElementById(countId);
    if (!listElement || !countElement) return;
    const files = entries.map(item => parseDocumentField(item)).flat();
    listElement.innerHTML = "";
    countElement.innerText = `(${files.length})`;
    if (files.length === 0) {
        listElement.style.display = "none";
        return;
    }
    files.forEach((file, index) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.marginBottom = "8px";
        const nameSpan = document.createElement("span");
        nameSpan.textContent = file.name || "Document";
        nameSpan.style.color = "#333";
        nameSpan.style.fontSize = "13px";
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.innerHTML = "&times;";
        removeBtn.style.background = "none";
        removeBtn.style.border = "none";
        removeBtn.style.color = "#d32f2f";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.fontSize = "18px";
        removeBtn.style.lineHeight = "1";
        removeBtn.title = "Remove document";
        removeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (file.isQueued) {
                removeQueuedFile(type, file.queueIndex);
            } else {
                removeExistingDocument(type, index);
            }
        });
        li.appendChild(nameSpan);
        li.appendChild(removeBtn);
        listElement.appendChild(li);
    });
    listElement.style.display = "block";
}
function removeExistingDocument(type, index) {
    let fieldName = "";
    let docList = null;
    if (type === "insurance") {
        fieldName = "Insurance_Document";
        docList = existingInsuranceDocs;
    } else if (type === "shipping") {
        fieldName = "Shipping_Documents";
        docList = existingShippingDocs;
    } else if (type === "additional") {
        fieldName = "Additional_Documents";
        docList = existingAdditionalDocs;
    }

    if (docList && index >= 0 && index < docList.length) {
        const removedItem = docList.splice(index, 1)[0];
        const filepath = extractFilepathFromUrl(removedItem);
        removedDocItems.push({
            fieldName: fieldName,
            item: removedItem,
            filepath: filepath
        });
        if (typeof deletedDocFields !== "undefined") {
            deletedDocFields.add(fieldName);
        }
    }

    if (type === "insurance") {
        renderDocumentList(existingInsuranceDocs, "insuranceDocsList", "insuranceCount", "insurance");
    } else if (type === "shipping") {
        renderDocumentList(existingShippingDocs, "shippingDocsList", "shippingCount", "shipping");
    } else if (type === "additional") {
        renderDocumentList(existingAdditionalDocs, "additionalDocsList", "additionalCount", "additional");
    }
}
function parseDocumentField(fileField) {
    const urls = [];
    if (!fileField) return [];
    if (Array.isArray(fileField)) {
        fileField.forEach(entry => {
            if (!entry) return;
            if (typeof entry === "string") {
                const url = entry.trim();
                if (url) urls.push({ url, name: extractFileName(url) });
            } else if (typeof entry === "object") {
                if (entry.isQueued && entry.name) {
                    urls.push({ url: "", name: entry.name, isQueued: true, queueIndex: entry.queueIndex });
                } else {
                    const url = entry.download_url || entry.file_url || entry.url || entry.content || entry.File || entry.file || "";
                    if (url) {
                        const name = entry.file_name || entry.fileName || entry.name || entry.display_name || extractFileName(url);
                        urls.push({ url, name });
                    }
                }
            }
        });
    } else if (typeof fileField === "string") {
        fileField.split(",").map(s => s.trim()).filter(Boolean).forEach(url => {
            urls.push({ url, name: extractFileName(url) });
        });
    } else if (typeof fileField === "object") {
        if (fileField.isQueued && fileField.name) {
            urls.push({ url: "", name: fileField.name, isQueued: true, queueIndex: fileField.queueIndex });
        } else {
            const url = fileField.download_url || fileField.file_url || fileField.url || fileField.content || fileField.File || fileField.file || "";
            if (url) {
                const name = fileField.file_name || fileField.fileName || fileField.name || fileField.display_name || extractFileName(url);
                urls.push({ url, name });
            }
        }
    }
    return urls;
}
function extractFileName(url) {
    if (!url || typeof url !== "string") return "Download File";
    try {
        const decoded = decodeURIComponent(url);
        const filepathMatch = decoded.match(/[?&](?:filepath|filename|file)=([^&]+)/i);
        if (filepathMatch && filepathMatch[1]) {
            let name = filepathMatch[1].split("/").pop() || filepathMatch[1];
            name = name.replace(/^\d+_/, "");
            return name.replace(/\?.*$/, "") || "Download File";
        }
        let pathname = decoded;
        try {
            pathname = new URL(decoded, window.location.origin).pathname;
        } catch (ignored) {
            const parts = decoded.split("?")[0].split("/");
            pathname = parts.pop() || decoded;
        }
        let name = pathname.split("/").pop() || decoded;
        if (name) {
            name = name.replace(/^\d+_/, "");
            name = name.replace(/\?.*$/, "");
            return name;
        }
    } catch (error) {
        // ignore
    }
    return "Download File";
}

// ==============================
// Toggle Document Lists
// ==============================
function toggleDocList(listId) {
    const listElement = document.getElementById(listId);
    if (listElement) {
        if (listElement.style.display === "none") {
            listElement.style.display = "block";
        } else {
            listElement.style.display = "none";
        }
    }
}
