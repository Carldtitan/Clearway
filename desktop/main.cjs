/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const os = require("node:os");
const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  session,
  shell,
} = require("electron");

const { createFileTools } = require("./file-tools.cjs");

const DEFAULT_WEB_URL = "https://clearway-kappa.vercel.app";
const requestedUrl = readUrlArgument() || process.env.CLEARWAY_WEB_URL || DEFAULT_WEB_URL;
const webUrl = new URL(requestedUrl);
const allowedOrigin = webUrl.origin;
let mainWindow = null;
let fileTools = null;

function readUrlArgument() {
  const argument = process.argv.find((value) => value.startsWith("--url="));
  return argument?.slice("--url=".length);
}

function isAllowedUrl(value) {
  try {
    return new URL(value).origin === allowedOrigin;
  } catch {
    return false;
  }
}

function assertAllowedSender(event) {
  const senderUrl = event.senderFrame?.url || event.sender.getURL();
  if (!isAllowedUrl(senderUrl)) {
    throw new Error("Clearway rejected a request from an untrusted page.");
  }
}

function registerIpc() {
  ipcMain.handle("clearway:get-environment", async (event) => {
    assertAllowedSender(event);
    return fileTools.getEnvironment({
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
    });
  });

  ipcMain.handle("clearway:choose-roots", async (event) => {
    assertAllowedSender(event);
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choose folders Clearway may search",
      buttonLabel: "Allow these folders",
      properties: ["openDirectory", "multiSelections"],
    });
    if (result.canceled) return fileTools.listRoots();
    return fileTools.setRoots(result.filePaths);
  });

  ipcMain.handle("clearway:execute-tool", async (event, request) => {
    assertAllowedSender(event);
    return fileTools.execute(request);
  });
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 760,
    minHeight: 640,
    show: false,
    backgroundColor: "#fbf9fa",
    title: "Clearway",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedUrl(url)) return { action: "allow" };
    if (url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedUrl(url)) event.preventDefault();
  });
  window.once("ready-to-show", () => window.show());
  await window.loadURL(webUrl.toString());
  return window;
}

app.whenReady().then(async () => {
  fileTools = createFileTools({
    ocrCachePath: path.join(app.getPath("userData"), "ocr-cache"),
    emit(activity) {
      if (!mainWindow?.isDestroyed()) {
        mainWindow.webContents.send("clearway:activity", activity);
      }
    },
    openPath(filePath) {
      return shell.openPath(filePath);
    },
  });
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(
        permission === "media" && isAllowedUrl(webContents.getURL()),
      );
    },
  );
  registerIpc();
  mainWindow = await createWindow();
  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  void fileTools?.dispose();
});
