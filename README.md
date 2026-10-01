# Trade Show Master - project structure

Code is unchanged from the original `script.js`, `imt.js` and `style.css`; it was only
split into files by feature. Everything is plain JS/CSS (no build step, no modules).

**Load order matters.** JS files share global scope and CSS rules override earlier rules.
The order is defined by the `<script>` / `<link>` tags in `trade_show_master.html`. Do not reorder.

## Where do I change...?

| I want to change...                               | Open                                                    |
|---------------------------------------------------|---------------------------------------------------------|
| Alert / popup messages                            | js/core/ui-feedback.js                                  |
| Pagination buttons (logic / look)                 | js/core/pagination.js / css/components/pagination.css   |
| Date formats                                      | js/core/date-utils.js                                   |
| Tab switching                                     | js/core/navigation.js, css/components/tabs.css, main-tabs.css |
| What loads on startup                             | js/core/app-init.js                                     |
| Trade Show form: save / edit / clear / TS-ID      | js/trade-show/trade-show-form.js                        |
| Responsible Team / Country dropdowns              | js/trade-show/trade-show-dropdowns.js                   |
| Event history table (Overview)                    | js/trade-show/trade-show-history.js, css/trade-show/event-history.css |
| Document upload / delete / lists                  | js/trade-show/documents/*                               |
| Inventory: Status -> Event dropdown               | js/inventory/event-selector.js                          |
| Inventory: lot auto-fill, certificates            | js/inventory/lot-master.js                              |
| Inventory table                                   | js/inventory/inventory-table.js, css/inventory/inventory-table.css |
| Scan Item popup + 10-minute rule                  | js/inventory/inventory-scan-popup.js, css/inventory/inventory-popup.css |
| Save inventory items                              | js/inventory/inventory-save.js                          |
| Generate Invoice / Memo                           | js/inventory/inventory-invoice-memo.js                  |
| Which buttons are enabled                         | js/inventory/inventory-buttons.js                       |
| Scan Log tab                                      | js/scan-log/*, css/scan-log/scan-log.css                |
| InterTracking Movement Log tab                    | js/intertransfer-log/intertransfer-log.js               |
| Inter-Movement Tracking tab                       | js/intertransfer/imt-*.js, css/intertransfer/*          |
| Excel exports                                     | js/export/excel-export.js                               |
| Mobile / tablet / laptop layout                   | css/responsive/bp-*.css                                 |

Every file starts with a header listing what it defines and what it uses from other files.
