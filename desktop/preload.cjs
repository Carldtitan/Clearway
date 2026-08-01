/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clearwayDesktop", {
  getEnvironment: () => ipcRenderer.invoke("clearway:get-environment"),
  chooseRoots: () => ipcRenderer.invoke("clearway:choose-roots"),
  executeTool: (request) =>
    ipcRenderer.invoke("clearway:execute-tool", request),
  onActivity: (listener) => {
    if (typeof listener !== "function") return () => {};
    const handler = (_event, activity) => listener(activity);
    ipcRenderer.on("clearway:activity", handler);
    return () => ipcRenderer.removeListener("clearway:activity", handler);
  },
});
