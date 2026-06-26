# Batchmate

Batchmate is a comprehensive, desktop-based student management system built specifically to help university batches efficiently track student records, manage academic progress, and automate creative tasks like generating birthday flyers.

## ✨ Features

- **🎓 Batch Management:** Maintain a complete database of students across IT, ITM, and AI degree programmes.
- **📊 Result Sheet Ingestion:** Automatically parse official university PDF result sheets to update student GPAs.
- **📥 Bulk Excel Import:** Import batch lists instantly from Google Forms / Excel exports, complete with profile pictures mapping.
- **🎉 Automated Birthday Flyers:** Generate beautiful, personalized birthday flyers with one click.
- **🔍 Advanced Filtering:** Search and filter students by name, index number, batch, degree programme, and GPA.

## 🛠 Tech Stack

- **Framework:** Electron + React (Vite)
- **Language:** TypeScript
- **Database:** SQLite (managed via Prisma ORM)
- **Styling:** Custom CSS with Lucide Icons
- **PDF Processing:** pdfjs-dist / pdf2json

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Nezz77/Batchmate.git
   cd Batchmate
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate the Prisma database client:
   ```bash
   npm run prisma:generate
   ```

4. Start the application in development mode:
   ```bash
   npm run dev
   ```

## 📦 Building for Production

To package the application for your operating system:
```bash
npm run electron:build
```
This will compile the app and output a standalone executable in the `dist` or `release` folder.

## 📄 License
MIT License
