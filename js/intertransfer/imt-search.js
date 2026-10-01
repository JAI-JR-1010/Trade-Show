// ============================================================================
// intertransfer/imt-search.js
// Inter-Movement Tracking: multi-select lot search box and table filter.
//
// Defines : loadIMTSearchOptions, filterIMTTable, imtSearch, imtDropdown, imtSelectedContainer, lotNumbers, selectedLots, renderDropdown, renderTags, removeLot
// Uses    : (defined in other files)
//   intertransfer/imt-table.js  ->  renderIMTTable
// ============================================================================

// ====================== ===========================================================
// LOAD Item from the Active Events
// =================================================================================
function loadIMTSearchOptions(data) {
    const datalist =
        document.getElementById("imtLotList");
    if (!datalist) return;
    datalist.innerHTML = "";
    data.forEach(record => {
        const option =
            document.createElement("option");
        option.value = record.Lot || "";
        datalist.appendChild(option);
    });
}
// =================================================================================
// FILTER IMT TABLE
// =================================================================================
function filterIMTTable() {
    if (!selectedLots || selectedLots.length === 0) {
        window.filteredIMTData = window.allIMTData || [];
    } else {
        window.filteredIMTData = (window.allIMTData || []).filter(item => selectedLots.includes(item.Lot));
    }
    window.imtCurrentPage = 1;
    renderIMTTable(1);
}
const imtSearch = document.getElementById("imtLotSearch");
const imtDropdown = document.getElementById("imtLotDropdown");
const imtSelectedContainer = document.getElementById("imtSelectedContainer");
let lotNumbers = [];
let selectedLots = [];
function renderDropdown(filter = "") {
    if (!lotNumbers || lotNumbers.length === 0) {
        imtDropdown.innerHTML = "";
        imtDropdown.style.display = "none";
        return;
    }
    imtDropdown.innerHTML = "";
    const filtered = lotNumbers.filter(lot =>
        lot.toLowerCase().includes(filter.toLowerCase()) &&
        !selectedLots.includes(lot)
    );
    if (filtered.length === 0) {
        imtDropdown.style.display = "none";
        return;
    }
    filtered.forEach(lot => {
        const div = document.createElement("div");
        div.className = "imt-dropdown-item";
        div.textContent = lot;
        div.onclick = () => {
            selectedLots.push(lot);
            renderTags();
            imtSearch.value = "";
            renderDropdown();
            filterIMTTable();
        };
        imtDropdown.appendChild(div);
    });
    imtDropdown.style.display = "block";
}
function renderTags() {
    document.querySelectorAll(".imt-tag").forEach(tag => tag.remove());
    selectedLots.forEach(lot => {
        const tag = document.createElement("div");
        tag.className = "imt-tag";
        tag.innerHTML = `
            ${lot}
            <span onclick="removeLot('${lot}')">&times;</span>
        `;
        // imtSelectedContainer.insertBefore(tag, imtSearch);
        imtSelectedContainer.appendChild(tag);
    });
    imtSelectedContainer.appendChild(imtSearch);
}
function removeLot(lot) {
    selectedLots = selectedLots.filter(item => item !== lot);
    renderTags();
    renderDropdown();
    filterIMTTable();
}
imtSearch.addEventListener("focus", () => {
    renderDropdown(imtSearch.value);
});
imtSearch.addEventListener("input", () => {
    renderDropdown(imtSearch.value);
});
document.addEventListener("click", (e) => {
    if (!e.target.closest(".imt-search-wrap")) {
        imtDropdown.style.display = "none";
    }
});
