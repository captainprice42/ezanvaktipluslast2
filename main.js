const { app, BrowserWindow, Tray, Menu, ipcMain, Notification, dialog, nativeImage, nativeTheme, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// Fix GPUCache / UserData permission cache errors
app.setPath('userData', path.join(app.getPath('appData'), 'EzanVaktiPlusData'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const { fetchPrayerTimes, fetchWeeklyPrayerTimes } = require('./scraper');
const cities = require('./cities');
const { checkForUpdates, downloadUpdate, installUpdate } = require('./updater');
const { toHijri, isRamadan, formatHijri } = require('./hijri');
const { t, getLocale } = require('./locales');
const { getDailyDua } = require('./duas');
const { getDailyVerse, getDailyHadith } = require('./verses');
const { ESMA } = require('./esma');

let mainWindow = null;
let miniWindow = null;
let dynamicIslandWindow = null;
let tray = null;
let config = {};
let notificationTimers = [];
let prayerCheckTimers = [];

const CONFIG_PATH = path.join(__dirname, 'config.json');
const SOUNDS_DIR = path.join(__dirname, 'sounds');
const LOGS_DIR = path.join(__dirname, 'logs');

// ===== ERROR LOGGING =====
function ensureLogsDir() {
    if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function logError(ctx, err) {
    try {
        ensureLogsDir();
        fs.appendFileSync(path.join(LOGS_DIR, 'error.log'),
            `[${new Date().toISOString()}] [ERROR] [${ctx}] ${err?.message || err}\n`, 'utf-8');
    } catch (e) { /* silent */ }
    console.error(`[${ctx}]`, err);
}

function logInfo(ctx, msg) {
    try {
        ensureLogsDir();
        fs.appendFileSync(path.join(LOGS_DIR, 'error.log'),
            `[${new Date().toISOString()}] [INFO] [${ctx}] ${msg}\n`, 'utf-8');
    } catch (e) { /* silent */ }
}

// ===== CONFIG =====
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (e) { logError('loadConfig', e); }

    const defaults = {
        lastCity: 'istanbul', lastCityName: 'İstanbul', theme: 'dark',
        autoLaunch: false, onboardingDone: false, language: 'tr',
        prayerTracking: true, cumaReminder: true, ramadanMode: true,
        lowResourceMode: false, maxRAM: 150
    };
    for (const [k, v] of Object.entries(defaults)) {
        if (config[k] === undefined) config[k] = v;
    }
    if (!config.notifications) {
        config.notifications = {
            imsak: { enabled: true, minutesBefore: 0, soundFile: 'sabah.mp3' },
            gunes: { enabled: false, minutesBefore: 0, soundFile: '' },
            ogle: { enabled: true, minutesBefore: 5, soundFile: 'ogle.mp3' },
            ikindi: { enabled: true, minutesBefore: 5, soundFile: 'ikindi.mp3' },
            aksam: { enabled: true, minutesBefore: 10, soundFile: 'aksam.mp3' },
            yatsi: { enabled: true, minutesBefore: 5, soundFile: 'yatsi.mp3' }
        };
    }
    if (!config.miniWidget) {
        config.miniWidget = {
            enabled: false, borderColor: '#c0392b', opacity: 0.85,
            posX: 100, posY: 100, displayMode: 'detailed', scale: 1.0, locked: false
        };
    }
    if (config.miniWidget.scale === undefined) config.miniWidget.scale = 1.0;
    if (config.miniWidget.locked === undefined) config.miniWidget.locked = false;
    if (!config.prayerLog) config.prayerLog = {};
    if (!config.kazaNamazlari) {
        config.kazaNamazlari = { imsak: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 };
    }
    if (!config.zikirmatik) config.zikirmatik = { count: 0, target: 33 };
    return config;
}

function saveConfig(newConfig) {
    config = { ...config, ...newConfig };
    config.date = new Date().toISOString().split('T')[0];
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8'); }
    catch (e) { logError('saveConfig', e); }
}

function ensureSoundsDir() {
    if (!fs.existsSync(SOUNDS_DIR)) fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

// ===== TEMA =====
function applyTheme(theme) {
    const validNativeThemes = ['system', 'light', 'dark'];
    nativeTheme.themeSource = validNativeThemes.includes(theme) ? theme : 'dark';
    const eff = (theme === 'system') ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : theme;
    [mainWindow, miniWindow].forEach(w => {
        if (w && !w.isDestroyed()) w.webContents.send('theme-changed', eff);
    });
}

function setAutoLaunch(enabled) {
    try {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            path: app.getPath('exe'),
            args: ['--autostart']
        });
    }
    catch (e) { logError('setAutoLaunch', e); }
}

// ===== WINDOWS =====
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 420, height: 720, resizable: false, frame: false,
        transparent: true,
        backgroundMaterial: 'acrylic',
        vibrancy: 'under-window',
        icon: path.join(__dirname, 'images', 'icon.png'),
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false }
    });
    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.on('close', (e) => { if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); } });
    mainWindow.on('closed', () => { mainWindow = null; });
}

