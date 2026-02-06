import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Case-insensitive column lookup
function findColumn(row, possibleNames) {
  if (!row) return null;
  const keyMap = {};
  Object.keys(row).forEach(key => {
    keyMap[key.toLowerCase().trim().replace(/\s+/g, ' ')] = key;
  });
  for (const name of possibleNames) {
    const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ');
    if (keyMap[normalized]) {
      return row[keyMap[normalized]];
    }
  }
  return null;
}

function cleanString(value) {
  if (!value) return null;
  return String(value).trim();
}

function parseNumber(value) {
  if (!value) return null;
  const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

// Generate a scholarship code from the name
function generateCode(name) {
  if (!name) return null;
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map(w => w.substring(0, 4).toUpperCase())
    .join('-');
}

// Detect scholarship type from the "Application process" column
function normalizeType(value) {
  if (!value) return 'form application';
  const lower = value.toLowerCase().trim();
  if (lower.includes('online')) return 'online application';
  if (lower.includes('indirect')) return 'indirect';
  return 'form application';
}

// Parse deadline text to a date
function parseDeadline(value) {
  if (!value) return null;
  const str = String(value).trim();

  // Try direct date parse
  const directParse = new Date(str);
  if (!isNaN(directParse.getTime()) && directParse.getFullYear() > 2000) {
    return directParse.toISOString().split('T')[0];
  }

  // Common patterns: "March 1", "September 30, 2025", "June 1st"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'];

  const monthMatch = str.toLowerCase().match(new RegExp(`(${monthNames.join('|')})\\s*(\\d{1,2})`));
  if (monthMatch) {
    const monthIdx = monthNames.indexOf(monthMatch[1]);
    const day = parseInt(monthMatch[2]);
    const yearMatch = str.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : 2025;
    const d = new Date(year, monthIdx, day);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  return null;
}

// Categorize scholarship by name/notes
function categorize(name, notes) {
  const text = ((name || '') + ' ' + (notes || '')).toLowerCase();
  if (text.includes('agriculture') || text.includes('farm')) return 'Agriculture';
  if (text.includes('technolog') || text.includes('stem')) return 'Technology';
  if (text.includes('citizen') || text.includes('leader')) return 'Citizenship/Leadership';
  if (text.includes('language') || text.includes('french') || text.includes('ukrainian')) return 'Language';
  if (text.includes('indigenous') || text.includes('first nation') || text.includes('metis') || text.includes('inuit')) return 'Indigenous';
  if (text.includes('science') || text.includes('math')) return 'Science';
  if (text.includes('art') || text.includes('music') || text.includes('drama')) return 'Arts';
  if (text.includes('education') || text.includes('teach')) return 'Education';
  return 'General';
}

async function importScholarships() {
  const client = await pool.connect();

  try {
    console.log('Importing Scholarship Data');
    console.log('='.repeat(72));

    await client.query('SET search_path TO ae_scholarships, public;');

    // Find the Excel file (scan recursively)
    const projectDataDir = path.join(__dirname, '../../project_data');
    function findExcelFiles(dir) {
      let results = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(findExcelFiles(fullPath));
        } else if (entry.name.endsWith('.xlsx')) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const allExcelFiles = findExcelFiles(projectDataDir);
    const filePath = allExcelFiles.find(f =>
      path.basename(f).toLowerCase().includes('summary') ||
      path.basename(f).toLowerCase().includes('scholarship')
    );

    if (!filePath) {
      console.log('No scholarship Excel file found in project_data/');
      return;
    }

    console.log(`Reading: ${path.basename(filePath)}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      raw: false,
      defval: null,
      blankrows: false
    });

    console.log(`  Found ${data.length} rows in sheet "${sheetName}"\n`);

    let imported = 0;
    let failed = 0;
    const seenCodes = new Set();

    for (const row of data) {
      try {
        const name = cleanString(findColumn(row, ['Scholarship/Award', 'Scholarship', 'Award', 'Name']));
        if (!name) continue;

        let code = generateCode(name);
        // Ensure unique code
        let suffix = 1;
        const baseCode = code;
        while (seenCodes.has(code)) {
          code = `${baseCode}-${suffix}`;
          suffix++;
        }
        seenCodes.add(code);

        const typeRaw = cleanString(findColumn(row, ['Application process', 'Application Type', 'Type']));
        const type = normalizeType(typeRaw);

        const deadlineRaw = cleanString(findColumn(row, ['Deadline / Timeframe', 'Deadline', 'Timeframe', 'Due Date']));
        const deadlineEnd = parseDeadline(deadlineRaw) || '2025-12-31';

        const notes = cleanString(findColumn(row, ['Notes', 'Description', 'Eligibility']));
        const sourceUrl = cleanString(findColumn(row, ['Sources', 'Source URL', 'URL', 'Link']));
        const value = cleanString(findColumn(row, ['Value', 'Award Value', 'Amount']));

        const category = categorize(name, notes);

        const eligibility = notes ? { description: notes } : {};

        await client.query(`
          INSERT INTO scholarships (code, name, type, value, deadline_end, eligibility_criteria, category, source_url, academic_year)
          VALUES ($1, $2, $3, $4, $5::date, $6::jsonb, $7, $8, $9)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            value = EXCLUDED.value,
            deadline_end = EXCLUDED.deadline_end,
            eligibility_criteria = EXCLUDED.eligibility_criteria,
            category = EXCLUDED.category,
            source_url = EXCLUDED.source_url,
            updated_at = NOW()
        `, [code, name, type, value, deadlineEnd, JSON.stringify(eligibility), category, sourceUrl, '2025-26']);

        imported++;
      } catch (err) {
        failed++;
        console.error(`  Failed row: ${err.message}`);
      }
    }

    // Log import
    await client.query(`
      INSERT INTO import_history (file_name, table_name, records_imported, records_failed, status, imported_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [path.basename(filePath), 'scholarships', imported, failed, failed > 0 ? 'Partial' : 'Success', 'system']);

    console.log(`Imported: ${imported} scholarships`);
    if (failed > 0) console.log(`Failed: ${failed} records`);

    // Verify
    const countResult = await client.query('SELECT COUNT(*) FROM scholarships');
    console.log(`\nTotal scholarships in database: ${countResult.rows[0].count}`);

    // Show sample
    const sample = await client.query('SELECT code, name, type, category, deadline_end FROM scholarships ORDER BY name LIMIT 5');
    console.log('\nSample records:');
    for (const row of sample.rows) {
      console.log(`  ${row.code} | ${row.name} | ${row.type} | ${row.category} | ${row.deadline_end ? row.deadline_end.toISOString().split('T')[0] : 'N/A'}`);
    }

    console.log('\n' + '='.repeat(72));
    console.log('Import completed successfully!');

  } catch (error) {
    console.error('Import error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importScholarships().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
