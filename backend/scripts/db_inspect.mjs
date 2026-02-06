import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.anwfztxxdxzpcdlynsmq:Rocambole50!@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  const client = await pool.connect();
  try {
    // Get all tables in ae_scholarships schema
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'ae_scholarships'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    // Get row counts for each table
    const tableData = [];
    for (const row of tables.rows) {
      const countRes = await client.query(
        `SELECT COUNT(*) as row_count FROM ae_scholarships."${row.table_name}"`
      );
      tableData.push({
        table_name: row.table_name,
        row_count: parseInt(countRes.rows[0].row_count, 10)
      });
    }

    console.log('='.repeat(80));
    console.log('TABLES IN ae_scholarships SCHEMA');
    console.log('='.repeat(80));
    console.log(`\nFound ${tableData.length} table(s):\n`);

    for (const table of tableData) {
      console.log(`  - ${table.table_name}  (${table.row_count} rows)`);
    }

    // Get columns for each table
    console.log('\n' + '='.repeat(80));
    console.log('TABLE COLUMNS');
    console.log('='.repeat(80));

    for (const table of tableData) {
      const colsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'ae_scholarships'
          AND table_name = $1
        ORDER BY ordinal_position;
      `, [table.table_name]);

      console.log(`\n--- ${table.table_name} (${table.row_count} rows) ---`);
      for (const col of colsResult.rows) {
        let type = col.data_type;
        if (col.character_maximum_length) {
          type += `(${col.character_maximum_length})`;
        }
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`    ${col.column_name.padEnd(40)} ${type.padEnd(30)} ${nullable}${defVal}`);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
