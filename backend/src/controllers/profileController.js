import * as profileService from '../services/profileService.js';

export async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function createProfile(req, res, next) {
  try {
    const { first_name, last_name, date_of_birth, sin, phone,
            address_street, address_city, address_province, address_postal_code,
            citizenship_status, residency_status, indigenous_status, gender, asn } = req.body;

    // Validate required fields
    const errors = [];
    if (!first_name) errors.push('First name is required');
    if (!last_name) errors.push('Last name is required');
    if (!date_of_birth) errors.push('Date of birth is required');
    if (!sin) errors.push('SIN is required');
    if (!phone) errors.push('Phone number is required');
    if (!address_street) errors.push('Street address is required');
    if (!address_city) errors.push('City is required');
    if (!address_province) errors.push('Province is required');
    if (!address_postal_code) errors.push('Postal code is required');
    if (!citizenship_status) errors.push('Citizenship status is required');
    if (residency_status === undefined || residency_status === null) errors.push('Alberta residency status is required');

    // SIN format validation (NNN-NNN-NNN or 9 digits)
    if (sin) {
      const sinClean = sin.replace(/[-\s]/g, '');
      if (!/^\d{9}$/.test(sinClean)) {
        errors.push('SIN must be 9 digits (format: NNN-NNN-NNN)');
      }
    }

    // Phone format validation
    if (phone) {
      const phoneClean = phone.replace(/[-\s()]/g, '');
      if (!/^\d{10}$/.test(phoneClean)) {
        errors.push('Phone must be 10 digits');
      }
    }

    // Postal code validation
    if (address_postal_code && !/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(address_postal_code)) {
      errors.push('Invalid postal code format (e.g., T5J 2N9)');
    }

    // Age validation (must be 16+)
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 16) errors.push('Applicant must be at least 16 years old');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const profile = await profileService.createProfile(req.user.id, req.body);

    // Log audit (non-blocking)
    const { query: dbQuery } = await import('../config/database.js');
    dbQuery(
      `INSERT INTO ae_scholarships.audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'PROFILE_CREATED', 'user', $2, $3)`,
      [req.user.id, req.user.id, JSON.stringify({ profile_complete: true })]
    ).catch(() => {});

    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const profile = await profileService.updateProfile(req.user.id, req.body);

    // Log audit (non-blocking)
    const { query: dbQuery } = await import('../config/database.js');
    dbQuery(
      `INSERT INTO ae_scholarships.audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'PROFILE_UPDATED', 'user', $2, $3)`,
      [req.user.id, req.user.id, JSON.stringify({ fields_updated: Object.keys(req.body) })]
    ).catch(() => {});

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}

export async function getBankingInfo(req, res, next) {
  try {
    const banking = await profileService.getBankingInfo(req.user.id);
    res.json({ success: true, data: banking });
  } catch (error) {
    next(error);
  }
}

export async function saveBankingInfo(req, res, next) {
  try {
    const { institution_number, transit_number, account_number, authorization_signed } = req.body;

    const errors = [];
    if (!institution_number || !/^\d{3}$/.test(institution_number)) {
      errors.push('Institution number must be exactly 3 digits');
    }
    if (!transit_number || !/^\d{5}$/.test(transit_number)) {
      errors.push('Transit number must be exactly 5 digits');
    }
    if (!account_number || !/^\d{1,12}$/.test(account_number)) {
      errors.push('Account number must be 1-12 digits');
    }
    if (!authorization_signed) {
      errors.push('Direct deposit authorization must be signed');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await profileService.saveBankingInfo(req.user.id, req.body);

    // Log audit (non-blocking)
    const { query: dbQuery } = await import('../config/database.js');
    dbQuery(
      `INSERT INTO ae_scholarships.audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'BANKING_UPDATED', 'banking_info', $2, $3)`,
      [req.user.id, result.id, JSON.stringify({ duplicate_flag: result.duplicate_flag })]
    ).catch(() => {});

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getLookup(req, res, next) {
  try {
    const data = await profileService.getLookup(req.params.table);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
