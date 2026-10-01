// ============================================================================
// core/ui-feedback.js
// Alerts and popups: toast alert, upload-countdown popup, saving overlay.
//
// Defines : showCustomAlert, showUploadPopup, updateUploadPopup, hideUploadPopup, showSavingPopup, hideSavingPopup
// Uses    : (nothing from other files)
// ============================================================================

// ==============================
// Custom Alert
// ==============================
function showCustomAlert(message) {
    let alertBox = document.getElementById("customAlertBox");
    if (!alertBox) {
        alertBox = document.createElement("div");
        alertBox.id = "customAlertBox";
        alertBox.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:6px;z-index:99999;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:none;text-align:center;min-width:250px;";
        document.body.appendChild(alertBox);
    }
    alertBox.innerText = message;
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}

// ==============================
// Upload Countdown Popup
// ==============================
function showUploadPopup(seconds) {
    let popup = document.getElementById("uploadPopup");
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "uploadPopup";
        popup.style.cssText = "position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);background:#fff;color:#222;padding:18px 22px;border-radius:8px;z-index:100000;box-shadow:0 8px 30px rgba(0,0,0,0.2);min-width:260px;text-align:center;font-size:15px;";
        const spinner = document.createElement('div');
        spinner.className = 'upload-spinner';
        spinner.style.cssText = 'width:36px;height:36px;border:4px solid #eee;border-top-color:#2b8aef;border-radius:50%;margin:0 auto 12px;animation:spin 1s linear infinite;';
        popup.appendChild(spinner);
        const msg = document.createElement('div');
        msg.id = 'uploadPopupMessage';
        popup.appendChild(msg);
        const style = document.createElement('style');
        style.innerHTML = '@keyframes spin {to {transform: rotate(360deg);}}';
        document.head.appendChild(style);
        document.body.appendChild(popup);
    }
    const msgEl = document.getElementById('uploadPopupMessage');
    msgEl.innerText = `Uploading documents... ${seconds}s remaining`;
    popup.style.display = 'block';
}
function updateUploadPopup(seconds) {
    const msgEl = document.getElementById('uploadPopupMessage');
    if (msgEl) msgEl.innerText = `Uploading documents... ${seconds}s remaining`;
}
function hideUploadPopup() {
    const popup = document.getElementById('uploadPopup');
    if (popup) popup.style.display = 'none';
}

function showSavingPopup(message = "Saving Items...") {
    document.getElementById("savingText")
        .innerText = message;
    document.getElementById("savingOverlay")
        .style.display = "flex";
}
function hideSavingPopup() {
    document.getElementById("savingOverlay")
        .style.display = "none";
}
