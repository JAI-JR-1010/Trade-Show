// ============================================================================
// inventory/event-selector.js
// Inventory: Status -> Event Name dropdown (Choices.js) and planned-event loading.
//
// Defines : eventChoices, allEventData, filterEventDropdown, loadPlannedEvents
// Uses    : (defined in other files)
//   core/ui-feedback.js  ->  showCustomAlert
//   inventory/inventory-table.js  ->  renderInventoryTable
// ============================================================================

// =========================================
// Event Name Autopopulate Based on Status
// =========================================
let eventChoices;
let allEventData = [];
function filterEventDropdown() {
    const eventDropdown = document.getElementById("eventName");
    const statusSelect = document.getElementById("statusSelect");
    if (!eventDropdown) return;
    // Use selected status, or empty if not yet selected
    const selectedStatus = (statusSelect && statusSelect.value && statusSelect.value !== "Select Status")
        ? statusSelect.value
        : "";
    let currentValue = eventDropdown.value;
    if (typeof eventChoices !== "undefined" && eventChoices) {
        currentValue = eventChoices.getValue(true);
        eventChoices.destroy();
    }
    eventDropdown.innerHTML = '<option value="">Select Event</option>';
    // Only populate if a status is explicitly selected
    if (selectedStatus && allEventData && allEventData.length > 0) {
        const filteredEvents = allEventData.filter(r => r.Event_Status === selectedStatus);
        filteredEvents.forEach(record => {
            if (record.Trade_Show_Name) {
                const option = document.createElement("option");
                option.value = record.Trade_Show_Name;
                option.textContent = record.Trade_Show_Name;
                if (record.Trade_Show_Name === currentValue) {
                    option.selected = true;
                }
                eventDropdown.appendChild(option);
            }
        });
    }
    eventChoices = new Choices(eventDropdown, {
        searchEnabled: true,
        shouldSort: false,
        removeItemButton: true
    });
    // existing
    eventDropdown.addEventListener("change", function () {
        if (!this.value || this.value === "") {
            window.allInventoryData = [];
            renderInventoryTable(1);
            console.log("Table cleared because event was removed");
        }
    });
    // 🔥 ADD THIS
    eventDropdown.addEventListener('removeItem', function () {
        window.allInventoryData = [];
        renderInventoryTable(1);
        console.log("Table cleared (removeItem event)");
    });
}
function loadPlannedEvents() {
    var config = {
        app_name: "feiny-app",
        report_name: "All_Trade_Show_Masters"
    };
    ZOHO.CREATOR.DATA.getRecords(config)
        .then(function (response) {
            console.log("Records for Events:", response);
            const data = response.data || [];
            allEventData = data; // Save global reference
            // Populate dropdown initially based on current status
            filterEventDropdown();
        })
        .catch(function (error) {
            console.log("Error loading events:", error);
        });
}
// Map the dropdown to change dynamically
document.addEventListener("DOMContentLoaded", function () {
    const statusSelect = document.getElementById("statusSelect");
    if (statusSelect) {
        statusSelect.addEventListener("change", filterEventDropdown);
    }
    statusSelect.addEventListener("change", function () {
        window.allInventoryData = [];
        renderInventoryTable(1);
        console.log(" Table cleared because status changed");
    });
});
//  Validation: Prevent interaction with Event Name if Status is not selected
document.addEventListener("click", function (e) {
    if (e.target.closest(".choices") && e.target.closest(".choices").querySelector("#eventName")) {
        const statusSelect = document.getElementById("statusSelect");
        if (!statusSelect || !statusSelect.value || statusSelect.value === "Select Status") {
            showCustomAlert("Please select an Event Status first.");
            if (typeof eventChoices !== "undefined" && eventChoices) {
                eventChoices.hideDropdown();
            }
            e.stopPropagation();
        }
    }
});
