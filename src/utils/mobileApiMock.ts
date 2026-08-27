import type { Student, Subject, CourseResult, ResultSheet, FlyerConfig } from '../types/electron.d'

const STORAGE_KEYS = {
  VERSION: 'batchmate_mobile_version',
  STUDENTS: 'batchmate_mobile_students_v5',
  SUBJECTS: 'batchmate_mobile_subjects_v5',
  RESULTS: 'batchmate_mobile_results_v5',
  RESULT_SHEETS: 'batchmate_mobile_result_sheets_v5',
  FLYER_CONFIG: 'batchmate_mobile_flyer_config_v5',
}

const CURRENT_VERSION = '5.0.0'

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', code: 'IN 1100', name: 'Fundamentals of Computing', credits: 3, semester: 'Year 1 Sem 1', programme: 'IT', isNonGpa: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sub-2', code: 'IN 1200', name: 'Programming Concepts', credits: 3, semester: 'Year 1 Sem 1', programme: 'IT', isNonGpa: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sub-3', code: 'IN 1300', name: 'Object Oriented Programming', credits: 3, semester: 'Year 1 Sem 2', programme: 'IT', isNonGpa: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sub-4', code: 'IN 1400', name: 'Data Structures and Algorithms', credits: 3, semester: 'Year 1 Sem 2', programme: 'IT', isNonGpa: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sub-5', code: 'IN 2100', name: 'Database Management Systems', credits: 3, semester: 'Year 2 Sem 1', programme: 'IT', isNonGpa: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sub-6', code: 'IN 2200', name: 'Mobile Application Development', credits: 3, semester: 'Year 2 Sem 2', programme: 'IT', isNonGpa: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

// Generic demo students covering all 12 months for testing
const DEMO_STUDENTS: Student[] = [
  { id: 'std-01', indexNumber: '244001A', fullName: 'Alexander Silva', email: 'alex.s@example.edu', dateOfBirth: '2001-01-14', profileImage: null, degreeProgramme: 'IT', gpa: 3.82, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-02', indexNumber: '244002B', fullName: 'Beatrice Perera', email: 'beatrice.p@example.edu', dateOfBirth: '2001-02-20', profileImage: null, degreeProgramme: 'IT', gpa: 3.65, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-03', indexNumber: '245003C', fullName: 'Charles Fernando', email: 'charles.f@example.edu', dateOfBirth: '2001-03-11', profileImage: null, degreeProgramme: 'ITM', gpa: 3.91, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-04', indexNumber: '245004D', fullName: 'Diana Wickrama', email: 'diana.w@example.edu', dateOfBirth: '2001-04-25', profileImage: null, degreeProgramme: 'ITM', gpa: 3.48, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-05', indexNumber: '245505E', fullName: 'Ethan Jayasuriya', email: 'ethan.j@example.edu', dateOfBirth: '2001-05-18', profileImage: null, degreeProgramme: 'AI', gpa: 3.77, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-06', indexNumber: '244006F', fullName: 'Fiona Dissanayake', email: 'fiona.d@example.edu', dateOfBirth: '2001-06-08', profileImage: null, degreeProgramme: 'IT', gpa: 3.59, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-07', indexNumber: '245007G', fullName: 'George Ratnayake', email: 'george.r@example.edu', dateOfBirth: '2001-07-22', profileImage: null, degreeProgramme: 'ITM', gpa: 3.84, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-08', indexNumber: '244008H', fullName: 'Hannah Mendis', email: 'hannah.m@example.edu', dateOfBirth: '2001-08-15', profileImage: null, degreeProgramme: 'IT', gpa: 3.95, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-09', indexNumber: '245509I', fullName: 'Ian Karunaratne', email: 'ian.k@example.edu', dateOfBirth: '2001-08-28', profileImage: null, degreeProgramme: 'AI', gpa: 3.70, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-10', indexNumber: '244010J', fullName: 'Julia Senanayake', email: 'julia.s@example.edu', dateOfBirth: '2001-09-03', profileImage: null, degreeProgramme: 'IT', gpa: 3.62, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-11', indexNumber: '245011K', fullName: 'Kevin Gunawardena', email: 'kevin.g@example.edu', dateOfBirth: '2001-10-19', profileImage: null, degreeProgramme: 'ITM', gpa: 3.88, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-12', indexNumber: '245512L', fullName: 'Laura Alwis', email: 'laura.a@example.edu', dateOfBirth: '2001-11-12', profileImage: null, degreeProgramme: 'AI', gpa: 3.51, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'std-13', indexNumber: '244013M', fullName: 'Michael Abeysekara', email: 'michael.a@example.edu', dateOfBirth: '2001-12-05', profileImage: null, degreeProgramme: 'IT', gpa: 3.73, totalCredits: 45, batch: '24', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.error('Error reading localStorage for key', key, err)
  }
  return defaultVal
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (err) {
    console.error('Error saving to localStorage for key', key, err)
  }
}

