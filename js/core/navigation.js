// ============================================================================
// core/navigation.js
// Tab switching: inner tabs (Event/Documents) and top-level section tabs.
//
// Defines : showTab, showMainSection
// Uses    : (defined in other files)
//   intertransfer/imt-load.js  ->  loadActiveEventName, loadIntertransferItems
//   inventory/event-selector.js  ->  loadPlannedEvents
// ============================================================================

// ==============================
// Hide the in Active Tabs
// ==============================
function showTab(tabElement, tabId) {
    const tabContainer = tabElement.parentElement;
    const tabs = tabContainer.querySelectorAll(".tab");
    tabs.forEach(tab => tab.classList.remove("active"));
    const contents = document.querySelectorAll(".tab-content");
    contents.forEach(content => content.classList.remove("active"));
    tabElement.classList.add("active");
    document.getElementById(tabId).classList.add("active");
}
// ==============================
// Top Tabs Section
// ==============================
function showMainSection(tabElement, sectionId) {
    const tabs = document.querySelectorAll(".main-tab");
    const sections = document.querySelectorAll(".main-section");
    tabs.forEach(tab => tab.classList.remove("active"));
    sections.forEach(sec => sec.classList.remove("active"));
    tabElement.classList.add("active");
    document.getElementById(sectionId).classList.add("active");
    if (sectionId === "inventory-section") {
        console.log("📦 Inventory opened → loading planned events");
        loadPlannedEvents();
    }
    if (sectionId === "intertransfer-section") {
        console.log("🔄 Intertransfer opened");
        loadActiveEventName().then(() => {
            loadIntertransferItems();
        });
    }
}
