import { ipcMain, app, shell } from 'electron'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const isDev = !!process.env.VITE_DEV_SERVER_URL

// In production, Prisma's native query engine is unpacked from ASAR into
// app.asar.unpacked — we must point the env var there before instantiating
// PrismaClient, otherwise the module loader can't find the .node binary.
if (!isDev) {
  const engineDir = path.join(
    process.resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    '.prisma',
    'client'
  )
  // Locate the .node query engine file for the current platform
  const engineFile = fs.readdirSync(engineDir).find(f =>
    f.startsWith('libquery_engine') && f.endsWith('.node')
  )
  if (engineFile) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(engineDir, engineFile)
  }
}

const dbPath = isDev
  ? path.join(process.cwd(), 'prisma', 'dev.db')
  : path.join(app.getPath('userData'), 'database.sqlite')

const resultSheetsDir = isDev
  ? path.join(process.cwd(), 'result-sheets')
  : path.join(app.getPath('userData'), 'result-sheets')

let prisma: PrismaClient

export async function initDatabase() {
  // In production, copy the default DB if it doesn't exist yet
  if (!isDev && !fs.existsSync(dbPath)) {
    const defaultDb = path.join(process.resourcesPath, 'batchmate.db')
    if (fs.existsSync(defaultDb)) {
      fs.copyFileSync(defaultDb, dbPath)
    }
  }

  if (!fs.existsSync(resultSheetsDir)) {
    fs.mkdirSync(resultSheetsDir, { recursive: true })
  }

  prisma = new PrismaClient({
    datasourceUrl: `file:${dbPath}`,
  })

  await prisma.$connect()
  console.log(`Database connected: ${dbPath}`)

  // Ensure result sheets directory exists
  if (!fs.existsSync(resultSheetsDir)) {
    fs.mkdirSync(resultSheetsDir, { recursive: true })
  }
}

export async function closeDatabase() {
  if (prisma) {
    await prisma.$disconnect()
  }
}

const GradePoints: Record<string, number> = {
  'A+': 4.00, 'A': 4.00, 'A-': 3.70,
  'B+': 3.30, 'B': 3.00, 'B-': 2.70,
  'C+': 2.30, 'C': 2.00, 'C-': 1.70,
  'D': 1.00, 'I': 0.00, 'F': 0.00
}

async function recalculateGpa(studentId: string) {
  const results = await prisma.courseResult.findMany({
    where: { studentId }
  })
  
  // Fetch all subjects to check for isNonGpa
  const allSubjects = await prisma.subject.findMany()
  const subjectMap = new Map(allSubjects.map(s => [s.code, s]))
  
  let totalCredits = 0
  let gpaCredits = 0
  let totalPoints = 0

  for (const res of results) {
    if (GradePoints[res.grade] !== undefined) { // P, N, W are ignored
      totalCredits += res.credits
      
      const subjectInfo = subjectMap.get(res.subjectCode)
      const isNonGpa = subjectInfo?.isNonGpa || false
      
      if (!isNonGpa) {
        gpaCredits += res.credits
        totalPoints += res.credits * GradePoints[res.grade]
      }
    }
  }

  const gpa = gpaCredits > 0 ? totalPoints / gpaCredits : 0
  await prisma.student.update({
    where: { id: studentId },
    data: { 
      gpa: Number(gpa.toFixed(2)),
      totalCredits: Number(totalCredits.toFixed(1))
    }
  })
}

