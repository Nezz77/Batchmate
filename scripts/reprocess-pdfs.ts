import fs from 'fs'
import path from 'path'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { PrismaClient } from '@prisma/client'
import { CURRICULUM } from '../electron/curriculum'

const prisma = new PrismaClient()

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
  let gpaCredits = 0
  let totalPoints = 0

  for (const res of results) {
    if (GradePoints[res.grade] !== undefined) {
      totalCredits += res.credits
      const subjectInfo = CURRICULUM[res.subjectCode]
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

async function main() {
  const dir = path.join(process.cwd(), 'result-sheets')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'))
  
  let totalUpdates = 0
  
  for (const file of files) {
    console.log(`Processing ${file}...`)
    const fileBuffer = fs.readFileSync(path.join(dir, file))
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + ' ';
    }
    
    // Attempt to extract subject code
    let subjectCode = ''
    const subjMatch = text.match(/([A-Z]{2}\d{4})\s+-/)
    if (subjMatch) {
      subjectCode = subjMatch[1]
    }
    
    if (!subjectCode) {
      console.log(`Could not find subject code for ${file}`)
      continue
    }
    
    const subjectInfo = CURRICULUM[subjectCode]
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
              subjectCode: subjectCode,
            }
          },
          update: { grade, semester: subjectInfo?.semester || "1" },
          create: {
            studentId: student.id,
            subjectCode: subjectCode,
            subjectName: subjectInfo?.name || "Unknown",
            grade,
            semester: subjectInfo?.semester || "1",
            credits: subjectInfo?.credits || 3.0
          }
        })
        uniqueUpdates.add(student.id)
      }
    }
    
    for (const studentId of uniqueUpdates) {
      await recalculateGpa(studentId)
    }
    
    console.log(`Updated ${uniqueUpdates.size} students from ${file}`)
    totalUpdates += uniqueUpdates.size
  }
  
  console.log(`Finished processing all PDFs. Total student updates: ${totalUpdates}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
