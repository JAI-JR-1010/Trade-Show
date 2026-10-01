// ============================================================================
// trade-show/trade-show-form.js
// Overview form: TS-ID generation, save/update, clear, edit, cancel.
//
// Defines : getCurrentTSIDFromServer, saveBtn, clearForm, editTradeShow, cancelBtn
// Uses    : (defined in other files)
//   core/common-utils.js  ->  delay
//   core/date-utils.js  ->  formatDate, getISOFormat
//   core/navigation.js  ->  showMainSection
//   core/ui-feedback.js  ->  hideUploadPopup, showCustomAlert, showUploadPopup, updateUploadPopup
//   inventory/event-selector.js  ->  loadPlannedEvents
//   trade-show/documents/documents-existing.js  ->  renderExistingDocuments
//   trade-show/documents/documents-state.js  ->  additionalFiles, deletedDocFields, existingAdditionalDocs, existingInsuranceDocs, existingShippingDocs, initialAdditionalDocsCount, initialInsuranceDocsCount, initialShippingDocsCount, insuranceFiles, removedDocItems, resetFileStorage, shippingFiles
//   trade-show/documents/documents-zoho.js  ->  deleteFileFromField, uploadAllFiles
//   trade-show/trade-show-dropdowns.js  ->  teamChoices
//   trade-show/trade-show-history.js  ->  loadEventHistory
// ============================================================================

// ==============================
// AUTO GENERATE TS ID
// ==============================
function getCurrentTSIDFromServer() {
    return ZOHO.CREATOR.DATA.getRecords({
        app_name: "feiny-app",
        report_name: "All_Trade_Show_Masters",
        page: 1,
        per_page: 200
    }).then(function (response) {
        let data = response.data;
        let year = new Date().getFullYear().toString().slice(-2);
        let prefix = year + "-TS-";
        if (!data || data.length === 0) {
            return prefix + "001";
        }
        let maxNumber = 0;
        data.forEach(record => {
            let tsid = record.Trade_Show_ID;
            if (tsid && tsid.startsWith(prefix)) {
                let num = parseInt(tsid.replace(prefix, ""));
                if (num > maxNumber) {
                    maxNumber = num;
                }
            }
        });
        let nextNumber = maxNumber + 1;
        let formatted = String(nextNumber).padStart(3, '0');
        return prefix + formatted;
    }).catch(function (error) {
        console.log("Error fetching TSID:", error);
        let year = new Date().getFullYear().toString().slice(-2);
        return year + "-TS-001";
    });
}