function getMiniWindowSize() {
    const mode = config.miniWidget?.displayMode || 'detailed';
    const scale = config.miniWidget?.scale || 1.0;
    let bw = mode === 'compact' ? 260 : 320;
    let bh = mode === 'compact' ? 110 : 260;
    return { width: Math.round(bw * scale), height: Math.round(bh * scale) };
}

function createMiniWindow() {
    if (miniWindow && !miniWindow.isDestroyed()) {
        const { width, height } = getMiniWindowSize();
        miniWindow.setSize(width, height);
        miniWindow.show();
        miniWindow.setAlwaysOnTop(true, 'screen-saver');
        return;
    }
    const { posX, posY, opacity, locked } = config.miniWidget || {};
    const { width, height } = getMiniWindowSize();
    miniWindow = new BrowserWindow({
        width, height, x: posX || 100, y: posY || 100,
        resizable: false, movable: !locked, frame: false, transparent: true,
        alwaysOnTop: true, skipTaskbar: true, focusable: false, opacity: opacity || 0.85,
        webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false }
    });
    miniWindow.setAlwaysOnTop(true, 'screen-saver');
    miniWindow.loadFile('mini.html');
    miniWindow.setMenuBarVisibility(false);

    // Send initial data when mini window loads
    miniWindow.webContents.on('did-finish-load', async () => {
        try {
            const times = await fetchPrayerTimes(config.lastCity || 'istanbul');
            if (miniWindow && !miniWindow.isDestroyed()) {
                miniWindow.webContents.send('prayer-times-updated', { times, cityName: config.lastCityName || 'İstanbul' });
                miniWindow.webContents.send('display-mode-changed', config.miniWidget?.displayMode || 'detailed');
                miniWindow.webContents.send('scale-changed', config.miniWidget?.scale || 1.0);
            }
        } catch (e) { logError('mini-init', e); }
    });

    miniWindow.on('blur', () => { if (miniWindow && !miniWindow.isDestroyed()) miniWindow.setAlwaysOnTop(true, 'screen-saver'); });
    miniWindow.on('moved', () => {
        if (miniWindow && !config.miniWidget?.locked) {
            const [x, y] = miniWindow.getPosition();
            config.miniWidget.posX = x; config.miniWidget.posY = y; saveConfig(config);
        }
    });
    miniWindow.on('closed', () => { miniWindow = null; });

    // Click-through when locked
    if (config.miniWidget?.locked) {
        miniWindow.setIgnoreMouseEvents(true, { forward: true });
    }
}

function closeMiniWindow() { if (miniWindow) { miniWindow.close(); miniWindow = null; } }

// ===== TRAY =====
function createTray() {
    let iconPath = path.join(__dirname, 'images', 'icon.png');
    let icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }) : nativeImage.createEmpty();
    tray = new Tray(icon);
    const menu = Menu.buildFromTemplate([
        { label: 'Göster', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
        {
            label: 'Mini Widget', type: 'checkbox', checked: config.miniWidget?.enabled || false,
            click: (m) => { config.miniWidget.enabled = m.checked; m.checked ? createMiniWindow() : closeMiniWindow(); saveConfig(config); }
        },
        { type: 'separator' },
        { label: 'Çıkış', click: () => { app.isQuitting = true; app.quit(); } }
    ]);
    tray.setToolTip('Ezan Vakti Plus 2.0.0');
    tray.setContextMenu(menu);
    tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });
}

