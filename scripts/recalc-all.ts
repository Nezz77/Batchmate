import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const GradePoints: Record<string, number> = {
  'A+': 4.00, 'A': 4.00, 'A-': 3.70,
  'B+': 3.30, 'B': 3.00, 'B-': 2.70,
  'C+': 2.30, 'C': 2.00, 'C-': 1.70,
  'D': 1.00, 'I': 0.00, 'F': 0.00
}

async function main() {
  const students = await prisma.student.findMany({
    include: { courseResults: true }
  })
  
  for (const s of students) {
    let totalCredits = 0
    let totalPoints = 0
    for (const res of s.courseResults) {
      if (GradePoints[res.grade] !== undefined) {
        totalCredits += res.credits
        totalPoints += res.credits * GradePoints[res.grade]
      }
    }
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0
    await prisma.student.update({
      where: { id: s.id },
      data: {
        gpa: Number(gpa.toFixed(2)),
        totalCredits: Number(totalCredits.toFixed(1))
      }
    })
  }
  
  console.log(`Recalculated for ${students.length} students.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
