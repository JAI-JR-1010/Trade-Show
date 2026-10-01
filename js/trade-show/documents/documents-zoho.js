// ============================================================================
// trade-show/documents/documents-zoho.js
// Zoho Creator file API calls: upload all queued files, upload one, delete one.
//
// Defines : uploadAllFiles, uploadFileToField, deleteFileFromField
// Uses    : (defined in other files)
//   core/common-utils.js  ->  delay
//   trade-show/documents/documents-queue.js  ->  setUploadProgress
//   trade-show/documents/documents-state.js  ->  additionalFiles, insuranceFiles, shippingFiles
// ============================================================================

async function uploadAllFiles(recordId) {
    console.log("🚀 Starting Sequential Upload...");
    const totalFiles = insuranceFiles.length + shippingFiles.length + additionalFiles.length;
    let uploadedCount = 0;
    setUploadProgress(uploadedCount, totalFiles);
    for (let file of insuranceFiles) {
        await uploadFileToField(recordId, "Insurance_Document", file);
        uploadedCount += 1;
        setUploadProgress(uploadedCount, totalFiles);
        await delay(500); // 👈 VERY IMPORTANT
    }
    for (let file of shippingFiles) {
        await uploadFileToField(recordId, "Shipping_Documents", file);
        uploadedCount += 1;
        setUploadProgress(uploadedCount, totalFiles);
        await delay(500);
    }
    for (let file of additionalFiles) {
        await uploadFileToField(recordId, "Additional_Documents", file);
        uploadedCount += 1;
        setUploadProgress(uploadedCount, totalFiles);
        await delay(500);
    }
    console.log("🎉 All uploads completed safely");
}

function uploadFileToField(recordId, fieldName, fileObject) {
    console.log("📤 Upload Start:", {
        recordId: recordId,
        fieldName: fieldName,
        fileName: fileObject.name,
        fileSizeKB: (fileObject.size / 1024).toFixed(1)
    });
    var config = {
        app_name: "feiny-app",
        report_name: "All_Trade_Show_Masters",
        id: recordId,
        field_name: fieldName,
        file: fileObject
    };
    return ZOHO.CREATOR.FILE.uploadFile(config)
        .then(function (response) {
            console.log("✅ Upload Success:", {
                fieldName: fieldName,
                fileName: fileObject.name,
                response: response
            });
            return response;
        })
        .catch(function (error) {
            console.error("❌ Upload Failed:", {
                fieldName: fieldName,
                fileName: fileObject.name,
                error: error
            });
            throw error;
        });
}
function deleteFileFromField(recordId, fieldName, filepath) {
    console.log("🗑️ Delete File Start:", {
        recordId: recordId,
        fieldName: fieldName,
        filepath: filepath
    });
    var config = {
        app_name: "feiny-app",
        report_name: "All_Trade_Show_Masters",
        id: recordId,
        field_name: fieldName
    };
    if (filepath) {
        config.filepath = filepath;
    }
    return ZOHO.CREATOR.FILE.deleteFile(config)
        .then(function (response) {
            console.log("✅ Delete File Success:", {
                fieldName: fieldName,
                filepath: filepath,
                response: response
            });
            return response;
        })
        .catch(function (error) {
            console.error("❌ Delete File Failed:", {
                fieldName: fieldName,
                filepath: filepath,
                error: error
            });
        });
}