// ==============================
// SAVE DATA
// ==============================
function saveBtn() {
    console.log("saveBtn Function Triggered");
    // Get values from your HTML fields
    var tsid = document.getElementById("tsid").value;
    var tsname = document.getElementById("tsname").value;
    var tscode = document.getElementById("tscode").value;
    var tslocation = document.getElementById("tslcode").value;
    var country = document.getElementById("countryInput").value;
    var city = document.getElementById("city").value;
    var venue = document.getElementById("vname").value;
    var address = document.getElementById("vaddress").value;
    var booth = document.getElementById("boothno").value;
    var startdateRaw = document.getElementById("startdate").value;
    var startdatecon = formatDate(startdateRaw);
    var startdate = startdatecon;
    var enddateraw = document.getElementById("enddate").value;
    var enddatecon = formatDate(enddateraw);
    var enddate = enddatecon;
    var eventstatus = document.getElementById("eventstatus").value;
    var teamSelect = document.getElementById("teamSelect");
    var notes = document.getElementById("notes").value;
    if (!tsname) return showCustomAlert("Trade Show Name is required");
    if (!booth) return showCustomAlert("Booth Number is required");
    if (!startdate) return showCustomAlert("Start Date is required");
    if (!enddate) return showCustomAlert("End Date is required");
    if (!eventstatus) return showCustomAlert("Event Status is required");
    var respteamText = [];
    for (let option of teamSelect.selectedOptions) {
        respteamText.push(option.text);
    }
    if (respteamText.length === 0) {
        return showCustomAlert("Responsible Team is required");
    }
    var respteam = respteamText.join(",\n");
    console.log(respteam);
    // Payload Data
    var payloadData = {
        "Trade_Show_ID": tsid,
        "Trade_Show_Name": tsname,
        "Trade_Show_Code": tscode,
        "Trade_Show_Location": tslocation,
        "Country": country,
        "City": city,
        "Venue_Name": venue,
        "Event_Status": eventstatus,
        "Venue_Address": address,
        "Booth_Number": booth,
        "Start_Date": startdate,
        "End_Date": enddate,
        "Responsible_Team": respteam,
        "Notes": notes
    };
    if (window.currentEditRecordId) {
        var recordToUpdateId = window.currentEditRecordId;
        var needsInsuranceDelete = (typeof deletedDocFields !== "undefined" && deletedDocFields.has("Insurance_Document")) || (typeof existingInsuranceDocs !== "undefined" && typeof initialInsuranceDocsCount !== "undefined" && existingInsuranceDocs.length < initialInsuranceDocsCount);
        var needsShippingDelete = (typeof deletedDocFields !== "undefined" && deletedDocFields.has("Shipping_Documents")) || (typeof existingShippingDocs !== "undefined" && typeof initialShippingDocsCount !== "undefined" && existingShippingDocs.length < initialShippingDocsCount);
        var needsAdditionalDelete = (typeof deletedDocFields !== "undefined" && deletedDocFields.has("Additional_Documents")) || (typeof existingAdditionalDocs !== "undefined" && typeof initialAdditionalDocsCount !== "undefined" && existingAdditionalDocs.length < initialAdditionalDocsCount);

        var updateConfig = {
            app_name: "feiny-app",
            report_name: "All_Trade_Show_Masters",
            id: recordToUpdateId,
            payload: { "data": payloadData }
        };
        ZOHO.CREATOR.DATA.updateRecordById(updateConfig).then(async function (response) {
            console.log("Update Response:", response);
            if (response.code == 3000) {
                // Delete files in Creator if existing files were removed
                try {
                    if (removedDocItems && removedDocItems.length > 0) {
                        for (let item of removedDocItems) {
                            await deleteFileFromField(recordToUpdateId, item.fieldName, item.filepath);
                            await delay(300);
                        }
                    }
                    if (typeof existingInsuranceDocs !== "undefined" && typeof initialInsuranceDocsCount !== "undefined" && initialInsuranceDocsCount > 0 && existingInsuranceDocs.length === 0) {
                        await deleteFileFromField(recordToUpdateId, "Insurance_Document");
                    }
                    if (typeof existingShippingDocs !== "undefined" && typeof initialShippingDocsCount !== "undefined" && initialShippingDocsCount > 0 && existingShippingDocs.length === 0) {
                        await deleteFileFromField(recordToUpdateId, "Shipping_Documents");
                    }
                    if (typeof existingAdditionalDocs !== "undefined" && typeof initialAdditionalDocsCount !== "undefined" && initialAdditionalDocsCount > 0 && existingAdditionalDocs.length === 0) {
                        await deleteFileFromField(recordToUpdateId, "Additional_Documents");
                    }
                } catch (delErr) {
                    console.error("Error deleting file:", delErr);
                }
                // Show upload countdown popup if there are files to upload
                const totalFiles = insuranceFiles.length + shippingFiles.length + additionalFiles.length;
                let countdownInterval = null;
                if (totalFiles > 0) {
                    let seconds = Math.max(3, Math.ceil(totalFiles * 2));
                    showUploadPopup(seconds);
                    countdownInterval = setInterval(() => {
                        seconds -= 1;
                        if (seconds <= 0) {
                            updateUploadPopup(0);
                        } else {
                            updateUploadPopup(seconds);
                        }
                    }, 1000);
                }
                try {
                    await uploadAllFiles(recordToUpdateId);
                    showCustomAlert("✅ Trade Show Updated Successfully");
                } catch (err) {
                    console.error('Upload error:', err);
                    showCustomAlert("❌ Error while uploading files");
                } finally {
                    if (countdownInterval) clearInterval(countdownInterval);
                    hideUploadPopup();
                }
                clearForm();
                resetFileStorage();
                let newTsid = await getCurrentTSIDFromServer();
                document.getElementById("tsid").value = newTsid;
                loadEventHistory();
                loadPlannedEvents();
            } else {
                showCustomAlert("❌ Error while updating");
            }
        }).catch(function (error) {
            console.log("Error:", error);
        });
    } else {
        var config = {
            app_name: "feiny-app",
            form_name: "Trade_Show_Master",
            payload: { "data": payloadData }
        };
        // Save to Creator
        ZOHO.CREATOR.DATA.addRecords(config).then(async function (response) {
            console.log("Response:", response);
            if (response.code == 3000) {
                let recordId = response.data.ID;
                // Show upload countdown popup if there are files to upload
                const totalFiles = insuranceFiles.length + shippingFiles.length + additionalFiles.length;
                let countdownInterval = null;
                if (totalFiles > 0) {
                    let seconds = Math.max(3, Math.ceil(totalFiles * 2));
                    showUploadPopup(seconds);
                    countdownInterval = setInterval(() => {
                        seconds -= 1;
                        if (seconds <= 0) {
                            updateUploadPopup(0);
                        } else {
                            updateUploadPopup(seconds);
                        }
                    }, 1000);
                }
                try {
                    await uploadAllFiles(recordId);
                    showCustomAlert("✅ Trade Show Saved Successfully");
                } catch (err) {
                    console.error('Upload error:', err);
                    showCustomAlert("❌ Error while uploading files");
                } finally {
                    if (countdownInterval) clearInterval(countdownInterval);
                    hideUploadPopup();
                }
                clearForm();
                resetFileStorage();
                let newTsid = await getCurrentTSIDFromServer();
                document.getElementById("tsid").value = newTsid;
                loadEventHistory();
                loadPlannedEvents();
            } else {
                showCustomAlert("❌ Error while saving");
            }
        }).catch(function (error) {
            console.log("Error:", error);
        });
    } 2
}

