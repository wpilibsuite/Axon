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

  // if (isDev) {
  win.webContents.openDevTools();
  // }
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

function bufferToSortedArray(buffer: Buffer): string[] {
  /*
    latest
    semantic sort with most recent first
    edge
   */
  const array = JSON.parse(buffer.toString()).results.map((element: { name: string }) => {
    return element.name;
  });
  const sorted: string[] = [];
  if (array.includes("latest")) {
    sorted.push("latest");
  }
  array.sort();
  array.forEach((element: string) => {
    if (element.match(/^\d+\.\d+\.\d+$/)) {
      sorted.push(element);
    }
  });
  if (array.includes("edge")) {
    sorted.push("edge");
  }
  return sorted;
}

ipcMain.on("request-tags", (event) => {
  // asks API for all metadata for Axon image, filters to only tags
  https
    .get("https://registry.hub.docker.com/v2/repositories/wpilib/axon/tags", (res) => {
      res.on("data", (buffer: Buffer) => {
        event.reply("axon-tags", bufferToSortedArray(buffer));
      });
    })
    .on("error", (e) => {
      console.error(e);
    });
});

ipcMain.on("launcher-version", (event) => {
  // gets build version for launcher. ENV variables are difficult with electron.
  // event.returnValue = app.getVersion();
  event.returnValue = "Version " + JSON.stringify(app.getVersion());
});
