import "dotenv/config";
import xlsx from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const filePath = "Batch 24 – Birthday Flyer Details Form (Responses)(2).xlsx";
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json<any>(sheet);

  console.log(`Found ${data.length} records in Excel sheet.`);

  let successCount = 0;
  let errorCount = 0;

  for (const row of data) {
    try {
      const keys = Object.keys(row);
      const email = row["Email Address"];
      const indexNumber = String(row["Index Number"] || "").trim().toUpperCase();
      const fullName = row[keys[3]];
      const dobRaw = row[keys[4]];
      const photoUrl = row[keys[5]];

      if (!indexNumber || !fullName) {
        continue;
      }

      // Convert Excel serial date to JS Date if it's a number
      let dateOfBirth: Date;
      if (typeof dobRaw === "number") {
        dateOfBirth = new Date((dobRaw - (25567 + 1)) * 86400 * 1000);
      } else {
        dateOfBirth = new Date(dobRaw);
      }

      // If date is invalid, default to a fallback
      if (isNaN(dateOfBirth.getTime())) {
        dateOfBirth = new Date("2000-01-01");
      }

      // Determine degree programme based on index number (3rd and 4th characters)
      const degreeCode = indexNumber.substring(2, 4);
      let degreeProgramme = "IT"; // default
      if (degreeCode === "40" || degreeCode === "41") degreeProgramme = "IT";
      else if (degreeCode === "50" || degreeCode === "51") degreeProgramme = "ITM";
      else if (degreeCode === "55") degreeProgramme = "AI";

      // Extract batch from index number (e.g. 24XXXX -> "24")
      const batch = indexNumber.substring(0, 2) || "24";

      await prisma.student.upsert({
        where: { indexNumber },
        update: {
          fullName,
          email,
          dateOfBirth,
          profileImage: photoUrl,
          degreeProgramme,
          batch,
        },
        create: {
          indexNumber,
          fullName,
          email,
          dateOfBirth,
          profileImage: photoUrl,
          degreeProgramme,
          batch,
          gpa: Number((Math.random() * (4.0 - 2.5) + 2.5).toFixed(2)), // Mock GPA between 2.5 and 4.0
        },
      });

      successCount++;
    } catch (error) {
      console.error(`Failed to ingest record for ${row["Index Number"]}:`, error);
      errorCount++;
    }
  }

  console.log(`Ingestion complete! Successfully added/updated ${successCount} students. Errors: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
