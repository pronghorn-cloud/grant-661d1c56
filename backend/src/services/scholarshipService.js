import { query } from '../config/database.js';

export async function getAll(filters = {}) {
  let sql = `SELECT id, code, name, type, value, deadline_start, deadline_end,
             category, source_url, status, academic_year, max_awards,
             eligibility_criteria, required_documents
             FROM ae_scholarships.scholarships WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (filters.type) {
    sql += ` AND type = $${paramIndex++}`;
    params.push(filters.type);
  }

  if (filters.category) {
    sql += ` AND category = $${paramIndex++}`;
    params.push(filters.category);
  }

  if (filters.status) {
    sql += ` AND status = $${paramIndex++}`;
    params.push(filters.status);
  }

  if (filters.search) {
    sql += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.academic_year) {
    sql += ` AND academic_year = $${paramIndex++}`;
    params.push(filters.academic_year);
  }

  sql += ' ORDER BY name ASC';

  const result = await query(sql, params);
  return result.rows;
}

export async function getById(id) {
  const result = await query(
    `SELECT * FROM ae_scholarships.scholarships WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getTypes() {
  const result = await query(
    'SELECT code, label FROM ae_scholarships.scholarship_types ORDER BY sort_order'
  );
  return result.rows;
}

export async function getCategories() {
  const result = await query(
    'SELECT code, label FROM ae_scholarships.scholarship_categories ORDER BY sort_order'
  );
  return result.rows;
}