// ===== BİLDİRİM + NAMAZ TAKİP =====
function setupNotificationTimers(prayerTimes) {
    notificationTimers.forEach(t => clearTimeout(t));
    notificationTimers = [];
    prayerCheckTimers.forEach(t => clearTimeout(t));
    prayerCheckTimers = [];

    if (!prayerTimes || !config.notifications) return;

    const now = new Date();
    const vakitKeys = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];
    const vakitLabels = { imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' };

    for (const key of vakitKeys) {
        const notifConfig = config.notifications[key];
        const prayerTime = prayerTimes[key];
        if (!prayerTime || !prayerTime.time) continue;

        const [h, m] = prayerTime.time.split(':').map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(h, m, 0, 0);

        // Bildirim
        if (notifConfig?.enabled) {
            const mBefore = notifConfig.minutesBefore || 0;
            const notifTime = new Date(prayerDate.getTime() - mBefore * 60000);
            const diff = notifTime.getTime() - now.getTime();
            if (diff > 0) {
                const timer = setTimeout(() => {
                    const label = vakitLabels[key];
                    const body = mBefore > 0 ? `${label} Ezanına ${mBefore} dakika kaldı!` : `${label} Ezanı vakti geldi!`;
                    new Notification({ title: 'Ezan Vakti Plus', body, icon: path.join(__dirname, 'images', 'icon.png') }).show();
                    if (notifConfig.soundFile) {
                        const sp = path.join(SOUNDS_DIR, notifConfig.soundFile);
                        if (fs.existsSync(sp) && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('play-sound-file', sp);
                    }
                    // Dynamic Island notification
                    if (config.dynamicIsland !== false) {
                        const iconMap = { imsak: '🌙', gunes: '🌅', ogle: '☀️', ikindi: '🌤️', aksam: '🌇', yatsi: '🌃' };
                        const mStr = mBefore > 0 ? String(mBefore).padStart(2, '0') + ':00' : '00:00';
                        const mBigStr = mBefore > 0 ? '00:' + String(mBefore).padStart(2, '0') + ':00' : '00:00:00';
                        showDynamicIsland({
                            title: mBefore > 0 ? `${label} Ezanına ${mBefore} dk` : `${label} Ezanı`,
                            subtitle: 'Ezan Vakti Plus',
                            time: prayerTimes[key].time || '',
                            countdown: mStr,
                            countdownBig: mBigStr,
                            nextName: label,
                            nextTime: prayerTimes[key].time || '',
                            icon: iconMap[key] || '🕌',
                            type: 'prayer',
                            duration: 10000,
                            dismissAfter: 8000
                        });
                    }
                }, diff);
                notificationTimers.push(timer);
            }
        }

        // Namaz takip popup: bir sonraki vakte 5dk kala, önceki namazı sor
        // Örn: Akşam -5dk olduğunda İkindi'yi kıldın mı diye sor
        if (config.prayerTracking && key !== 'gunes') {
            const idx = vakitKeys.indexOf(key);
            const nextIdx = idx + 1;
            if (nextIdx < vakitKeys.length) {
                const nextPrayer = prayerTimes[vakitKeys[nextIdx]];
                if (nextPrayer && nextPrayer.time) {
                    const [nh, nm] = nextPrayer.time.split(':').map(Number);
                    const nextPrayerDate = new Date(now);
                    nextPrayerDate.setHours(nh, nm, 0, 0);
                    const checkTime = new Date(nextPrayerDate.getTime() - 5 * 60000); // 5dk önce
                    const checkDiff = checkTime.getTime() - now.getTime();
                    if (checkDiff > 0) {
                        const timer = setTimeout(() => {
                            if (mainWindow && !mainWindow.isDestroyed()) {
                                mainWindow.webContents.send('prayer-check-popup', { key, label: vakitLabels[key] });
                            }
                        }, checkDiff);
                        prayerCheckTimers.push(timer);
                    }
                }
            } else if (key === 'yatsi') {
                // Yatsı için: gece yarısına yakın (23:00) sor
                const checkDate = new Date(now);
                checkDate.setHours(23, 0, 0, 0);
                const checkDiff = checkDate.getTime() - now.getTime();
                if (checkDiff > 0) {
                    const timer = setTimeout(() => {
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('prayer-check-popup', { key, label: vakitLabels[key] });
                        }
                    }, checkDiff);
                    prayerCheckTimers.push(timer);
                }
            }
        }
    }

    // Cuma hatırlatıcısı
    if (config.cumaReminder && now.getDay() === 5) {
        const cumaDate = new Date(now);
        cumaDate.setHours(10, 0, 0, 0);
        const cumaDiff = cumaDate.getTime() - now.getTime();
        if (cumaDiff > 0) {
            const timer = setTimeout(() => {
                const lang = config.language || 'tr';
                new Notification({
                    title: t('cumaGunu', lang),
                    body: t('cumaMessage', lang),
                    icon: path.join(__dirname, 'images', 'icon.png')
                }).show();
            }, cumaDiff);
            notificationTimers.push(timer);
        }
    }
}

