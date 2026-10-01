# Trade Show Master

A Zoho Creator **widget** for managing jewellery trade shows end to end: planning events, tracking
which stock items go to a show, logging every scan in and out of the warehouse, and recording
stock movements between locations.

Built with plain HTML, CSS and JavaScript (no build step, no framework) on top of the
[Zoho Creator Widget SDK](https://www.zoho.com/creator/help/widgets/).

---

## Features

The app has five tabs.

### 1. Overview
- Create and edit trade shows (name, code, location, country, city, venue, booth, dates, notes).
- Auto-generated Trade Show ID in the format `YY-TS-001`.
- Multi-select **Responsible Team** (DUB, JP, NY).
- Upload **Insurance**, **Shipping** and **Additional** documents (up to 10 files per type), with a
  queue, progress bar and the ability to remove existing files.
- Paginated event history table. Only events with status **Planned** can be edited.

### 2. Inventory
- Filter by event status, then pick an event and load its items.
- **Scan Item** popup: choose a lot and its details (description, pieces, weight, cost, origin,
  treatment, up to three certificates) are filled in automatically from the Lot Master.
- Each scan toggles the item between **Check-Out** and **Check-In**.
- Select items and **Generate Invoice** or **Generate Memo** (opens the matching Creator page).
- **Save Item** writes new and changed items back to Creator. **Export** downloads an Excel file.

### 3. Scan Log
- Per-item history of the four movement steps: *Warehouse Out, Trade Show In, Trade Show Out,
  Warehouse In*. Filter by event, paginated, Excel export.

### 4. Inter-Movement Tracking
- Works on the currently **Active** event.
- Set From / To location (USA, Dubai, Jaipur), handover person (the logged-in user), date and notes per lot.
- Search and filter lots with multi-select tags, **bulk update** locations for several lots at once,
  then save all changes.

### 5. InterTracking Movement Log
- Read-only history of saved movements for an event, paginated, Excel export.

---

## Business rules built into the app

| Area | Rule |
|------|------|
| Editing events | Only **Planned** events can be edited. |
| New inventory items | Cannot be added when the event is **Active** or **Closed**. |
| Scan cooldown | An item cannot be scanned or saved again within **10 minutes** of its last scan or save. |
| Scan cycle | Scans cycle through 4 steps. Odd scan = Check-Out, even scan = Check-In. |
| Invoice / Memo | Only allowed while the event is **Active**. |
| Action buttons | Enabled or disabled automatically by event status (see `js/inventory/inventory-buttons.js`). |
| Document uploads | Maximum 10 files per document type. |
| Movement tracking | From and To location are both required and must be different. Bulk update needs 2 or more rows selected. |

---

## Tech stack

| Purpose | Library |
|---------|---------|
| Backend and data | [Zoho Creator](https://www.zoho.com/creator/) (Widget SDK v2.0) |
| Searchable dropdowns | [Choices.js](https://github.com/Choices-js/Choices) |
| Excel export | [SheetJS (xlsx 0.18.5)](https://sheetjs.com/) |

Libraries are loaded from CDNs in `trade_show_master.html`.

### Zoho Creator objects used

The code expects an application named `feiny-app` with these reports and forms.

| Type | Name |
|------|------|
| Reports | `All_Trade_Show_Masters`, `All_Lot_Master`, `All_Certificate_Details`, `All_Inventory_Items`, `All_Scan_Logs`, `All_Intertranfer_Trackings`, `All_User_Masters` |
| Forms | `Trade_Show_Master`, `Inventory_items`, `Scan_log`, `InterTranfer_Tracking` |

---

## Project structure

```
trade_show_master/
├── trade_show_master.html          Page markup and the ordered list of CSS/JS files
├── css/
│   ├── base/                       Reset, page container
│   ├── components/                 Cards, tabs, buttons, pagination, Choices.js styling
│   ├── forms/                      Form grid and input styles
│   ├── trade-show/                 Overview tab
│   ├── inventory/                  Inventory tab
│   ├── scan-log/                   Scan Log tab
│   ├── intertransfer/              Inter-Movement Tracking tab
│   └── responsive/                 One file per screen size (1600, 1366, 1200, 900, 768 px)
└── js/
    ├── core/                       Alerts/popups, pagination, dates, tab navigation, startup
    ├── trade-show/                 Overview form, dropdowns, history table
    │   └── documents/              Document state, Zoho upload/delete, existing list, upload queue
    ├── inventory/                  Event selector, lot master, items table, scan popup, save,
    │                               invoice/memo, button states
    ├── scan-log/                   Scan log data access and table
    ├── intertransfer-log/          Movement log tab
    ├── intertransfer/              Inter-Movement Tracking (user, lots, load, table, search, bulk, save)
    └── export/                     Excel exports
```

Every file starts with a header comment describing its purpose, what it defines, and what it uses
from other files.

### Important: load order

There are no ES modules or bundler. All JS files are plain scripts that share one global scope, and
CSS rules override earlier ones. **The order of the `<script>` and `<link>` tags in
`trade_show_master.html` matters. Do not reorder them.** Add new files in the right place in that list.

---

## Where do I change...?

| I want to change... | Open |
|---------------------|------|
| Alert and popup messages | `js/core/ui-feedback.js` |
| Pagination logic / look | `js/core/pagination.js` / `css/components/pagination.css` |
| Date formats | `js/core/date-utils.js` |
| Tab switching | `js/core/navigation.js`, `css/components/tabs.css`, `css/components/main-tabs.css` |
| What loads on startup | `js/core/app-init.js` |
| Trade show save / edit / clear / ID | `js/trade-show/trade-show-form.js` |
| Team and Country dropdowns | `js/trade-show/trade-show-dropdowns.js` |
| Event history table | `js/trade-show/trade-show-history.js`, `css/trade-show/event-history.css` |
| Document upload and delete | `js/trade-show/documents/` |
| Status to Event dropdown | `js/inventory/event-selector.js` |
| Lot auto-fill and certificates | `js/inventory/lot-master.js` |
| Inventory table | `js/inventory/inventory-table.js`, `css/inventory/inventory-table.css` |
| Scan popup and 10-minute rule | `js/inventory/inventory-scan-popup.js`, `css/inventory/inventory-popup.css` |
| Saving inventory items | `js/inventory/inventory-save.js` |
| Invoice and Memo | `js/inventory/inventory-invoice-memo.js` |
| Which buttons are enabled | `js/inventory/inventory-buttons.js` |
| Scan Log tab | `js/scan-log/`, `css/scan-log/scan-log.css` |
| Movement Log tab | `js/intertransfer-log/intertransfer-log.js` |
| Inter-Movement Tracking tab | `js/intertransfer/`, `css/intertransfer/` |
| Excel exports | `js/export/excel-export.js` |
| Mobile / tablet / laptop layout | `css/responsive/bp-*.css` |

---

## Getting started

This app only works **inside Zoho Creator**, because it calls the Creator Widget SDK for all data.
Opening the HTML file directly in a browser will load the page but no data.

1. Make sure your Creator application (`feiny-app`) has the reports and forms listed above.
2. Zip the project so that `trade_show_master.html` is at the top level, next to the `css/` and `js/` folders.
3. In Zoho Creator, go to **Workflow, Widgets** and create a new widget (hosting: *Zoho*).
4. Upload the zip and set `trade_show_master.html` as the index page.
5. Add the widget to a page in your Creator app.

> If you change `app_name`, report names or form names, update them in the JS files.
> They are written directly where they are used (search for `app_name:`).

---

## Known issues

- **Pagination on the last pages.** In `js/core/pagination.js`, `startPage` is declared with `const`
  but reassigned. On the last few pages of a table with more than 5 pages, this throws
  `Assignment to constant variable` and the page buttons stop updating.
  Fix: change `const startPage` to `let startPage`.

---

## Contributing

1. Find the file for the feature in the table above.
2. Keep new code in the matching feature folder.
3. If you add a file, add its `<script>` or `<link>` tag to `trade_show_master.html` in the right order.
4. Test inside Zoho Creator.
