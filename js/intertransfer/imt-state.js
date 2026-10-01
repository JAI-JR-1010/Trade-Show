// ============================================================================
// intertransfer/imt-state.js
// Inter-Movement Tracking: shared state and pagination state.
//
// Defines : intertransferData
// Uses    : (nothing from other files)
// ============================================================================

let intertransferData = [];
window.imtCurrentPage = 1;
window.imtRowsPerPage = 10;
window.allIMTData = [];
window.filteredIMTData = [];
window.imtRowStates = {};