// ===== DYNAMIC ISLAND =====
function openDynamicIsland() {
    if (dynamicIslandWindow && !dynamicIslandWindow.isDestroyed()) return;
    try {
        const { screen } = require('electron');
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth } = primaryDisplay.workAreaSize;
        const islandWidth = 440;
        const islandHeight = 280;
        const x = Math.round((screenWidth - islandWidth) / 2);

        dynamicIslandWindow = new BrowserWindow({
            width: islandWidth, height: islandHeight, x, y: 0,
            frame: false, transparent: true, resizable: false, movable: false,
            skipTaskbar: true, alwaysOnTop: true, focusable: false,
            fullscreenable: false, type: 'toolbar',
            webPreferences: {
                preload: path.join(__dirname, 'island-preload.js'),
                contextIsolation: true, nodeIntegration: false
            }
        });
        dynamicIslandWindow.setAlwaysOnTop(true, 'screen-saver');
        dynamicIslandWindow.setIgnoreMouseEvents(true, { forward: true });
        dynamicIslandWindow.loadFile('island.html');
        dynamicIslandWindow.setMenuBarVisibility(false);
        dynamicIslandWindow.on('closed', () => { dynamicIslandWindow = null; });
    } catch (e) { logError('openDynamicIsland', e); }
}

function showDynamicIsland(data) {
    if (!dynamicIslandWindow || dynamicIslandWindow.isDestroyed()) {
        openDynamicIsland();
        // Wait for did-finish-load to send data
        dynamicIslandWindow.webContents.on('did-finish-load', () => {
            if (dynamicIslandWindow && !dynamicIslandWindow.isDestroyed()) {
                dynamicIslandWindow.webContents.send('dynamic-island-show', data);
            }
        });
    } else {
        dynamicIslandWindow.webContents.send('dynamic-island-show', data);
    }
}

