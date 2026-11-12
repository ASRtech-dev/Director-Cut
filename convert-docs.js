import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import TurndownService from 'turndown';

const turndownService = new TurndownService();

const seedDir = path.join(process.cwd(), 'src', 'prompts', 'seed');

async function convert() {
  const files = fs.readdirSync(seedDir).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    const filePath = path.join(seedDir, file);
    const buffer = fs.readFileSync(filePath);
    
    // Check if it looks like a zip (PK starting bytes)
    if (buffer.length > 2 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
      console.log(`Converting ${file} from DOCX to MD...`);
      try {
        const result = await mammoth.convertToHtml({ buffer });
        const markdown = turndownService.turndown(result.value);
        fs.writeFileSync(filePath, markdown);
        console.log(`Successfully converted ${file}`);
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err.message);
      }
    } else {
      console.log(`Skipping ${file}, does not appear to be a DOCX.`);
    }
  }
}

convert();
