// ============================================================================
// intertransfer/imt-user.js
// Inter-Movement Tracking: logged-in user + user master lookup (runs at load).
//
// Defines : loginuserid, loginUserName, loginUserLocation, loginUserInitPromise, loadLoginUserHandoverData
// Uses    : (nothing from other files)
// ============================================================================

let loginuserid = "";
let loginUserName = "";
let loginUserLocation = "";
let loginUserInitPromise = loadLoginUserHandoverData();

function loadLoginUserHandoverData() {
    return ZOHO.CREATOR.UTIL.getInitParams()
        .then(function (initParams) {
            console.log("🔥 USER RESPONSE:", initParams);
            loginuserid = (initParams.loginUser || "").toLowerCase();
            if (!loginuserid) {
                return;
            }
            return ZOHO.CREATOR.DATA.getRecords({
                app_name: "feiny-app",
                report_name: "All_User_Masters",
                field_config: "custom",
                fields: "User_Name,Email,Department,Location,Status"
            })
                .then(function (response) {
                    console.log("User Master Response:", response);
                    const users = response.data || [];
                    const matchedUser = users.find(function (rec) {
                        return (rec.Email || "").toLowerCase().trim() === loginuserid;
                    });

                    if (matchedUser) {
                        console.log("Matched User:", matchedUser);
                        loginUserName = matchedUser.User_Name || "";
                        loginUserLocation = matchedUser.Location || "";
                    } else {
                        console.log("No matching email found in User Master");
                        loginUserName = loginuserid;
                    }
                })
                .catch(function (error) {
                    console.log("User Master Fetch Error:", error);
                    loginUserName = loginuserid;
                });
        })
        .catch(function (error) {
            console.log("❌ USER ERROR:", error);
        });
}
