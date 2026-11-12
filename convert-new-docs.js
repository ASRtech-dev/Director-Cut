import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

const newDocsDir = path.join(process.cwd(), 'new docs');
const seedDir = path.join(process.cwd(), 'src', 'prompts', 'seed');

async function convert() {
  console.log("Starting docx conversion...");
  try {
    const files = fs.readdirSync(newDocsDir).filter(f => f.endsWith('.docx'));
    console.log(`Found ${files.length} docx files to convert.`);

    for (const file of files) {
      const docxPath = path.join(newDocsDir, file);
      const mdName = file.replace('.docx', '.md');
      const mdPath = path.join(seedDir, mdName);
      
      console.log(`Converting '${file}'...`);
      const buffer = fs.readFileSync(docxPath);
      const result = await mammoth.convertToHtml({ buffer });
      
      // Convert to clean markdown
      let markdown = turndownService.turndown(result.value);
      
      // Clean duplicate carriage returns or trailing spaces
      markdown = markdown.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');

      fs.writeFileSync(mdPath, markdown);
      console.log(`Successfully wrote ${mdName}`);
    }
    console.log("All files converted successfully!");
  } catch (err) {
    console.error("Conversion failed:", err);
  }
}

convert();
