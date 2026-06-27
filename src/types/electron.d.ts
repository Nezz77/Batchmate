import type { ElectronAPI } from '../electron/preload'

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export interface Student {
  id: string
  indexNumber: string
  fullName: string
  email: string | null
  dateOfBirth: string
  profileImage: string | null
  degreeProgramme: string
  gpa: number
  totalCredits: number
  batch: string
  createdAt: string
  updatedAt: string
}

export interface Subject {
  id: string
  code: string
  name: string
  credits: number
  semester: string
  programme: string
  isNonGpa: boolean
  createdAt: string
  updatedAt: string
}

export interface ElectronAPI {
  dialog: {
    openFile(options: any): Promise<string | undefined>
  }
  fs: {
    readFile(path: string): Promise<ArrayBuffer>
  }
  subjects: {
    getAll(): Promise<Subject[]>
    create(data: Partial<Subject>): Promise<Subject>
    update(id: string, data: Partial<Subject>): Promise<Subject>
    delete(id: string): Promise<void>
  }
  students: {
    getAll(): Promise<Student[]>
    create(data: Partial<Student>): Promise<Student>
    update(id: string, data: Partial<Student>): Promise<Student>
    delete(id: string): Promise<void>
  }
}

export interface ResultSheet {
  id: string
  filename: string
  filepath: string
  batch: string
  semester: string
  subjectCode: string | null
  subjectName: string | null
  uploadedAt: string
}

export interface CourseResult {
  id: string
  studentId: string
  subjectCode: string
  subjectName: string | null
  grade: string
  credits: number
  semester: string | null
  createdAt: string
}

export interface DashboardStats {
  totalStudents: number
  avgGpa: number
  programmeDistribution: { name: string; count: number }[]
  gpaDistribution: { range: string; count: number }[]
  batchDistribution: { batch: string; count: number }[]
  upcomingBirthdays: Student[]
}

export interface ImportResult {
  success: number
  errors: number
  errorDetails: string[]
  total: number
}