// ===== IPC =====
function setupIPC() {
    // Dynamic Island
    ipcMain.on('close-dynamic-island', () => {
        if (dynamicIslandWindow && !dynamicIslandWindow.isDestroyed()) {
            dynamicIslandWindow.close(); dynamicIslandWindow = null;
        }
    });
    ipcMain.on('island-set-mouse-ignore', (ev, ignore) => {
        if (dynamicIslandWindow && !dynamicIslandWindow.isDestroyed()) {
            dynamicIslandWindow.setIgnoreMouseEvents(ignore, { forward: true });
        }
    });
    ipcMain.handle('test-dynamic-island', () => {
        const now = new Date();
        const h = now.getHours(), m = now.getMinutes();
        showDynamicIsland({
            title: 'Akşam Ezanı', subtitle: 'Ezan Vakti Plus',
            countdown: '50:00', countdownBig: '00:50:00',
            nextName: 'Akşam', icon: '🕌', type: 'prayer', duration: 10000,
            times: {
                imsak: { time: '05:30', passed: true, active: false },
                gunes: { time: '07:00', passed: true, active: false },
                ogle: { time: '12:30', passed: h < 12 ? false : true, active: false },
                ikindi: { time: '15:45', passed: h < 15 ? false : true, active: false },
                aksam: { time: '18:25', passed: false, active: true },
                yatsi: { time: '19:50', passed: false, active: false }
            },
            labels: { imsak: 'İmsak', gunes: 'Güneş', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' }
        });
        return { success: true };
    });
    ipcMain.handle('toggle-dynamic-island', (ev, enabled) => {
        config.dynamicIsland = enabled;
        saveConfig(config);
        if (enabled) { openDynamicIsland(); }
        else if (dynamicIslandWindow && !dynamicIslandWindow.isDestroyed()) {
            dynamicIslandWindow.close(); dynamicIslandWindow = null;
        }
        return { success: true };
    });
    ipcMain.handle('update-island-data', (ev, payload) => {
        if (config.dynamicIsland !== false && dynamicIslandWindow && !dynamicIslandWindow.isDestroyed()) {
            dynamicIslandWindow.webContents.send('dynamic-island-update', payload);
        }
        return { success: true };
    });

    ipcMain.handle('get-prayer-times', async (ev, citySlug) => {
        try {
            const times = await fetchPrayerTimes(citySlug);
            setupNotificationTimers(times);
            if (miniWindow && !miniWindow.isDestroyed())
                miniWindow.webContents.send('prayer-times-updated', { times, cityName: config.lastCityName });
            return { success: true, times };
        } catch (e) { logError('get-prayer-times', e); return { success: false, error: e.message }; }
    });

    ipcMain.handle('get-weekly-times', async (ev, citySlug) => {
        try {
            const days = await fetchWeeklyPrayerTimes(citySlug);
            return { success: true, days };
        } catch (e) { logError('get-weekly-times', e); return { success: false, error: e.message }; }
    });

    ipcMain.handle('get-config', () => config);
    ipcMain.handle('save-config', (ev, c) => { saveConfig(c); return { success: true }; });

    ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
    ipcMain.on('window-close', () => { if (mainWindow) mainWindow.hide(); });
    ipcMain.on('window-to-tray', () => { if (mainWindow) mainWindow.hide(); });

    ipcMain.handle('toggle-mini-widget', (ev, en) => {
        en ? createMiniWindow() : closeMiniWindow();
        config.miniWidget.enabled = en; saveConfig(config); return { success: true };
    });

    ipcMain.on('update-mini-position', (ev, x, y) => { config.miniWidget.posX = x; config.miniWidget.posY = y; saveConfig(config); });
    ipcMain.on('update-mini-style', (ev, bc, op) => {
        if (miniWindow) miniWindow.setOpacity(op);
        config.miniWidget.borderColor = bc; config.miniWidget.opacity = op; saveConfig(config);
        if (miniWindow && !miniWindow.isDestroyed()) miniWindow.webContents.send('update-style', { borderColor: bc, opacity: op });
    });

    ipcMain.handle('set-mini-display-mode', (ev, mode) => {
        config.miniWidget.displayMode = mode; saveConfig(config);
        if (miniWindow && !miniWindow.isDestroyed()) {
            const s = getMiniWindowSize();
            miniWindow.setContentSize(s.width, s.height);
            miniWindow.webContents.send('display-mode-changed', mode);
            miniWindow.setAlwaysOnTop(true, 'screen-saver');
        }
        return { success: true };
    });

    ipcMain.handle('set-mini-scale', (ev, scale) => {
        config.miniWidget.scale = scale; saveConfig(config);
        if (miniWindow && !miniWindow.isDestroyed()) {
            const s = getMiniWindowSize();
            miniWindow.setContentSize(s.width, s.height);
            miniWindow.webContents.send('scale-changed', scale);
            miniWindow.setAlwaysOnTop(true, 'screen-saver');
        }
        return { success: true };
    });

    ipcMain.handle('set-mini-locked', (ev, locked) => {
        config.miniWidget.locked = locked; saveConfig(config);
        if (miniWindow && !miniWindow.isDestroyed()) {
            miniWindow.setMovable(!locked);
            // Click-through: when locked, clicks pass through to apps below
            miniWindow.setIgnoreMouseEvents(locked, { forward: true });
            miniWindow.webContents.send('lock-changed', locked);
        }
        return { success: true };
    });

    ipcMain.handle('play-sound', async () => ({ success: true }));
    ipcMain.handle('show-notification', async (ev, title, body) => {
        new Notification({ title, body, icon: path.join(__dirname, 'images', 'icon.png') }).show();
        return { success: true };
    });
    ipcMain.handle('select-sound-file', async () => {
        const r = await dialog.showOpenDialog(mainWindow, {
            title: 'Ses Dosyası Seç', filters: [{ name: 'Ses', extensions: ['mp3', 'wav', 'ogg'] }], properties: ['openFile']
        });
        if (r.canceled || !r.filePaths.length) return null;
        const fn = path.basename(r.filePaths[0]);
        try { fs.copyFileSync(r.filePaths[0], path.join(SOUNDS_DIR, fn)); return fn; }
        catch (e) { logError('select-sound-file', e); return null; }
    });

    ipcMain.handle('get-cities', () => cities);
    ipcMain.handle('get-app-path', () => __dirname);

    // Tema
    ipcMain.handle('set-theme', (ev, theme) => { config.theme = theme; saveConfig(config); applyTheme(theme); return { success: true }; });
    ipcMain.handle('get-effective-theme', () => config.theme === 'system' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : (config.theme || 'dark'));

    // Startup
    ipcMain.handle('set-auto-launch', (ev, en) => { config.autoLaunch = en; saveConfig(config); setAutoLaunch(en); return { success: true }; });
    ipcMain.handle('complete-onboarding', () => { config.onboardingDone = true; saveConfig(config); return { success: true }; });

    // Dil
    ipcMain.handle('set-language', (ev, lang) => { config.language = lang; saveConfig(config); return { success: true }; });

    // Hicri
    ipcMain.handle('get-hijri-date', () => formatHijri(new Date(), config.language || 'tr'));
    ipcMain.handle('is-ramadan', () => isRamadan(new Date(), config.language));

    // Günlük dua
    ipcMain.handle('get-daily-dua', () => getDailyDua(config.language || 'tr'));

    // Günün ayeti ve hadisi
    ipcMain.handle('get-daily-verse', () => getDailyVerse(config.language || 'tr'));
    ipcMain.handle('get-daily-hadith', () => getDailyHadith(config.language || 'tr'));

    // Esmaül Hüsna
    ipcMain.handle('get-esma', () => ESMA);

    // Namaz takip
    ipcMain.handle('log-prayer', (ev, key, prayed) => {
        const today = new Date().toISOString().split('T')[0];
        if (!config.prayerLog[today]) config.prayerLog[today] = {};
        config.prayerLog[today][key] = prayed;
        if (!prayed) {
            if (!config.kazaNamazlari[key]) config.kazaNamazlari[key] = 0;
            config.kazaNamazlari[key]++;
        }
        saveConfig(config);
        return { success: true };
    });

    ipcMain.handle('get-prayer-log', () => config.prayerLog);
    ipcMain.handle('get-kaza', () => config.kazaNamazlari);
    ipcMain.handle('save-kaza', (ev, kaza) => { config.kazaNamazlari = kaza; saveConfig(config); return { success: true }; });

    // Zikirmatik
    ipcMain.handle('get-zikirmatik', () => config.zikirmatik || { count: 0, target: 33 });
    ipcMain.handle('save-zikirmatik', (ev, data) => { config.zikirmatik = data; saveConfig(config); return { success: true }; });

    // RAM limiti
    ipcMain.handle('save-max-ram', (ev, maxRAM) => { config.maxRAM = maxRAM; saveConfig(config); return { success: true }; });

    // Performans - use getProcessMemoryInfo for accurate readings
    ipcMain.handle('get-performance', async () => {
        try {
            const memInfo = await process.getProcessMemoryInfo();
            return {
                private: Math.round(memInfo.private / 1024), // KB to MB
                maxRAM: config.maxRAM || 150
            };
        } catch (e) {
            // Fallback to process.memoryUsage if getProcessMemoryInfo fails
            const mem = process.memoryUsage();
            return {
                private: Math.round(mem.rss / 1048576),
                maxRAM: config.maxRAM || 150
            };
        }
    });

    // Yakın camiler
    ipcMain.handle('open-external', (ev, url) => { shell.openExternal(url); return { success: true }; });

    // Yazdırma (Print)
    ipcMain.handle('print-page', async (event, options) => {
        try {
            await event.sender.print(options || {});
            return { success: true };
        } catch (e) {
            logError('print-page', e);
            return { success: false, error: e.message };
        }
    });

    // Hakkında
    ipcMain.handle('get-about-info', () => ({
        version: '2.0.0',
        appName: 'Ezan Vakti Plus',
        developer: 'Ezan Vakti Plus Team',
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome
    }));

    // Auto-updater
    ipcMain.handle('check-update', async () => {
        try {
            logInfo('updater', 'Güncelleme kontrolü');
            const r = await checkForUpdates();
            logInfo('updater', `Sonuç: hasUpdate=${r.hasUpdate}, latest=${r.latestVersion}`);
            return r;
        } catch (e) { logError('check-update', e); return { hasUpdate: false, currentVersion: '2.0.0', latestVersion: '2.0.0' }; }
    });

    ipcMain.handle('start-update', async (ev, url) => {
        try {
            logInfo('updater', `İndirme: ${url}`);
            const zip = await downloadUpdate(url, (d, t, s) => {
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-progress', { downloaded: d, total: t, speed: s });
            });
            await installUpdate(zip, __dirname);
            return { success: true };
        } catch (e) { logError('start-update', e); return { success: false, error: e.message }; }
    });

    ipcMain.handle('restart-app', () => { app.relaunch(); app.isQuitting = true; app.quit(); });

    // Auto location detection via IP
    ipcMain.handle('detect-location', async () => {
        try {
            const https = require('https');
            return new Promise((resolve) => {
                https.get('https://ipapi.co/json/', (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            resolve({ success: true, city: json.city, region: json.region, country: json.country_name });
                        } catch (e) { resolve({ success: false }); }
                    });
                }).on('error', () => resolve({ success: false }));
            });
        } catch (e) { return { success: false }; }
    });
}

