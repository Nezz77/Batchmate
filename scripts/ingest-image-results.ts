import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const subjectCode = "IN1301"
const subjectName = "Digital Systems and Digital Computers"
const semester = "1"
const credits = 3.0

const resultsData = [
  ['225020X', 'C'], ['245004V', 'B-'], ['245009P', 'A-'], ['245013X', 'A-'], ['245017M', 'A-'], ['245021U', 'B+'], ['245025K', 'F'], ['245029C', 'C'], ['245033H', 'B+'], ['245037A', 'B'], ['245041F', 'A-'], ['245045V', 'C+'], ['245049L', 'B+'], ['245054X', 'A'], ['245058M', 'B-'], ['245062U', 'B-'], ['245066K', 'B'], ['245070R', 'B'], ['245074H', 'A-'], ['245078A', 'B-'], ['245083J', 'B+'], ['245087B', 'B+'], ['245091G', 'A'], ['245095X', 'B+'], ['245099M', 'C+'], ['245103A', 'B-'], ['245107N', 'A-'], ['245112B', 'B-'], ['245117U', 'A-'], ['245122F', 'B'], ['245126V', 'B'], ['215133L', 'C-'], ['235026F', 'I'],
  ['245001J', 'A-'], ['245005B', 'I'], ['245010K', 'B-'], ['245014C', 'A-'], ['245018R', 'A'], ['245022A', 'A-'], ['245026N', 'B+'], ['245030V', 'B+'], ['245034L', 'B-'], ['245038D', 'B+'], ['245042J', 'B+'], ['245046B', 'A-'], ['245050G', 'C-'], ['245055C', 'B+'], ['245059R', 'B-'], ['245063A', 'I'], ['245067N', 'A-'], ['245071V', 'B-'], ['245075L', 'B+'], ['245079D', 'B+'], ['245084M', 'B+'], ['245088E', 'I'], ['245092K', 'A-'], ['245096C', 'C'], ['245100L', 'B'], ['245104D', 'B-'], ['245108T', 'B+'], ['245114H', 'A'], ['245118A', 'C+'], ['245123J', 'B+'], ['245127B', 'C+'], ['225069E', 'C'], ['235120M', 'I'],
  ['245002M', 'B-'], ['245006E', 'B+'], ['245011N', 'A-'], ['245015F', 'B+'], ['245019V', 'A'], ['245023D', 'B-'], ['245027T', 'B+'], ['245031B', 'A-'], ['245035P', 'B-'], ['245039G', 'B-'], ['245043M', 'B'], ['245047E', 'A-'], ['245052N', 'B+'], ['245056F', 'B+'], ['245060L', 'B'], ['245064D', 'B+'], ['245068T', 'B+'], ['245072B', 'A-'], ['245076P', 'C+'], ['245080X', 'B'], ['245085R', 'A'], ['245089H', 'A-'], ['245093N', 'B-'], ['245097F', 'B-'], ['245101P', 'I'], ['245105G', 'A-'], ['245109X', 'B+'], ['245115L', 'B'], ['245119D', 'B'], ['245124M', 'B-'], ['245128E', 'B'], ['235003H', 'I'], ['235121R', 'B-'],
  ['245003R', 'B+'], ['245008L', 'A'], ['245012T', 'B'], ['245016J', 'B'], ['245020P', 'B'], ['245024G', 'B+'], ['245028X', 'B+'], ['245032E', 'A'], ['245036U', 'B-'], ['245040C', 'F'], ['245044R', 'B'], ['245048H', 'B-'], ['245053T', 'B'], ['245057J', 'A-'], ['245061P', 'I'], ['245065G', 'A-'], ['245069X', 'B-'], ['245073E', 'B+'], ['245077U', 'B'], ['245082F', 'B-'], ['245086V', 'C+'], ['245090D', 'A-'], ['245094T', 'B-'], ['245098J', 'C'], ['245102U', 'B+'], ['245106K', 'B'], ['245110R', 'B-'], ['245116P', 'B-'], ['245121C', 'A-'], ['245125R', 'B'], ['245129H', 'B'], ['235004L', 'I']
]

const gradePoints: Record<string, number> = {
  'A+': 4.2, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.5,
  'D': 1.0, 'F': 0.0, 'I': 0.0, 'P': 0.0, 'N': 0.0, 'W': 0.0
}

async function main() {
  console.log(`Starting to ingest ${resultsData.length} records...`)
  let added = 0;

  for (const [indexNumber, grade] of resultsData) {
    // Determine programme and batch
    const degreeCode = indexNumber.substring(2, 4);
    let degreeProgramme = "IT"; // default
    if (degreeCode === "40" || degreeCode === "41") degreeProgramme = "IT";
    else if (degreeCode === "50" || degreeCode === "51") degreeProgramme = "ITM";
    else if (degreeCode === "55") degreeProgramme = "AI";

    const batch = indexNumber.substring(0, 2) || "24";

    // Upsert student if they don't exist
    const student = await prisma.student.upsert({
      where: { indexNumber },
      update: {},
      create: {
        indexNumber,
        fullName: `Student ${indexNumber}`, // Placeholder if missing
        dateOfBirth: new Date("2000-01-01"),
        degreeProgramme,
        batch
      }
    })

    // Upsert CourseResult
    await prisma.courseResult.upsert({
      where: {
        studentId_subjectCode: {
          studentId: student.id,
          subjectCode
        }
      },
      update: {
        grade,
        credits,
        semester,
        subjectName
      },
      create: {
        studentId: student.id,
        subjectCode,
        subjectName,
        grade,
        credits,
        semester
      }
    })
    
    // We should also recalculate GPA for the student but for a script it's better to just do it via ingest-pdf's recalculation logic or just simple logic
    const allResults = await prisma.courseResult.findMany({
      where: { studentId: student.id }
    })
    
    let totalPoints = 0
    let totalCredits = 0
    for (const res of allResults) {
      if (['I', 'F', 'N', 'W', 'P'].includes(res.grade)) continue
      const point = gradePoints[res.grade] || 0
      totalPoints += point * res.credits
      totalCredits += res.credits
    }
    
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0
    await prisma.student.update({
      where: { id: student.id },
      data: { gpa: Number(gpa.toFixed(2)) }
    })
    
    added++;
  }
  
  console.log(`Successfully ingested ${added} results for ${subjectCode}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
