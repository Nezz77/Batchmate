import { PrismaClient } from '@prisma/client'
import { CURRICULUM } from '../electron/curriculum'

const prisma = new PrismaClient()

async function main() {
  console.log('Migrating curriculum to database...')
  
  for (const [code, info] of Object.entries(CURRICULUM)) {
    // We'll set default programme to 'IT' for these as they are mostly IT, or 'All' for Non-Technical
    let programme = 'IT'
    if (info.isNonGpa) {
      programme = 'All'
    } else if (code.startsWith('CM')) {
      // Math modules might be shared, but let's default to IT for now
      programme = 'IT'
    }
    
    await prisma.subject.upsert({
      where: { code },
      update: {
        name: info.name,
        credits: info.credits,
        semester: info.semester,
        isNonGpa: info.isNonGpa || false,
        programme
      },
      create: {
        code,
        name: info.name,
        credits: info.credits,
        semester: info.semester,
        isNonGpa: info.isNonGpa || false,
        programme
      }
    })
  }
  
  console.log(`Successfully migrated ${Object.keys(CURRICULUM).length} subjects!`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
