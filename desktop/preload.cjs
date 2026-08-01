/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clearwayDesktop", {
  getEnvironment: () => ipcRenderer.invoke("clearway:get-environment"),
  executeTool: (request) =>
    ipcRenderer.invoke("clearway:execute-tool", request),
  stopComputer: () => ipcRenderer.invoke("clearway:stop-computer"),
  linkCandidate: (request) =>
    ipcRenderer.invoke("clearway:link-candidate", request),
  listLinkedCandidates: () => ipcRenderer.invoke("clearway:list-linked"),
  exportCase: (request) => ipcRenderer.invoke("clearway:export-case", request),
  onActivity: (listener) => {
    if (typeof listener !== "function") return () => {};
    const handler = (_event, activity) => listener(activity);
    ipcRenderer.on("clearway:activity", handler);
    return () => ipcRenderer.removeListener("clearway:activity", handler);
  },
});
