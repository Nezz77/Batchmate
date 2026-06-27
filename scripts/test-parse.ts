import fs from 'fs'
import path from 'path'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

async function parse() {
  const fileBuffer = fs.readFileSync('result-sheets/1782534650056_IN1611_Multimedia Technologies_Intake 2024_Semester 1_student_view.pdf')
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + ' ';
  }
  
  console.log("PDF Text Prefix:", text.substring(0, 500))
  
  const regex1 = /(24\d{4}[A-Z])\s+([A-D][+-]?|I|F|P|N|W)/g
  const regex2 = /\b(\d{6}[A-Z])\s+([A-D][+-]?|I|F|P|N|W)(?=\s|$)/g
  
  const matches1 = [...text.matchAll(regex1)]
  const matches2 = [...text.matchAll(regex2)]
  
  console.log(`Regex 1 (old) found ${matches1.length} matches. First match:`, matches1[0]?.[0])
  console.log(`Regex 2 (new) found ${matches2.length} matches. First match:`, matches2[0]?.[0])
}

parse().catch(console.error)
