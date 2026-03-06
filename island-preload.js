const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onDynamicIslandShow: (cb) => ipcRenderer.on('dynamic-island-show', (ev, data) => cb(data)),
    onDynamicIslandUpdate: (cb) => ipcRenderer.on('dynamic-island-update', (ev, data) => cb(data)),
    onIslandForceState: (cb) => ipcRenderer.on('island-force-state', (ev, action) => cb(action)),
    closeDynamicIsland: () => ipcRenderer.send('close-dynamic-island'),
    setIslandMouseIgnore: (ignore) => ipcRenderer.send('island-set-mouse-ignore', ignore)
});