// ==============================
// Clear the Form
// ==============================
function clearForm() {
    window.currentEditRecordId = null;
    document.getElementById("tsid").value = "";
    document.getElementById("tsname").value = "";
    document.getElementById("tscode").value = "";
    document.getElementById("tslcode").value = "";
    document.getElementById("countryInput").value = "";
    document.getElementById("city").value = "";
    document.getElementById("vname").value = "";
    document.getElementById("vaddress").value = "";
    document.getElementById("boothno").value = "";
    document.getElementById("startdate").value = "";
    document.getElementById("enddate").value = "";
    document.getElementById("notes").value = "";
    document.getElementById("eventstatus").selectedIndex = 0;
    // Clear multi-select
    if (teamChoices) {
        teamChoices.removeActiveItems();
    }
    // Remove expand UI class
    const parent = document.getElementById("teamSelect").closest(".expand-field");
    if (parent) {
        parent.classList.remove("active");
    }
}

function editTradeShow(id) {
    const record = window.allEventHistoryData.find(r => r.ID === id);
    if (!record) return;
    if (record.Event_Status !== "Planned") {
        showCustomAlert("Only Planned events can be edited.");
        return;
    }
    window.currentEditRecordId = id;
    document.getElementById("tsid").value = record.Trade_Show_ID || "";
    document.getElementById("tsname").value = record.Trade_Show_Name || "";
    document.getElementById("tscode").value = record.Trade_Show_Code || "";
    document.getElementById("tslcode").value = record.Trade_Show_Location || "";
    document.getElementById("countryInput").value = record.Country || "";
    document.getElementById("city").value = record.City || "";
    document.getElementById("vname").value = record.Venue_Name || "";
    document.getElementById("vaddress").value = record.Venue_Address || "";
    document.getElementById("boothno").value = record.Booth_Number || "";
    if (record.Event_Status) {
        document.getElementById("eventstatus").value = record.Event_Status;
    }
    document.getElementById("startdate").value = getISOFormat(record.Start_Date);
    document.getElementById("enddate").value = getISOFormat(record.End_Date);
    document.getElementById("notes").value = record.Notes || "";
    if (teamChoices) {
        teamChoices.removeActiveItems();
        if (record.Responsible_Team) {
            let teams = record.Responsible_Team.split(/,\s*|\n/).map(t => t.trim()).filter(t => t);
            let valuesToSet = [];
            let textToValue = { "DUB": "option1", "JP": "option2", "NY": "option3" };
            teams.forEach(t => {
                if (textToValue[t]) valuesToSet.push(textToValue[t]);
            });
            teamChoices.setChoiceByValue(valuesToSet);
            const parent = document.getElementById("teamSelect").closest(".expand-field");
            if (parent) parent.classList.add("active");
        }
    }
    renderExistingDocuments(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const overviewTab = document.querySelector(".main-tab[onclick*='overview']");
    if (overviewTab) showMainSection(overviewTab, 'overview');
}

function cancelBtn() {
    clearForm();
    resetFileStorage();
    getCurrentTSIDFromServer().then(tsid => {
        document.getElementById("tsid").value = tsid;
    });
}
