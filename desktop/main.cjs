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
const { createWindowsControl } = require("./windows-control.cjs");
const { exportCaseFolder } = require("./case-export.cjs");

const DEFAULT_WEB_URL = "https://clearway-kappa.vercel.app";
const requestedUrl = readUrlArgument() || process.env.CLEARWAY_WEB_URL || DEFAULT_WEB_URL;
const webUrl = new URL(requestedUrl);
const allowedOrigin = webUrl.origin;
let mainWindow = null;
let fileTools = null;
let windowsControl = null;

const WINDOWS_CAPABILITIES = [
  "observe_windows",
  "open_file_explorer",
  "launch_app",
  "focus_window",
  "invoke_element",
  "click",
  "type_text",
  "press_keys",
  "scroll",
  "wait",
  "register_selected_file",
];
const VERIFIED_FILE_CAPABILITIES = [
  "extract_text",
  "preview_candidate",
  "open_candidate",
];

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
    const environment = fileTools.getEnvironment({
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
    });
    return {
      ...environment,
      capabilities: [...WINDOWS_CAPABILITIES, ...VERIFIED_FILE_CAPABILITIES],
    };
  });

  ipcMain.handle("clearway:execute-tool", async (event, request) => {
    assertAllowedSender(event);
    if (request?.tool === "register_selected_file") {
      const paths = await windowsControl.getSelectedFiles();
      return fileTools.registerPaths(paths);
    }
    if (WINDOWS_CAPABILITIES.includes(request?.tool)) {
      return windowsControl.execute(request);
    }
    if (!VERIFIED_FILE_CAPABILITIES.includes(request?.tool)) {
      throw new Error("Clearway requires visible Windows control for this task.");
    }
    return fileTools.execute(request);
  });

  ipcMain.handle("clearway:stop-computer", async (event) => {
    assertAllowedSender(event);
    windowsControl.stop();
    return { ok: true };
  });

  ipcMain.handle("clearway:link-candidate", async (event, request) => {
    assertAllowedSender(event);
    return fileTools.linkCandidate(request || {});
  });

  ipcMain.handle("clearway:list-linked", async (event) => {
    assertAllowedSender(event);
    return fileTools.listLinkedCandidates();
  });

  ipcMain.handle("clearway:export-case", async (event, request) => {
    assertAllowedSender(event);
    return exportCaseFolder({
      ...request,
      dialog,
      linkedFiles: fileTools.getLinkedFiles(),
      mainWindow,
      shell,
    });
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
  windowsControl = createWindowsControl({
    emit(activity) {
      if (!mainWindow?.isDestroyed()) {
        mainWindow.webContents.send("clearway:activity", activity);
      }
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
