import { app, BrowserWindow } from 'electron';
import * as path from 'path';
// import { initialize as initializeElectronRemote } from '@electron/remote/main';
// import electronRemote from '@electron/remote/main';
import {
  enable as enableElectronRemote,
  initialize as initializeElectronRemote,
} from '@electron/remote/main';

initializeElectronRemote();

if ((module as any).hot) {
  (module as any).hot.accept();
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // enableRemoteModule: true
    },
  });

  // Load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, './index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('browser-window-created', (_, window) => {
  enableElectronRemote(window.webContents);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
