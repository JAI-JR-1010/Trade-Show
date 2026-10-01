// ============================================================================
// trade-show/trade-show-dropdowns.js
// Overview form dropdowns: Responsible Team (Choices.js multi-select) and Country.
//
// Defines : teamChoices, teamSelectElement, initCountryDropdown
// Uses    : (nothing from other files)
// ============================================================================

// ==============================
// Resposible Team Dropdown with multi-select
// ==============================
let teamChoices;

document.addEventListener("DOMContentLoaded", function () {
    teamChoices = new Choices('#teamSelect', {
        removeItemButton: true,
        // placeholderValue: 'Select Responsible Team',
        searchEnabled: true
    });
});
// ==============================
// Responsible Team
// ==============================
const teamSelectElement = document.getElementById("teamSelect");
teamSelectElement.addEventListener("change", function () {
    const parent = this.closest(".expand-field");
    const selected = teamChoices.getValue(true).length;
    if (selected > 0) {
        parent.classList.add("active");
    } else {
        parent.classList.remove("active");
    }
});

// ==============================
// Country drop down
// ==============================
function initCountryDropdown() {
    const countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia",
        "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Belgium",
        "Bhutan", "Bolivia", "Brazil", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile",
        "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
        "Denmark", "Dominican Republic", "Ecuador", "Egypt", "Estonia", "Ethiopia", "Finland",
        "France", "Georgia", "Germany", "Ghana", "Greece", "Greenland", "Hungary", "Iceland",
        "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
        "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Laos", "Latvia", "Lebanon", "Lithuania",
        "Luxembourg", "Malaysia", "Maldives", "Mexico", "Mongolia", "Morocco", "Myanmar",
        "Nepal", "Netherlands", "New Zealand", "Nigeria", "North Korea", "Norway", "Oman",
        "Pakistan", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
        "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka",
        "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine", "United Arab Emirates",
        "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vietnam", "Yemen",
        "Zambia", "Zimbabwe"
    ];
    const input = document.getElementById("countryInput");
    const list = document.getElementById("countryList");
    function renderList(data) {
        list.innerHTML = "";
        data.forEach(country => {
            const div = document.createElement("div");
            div.classList.add("dropdown-item");
            div.textContent = country;

            div.onclick = () => {
                input.value = country;
                list.style.display = "none";
            };
            list.appendChild(div);
        });

        list.style.display = data.length ? "block" : "none";
    }
    input.addEventListener("click", function () {
        renderList(countries);
    });
    input.addEventListener("input", function () {
        const value = this.value.toLowerCase();
        if (value === "") {
            renderList(countries);
            return;
        }
        const filtered = countries.filter(c =>
            c.toLowerCase().includes(value)
        );
        renderList(filtered);
    });
    document.addEventListener("click", function (e) {
        if (!e.target.closest(".custom-dropdown")) {
            list.style.display = "none";
        }
    });
}
document.addEventListener("DOMContentLoaded", initCountryDropdown);
