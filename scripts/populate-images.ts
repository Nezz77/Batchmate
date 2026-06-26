import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const imagesDir = path.join(process.cwd(), 'Images', 'imageswithindex')

async function main() {
  if (!fs.existsSync(imagesDir)) {
    console.error(`Images directory not found: ${imagesDir}`)
    return
  }

  const files = fs.readdirSync(imagesDir)
  let updatedCount = 0

  for (const file of files) {
    if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png')) {
      const indexNumber = file.substring(0, file.lastIndexOf('.')).trim().toUpperCase()
      const imagePath = `file://${path.join(imagesDir, file)}`

      try {
        const student = await prisma.student.findUnique({ where: { indexNumber } })
        if (student) {
          await prisma.student.update({
            where: { indexNumber },
            data: { profileImage: imagePath }
          })
          updatedCount++
        } else {
          console.log(`Student not found for image: ${file}`)
        }
      } catch (err) {
        console.error(`Error updating student ${indexNumber}:`, err)
      }
    }
  }

  console.log(`Successfully updated profile images for ${updatedCount} students.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