export function setupMobileApiFallback() {
  if (typeof window === 'undefined') return
  if (window.api) return // Already running in Electron

  console.log('📱 Initializing Batchmate Mobile API Adapter')

  const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION)
  const storedStudents = getStored<Student[]>(STORAGE_KEYS.STUDENTS, [])

  if (storedVersion !== CURRENT_VERSION || storedStudents.length === 0) {
    setStored(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
    setStored(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS)
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION)
  }

  const mobileApi = {
    students: {
      getAll: async (filters?: {
        search?: string
        programme?: string
        batch?: string
        gpaMin?: number
        gpaMax?: number
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
      }): Promise<Student[]> => {
        let list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          list = list.filter(
            s => s.fullName.toLowerCase().includes(q) || s.indexNumber.toLowerCase().includes(q)
          )
        }
        if (filters?.programme && filters.programme !== 'all') {
          list = list.filter(s => s.degreeProgramme === filters.programme)
        }
        if (filters?.batch && filters.batch !== 'all') {
          list = list.filter(s => s.batch === filters.batch)
        }
        if (filters?.gpaMin !== undefined) {
          list = list.filter(s => (s.gpa ?? 0) >= filters.gpaMin!)
        }
        if (filters?.gpaMax !== undefined) {
          list = list.filter(s => (s.gpa ?? 0) <= filters.gpaMax!)
        }
        if (filters?.sortBy) {
          const order = filters.sortOrder === 'desc' ? -1 : 1
          list.sort((a: any, b: any) => {
            const valA = a[filters.sortBy!] ?? ''
            const valB = b[filters.sortBy!] ?? ''
            if (valA < valB) return -1 * order
            if (valA > valB) return 1 * order
            return 0
          })
        }
        return list
      },

      getById: async (id: string): Promise<Student | null> => {
        const list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        return list.find(s => s.id === id) || null
      },

      create: async (data: Partial<Student>): Promise<Student> => {
        const list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        const newStudent: Student = {
          id: `std-${Date.now()}`,
          indexNumber: data.indexNumber || `ST/${Date.now().toString().slice(-4)}`,
          fullName: data.fullName || 'New Student',
          email: data.email || null,
          dateOfBirth: data.dateOfBirth || '2001-01-01',
          profileImage: data.profileImage || null,
          degreeProgramme: data.degreeProgramme || 'IT',
          gpa: Number(data.gpa) || 0,
          totalCredits: Number(data.totalCredits) || 0,
          batch: data.batch || '24',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        list.push(newStudent)
        setStored(STORAGE_KEYS.STUDENTS, list)
        return newStudent
      },

      update: async (id: string, data: Partial<Student>): Promise<Student> => {
        const list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        const idx = list.findIndex(s => s.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() }
          setStored(STORAGE_KEYS.STUDENTS, list)
          return list[idx]
        }
        throw new Error('Student not found')
      },

      delete: async (id: string): Promise<void> => {
        let list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        list = list.filter(s => s.id !== id)
        setStored(STORAGE_KEYS.STUDENTS, list)
      },

      deleteAll: async (): Promise<void> => {
        setStored(STORAGE_KEYS.STUDENTS, [])
      },

      importBulk: async (records: any[]): Promise<{ success: number; errors: number; errorDetails: string[]; total: number }> => {
        const list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        let success = 0
        records.forEach((r, i) => {
          list.push({
            id: `std-${Date.now()}-${i}`,
            indexNumber: r.indexNumber || `244${100 + i}`,
            fullName: r.fullName || 'Imported Student',
            email: r.email || null,
            dateOfBirth: r.dateOfBirth || '2001-01-01',
            profileImage: r.profileImage || null,
            degreeProgramme: r.degreeProgramme || 'IT',
            gpa: Number(r.gpa) || 3.0,
            totalCredits: Number(r.totalCredits) || 30,
            batch: r.batch || '24',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          success++
        })
        setStored(STORAGE_KEYS.STUDENTS, list)
        return { success, errors: 0, errorDetails: [], total: records.length }
      },

      getStats: async () => {
        const list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        const totalStudents = list.length
        const avgGpa = totalStudents > 0
          ? Number((list.reduce((acc, s) => acc + (s.gpa || 0), 0) / totalStudents).toFixed(2))
          : 0

        const progMap: Record<string, number> = {}
        const batchMap: Record<string, number> = {}
        const gpaBuckets = { '< 2.0': 0, '2.0 - 2.99': 0, '3.0 - 3.49': 0, '3.5 - 4.0': 0 }

        list.forEach(s => {
          progMap[s.degreeProgramme] = (progMap[s.degreeProgramme] || 0) + 1
          batchMap[s.batch] = (batchMap[s.batch] || 0) + 1
          if (s.gpa < 2.0) gpaBuckets['< 2.0']++
          else if (s.gpa < 3.0) gpaBuckets['2.0 - 2.99']++
          else if (s.gpa < 3.5) gpaBuckets['3.0 - 3.49']++
          else gpaBuckets['3.5 - 4.0']++
        })

        const currentMonth = new Date().getMonth()
        const upcoming = list.filter(s => {
          if (!s.dateOfBirth) return false
          const m = new Date(s.dateOfBirth).getMonth()
          return m === currentMonth || m === (currentMonth + 1) % 12
        }).sort((a, b) => new Date(a.dateOfBirth).getDate() - new Date(b.dateOfBirth).getDate())

        return {
          totalStudents,
          avgGpa,
          programmeDistribution: Object.entries(progMap).map(([name, count]) => ({ name, count })),
          batchDistribution: Object.entries(batchMap).map(([batch, count]) => ({ batch, count })),
          gpaDistribution: Object.entries(gpaBuckets).map(([range, count]) => ({ range, count })),
          upcomingBirthdays: upcoming.slice(0, 5),
        }
      },

      getBirthdays: async (month?: number): Promise<Student[]> => {
        const list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        const targetMonth = month !== undefined && month !== null ? month : new Date().getMonth()
        return list.filter(s => {
          if (!s.dateOfBirth) return false
          const dob = new Date(s.dateOfBirth)
          return dob.getMonth() === targetMonth
        }).sort((a, b) => {
          return new Date(a.dateOfBirth).getDate() - new Date(b.dateOfBirth).getDate()
        })
      },

      getResults: async (studentId: string): Promise<CourseResult[]> => {
        return [
          { id: 'res-1', studentId, subjectCode: 'IN 1100', subjectName: 'Fundamentals of Computing', grade: 'A', credits: 3, semester: 'Year 1 Sem 1', createdAt: new Date().toISOString() },
          { id: 'res-2', studentId, subjectCode: 'IN 1200', subjectName: 'Programming Concepts', grade: 'A+', credits: 3, semester: 'Year 1 Sem 1', createdAt: new Date().toISOString() },
          { id: 'res-3', studentId, subjectCode: 'IN 1300', subjectName: 'Object Oriented Programming', grade: 'A-', credits: 3, semester: 'Year 1 Sem 2', createdAt: new Date().toISOString() },
          { id: 'res-4', studentId, subjectCode: 'IN 1400', subjectName: 'Data Structures & Algorithms', grade: 'A', credits: 3, semester: 'Year 1 Sem 2', createdAt: new Date().toISOString() },
        ]
      },

      getRank: async (studentId: string) => {
        const list = getStored<Student[]>(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS)
        const target = list.find(s => s.id === studentId)
        if (!target) return null
        const sameProg = list.filter(s => s.degreeProgramme === target.degreeProgramme)
        sameProg.sort((a, b) => b.gpa - a.gpa)
        const rank = sameProg.findIndex(s => s.id === studentId) + 1
        return {
          rank: rank > 0 ? rank : 1,
          total: sameProg.length,
          degree: target.degreeProgramme,
        }
      },
    },

    subjects: {
      getAll: async (): Promise<Subject[]> => {
        return getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS)
      },
      create: async (data: Partial<Subject>): Promise<Subject> => {
        const list = getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS)
        const newSub: Subject = {
          id: `sub-${Date.now()}`,
          code: data.code || 'IN 0000',
          name: data.name || 'New Subject',
          credits: Number(data.credits) || 3,
          semester: data.semester || 'Year 1 Sem 1',
          programme: data.programme || 'IT',
          isNonGpa: Boolean(data.isNonGpa),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        list.push(newSub)
        setStored(STORAGE_KEYS.SUBJECTS, list)
        return newSub
      },
      update: async (id: string, data: Partial<Subject>): Promise<Subject> => {
        const list = getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS)
        const idx = list.findIndex(s => s.id === id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() }
          setStored(STORAGE_KEYS.SUBJECTS, list)
          return list[idx]
        }
        throw new Error('Subject not found')
      },
      delete: async (id: string): Promise<void> => {
        let list = getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS)
        list = list.filter(s => s.id !== id)
        setStored(STORAGE_KEYS.SUBJECTS, list)
      },
    },

    resultSheets: {
      getAll: async (): Promise<ResultSheet[]> => {
        return getStored<ResultSheet[]>(STORAGE_KEYS.RESULT_SHEETS, [])
      },
      save: async (data: any) => {
        const list = getStored<ResultSheet[]>(STORAGE_KEYS.RESULT_SHEETS, [])
        const sheet: ResultSheet = {
          id: `rs-${Date.now()}`,
          filename: data.filename || 'results.pdf',
          filepath: `/mobile-results/${data.filename}`,
          batch: data.batch || '24',
          semester: data.semester || 'Year 1 Sem 1',
          subjectCode: data.subjectCode || null,
          subjectName: data.subjectName || null,
          uploadedAt: new Date().toISOString(),
        }
        list.push(sheet)
        setStored(STORAGE_KEYS.RESULT_SHEETS, list)
        return sheet
      },
      delete: async (id: string) => {
        let list = getStored<ResultSheet[]>(STORAGE_KEYS.RESULT_SHEETS, [])
        list = list.filter(s => s.id !== id)
        setStored(STORAGE_KEYS.RESULT_SHEETS, list)
      },
      open: async (id: string) => {
        console.log('Open result sheet in mobile:', id)
      },
    },

    dialog: {
      openFile: async (_options?: any) => {
        return undefined
      },
      openFiles: async (_options?: any) => {
        return []
      },
      saveFile: async (_options?: any) => {
        return 'download.png'
      },
    },

    fs: {
      readFile: async (_filePath: string) => {
        return new ArrayBuffer(0)
      },
      writeFile: async (_filePath: string, _data: any) => {
        return true
      },
      openExternal: async (url: string) => {
        window.open(url, '_blank')
      },
    },

    excel: {
      parse: async (_filePath: string) => {
        return { headers: ['Index Number', 'Full Name', 'GPA'], data: [], sheetName: 'Sheet1', totalSheets: 1 }
      },
    },

    app: {
      getPath: async (_name: string) => '/mobile-app-storage',
      getResultSheetsDir: async () => '/mobile-app-storage/result-sheets',
      getFlyerConfig: async (): Promise<FlyerConfig | null> => {
        return getStored<FlyerConfig | null>(STORAGE_KEYS.FLYER_CONFIG, null)
      },
      saveFlyerConfig: async (config: FlyerConfig) => {
        setStored(STORAGE_KEYS.FLYER_CONFIG, config)
      },
    },
  }

  // @ts-ignore
  window.api = mobileApi
}
