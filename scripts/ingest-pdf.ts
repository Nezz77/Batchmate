import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const pdfPath = path.join(process.cwd(), 'Resultsheets', 'IN1611_Multimedia Technologies_Intake 2024_Semester 1_student_view.pdf')

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
  
  let totalCredits = 0
  let totalPoints = 0

  for (const res of results) {
    if (GradePoints[res.grade] !== undefined) {
      totalCredits += res.credits
      totalPoints += res.credits * GradePoints[res.grade]
    }
  }

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0
  await prisma.student.update({
    where: { id: studentId },
    data: { gpa: Number(gpa.toFixed(2)) }
  })
}

async function main() {
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found: ${pdfPath}`)
    return
  }

  const dataBuffer = fs.readFileSync(pdfPath)
  console.log("Parsing PDF...")
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(dataBuffer) }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + ' ';
  }

  // Match index number (e.g. 244001C) followed by whitespace and a grade
  const regex = /(24\d{4}[A-Z])\s+([A-D][+-]?|I|F|P|N|W)/g
  let match
  const uniqueUpdates = new Set<string>()
  let count = 0

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
            subjectCode: "IN1611",
          }
        },
        update: { grade, semester: "Semester 1" },
        create: {
          studentId: student.id,
          subjectCode: "IN1611",
          subjectName: "Multimedia Technologies",
          grade,
          semester: "Semester 1",
          credits: 3.0
        }
      })
      uniqueUpdates.add(student.id)
      count++
    }
  }

  console.log(`Found and updated ${count} grades.`)
  console.log(`Recalculating GPAs for ${uniqueUpdates.size} students...`)

  for (const studentId of uniqueUpdates) {
    await recalculateGpa(studentId)
  }

  console.log("Successfully ingested PDF and updated all GPAs.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
