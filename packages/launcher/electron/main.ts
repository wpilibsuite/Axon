import { app, BrowserWindow, ipcMain, nativeImage } from "electron";
import * as path from "path";
import * as isDev from "electron-is-dev";
import installExtension, { REACT_DEVELOPER_TOOLS } from "electron-devtools-installer";
import * as https from "https";

let win: BrowserWindow | null = null;

function createWindow() {
  const icoPath = path.join(__dirname, "icon.png");
  win = new BrowserWindow({
    width: 600,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    icon: nativeImage.createFromPath(icoPath)
  });

  if (isDev) {
    win.loadURL("http://localhost:2000/index.html");
  } else {
    // 'build/index.html'
    win.loadURL(`file://${__dirname}/../index.html`);
  }

  win.on("closed", () => (win = null));

  win.setMenu(null);

  // Hot Reloading
  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("electron-reload")(__dirname, {
      electron: path.join(__dirname, "..", "..", "node_modules", ".bin", "electron"),
      forceHardReset: true,
      hardResetMethod: "exit"
    });
  }

  // DevTools
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log("An error occurred: ", err));

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});

ipcMain.on("request-internet", (event) => {
  https
    .get("https://hub.docker.com/", (res) => {
      event.reply("internet-status", res.statusCode === 200);
    })
    .on("error", (e) => {
      event.reply("internet-status", false);
    });
});