export function registerDatabaseHandlers() {
  // ── Students: Get All ──────────────────────────────────────
  ipcMain.handle('db:students:getAll', async (_, filters?: {
    search?: string
    programme?: string
    batch?: string
    gpaMin?: number
    gpaMax?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    const where: any = {}

    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search } },
        { indexNumber: { contains: filters.search } },
        { email: { contains: filters.search } },
      ]
    }

    if (filters?.programme) {
      where.degreeProgramme = filters.programme
    }

    if (filters?.batch) {
      where.batch = filters.batch
    }

    if (filters?.gpaMin !== undefined || filters?.gpaMax !== undefined) {
      where.gpa = {}
      if (filters?.gpaMin !== undefined) where.gpa.gte = filters.gpaMin
      if (filters?.gpaMax !== undefined) where.gpa.lte = filters.gpaMax
    }

    const orderBy: any = {}
    if (filters?.sortBy) {
      orderBy[filters.sortBy] = filters?.sortOrder || 'asc'
    } else {
      orderBy.fullName = 'asc'
    }

    return prisma.student.findMany({ where, orderBy })
  })

  // ── Students: Get By ID ────────────────────────────────────
  ipcMain.handle('db:students:getById', async (_, id: string) => {
    return prisma.student.findUnique({ where: { id } })
  })

  // ── Students: Create ───────────────────────────────────────
  ipcMain.handle('db:students:create', async (_, data: any) => {
    return prisma.student.create({
      data: {
        indexNumber: data.indexNumber,
        fullName: data.fullName,
        email: data.email || null,
        dateOfBirth: new Date(data.dateOfBirth),
        profileImage: data.profileImage || null,
        degreeProgramme: data.degreeProgramme,
        gpa: data.gpa || 0.0,
        batch: data.batch,
      },
    })
  })

  // ── Students: Update ───────────────────────────────────────
  ipcMain.handle('db:students:update', async (_, id: string, data: any) => {
    const updateData: any = {}
    if (data.fullName !== undefined) updateData.fullName = data.fullName
    if (data.email !== undefined) updateData.email = data.email
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth)
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage
    if (data.degreeProgramme !== undefined) updateData.degreeProgramme = data.degreeProgramme
    if (data.gpa !== undefined) updateData.gpa = data.gpa
    if (data.batch !== undefined) updateData.batch = data.batch

    return prisma.student.update({ where: { id }, data: updateData })
  })

  // ── Students: Delete ───────────────────────────────────────
  ipcMain.handle('db:students:delete', async (_, id: string) => {
    return await prisma.student.delete({ where: { id } })
  })

  ipcMain.handle('db:students:deleteAll', async () => {
    return await prisma.student.deleteMany({})
  })

  // ── Students: Bulk Import ──────────────────────────────────
  ipcMain.handle('db:students:importBulk', async (_, records: any[]) => {
    let success = 0
    let errors = 0
    const errorDetails: string[] = []

    for (const record of records) {
      try {
        let dateOfBirth: Date
        if (typeof record.dateOfBirth === 'number') {
          // Excel serial date
          dateOfBirth = new Date((record.dateOfBirth - (25567 + 1)) * 86400 * 1000)
        } else {
          dateOfBirth = new Date(record.dateOfBirth)
        }
        if (isNaN(dateOfBirth.getTime())) {
          dateOfBirth = new Date('2000-01-01')
        }

        const idx = String(record.indexNumber).trim().toUpperCase()
        
        let derivedProg = record.degreeProgramme;
        const degreeCode = idx.substring(2, 4);
        if (degreeCode === "40" || degreeCode === "41") derivedProg = "IT";
        else if (degreeCode === "50" || degreeCode === "51") derivedProg = "ITM";
        else if (degreeCode === "55") derivedProg = "AI";
        else if (!derivedProg) derivedProg = "IT";

        const updateData: any = {
          fullName: record.fullName,
          email: record.email || null,
          dateOfBirth,
          degreeProgramme: derivedProg,
          batch: record.batch || '24',
        }
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
            gpa: record.gpa || Number((Math.random() * (4.0 - 2.5) + 2.5).toFixed(2)),
            batch: record.batch || '24',
          },
        })
        success++
      } catch (err: any) {
        errors++
        errorDetails.push(`${record.indexNumber}: ${err.message}`)
      }
    }

    return { success, errors, errorDetails, total: records.length }
  })

  // ── Students: Get Stats ────────────────────────────────────
  ipcMain.handle('db:students:getStats', async () => {
    const allStudents = await prisma.student.findMany()
    const total = allStudents.length

    if (total === 0) {
      return {
        totalStudents: 0,
        avgGpa: 0,
        programmeDistribution: [],
        gpaDistribution: [],
        batchDistribution: [],
        upcomingBirthdays: [],
      }
    }

    // Average GPA
    const avgGpa = allStudents.reduce((sum, s) => sum + s.gpa, 0) / total

    // Programme distribution
    const progMap = new Map<string, number>()
    allStudents.forEach(s => {
      progMap.set(s.degreeProgramme, (progMap.get(s.degreeProgramme) || 0) + 1)
    })
    const programmeDistribution = Array.from(progMap.entries()).map(([name, count]) => ({ name, count }))

    // GPA distribution (buckets)
    const gpaBuckets = [
      { range: '0 - 1.0', min: 0, max: 1.0, count: 0 },
      { range: '1.0 - 2.0', min: 1.0, max: 2.0, count: 0 },
      { range: '2.0 - 2.5', min: 2.0, max: 2.5, count: 0 },
      { range: '2.5 - 3.0', min: 2.5, max: 3.0, count: 0 },
      { range: '3.0 - 3.5', min: 3.0, max: 3.5, count: 0 },
      { range: '3.5 - 4.0', min: 3.5, max: 4.01, count: 0 },
    ]
    allStudents.forEach(s => {
      for (const bucket of gpaBuckets) {
        if (s.gpa >= bucket.min && s.gpa < bucket.max) {
          bucket.count++
          break
        }
      }
    })
    const gpaDistribution = gpaBuckets.map(({ range, count }) => ({ range, count }))

    // Batch distribution
    const batchMap = new Map<string, number>()
    allStudents.forEach(s => {
      batchMap.set(s.batch, (batchMap.get(s.batch) || 0) + 1)
    })
    const batchDistribution = Array.from(batchMap.entries()).map(([batch, count]) => ({ batch, count }))

    // Upcoming birthdays (next 30 days)
    const now = new Date()
    const upcomingBirthdays = allStudents
      .filter(s => {
        const dob = new Date(s.dateOfBirth)
        const thisYearBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
        // If birthday has already passed this year, check next year
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(now.getFullYear() + 1)
        }
        const diffDays = (thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays >= 0 && diffDays <= 30
      })
      .sort((a, b) => {
        const aDob = new Date(a.dateOfBirth)
        const bDob = new Date(b.dateOfBirth)
        const aNext = new Date(now.getFullYear(), aDob.getMonth(), aDob.getDate())
        const bNext = new Date(now.getFullYear(), bDob.getMonth(), bDob.getDate())
        if (aNext < now) aNext.setFullYear(now.getFullYear() + 1)
        if (bNext < now) bNext.setFullYear(now.getFullYear() + 1)
        return aNext.getTime() - bNext.getTime()
      })
      .slice(0, 10)

    return {
      totalStudents: total,
      avgGpa: Number(avgGpa.toFixed(2)),
      programmeDistribution,
      gpaDistribution,
      batchDistribution,
      upcomingBirthdays,
    }
  })

  // ── Students: Get Birthdays ────────────────────────────────
  ipcMain.handle('db:students:getBirthdays', async (_, month?: number) => {
    const allStudents = await prisma.student.findMany()
    const targetMonth = month !== undefined ? month : new Date().getMonth()

    return allStudents.filter(s => {
      const dob = new Date(s.dateOfBirth)
      return dob.getMonth() === targetMonth
    }).sort((a, b) => {
      return new Date(a.dateOfBirth).getDate() - new Date(b.dateOfBirth).getDate()
    })
  })

  // ── Students: Get Results ──────────────────────────────────
  ipcMain.handle('db:students:getResults', async (_, studentId: string) => {
    return prisma.courseResult.findMany({
      where: { studentId },
      orderBy: { semester: 'asc' }
    })
  })

  // ── Students: Get Rank ─────────────────────────────────────
  ipcMain.handle('db:students:getRank', async (_, studentId: string) => {
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return null;
    
    // Get all students in the same degree and batch
    const students = await prisma.student.findMany({
      where: { degreeProgramme: student.degreeProgramme, batch: student.batch },
      orderBy: { gpa: 'desc' },
      select: { id: true }
    })
    
    // Calculate rank
    const rank = students.findIndex(s => s.id === student.id) + 1;
    return { rank, total: students.length, degree: student.degreeProgramme }
  })

  // ── Subjects: Get All ──────────────────────────────────────
  ipcMain.handle('db:subjects:getAll', async () => {
    return prisma.subject.findMany({ orderBy: [{ semester: 'asc' }, { code: 'asc' }] })
  })

  // ── Subjects: Create ───────────────────────────────────────
  ipcMain.handle('db:subjects:create', async (_, data: any) => {
    return prisma.subject.create({ data })
  })

  // ── Subjects: Update ───────────────────────────────────────
  ipcMain.handle('db:subjects:update', async (_, id: string, data: any) => {
    return prisma.subject.update({ where: { id }, data })
  })

  // ── Subjects: Delete ───────────────────────────────────────
  ipcMain.handle('db:subjects:delete', async (_, id: string) => {
    return await prisma.subject.delete({ where: { id } })
  })

  // ── Result Sheets: Get All ─────────────────────────────────
  ipcMain.handle('db:resultSheets:getAll', async () => {
    return prisma.resultSheet.findMany({ orderBy: { uploadedAt: 'desc' } })
  })

  // ── Result Sheets: Save ────────────────────────────────────
  ipcMain.handle('db:resultSheets:save', async (_, data: {
    filename: string
    buffer: ArrayBuffer
    batch: string
    semester: string
    subjectCode?: string
    subjectName?: string
  }) => {
    const filename = `${Date.now()}_${data.filename}`
    const filepath = path.join(resultSheetsDir, filename)
    const fileBuffer = Buffer.from(data.buffer)
    fs.writeFileSync(filepath, fileBuffer)

    const subjectInfo = data.subjectCode 
      ? await prisma.subject.findUnique({ where: { code: data.subjectCode } })
      : null

    const sheet = await prisma.resultSheet.create({
      data: {
        filename: data.filename,
        filepath,
        batch: data.batch,
        semester: subjectInfo?.semester || data.semester,
        subjectCode: data.subjectCode || null,
        subjectName: subjectInfo?.name || data.subjectName || null,
      },
    })

    // Parse PDF to extract grades
    if (data.filename.toLowerCase().endsWith('.pdf')) {
      try {
        const pdfjsLib = await import(/* @vite-ignore */ 'pdfjs-dist/legacy/build/pdf.mjs');
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;
        let text = '';
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + ' ';
        }
        
        let actualSubjectCode = data.subjectCode;
        if (!actualSubjectCode) {
          const subjMatch = text.match(/([A-Z]{2}\d{4})\s+-/);
          if (subjMatch) {
            actualSubjectCode = subjMatch[1];
          }
        }

        if (actualSubjectCode) {
          const actualSubjectInfo = await prisma.subject.findUnique({ where: { code: actualSubjectCode } }) || subjectInfo;
          // Match index number (e.g. 244001C or 234250D) followed by whitespace and a grade
          // Including A+, A, A-, B+, etc. and I, F, P, N, W
          const regex = /\b(\d{6}[A-Z])\s+([A-D][+-]?|I|F|P|N|W)(?=\s|$)/g
          let match
          const uniqueUpdates = new Set<string>()

          while ((match = regex.exec(text)) !== null) {
            const indexNumber = match[1]
            const grade = match[2]

            const student = await prisma.student.findUnique({
              where: { indexNumber }
            })

            if (student) {
              await prisma.courseResult.upsert({
                where: {
                  studentId_subjectCode: {
                    studentId: student.id,
                    subjectCode: actualSubjectCode,
                  }
                },
                update: { grade, semester: actualSubjectInfo?.semester || data.semester },
                create: {
                  studentId: student.id,
                  subjectCode: actualSubjectCode,
                  subjectName: actualSubjectInfo?.name || data.subjectName,
                  grade,
                  semester: actualSubjectInfo?.semester || data.semester,
                  credits: actualSubjectInfo?.credits || 3.0
                }
              })
              uniqueUpdates.add(student.id)
            }
          }

          if (!data.subjectCode) {
            await prisma.resultSheet.update({
              where: { id: sheet.id },
              data: {
                subjectCode: actualSubjectCode,
                subjectName: actualSubjectInfo?.name
              }
            })
          }

        // Recalculate GPA for all affected students
        for (const studentId of Array.from(uniqueUpdates)) {
          await recalculateGpa(studentId)
        }
        console.log(`Parsed PDF and updated ${uniqueUpdates.size} student results.`)
        } // End if (actualSubjectCode)
      } catch (e) {
        console.error("Failed to parse PDF results:", e)
      }
    }

    return sheet
  })

  // ── Result Sheets: Delete ──────────────────────────────────
  ipcMain.handle('db:resultSheets:delete', async (_, id: string) => {
    const sheet = await prisma.resultSheet.findUnique({ where: { id } })
    if (sheet) {
      if (sheet.subjectCode && sheet.batch) {
        // Find all course results for this subject and batch
        const studentsInBatch = await prisma.student.findMany({
          where: { batch: sheet.batch },
          select: { id: true }
        })
        const studentIds = studentsInBatch.map(s => s.id)

        await prisma.courseResult.deleteMany({
          where: {
            subjectCode: sheet.subjectCode,
            studentId: { in: studentIds }
          }
        })
        
        // Recalculate GPA for affected students
        for (const studentId of studentIds) {
          await recalculateGpa(studentId)
        }
      }

      if (fs.existsSync(sheet.filepath)) {
        fs.unlinkSync(sheet.filepath)
      }
      return prisma.resultSheet.delete({ where: { id } })
    }
    return null
  })

  // ── Result Sheets: Open ────────────────────────────────────
  ipcMain.handle('db:resultSheets:open', async (_, id: string) => {
    const sheet = await prisma.resultSheet.findUnique({ where: { id } })
    if (sheet && fs.existsSync(sheet.filepath)) {
      await shell.openPath(sheet.filepath)
    }
  })
}