// ===== NATIVE THEME =====
nativeTheme.on('updated', () => {
    if (config.theme === 'system') {
        const eff = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
        [mainWindow, miniWindow].forEach(w => { if (w && !w.isDestroyed()) w.webContents.send('theme-changed', eff); });
    }
});

// ===== APP =====
app.whenReady().then(() => {
    loadConfig(); ensureSoundsDir(); ensureLogsDir(); setupIPC();
    createMainWindow(); createTray();
    applyTheme(config.theme || 'dark');
    if (config.autoLaunch) setAutoLaunch(true);
    if (config.miniWidget?.enabled) createMiniWindow();
    if (config.dynamicIsland !== false) openDynamicIsland();
    logInfo('app', 'Uygulama başlatıldı v2.0.0');

    globalShortcut.register('F7', () => {
        if (dynamicIslandWindow && !dynamicIslandWindow.isDestroyed()) {
            dynamicIslandWindow.webContents.send('island-force-state', 'expand');
        }
    });

    globalShortcut.register('F8', () => {
        if (dynamicIslandWindow && !dynamicIslandWindow.isDestroyed()) {
            dynamicIslandWindow.webContents.send('island-force-state', 'collapse');
        }
    });

    setTimeout(async () => {
        try {
            const u = await checkForUpdates();
            if (u.hasUpdate && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('update-available', u);
        } catch (e) { logError('startup-update', e); }
    }, 3000);
});

app.on('window-all-closed', () => { });
app.on('activate', () => { if (!mainWindow) createMainWindow(); });
app.on('before-quit', () => {
    app.isQuitting = true;
    notificationTimers.forEach(t => clearTimeout(t)); notificationTimers = [];
    prayerCheckTimers.forEach(t => clearTimeout(t)); prayerCheckTimers = [];
    logInfo('app', 'Uygulama kapatılıyor');
});
