import { PrismaClient } from '@prisma/client'
import { CURRICULUM } from '../electron/curriculum'

const prisma = new PrismaClient()

const GradePoints: Record<string, number> = {
  'A+': 4.00, 'A': 4.00, 'A-': 3.70,
  'B+': 3.30, 'B': 3.00, 'B-': 2.70,
  'C+': 2.30, 'C': 2.00, 'C-': 1.70,
  'D': 1.00, 'I': 0.00, 'F': 0.00
}

async function main() {
  console.log('Updating credits and recalculating GPAs based on new Curriculum data...')
  
  // 1. Update CourseResults
  const results = await prisma.courseResult.findMany()
  let updatedCount = 0
  
  for (const res of results) {
    const subjectInfo = CURRICULUM[res.subjectCode]
    if (subjectInfo && (res.credits !== subjectInfo.credits || res.subjectName !== subjectInfo.name || res.semester !== subjectInfo.semester)) {
      await prisma.courseResult.update({
        where: { id: res.id },
        data: {
          credits: subjectInfo.credits,
          subjectName: subjectInfo.name,
          semester: subjectInfo.semester
        }
      })
      updatedCount++
    }
  }
  
  console.log(`Updated ${updatedCount} CourseResult records.`)
  
  // 2. Recalculate all GPAs and total credits
  const students = await prisma.student.findMany({
    include: { courseResults: true }
  })
  
  for (const s of students) {
    let totalCredits = 0
    let gpaCredits = 0
    let totalPoints = 0
    for (const res of s.courseResults) {
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
      where: { id: s.id },
      data: {
        gpa: Number(gpa.toFixed(2)),
        totalCredits: Number(totalCredits.toFixed(1))
      }
    })
  }
  
  console.log(`Recalculated GPA and totalCredits for ${students.length} students.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
