"use strict";
const electron = require("electron");
const api = {
  // ── Student operations ─────────────────────────────────────
  students: {
    getAll: (filters) => electron.ipcRenderer.invoke("db:students:getAll", filters),
    getById: (id) => electron.ipcRenderer.invoke("db:students:getById", id),
    create: (data) => electron.ipcRenderer.invoke("db:students:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("db:students:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("db:students:delete", id),
    deleteAll: () => electron.ipcRenderer.invoke("db:students:deleteAll"),
    importBulk: (records) => electron.ipcRenderer.invoke("db:students:importBulk", records),
    getStats: () => electron.ipcRenderer.invoke("db:students:getStats"),
    getBirthdays: (month) => electron.ipcRenderer.invoke("db:students:getBirthdays", month),
    getResults: (studentId) => electron.ipcRenderer.invoke("db:students:getResults", studentId)
  },
  // ── Result sheet operations ────────────────────────────────
  resultSheets: {
    getAll: () => electron.ipcRenderer.invoke("db:resultSheets:getAll"),
    save: (data) => electron.ipcRenderer.invoke("db:resultSheets:save", data),
    delete: (id) => electron.ipcRenderer.invoke("db:resultSheets:delete", id),
    open: (id) => electron.ipcRenderer.invoke("db:resultSheets:open", id)
  },
  // ── Dialog operations ──────────────────────────────────────
  dialog: {
    openFile: (options) => electron.ipcRenderer.invoke("dialog:openFile", options),
    openFiles: (options) => electron.ipcRenderer.invoke("dialog:openFiles", options),
    saveFile: (options) => electron.ipcRenderer.invoke("dialog:saveFile", options)
  },
  // ── File system operations ─────────────────────────────────
  fs: {
    readFile: (filePath) => electron.ipcRenderer.invoke("fs:readFile", filePath),
    writeFile: (filePath, data) => electron.ipcRenderer.invoke("fs:writeFile", filePath, data),
    openExternal: (filePath) => electron.ipcRenderer.invoke("fs:openExternal", filePath)
  },
  // ── Excel operations ───────────────────────────────────────
  excel: {
    parse: (filePath) => electron.ipcRenderer.invoke("excel:parse", filePath)
  },
  // ── App operations ─────────────────────────────────────────
  app: {
    getPath: (name) => electron.ipcRenderer.invoke("app:getPath", name),
    getResultSheetsDir: () => electron.ipcRenderer.invoke("app:getResultSheetsDir")
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
