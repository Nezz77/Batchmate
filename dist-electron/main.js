"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const client = require("@prisma/client");
const isDev$1 = !electron.app.isPackaged;
const dbPath = isDev$1 ? path.join(process.cwd(), "prisma", "dev.db") : path.join(electron.app.getPath("userData"), "database.sqlite");
const resultSheetsDir = isDev$1 ? path.join(process.cwd(), "result-sheets") : path.join(electron.app.getPath("userData"), "result-sheets");
let prisma;
async function initDatabase() {
  if (!isDev$1 && !fs.existsSync(dbPath)) {
    const defaultDb = path.join(process.resourcesPath, "batchmate.db");
    if (fs.existsSync(defaultDb)) {
      fs.copyFileSync(defaultDb, dbPath);
    }
  }
  prisma = new client.PrismaClient({
    datasourceUrl: `file:${dbPath}`
  });
  await prisma.$connect();
  console.log(`Database connected: ${dbPath}`);
  if (!fs.existsSync(resultSheetsDir)) {
    fs.mkdirSync(resultSheetsDir, { recursive: true });
  }
}
async function closeDatabase() {
  if (prisma) {
    await prisma.$disconnect();
  }
}
const GradePoints = {
  "A+": 4,
  "A": 4,
  "A-": 3.7,
  "B+": 3.3,
  "B": 3,
  "B-": 2.7,
  "C+": 2.3,
  "C": 2,
  "C-": 1.7,
  "D": 1,
  "I": 0,
  "F": 0
};
async function recalculateGpa(studentId) {
  const results = await prisma.courseResult.findMany({
    where: { studentId }
  });
  let totalCredits = 0;
  let totalPoints = 0;
  for (const res of results) {
    if (GradePoints[res.grade] !== void 0) {
      totalCredits += res.credits;
      totalPoints += res.credits * GradePoints[res.grade];
    }
  }
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  await prisma.student.update({
    where: { id: studentId },
    data: { gpa: Number(gpa.toFixed(2)) }
  });
}
function registerDatabaseHandlers() {
  electron.ipcMain.handle("db:students:getAll", async (_, filters) => {
    const where = {};
    if (filters == null ? void 0 : filters.search) {
      where.OR = [
        { fullName: { contains: filters.search } },
        { indexNumber: { contains: filters.search } },
        { email: { contains: filters.search } }
      ];
    }
    if (filters == null ? void 0 : filters.programme) {
      where.degreeProgramme = filters.programme;
    }
    if (filters == null ? void 0 : filters.batch) {
      where.batch = filters.batch;
    }
    if ((filters == null ? void 0 : filters.gpaMin) !== void 0 || (filters == null ? void 0 : filters.gpaMax) !== void 0) {
      where.gpa = {};
      if ((filters == null ? void 0 : filters.gpaMin) !== void 0) where.gpa.gte = filters.gpaMin;
      if ((filters == null ? void 0 : filters.gpaMax) !== void 0) where.gpa.lte = filters.gpaMax;
    }
    const orderBy = {};
    if (filters == null ? void 0 : filters.sortBy) {
      orderBy[filters.sortBy] = (filters == null ? void 0 : filters.sortOrder) || "asc";
    } else {
      orderBy.fullName = "asc";
    }
    return prisma.student.findMany({ where, orderBy });
  });
  electron.ipcMain.handle("db:students:getById", async (_, id) => {
    return prisma.student.findUnique({ where: { id } });
  });
  electron.ipcMain.handle("db:students:create", async (_, data) => {
    return prisma.student.create({
      data: {
        indexNumber: data.indexNumber,
        fullName: data.fullName,
        email: data.email || null,
        dateOfBirth: new Date(data.dateOfBirth),
        profileImage: data.profileImage || null,
        degreeProgramme: data.degreeProgramme,
        gpa: data.gpa || 0,
        batch: data.batch
      }
    });
  });
  electron.ipcMain.handle("db:students:update", async (_, id, data) => {
    const updateData = {};
    if (data.fullName !== void 0) updateData.fullName = data.fullName;
    if (data.email !== void 0) updateData.email = data.email;
    if (data.dateOfBirth !== void 0) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.profileImage !== void 0) updateData.profileImage = data.profileImage;
    if (data.degreeProgramme !== void 0) updateData.degreeProgramme = data.degreeProgramme;
    if (data.gpa !== void 0) updateData.gpa = data.gpa;
    if (data.batch !== void 0) updateData.batch = data.batch;
    return prisma.student.update({ where: { id }, data: updateData });
  });
  electron.ipcMain.handle("db:students:delete", async (_, id) => {
    return await prisma.student.delete({ where: { id } });
  });
  electron.ipcMain.handle("db:students:deleteAll", async () => {
    return await prisma.student.deleteMany({});
  });
  electron.ipcMain.handle("db:students:importBulk", async (_, records) => {
    let success = 0;
    let errors = 0;
    const errorDetails = [];
    for (const record of records) {
      try {
        let dateOfBirth;
        if (typeof record.dateOfBirth === "number") {
          dateOfBirth = new Date((record.dateOfBirth - (25567 + 1)) * 86400 * 1e3);
        } else {
          dateOfBirth = new Date(record.dateOfBirth);
        }
        if (isNaN(dateOfBirth.getTime())) {
          dateOfBirth = /* @__PURE__ */ new Date("2000-01-01");
        }
        const idx = String(record.indexNumber).trim().toUpperCase();
        let derivedProg = record.degreeProgramme;
        const prefix = idx.substring(0, 3);
        if (prefix === "244") derivedProg = "IT";
        else if (prefix === "245") derivedProg = "ITM";
        else if (prefix === "246") derivedProg = "AI";
        else if (!derivedProg) derivedProg = "IT";
        const updateData = {
          fullName: record.fullName,
          email: record.email || null,
          dateOfBirth,
          degreeProgramme: derivedProg,
          batch: record.batch || "24"
        };
        if (record.profileImage) {
          updateData.profileImage = record.profileImage;
        }
        await prisma.student.upsert({
          where: { indexNumber: idx },
          update: updateData,
          create: {
            indexNumber: idx,
            fullName: record.fullName,
            email: record.email || null,
            dateOfBirth,
            profileImage: record.profileImage || null,
            degreeProgramme: derivedProg,
            gpa: record.gpa || Number((Math.random() * (4 - 2.5) + 2.5).toFixed(2)),
            batch: record.batch || "24"
          }
        });
        success++;
      } catch (err) {
        errors++;
        errorDetails.push(`${record.indexNumber}: ${err.message}`);
      }
    }
    return { success, errors, errorDetails, total: records.length };
  });
  electron.ipcMain.handle("db:students:getStats", async () => {
    const allStudents = await prisma.student.findMany();
    const total = allStudents.length;
    if (total === 0) {
      return {
        totalStudents: 0,
        avgGpa: 0,
        programmeDistribution: [],
        gpaDistribution: [],
        batchDistribution: [],
        upcomingBirthdays: []
      };
    }
    const avgGpa = allStudents.reduce((sum, s) => sum + s.gpa, 0) / total;
    const progMap = /* @__PURE__ */ new Map();
    allStudents.forEach((s) => {
      progMap.set(s.degreeProgramme, (progMap.get(s.degreeProgramme) || 0) + 1);
    });
    const programmeDistribution = Array.from(progMap.entries()).map(([name, count]) => ({ name, count }));
    const gpaBuckets = [
      { range: "0 - 1.0", min: 0, max: 1, count: 0 },
      { range: "1.0 - 2.0", min: 1, max: 2, count: 0 },
      { range: "2.0 - 2.5", min: 2, max: 2.5, count: 0 },
      { range: "2.5 - 3.0", min: 2.5, max: 3, count: 0 },
      { range: "3.0 - 3.5", min: 3, max: 3.5, count: 0 },
      { range: "3.5 - 4.0", min: 3.5, max: 4.01, count: 0 }
    ];
    allStudents.forEach((s) => {
      for (const bucket of gpaBuckets) {
        if (s.gpa >= bucket.min && s.gpa < bucket.max) {
          bucket.count++;
          break;
        }
      }
    });
    const gpaDistribution = gpaBuckets.map(({ range, count }) => ({ range, count }));
    const batchMap = /* @__PURE__ */ new Map();
    allStudents.forEach((s) => {
      batchMap.set(s.batch, (batchMap.get(s.batch) || 0) + 1);
    });
    const batchDistribution = Array.from(batchMap.entries()).map(([batch, count]) => ({ batch, count }));
    const now = /* @__PURE__ */ new Date();
    const upcomingBirthdays = allStudents.filter((s) => {
      const dob = new Date(s.dateOfBirth);
      const thisYearBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (thisYearBirthday < now) {
        thisYearBirthday.setFullYear(now.getFullYear() + 1);
      }
      const diffDays = (thisYearBirthday.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).sort((a, b) => {
      const aDob = new Date(a.dateOfBirth);
      const bDob = new Date(b.dateOfBirth);
      const aNext = new Date(now.getFullYear(), aDob.getMonth(), aDob.getDate());
      const bNext = new Date(now.getFullYear(), bDob.getMonth(), bDob.getDate());
      if (aNext < now) aNext.setFullYear(now.getFullYear() + 1);
      if (bNext < now) bNext.setFullYear(now.getFullYear() + 1);
      return aNext.getTime() - bNext.getTime();
    }).slice(0, 10);
    return {
      totalStudents: total,
      avgGpa: Number(avgGpa.toFixed(2)),
      programmeDistribution,
      gpaDistribution,
      batchDistribution,
      upcomingBirthdays
    };
  });
  electron.ipcMain.handle("db:students:getBirthdays", async (_, month) => {
    const allStudents = await prisma.student.findMany();
    const targetMonth = month !== void 0 ? month : (/* @__PURE__ */ new Date()).getMonth();
    return allStudents.filter((s) => {
      const dob = new Date(s.dateOfBirth);
      return dob.getMonth() === targetMonth;
    }).sort((a, b) => {
      return new Date(a.dateOfBirth).getDate() - new Date(b.dateOfBirth).getDate();
    });
  });
  electron.ipcMain.handle("db:resultSheets:getAll", async () => {
    return prisma.resultSheet.findMany({ orderBy: { uploadedAt: "desc" } });
  });
  electron.ipcMain.handle("db:resultSheets:save", async (_, data) => {
    const filename = `${Date.now()}_${data.filename}`;
    const filepath = path.join(resultSheetsDir, filename);
    const fileBuffer = Buffer.from(data.buffer);
    fs.writeFileSync(filepath, fileBuffer);
    const sheet = await prisma.resultSheet.create({
      data: {
        filename: data.filename,
        filepath,
        batch: data.batch,
        semester: data.semester,
        subjectCode: data.subjectCode || null,
        subjectName: data.subjectName || null
      }
    });
    if (data.filename.toLowerCase().endsWith(".pdf") && data.subjectCode) {
      try {
        const pdfjsLib = await Promise.resolve().then(() => require("./pdf-C1IA6Uqw.js"));
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;
        let text = "";
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + " ";
        }
        const regex = /(24\d{4}[A-Z])\s+([A-D][+-]?|I|F|P|N|W)/g;
        let match;
        const uniqueUpdates = /* @__PURE__ */ new Set();
        while ((match = regex.exec(text)) !== null) {
          const indexNumber = match[1];
          const grade = match[2];
          const student = await prisma.student.findUnique({
            where: { indexNumber }
          });
          if (student) {
            await prisma.courseResult.upsert({
              where: {
                studentId_subjectCode: {
                  studentId: student.id,
                  subjectCode: data.subjectCode
                }
              },
              update: { grade, semester: data.semester },
              create: {
                studentId: student.id,
                subjectCode: data.subjectCode,
                subjectName: data.subjectName,
                grade,
                semester: data.semester,
                credits: 3
                // Defaulting to 3 credits as per plan
              }
            });
            uniqueUpdates.add(student.id);
          }
        }
        for (const studentId of uniqueUpdates) {
          await recalculateGpa(studentId);
        }
        console.log(`Parsed PDF and updated ${uniqueUpdates.size} student results.`);
      } catch (e) {
        console.error("Failed to parse PDF results:", e);
      }
    }
    return sheet;
  });
  electron.ipcMain.handle("db:resultSheets:delete", async (_, id) => {
    const sheet = await prisma.resultSheet.findUnique({ where: { id } });
    if (sheet && fs.existsSync(sheet.filepath)) {
      fs.unlinkSync(sheet.filepath);
    }
    return prisma.resultSheet.delete({ where: { id } });
  });
  electron.ipcMain.handle("db:resultSheets:open", async (_, id) => {
    const sheet = await prisma.resultSheet.findUnique({ where: { id } });
    if (sheet && fs.existsSync(sheet.filepath)) {
      await electron.shell.openPath(sheet.filepath);
    }
  });
}
const isDev = !electron.app.isPackaged;
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#0B1120",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false
    },
    icon: isDev ? path.join(process.cwd(), "app_icons/batchmate.png") : path.join(process.resourcesPath, "app_icons/batchmate.png"),
    show: false
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow == null ? void 0 : mainWindow.show();
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
electron.ipcMain.handle("dialog:openFile", async (_, options) => {
  if (!mainWindow) return null;
  const result = await electron.dialog.showOpenDialog(mainWindow, {
    filters: options == null ? void 0 : options.filters,
    properties: (options == null ? void 0 : options.properties) || ["openFile"]
  });
  return result.canceled ? null : result.filePaths[0];
});
electron.ipcMain.handle("dialog:openFiles", async (_, options) => {
  if (!mainWindow) return [];
  const result = await electron.dialog.showOpenDialog(mainWindow, {
    filters: options == null ? void 0 : options.filters,
    properties: ["openFile", "multiSelections"]
  });
  return result.canceled ? [] : result.filePaths;
});
electron.ipcMain.handle("dialog:saveFile", async (_, options) => {
  if (!mainWindow) return null;
  const result = await electron.dialog.showSaveDialog(mainWindow, {
    defaultPath: options == null ? void 0 : options.defaultPath,
    filters: options == null ? void 0 : options.filters
  });
  return result.canceled ? null : result.filePath;
});
electron.ipcMain.handle("fs:readFile", async (_, filePath) => {
  return fs.readFileSync(filePath);
});
electron.ipcMain.handle("fs:writeFile", async (_, filePath, data) => {
  fs.writeFileSync(filePath, data);
  return true;
});
electron.ipcMain.handle("fs:openExternal", async (_, filePath) => {
  await electron.shell.openPath(filePath);
});
electron.ipcMain.handle("app:getPath", async (_, name) => {
  return electron.app.getPath(name);
});
electron.ipcMain.handle("app:getResultSheetsDir", async () => {
  const dir = isDev ? path.join(process.cwd(), "result-sheets") : path.join(electron.app.getPath("userData"), "result-sheets");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
});
electron.ipcMain.handle("excel:parse", async (_, filePath) => {
  const xlsxModule = await import("xlsx");
  const XLSX = xlsxModule.default || xlsxModule;
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  const headers = Object.keys(data[0] || {});
  return { headers, data, sheetName, totalSheets: workbook.SheetNames.length };
});
electron.app.whenReady().then(async () => {
  await initDatabase();
  registerDatabaseHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", async () => {
  await closeDatabase();
});
