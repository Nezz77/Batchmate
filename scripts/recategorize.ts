import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany()
  
  let updatedCount = 0;
  for (const student of students) {
    const idx = String(student.indexNumber).trim().toUpperCase()
    
    // Only process standard length index numbers (e.g., 244001C, which is 7 characters)
    if (idx.length >= 6) {
      const degreeCode = idx.substring(2, 4);
      let derivedProg = student.degreeProgramme;
      
      if (degreeCode === "40" || degreeCode === "41") derivedProg = "IT";
      else if (degreeCode === "50" || degreeCode === "51") derivedProg = "ITM";
      else if (degreeCode === "55") derivedProg = "AI";
      else derivedProg = "IT"; // default fallback or leave as is if we want to be safe, but let's follow the new logic

      if (student.degreeProgramme !== derivedProg) {
        console.log(`Updating ${idx}: ${student.degreeProgramme} -> ${derivedProg}`);
        await prisma.student.update({
          where: { id: student.id },
          data: { degreeProgramme: derivedProg }
        });
        updatedCount++;
      }
    }
  }
  
  console.log(`Successfully updated ${updatedCount} students.`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
