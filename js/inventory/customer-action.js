// ============================================================================
// inventory/customer-action.js
// Locally stages customer visits for an inventory item before Save Item.
// ============================================================================

let customerActionItemIndex = null;
let customerActionCustomerList = null;
let customerActionChoices = null;

async function loadCustomerActionCustomers() {
    if (customerActionCustomerList) return customerActionCustomerList;
    const rows = await creatorGet(INV_CFG.customerActionReport);
    customerActionCustomerList = rows.map(row => ({
        id: row.ID,
        name: firstField(row, [INV_CFG.customerActionNameField])
    })).filter(customer => customer.id && customer.name)
        .sort((a, b) => a.name.localeCompare(b.name));
    return customerActionCustomerList;
}

async function openCustomerAction(index) {
    const record = (window.allInventoryData || [])[index];
    if (!record) return;
    customerActionItemIndex = index;
    const select = document.getElementById("customerActionName");
    const status = document.getElementById("customerActionLocalStatus");
    status.textContent = "";
    select.disabled = true;
    document.getElementById("customerActionPopup").style.display = "flex";
    try {
        const customers = await loadCustomerActionCustomers();
        if (customerActionChoices) {
            customerActionChoices.destroy();
            customerActionChoices = null;
        }
        select.innerHTML = '<option value="">Select Customer</option>' + customers.map(customer =>
            `<option value="${escHtml(customer.id)}">${escHtml(customer.name)}</option>`).join("");
        select.disabled = false;
        if (customers.length) {
            customerActionChoices = new Choices(select, {
                searchEnabled: true,
                shouldSort: false,
                itemSelectText: "",
                searchPlaceholderValue: "Search customers"
            });
        } else {
            status.textContent = "No customers were returned from All_Customers1.";
        }
    } catch (error) {
        console.error("Could not load customer report", error);
        status.textContent = "Could not load customers.";
        return;
    }
    document.getElementById("customerActionVisitDate").value = "";
    document.getElementById("customerActionComments").value = "";
    renderCustomerActionList(record);
}

function closeCustomerAction() {
    document.getElementById("customerActionPopup").style.display = "none";
    customerActionItemIndex = null;
}

function renderCustomerActionList(record) {
    const drafts = record._customerVisitDrafts || [];
    const body = document.getElementById("customerActionListBody");
    body.innerHTML = drafts.map((visit, index) => {
        const customer = (customerActionCustomerList || []).find(item => String(item.id) === String(visit.Customer_Name));
        return `<tr>
            <td>${escHtml(customer ? customer.name : visit.Customer_Name)}</td>
            <td>${escHtml(fromCreatorDate(visit.Visit_Date))}</td>
            <td class="customer-action-comment-cell">${escHtml(visit.Comments || "")}</td>
            <td><button type="button" class="customer-action-remove" title="Remove visit" aria-label="Remove visit" onclick="removeCustomerActionVisit(${index})">×</button></td>
        </tr>`;
    }).join("");
    document.getElementById("customerActionEmpty").hidden = drafts.length > 0;
}

function removeCustomerActionVisit(index) {
    const record = (window.allInventoryData || [])[customerActionItemIndex];
    if (!record || !record._customerVisitDrafts) return;
    record._customerVisitDrafts.splice(index, 1);
    renderCustomerActionList(record);
    renderInventoryTable(1);
}

function saveCustomerAction() {
    const customerId = document.getElementById("customerActionName").value;
    const visitDate = document.getElementById("customerActionVisitDate").value;
    const comments = document.getElementById("customerActionComments").value.trim();
    if (!customerId || !visitDate) {
        showCustomAlert("Please choose a customer and visit date.");
        return;
    }
    const record = (window.allInventoryData || [])[customerActionItemIndex];
    if (!record) return;
    if (!record._customerVisitDrafts) record._customerVisitDrafts = [];
    record._customerVisitDrafts.push({
        Customer_Name: customerId,
        Visit_Date: toCreatorDate(visitDate),
        Comments: comments
    });
    renderCustomerActionList(record);
    renderInventoryTable(1);
    document.getElementById("customerActionVisitDate").value = "";
    document.getElementById("customerActionComments").value = "";
    document.getElementById("customerActionLocalStatus").textContent = "Visit saved locally. Add another visit or close when finished.";
}

document.addEventListener("DOMContentLoaded", function () {
    const saveButton = document.getElementById("btnSaveCustomerAction");
    const cancelButton = document.getElementById("btnCancelCustomerAction");
    if (saveButton) saveButton.addEventListener("click", saveCustomerAction);
    if (cancelButton) cancelButton.addEventListener("click", closeCustomerAction);
});