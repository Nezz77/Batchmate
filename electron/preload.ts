import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // ── Student operations ─────────────────────────────────────
  students: {
    getAll: (filters?: {
      search?: string
      programme?: string
      batch?: string
      gpaMin?: number
      gpaMax?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }) => ipcRenderer.invoke('db:students:getAll', filters),

    getById: (id: string) =>
      ipcRenderer.invoke('db:students:getById', id),

    create: (data: any) =>
      ipcRenderer.invoke('db:students:create', data),

    update: (id: string, data: any) =>
      ipcRenderer.invoke('db:students:update', id, data),

    delete: (id: string) =>
      ipcRenderer.invoke('db:students:delete', id),

    deleteAll: () =>
      ipcRenderer.invoke('db:students:deleteAll'),

    importBulk: (records: any[]) =>
      ipcRenderer.invoke('db:students:importBulk', records),

    getStats: () =>
      ipcRenderer.invoke('db:students:getStats'),

    getBirthdays: (month?: number) =>
      ipcRenderer.invoke('db:students:getBirthdays', month),

    getResults: (studentId: string) =>
      ipcRenderer.invoke('db:students:getResults', studentId),

    getRank: (studentId: string) =>
      ipcRenderer.invoke('db:students:getRank', studentId),
  },

  // ── Subject operations ─────────────────────────────────────
  subjects: {
    getAll: () =>
      ipcRenderer.invoke('db:subjects:getAll'),

    create: (data: any) =>
      ipcRenderer.invoke('db:subjects:create', data),

    update: (id: string, data: any) =>
      ipcRenderer.invoke('db:subjects:update', id, data),

    delete: (id: string) =>
      ipcRenderer.invoke('db:subjects:delete', id),
  },

  // ── Result sheet operations ────────────────────────────────
  resultSheets: {
    getAll: () =>
      ipcRenderer.invoke('db:resultSheets:getAll'),

    save: (data: { filename: string; buffer: ArrayBuffer; batch: string; semester: string; subjectCode?: string; subjectName?: string }) =>
      ipcRenderer.invoke('db:resultSheets:save', data),

    delete: (id: string) =>
      ipcRenderer.invoke('db:resultSheets:delete', id),

    open: (id: string) =>
      ipcRenderer.invoke('db:resultSheets:open', id),
  },

  // ── Dialog operations ──────────────────────────────────────
  dialog: {
    openFile: (options?: { filters?: { name: string; extensions: string[] }[] }) =>
      ipcRenderer.invoke('dialog:openFile', options),

    openFiles: (options?: { filters?: { name: string; extensions: string[] }[] }) =>
      ipcRenderer.invoke('dialog:openFiles', options),

    saveFile: (options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
      ipcRenderer.invoke('dialog:saveFile', options),
  },

  // ── File system operations ─────────────────────────────────
  fs: {
    readFile: (filePath: string) =>
      ipcRenderer.invoke('fs:readFile', filePath),

    writeFile: (filePath: string, data: Buffer | Uint8Array) =>
      ipcRenderer.invoke('fs:writeFile', filePath, data),

    openExternal: (filePath: string) =>
      ipcRenderer.invoke('fs:openExternal', filePath),
  },

  // ── Excel operations ───────────────────────────────────────
  excel: {
    parse: (filePath: string) =>
      ipcRenderer.invoke('excel:parse', filePath),
  },

  // ── App operations ─────────────────────────────────────────
  app: {
    getPath: (name: string) =>
      ipcRenderer.invoke('app:getPath', name),

    getResultSheetsDir: () =>
      ipcRenderer.invoke('app:getResultSheetsDir'),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
