// ============================================================================
// inventory/inventory-config.js
// Inventory: one place for the Creator object names and Lot Master field names
// used by the Trade Show list changes (grouping, editing, selections, SKU details).
//
// !! CHECK THESE AGAINST YOUR CREATOR APP. Anything marked ASSUMED was not in the
// !! original code, so confirm the spelling in Creator and edit it here only.
//
// Defines : INV_CFG
// Uses    : (nothing from other files)
// ============================================================================

window.INV_CFG = {
    app: "feiny-app",

    // ---- Existing objects ----
    inventoryReport: "All_Inventory_Items",
    customerActionReport: "All_Customers1",
    customerActionNameField: "Legal_Name",

    // ---- New objects (ASSUMED names - create these in Creator, Step 0 of roadmap) ----
    selectionForm: "Selection",
    selectionReport: "All_Selections",
    selectionItemForm: "Selection_Items",
    selectionItemReport: "All_Selection_Items",
    customerReport: "All_Customers",              // ASSUMED: your customer master report
    customerNameFields: ["Customer_Name", "Name", "Company_Name"],

    skuNoteForm: "SKU_Notes",       skuNoteReport: "All_SKU_Notes",
    skuImageForm: "SKU_Images",     skuImageReport: "All_SKU_Images",
    skuImageField: "Image",         // file-upload field on SKU_Images
    skuDocumentForm: "SKU_Documents", skuDocumentReport: "All_SKU_Documents",
    skuDocumentField: "Document",

    // ---- Lot Master field candidates (first non-empty one wins) ----
    // ASSUMED names. The requirement is ON-HAND, not stock, so Stock_On_Hand is NOT a fallback for pcs.
    onHandPcsFields: ["On_Hand_Pcs", "On_Hand_Qty", "On_Hand", "Qty_On_Hand"],
    onHandWeightFields: ["On_Hand_Weight", "On_Hand_Weight_Ct", "Weight_Ct", "Weight_grams", "weight"],
    categoryFields: ["Category1"],
    speciesFields: ["Species", "Stone_Species", "Stone_Type", "Gemstone"],

    // ---- Display order of categories (anything else follows alphabetically) ----
    categoryOrder: ["Diamond", "Jewelry", "Color Stone"],

    // ---- Total rule: Price x Weight when weight > 0, otherwise Price x Pcs ----
    // Change recalcTotal() in inventory-model.js if FEI prices differently.
    editableEventStatuses: ["Planned", "Active"]
};
