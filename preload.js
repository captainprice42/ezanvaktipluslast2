const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Namaz vakitleri
    getPrayerTimes: (citySlug) => ipcRenderer.invoke('get-prayer-times', citySlug),
    getWeeklyTimes: (citySlug) => ipcRenderer.invoke('get-weekly-times', citySlug),

    // Config
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),

    // Pencere
    windowMinimize: () => ipcRenderer.send('window-minimize'),
    windowClose: () => ipcRenderer.send('window-close'),
    windowToTray: () => ipcRenderer.send('window-to-tray'),

    // Mini widget
    toggleMiniWidget: (enabled) => ipcRenderer.invoke('toggle-mini-widget', enabled),
    updateMiniPosition: (x, y) => ipcRenderer.send('update-mini-position', x, y),
    updateMiniStyle: (borderColor, opacity) => ipcRenderer.send('update-mini-style', borderColor, opacity),
    setMiniDisplayMode: (mode) => ipcRenderer.invoke('set-mini-display-mode', mode),
    setMiniScale: (scale) => ipcRenderer.invoke('set-mini-scale', scale),
    setMiniLocked: (locked) => ipcRenderer.invoke('set-mini-locked', locked),

    // Ses & bildirim
    playSound: (fn) => ipcRenderer.invoke('play-sound', fn),
    selectSoundFile: () => ipcRenderer.invoke('select-sound-file'),
    showNotification: (t, b) => ipcRenderer.invoke('show-notification', t, b),

    // Şehirler
    getCities: () => ipcRenderer.invoke('get-cities'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // Tema
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
    getEffectiveTheme: () => ipcRenderer.invoke('get-effective-theme'),
    onThemeChanged: (cb) => ipcRenderer.on('theme-changed', (ev, t) => cb(t)),

    // Startup
    setAutoLaunch: (en) => ipcRenderer.invoke('set-auto-launch', en),
    completeOnboarding: () => ipcRenderer.invoke('complete-onboarding'),

    // Dil
    setLanguage: (lang) => ipcRenderer.invoke('set-language', lang),

    // Hicri
    getHijriDate: () => ipcRenderer.invoke('get-hijri-date'),
    isRamadan: () => ipcRenderer.invoke('is-ramadan'),

    // Günlük dua
    getDailyDua: () => ipcRenderer.invoke('get-daily-dua'),

    // Günün ayeti ve hadisi
    getDailyVerse: () => ipcRenderer.invoke('get-daily-verse'),
    getDailyHadith: () => ipcRenderer.invoke('get-daily-hadith'),

    // Esmaül Hüsna
    getEsma: () => ipcRenderer.invoke('get-esma'),

    // Namaz takip
    logPrayer: (key, prayed) => ipcRenderer.invoke('log-prayer', key, prayed),
    getPrayerLog: () => ipcRenderer.invoke('get-prayer-log'),
    getKaza: () => ipcRenderer.invoke('get-kaza'),
    saveKaza: (kaza) => ipcRenderer.invoke('save-kaza', kaza),
    onPrayerCheckPopup: (cb) => ipcRenderer.on('prayer-check-popup', (ev, d) => cb(d)),

    // Zikirmatik
    getZikirmatik: () => ipcRenderer.invoke('get-zikirmatik'),
    saveZikirmatik: (data) => ipcRenderer.invoke('save-zikirmatik', data),

    // RAM limiti
    saveMaxRAM: (maxRAM) => ipcRenderer.invoke('save-max-ram', maxRAM),

    // Performans
    getPerformance: () => ipcRenderer.invoke('get-performance'),

    // External link
    openExternal: (url) => ipcRenderer.invoke('open-external', url),

    // Hakkında
    getAboutInfo: () => ipcRenderer.invoke('get-about-info'),
    printPage: (options) => ipcRenderer.invoke('print-page', options),

    // Auto location
    detectLocation: () => ipcRenderer.invoke('detect-location'),

    // Dynamic Island
    testDynamicIsland: () => ipcRenderer.invoke('test-dynamic-island'),
    toggleDynamicIsland: (enabled) => ipcRenderer.invoke('toggle-dynamic-island', enabled),
    updateIslandData: (data) => ipcRenderer.invoke('update-island-data', data),

    // Auto-updater
    checkUpdate: () => ipcRenderer.invoke('check-update'),
    startUpdate: (url) => ipcRenderer.invoke('start-update', url),
    restartApp: () => ipcRenderer.invoke('restart-app'),
    onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (ev, i) => cb(i)),
    onUpdateProgress: (cb) => ipcRenderer.on('update-progress', (ev, p) => cb(p)),

    // Mini widget events
    onPrayerTimesUpdate: (cb) => ipcRenderer.on('prayer-times-updated', (ev, d) => cb(d)),
    onDisplayModeChanged: (cb) => ipcRenderer.on('display-mode-changed', (ev, m) => cb(m)),
    onStyleUpdate: (cb) => ipcRenderer.on('update-style', (ev, d) => cb(d)),
    onScaleChanged: (cb) => ipcRenderer.on('scale-changed', (ev, s) => cb(s)),
    onLockChanged: (cb) => ipcRenderer.on('lock-changed', (ev, l) => cb(l)),
    onPlaySoundFile: (cb) => ipcRenderer.on('play-sound-file', (ev, p) => cb(p))
});
