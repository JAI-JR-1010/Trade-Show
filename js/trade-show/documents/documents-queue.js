// ============================================================================
// trade-show/documents/documents-queue.js
// Documents tab: add files to upload queue, queue panel, progress bar.
//
// Defines : handleDocumentUpload, renderCombinedDocumentList, getExistingDocs, getQueuedFiles, renderUploadQueue, setUploadProgress, clearUploadStatusPanel, removeQueuedFile
// Uses    : (defined in other files)
//   core/ui-feedback.js  ->  showCustomAlert
//   trade-show/documents/documents-existing.js  ->  renderDocumentList
//   trade-show/documents/documents-state.js  ->  additionalFiles, existingAdditionalDocs, existingInsuranceDocs, existingShippingDocs, insuranceFiles, shippingFiles
// ============================================================================

// ==============================
// Handle Document Uploads
// ==============================
function handleDocumentUpload() {
    const docNameInput = document.getElementById("docNameInput");
    const docName = docNameInput ? docNameInput.value.trim() : "";
    const fileUpload1 = document.getElementById("fileUpload1");
    if (!docName || docName === "Select Document Name") {
        showCustomAlert("Please select a Document Name.");
        return;
    }
    let targetListId = "";
    let targetCountId = "";
    let fileArray = [];
    let existingDocs = [];
    let docType = "";
    if (docName.toLowerCase() === "insurance document") {
        targetListId = "insuranceDocsList";
        targetCountId = "insuranceCount";
        fileArray = insuranceFiles;
        existingDocs = existingInsuranceDocs;
        docType = "insurance";
    } else if (docName.toLowerCase() === "shipping documents") {
        targetListId = "shippingDocsList";
        targetCountId = "shippingCount";
        fileArray = shippingFiles;
        existingDocs = existingShippingDocs;
        docType = "shipping";
    } else if (docName.toLowerCase() === "additional documents") {
        targetListId = "additionalDocsList";
        targetCountId = "additionalCount";
        fileArray = additionalFiles;
        existingDocs = existingAdditionalDocs;
        docType = "additional";
    } else {
        showCustomAlert("Document Name is invalid.");
        return;
    }
    const targetList = document.getElementById(targetListId);
    if (!targetList) return;
    let filesAdded = false;
    let limitExceeded = false;
    function appendSelectedFiles(inputElement) {
        if (inputElement && inputElement.files && inputElement.files.length > 0) {
            const existingCount = existingDocs.length + fileArray.length;
            const newFiles = Array.from(inputElement.files);
            if (existingCount + newFiles.length > 10) {
                showCustomAlert(`You can upload a maximum of 10 files for ${docName}. Current count is ${existingCount}, selected ${newFiles.length}.`);
                inputElement.value = "";
                limitExceeded = true;
                return;
            }
            newFiles.forEach(file => {
                fileArray.push(file); // store file
                filesAdded = true;
            });
            inputElement.value = "";
            renderCombinedDocumentList(docType, targetListId, targetCountId);
        }
    }
    appendSelectedFiles(fileUpload1);
    if (filesAdded) {
        renderUploadQueue();
        showCustomAlert("Documents added successfully to " + docName);
        docNameInput.value = ""; // Reset dropdown
    } else if (!limitExceeded) {
        showCustomAlert("Please select at least one file to upload.");
    }
}
function renderCombinedDocumentList(type, listId, countId) {
    const existingDocs = getExistingDocs(type);
    const queuedFiles = getQueuedFiles(type).map((file, index) => ({ isQueued: true, queueIndex: index, name: file.name }));
    const combined = [...existingDocs, ...queuedFiles];
    renderDocumentList(combined, listId, countId, type);
}
function getExistingDocs(type) {
    if (type === "insurance") return existingInsuranceDocs;
    if (type === "shipping") return existingShippingDocs;
    if (type === "additional") return existingAdditionalDocs;
    return [];
}
function getQueuedFiles(type) {
    if (type === "insurance") return insuranceFiles;
    if (type === "shipping") return shippingFiles;
    if (type === "additional") return additionalFiles;
    return [];
}
function renderUploadQueue() {
    const panel = document.getElementById("uploadStatusPanel");
    const message = document.getElementById("uploadStatusMessage");
    const summary = document.getElementById("uploadStatusSummary");
    const fileList = document.getElementById("uploadStatusFileList");
    if (!panel || !message || !summary || !fileList) return;
    const allFiles = [
        ...insuranceFiles.map(file => ({ category: "Insurance", file })),
        ...shippingFiles.map(file => ({ category: "Shipping", file })),
        ...additionalFiles.map(file => ({ category: "Additional", file }))
    ];
    if (allFiles.length === 0) {
        panel.style.display = "none";
        return;
    }
    panel.style.display = "block";
    message.innerText = `Queued ${allFiles.length} file${allFiles.length === 1 ? "" : "s"} for upload`;
    summary.innerText = allFiles.map(item => item.category).filter((value, index, self) => self.indexOf(value) === index).join(" · ");
    fileList.innerHTML = "";
    allFiles.forEach(function (item, index) {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        li.style.marginBottom = "8px";
        const fileName = document.createElement("span");
        fileName.textContent = item.file.name;
        const statusBadge = document.createElement("span");
        statusBadge.className = "status-badge";
        statusBadge.innerText = item.category;
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.innerHTML = "&times;";
        removeBtn.style.background = "none";
        removeBtn.style.border = "none";
        removeBtn.style.color = "#d32f2f";
        removeBtn.style.cursor = "pointer";
        removeBtn.style.fontSize = "18px";
        removeBtn.style.lineHeight = "1";
        removeBtn.title = "Remove queued file";
        removeBtn.addEventListener("click", function () {
            removeQueuedFile(item.category.toLowerCase(), index);
        });
        li.appendChild(fileName);
        li.appendChild(statusBadge);
        li.appendChild(removeBtn);
        fileList.appendChild(li);
    });
    setUploadProgress(0, allFiles.length);
}
function setUploadProgress(completed, total) {
    const progressBar = document.getElementById("uploadProgressBar");
    const summary = document.getElementById("uploadStatusSummary");
    const message = document.getElementById("uploadStatusMessage");
    if (!progressBar || !summary || !message) return;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    progressBar.style.width = `${percent}%`;
    summary.innerText = total === 0 ? "No files queued." : `${completed} of ${total} uploaded — ${percent}%`;
    if (completed === total && total > 0) {
        message.innerText = "Upload completed";
    }
}
function clearUploadStatusPanel() {
    const panel = document.getElementById("uploadStatusPanel");
    if (panel) panel.style.display = "none";
    const fileList = document.getElementById("uploadStatusFileList");
    if (fileList) fileList.innerHTML = "";
    setUploadProgress(0, 0);
}
function removeQueuedFile(type, index) {
    let fileArray = [];
    if (type === "insurance") {
        fileArray = insuranceFiles;
    } else if (type === "shipping") {
        fileArray = shippingFiles;
    } else if (type === "additional") {
        fileArray = additionalFiles;
    }
    if (!fileArray || index < 0 || index >= fileArray.length) return;
    fileArray.splice(index, 1);
    renderUploadQueue();
}
