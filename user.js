// ==UserScript==
// @name         Camper Wonk.Ink Cat - GUI
// @namespace    http://tampermonkey.net/
// @version      2.6
// @author       CAMPER + assistant
// @description  Automate Work.ink (with an on-page GUI for toggling speedup, editing settings, and Cloudflare status)
// @match        *://work.ink/*
// @match        *://*.work.ink/*
// @match        *://key.thanhub.com/*
// @match        *://therealasu.pythonanywhere.com/*
// @match        *://blox-script.com/*
// @match        *://loot-link.com/s?*
// @match        *://loot-links.com/s?*
// @match        *://lootlink.org/s?*
// @match        *://lootlinks.co/s?*
// @match        *://lootdest.info/s?*
// @match        *://lootdest.org/s?*
// @match        *://lootdest.com/s?*
// @match        *://links-loot.com/s?*
// @match        *://linksloot.net/s?*
// @match        *://rekonise.com/*
// @match        *://link-unlock/*
// @match        *://linkvertise.com/*/*
// @match        *://socialwolvez.com/*
// @match        *://scwz.me/*
// @match        *://adfoc.us/*
// @match        *://unlocknow.net/*
// @match        *://sub2get.com/*
// @match        *://sub4unlock.com/*
// @match        *://sub2unlock.net/*
// @match        *://sub2unlock.com/*
// @match        *://mboost.me/*
// @match        *://paste-drop.com/paste/*
// @match        *://pastebin.com/*
// @match        *://deltaios-executor.com/ads.html*
// @match        *://rentry.co/*
// @match        *://rekonise.com/*
// @match        *://rkns.link/*
// @match        *://bit.ly/*
// @match        *://rb.gy/*
// @match        *://is.gd/*
// @match        *://rebrand.ly/*
// @match        *://6x.work/*
// @match        *://boost.ink/*
// @match        *://booo.st/*
// @match        *://bst.gg/*
// @match        *://bst.wtf/*
// @match        *://linkunlocker.com/*
// @match        *://unlk.link/*
// @match        *://pandadevelopment.net/getkey*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIG KEYS for localStorage ---
    const STORAGE_KEY = 'camper_work_ink_gui_settings_v1';

    // default settings
    const DEFAULTS = {
        speedEnabled: true,
        speedFactor: 5,
        disableSpeedupUrls: [
            "https://work.ink/22hr/42rk6hcq",
            "https://work.ink/22hr/ito4wckq",
            "https://work.ink/22hr/pzarvhq1"
        ],
        panelVisible: true,
        minimized: false
    };

    // load/save
    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {...DEFAULTS};
            const parsed = JSON.parse(raw);
            return Object.assign({}, DEFAULTS, parsed);
        } catch (e) {
            console.warn("[Work.ink GUI] Failed to load settings, using defaults.", e);
            return {...DEFAULTS};
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn("[Work.ink GUI] Failed to save settings.", e);
        }
    }

    // settings
    const settings = loadSettings();

    // Quick helper: is page in cloudflare checking mode
    function isWorkInkLoading() {
        return /Checking your browser\. This takes about 5 seconds\./i.test(document.body?.innerText || '');
    }

    // If not work.ink hostname, keep original console-safe behavior but bail out early (match list already restricts pages)
    if (!location.hostname.includes("work.ink")) {
        console.log("[Work.ink Auto] Not on work.ink host — GUI will still show on matching pages only.");
    }

    // GUI creation
    function createPanel() {
        // styles
        const css = `
            #camper-gui { position: fixed; right: 16px; bottom: 16px; width: 320px; z-index: 2147483647;
                         font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial;
                         box-shadow: 0 6px 22px rgba(0,0,0,.35); border-radius: 8px; overflow: hidden; }
            #camper-gui .panel { background: #0d1117; color: #c9d1d9; padding: 12px; }
            #camper-gui .header { display:flex; justify-content:space-between; align-items:center; gap:8px; }
            #camper-gui .title { font-weight:600; font-size:13px; }
            #camper-gui button, #camper-gui input[type="button"] { background:#161b22; color:#c9d1d9; border:1px solid #30363d; padding:6px 8px; border-radius:6px; cursor:pointer; }
            #camper-gui .muted { color:#8b949e; font-size:12px; }
            #camper-gui .row { margin-top:10px; display:flex; gap:8px; align-items:center; }
            #camper-gui label { font-size:12px; display:block; width:110px; }
            #camper-gui input[type="range"] { flex:1; }
            #camper-gui input[type="text"] { flex:1; padding:6px; border-radius:6px; border:1px solid #30363d; background:#0b0f13; color:#c9d1d9; }
            #camper-gui .list { max-height:120px; overflow:auto; border:1px dashed #22272b; padding:8px; margin-top:8px; border-radius:6px; background:#06070a; font-size:12px; }
            #camper-gui .list div { display:flex; justify-content:space-between; gap:8px; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.02); }
            #camper-gui .small { font-size:12px; }
            #camper-gui .status { font-weight:700; color:#58a6ff; }
            #camper-gui .minimize { background:transparent; border:none; color:#8b949e; cursor:pointer; }
        `;
        const style = document.createElement('style');
        style.id = 'camper-gui-style';
        style.textContent = css;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'camper-gui';

        const panel = document.createElement('div');
        panel.className = 'panel';

        // header
        const header = document.createElement('div');
        header.className = 'header';
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = 'Camper — Work.ink GUI';
        const controls = document.createElement('div');

        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'minimize';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.innerHTML = settings.minimized ? '&#9650;' : '&#9660;';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Close GUI';

        controls.appendChild(minimizeBtn);
        controls.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(controls);
        panel.appendChild(header);

        // content container (toggle hide on minimize)
        const content = document.createElement('div');
        content.id = 'camper-gui-content';
        content.style.display = settings.minimized ? 'none' : 'block';

        // Cloudflare status
        const cfRow = document.createElement('div');
        cfRow.className = 'row';
        const cfLabel = document.createElement('div');
        cfLabel.className = 'muted';
        cfLabel.textContent = 'Cloudflare:';
        const cfStatus = document.createElement('div');
        cfStatus.className = 'status';
        cfStatus.id = 'camper-cf-status';
        cfStatus.textContent = isWorkInkLoading() ? 'Checking...' : 'OK';
        cfRow.appendChild(cfLabel);
        cfRow.appendChild(cfStatus);
        content.appendChild(cfRow);

        // toggle speed
        const toggleRow = document.createElement('div');
        toggleRow.className = 'row';
        const toggleLabel = document.createElement('label');
        toggleLabel.textContent = 'Speedup:';
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'camper-toggle';
        toggleBtn.textContent = settings.speedEnabled ? 'Enabled' : 'Disabled';
        toggleRow.appendChild(toggleLabel);
        toggleRow.appendChild(toggleBtn);
        content.appendChild(toggleRow);

        // speed factor slider
        const speedRow = document.createElement('div');
        speedRow.className = 'row';
        const speedLabel = document.createElement('label');
        speedLabel.textContent = 'Speed factor:';
        const speedValue = document.createElement('div');
        speedValue.className = 'muted small';
        speedValue.id = 'camper-speed-value';
        speedValue.textContent = 'x' + settings.speedFactor;
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.min = '1';
        speedSlider.max = '20';
        speedSlider.value = settings.speedFactor;
        speedSlider.title = 'Divide timeouts by this factor';
        speedRow.appendChild(speedLabel);
        speedRow.appendChild(speedSlider);
        speedRow.appendChild(speedValue);
        content.appendChild(speedRow);

        // disabled URLs list and add/remove current
        const urlRow = document.createElement('div');
        urlRow.className = 'row';
        const urlLabel = document.createElement('label');
        urlLabel.textContent = 'Blocked URLs:';
        urlRow.appendChild(urlLabel);

        const listWrap = document.createElement('div');
        listWrap.style.flex = '1';
        listWrap.style.display = 'flex';
        listWrap.style.flexDirection = 'column';

        const listBox = document.createElement('div');
        listBox.className = 'list';
        listBox.id = 'camper-url-list';
        listWrap.appendChild(listBox);

        const addRemoveRow = document.createElement('div');
        addRemoveRow.className = 'row';
        addRemoveRow.style.marginTop = '8px';

        const currentInput = document.createElement('input');
        currentInput.type = 'text';
        currentInput.placeholder = 'Paste URL or use current';
        currentInput.value = location.href;
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add';
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';

        addRemoveRow.appendChild(currentInput);
        addRemoveRow.appendChild(addBtn);
        addRemoveRow.appendChild(removeBtn);
        listWrap.appendChild(addRemoveRow);

        urlRow.appendChild(listWrap);
        content.appendChild(urlRow);

        // keyboard hint
        const hintRow = document.createElement('div');
        hintRow.className = 'row';
        const hint = document.createElement('div');
        hint.className = 'muted small';
        hint.textContent = 'Shortcut: Ctrl+Shift+S toggles speedup';
        hintRow.appendChild(hint);
        content.appendChild(hintRow);

        panel.appendChild(content);
        container.appendChild(panel);
        document.body.appendChild(container);

        // Populate list box
        function refreshList() {
            listBox.innerHTML = '';
            if (!settings.disableSpeedupUrls || settings.disableSpeedupUrls.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'muted small';
                empty.textContent = '(none)';
                listBox.appendChild(empty);
                return;
            }
            settings.disableSpeedupUrls.forEach((u, idx) => {
                const row = document.createElement('div');
                const left = document.createElement('div');
                left.style.flex = '1';
                left.style.wordBreak = 'break-all';
                left.textContent = u;
                const right = document.createElement('div');
                right.style.flex = '0 0 auto';
                const rm = document.createElement('button');
                rm.textContent = 'x';
                rm.title = 'Remove URL';
                rm.addEventListener('click', () => {
                    settings.disableSpeedupUrls.splice(idx, 1);
                    saveSettings();
                    refreshList();
                    updateSpeedEnabledForPage();
                });
                right.appendChild(rm);
                row.appendChild(left);
                row.appendChild(right);
                listBox.appendChild(row);
            });
        }
        refreshList();

        // add/remove button handlers
        addBtn.addEventListener('click', () => {
            const val = currentInput.value.trim();
            if (!val) return;
            if (!settings.disableSpeedupUrls.includes(val)) {
                settings.disableSpeedupUrls.push(val);
                saveSettings();
                refreshList();
                updateSpeedEnabledForPage();
            }
        });
        removeBtn.addEventListener('click', () => {
            const val = currentInput.value.trim();
            if (!val) return;
            const i = settings.disableSpeedupUrls.indexOf(val);
            if (i >= 0) {
                settings.disableSpeedupUrls.splice(i, 1);
                saveSettings();
                refreshList();
                updateSpeedEnabledForPage();
            }
        });

        // toggle/minimize/close
        minimizeBtn.addEventListener('click', () => {
            settings.minimized = !settings.minimized;
            saveSettings();
            content.style.display = settings.minimized ? 'none' : 'block';
            minimizeBtn.innerHTML = settings.minimized ? '&#9650;' : '&#9660;';
        });
        closeBtn.addEventListener('click', () => {
            container.remove();
            // persist that user closed panel
            settings.panelVisible = false;
            saveSettings();
        });

        // toggle speed button
        toggleBtn.addEventListener('click', () => {
            settings.speedEnabled = !settings.speedEnabled;
            saveSettings();
            toggleBtn.textContent = settings.speedEnabled ? 'Enabled' : 'Disabled';
            applySpeedToggle();
        });

        // slider
        speedSlider.addEventListener('input', () => {
            const v = parseInt(speedSlider.value, 10) || 1;
            settings.speedFactor = v;
            speedValue.textContent = 'x' + v;
            saveSettings();
            applySpeedToggle(); // reapply with new factor
        });

        // expose some DOM nodes for external updates
        return {
            container,
            cfStatus,
            toggleBtn,
            speedValue,
            speedSlider,
            refreshList,
            applyToggleUI() {
                toggleBtn.textContent = settings.speedEnabled ? 'Enabled' : 'Disabled';
                speedValue.textContent = 'x' + settings.speedFactor;
                speedSlider.value = settings.speedFactor;
            }
        };
    }

    // Only create panel if user hasn't explicitly closed it earlier; user can re-run script to show again
    let panelAPI = null;
    if (settings.panelVisible !== false) {
        panelAPI = createPanel();
    }

    // ================================================================
    // Speedup logic: monkeypatch setTimeout/setInterval
    // ================================================================
    let applied = false;
    let originalSetTimeout = window.setTimeout;
    let originalSetInterval = window.setInterval;

    function isPageBlockedByUrlList() {
        try {
            if (!Array.isArray(settings.disableSpeedupUrls)) return false;
            // Check if current URL starts with any of the blocked list items
            return settings.disableSpeedupUrls.some(u => {
                try {
                    // allow plain substrings too, but prefer startsWith for exactness
                    return location.href.startsWith(u) || location.href.includes(u);
                } catch (e) {
                    return false;
                }
            });
        } catch (e) {
            return false;
        }
    }

    function updateSpeedEnabledForPage() {
        // If page matches a blocked URL, force speedEnabled = false for this page
        if (isPageBlockedByUrlList()) {
            // note: do not overwrite user's global saved setting; just ensure we don't apply patch here
            if (panelAPI) panelAPI.cfStatus.textContent = 'Blocked by list';
            return false;
        } else {
            if (panelAPI) panelAPI.cfStatus.textContent = isWorkInkLoading() ? 'Checking...' : 'OK';
            return true;
        }
    }

    function applySpeedPatch() {
        if (applied) return;
        applied = true;

        // store originals (in case another script already patched)
        originalSetTimeout = window.setTimeout;
        originalSetInterval = window.setInterval;

        window.setTimeout = function(fn, delay, ...args) {
            // If disabled for this page due to blocklist, run original with delay unchanged
            if (!settings.speedEnabled || !updateSpeedEnabledForPage()) {
                return originalSetTimeout(fn, delay, ...args);
            }
            if (typeof delay === "number") delay = Math.max(0, Math.floor(delay / settings.speedFactor));
            return originalSetTimeout(fn, delay, ...args);
        };

        window.setInterval = function(fn, delay, ...args) {
            if (!settings.speedEnabled || !updateSpeedEnabledForPage()) {
                return originalSetInterval(fn, delay, ...args);
            }
            if (typeof delay === "number") delay = Math.max(1, Math.floor(delay / settings.speedFactor));
            return originalSetInterval(fn, delay, ...args);
        };

        console.log("[Camper GUI] Timer speedup applied (factor x" + settings.speedFactor + ").");
    }

    function removeSpeedPatch() {
        if (!applied) return;
        try {
            // attempt to restore originals
            if (originalSetTimeout) window.setTimeout = originalSetTimeout;
            if (originalSetInterval) window.setInterval = originalSetInterval;
        } catch (e) {
            console.warn("[Camper GUI] Could not restore original timers.", e);
        }
        applied = false;
        console.log("[Camper GUI] Timer speedup removed.");
    }

    function applySpeedToggle() {
        if (!updateSpeedEnabledForPage()) {
            // blocked by list: ensure disabled
            removeSpeedPatch();
            if (panelAPI) panelAPI.applyToggleUI();
            return;
        }
        if (settings.speedEnabled) {
            applySpeedPatch();
        } else {
            removeSpeedPatch();
        }
        if (panelAPI) panelAPI.applyToggleUI();
    }

    // Apply initially (but watch cloudflare)
    if (isWorkInkLoading()) {
        console.log("[Cloudflare] Waiting for browser check...");
        const interval = setInterval(() => {
            if (!isWorkInkLoading()) {
                clearInterval(interval);
                console.log("[Cloudflare] Check complete, resuming script.");
                if (panelAPI) panelAPI.cfStatus.textContent = 'OK';
                applySpeedToggle();
            } else {
                if (panelAPI) panelAPI.cfStatus.textContent = 'Checking...';
            }
        }, 800);
    } else {
        applySpeedToggle();
    }

    // Toggle by keyboard (preserve original shortcut)
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
            settings.speedEnabled = !settings.speedEnabled;
            saveSettings();
            applySpeedToggle();
            if (panelAPI) panelAPI.applyToggleUI();
            // flash UI briefly
            flashButton(panelAPI && panelAPI.toggleBtn);
        }
    });

    // Also re-run update when location changes (single-page apps)
    let lastHref = location.href;
    setInterval(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            // update input field with new location
            try {
                const input = document.querySelector('#camper-gui input[type="text"]');
                if (input) input.value = location.href;
            } catch (e) {}
            // re-evaluate blocked list
            if (panelAPI) panelAPI.refreshList && panelAPI.refreshList();
            // update application
            applySpeedToggle();
        }
    }, 1000);

    // small visual flash helper
    function flashButton(btn) {
        if (!btn) return;
        const orig = btn.style.boxShadow;
        btn.style.boxShadow = '0 0 8px rgba(88,166,255,0.8)';
        setTimeout(() => { btn.style.boxShadow = orig; }, 400);
    }

    // make sure UI reflects settings when created
    if (panelAPI) panelAPI.applyToggleUI();

    // Expose a small debug object on window for dev tinkering (optional)
    try {
        window.CamperWorkInkGUI = {
            settings,
            applySpeedToggle,
            removeSpeedPatch,
            applySpeedPatch,
            refreshUI: () => panelAPI && panelAPI.applyToggleUI()
        };
    } catch (e) {}

    // final debug log
    console.log("[Camper GUI] Ready. Speed " + (settings.speedEnabled ? "enabled" : "disabled") + " (x" + settings.speedFactor + ").");

})();
