import * as applicationService from '../services/applicationService.js';

export async function startApplication(req, res, next) {
  try {
    const { scholarship_id } = req.body;
    if (!scholarship_id) {
      return res.status(400).json({ success: false, message: 'scholarship_id is required' });
    }

    // Check profile is complete
    const { query } = await import('../config/database.js');
    const profileCheck = await query(
      'SELECT profile_complete FROM ae_scholarships.users WHERE id = $1',
      [req.user.id]
    );
    if (!profileCheck.rows[0]?.profile_complete) {
      return res.status(400).json({ success: false, message: 'Please complete your profile before applying' });
    }

    const result = await applicationService.startApplication(req.user.id, scholarship_id);

    if (result.existing) {
      return res.json({ success: true, data: result.application, message: 'Existing draft found' });
    }

    res.status(201).json({ success: true, data: result.application });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

export async function getMyApplications(req, res, next) {
  try {
    const applications = await applicationService.getMyApplications(req.user.id);
    res.json({ success: true, data: applications, count: applications.length });
  } catch (error) {
    next(error);
  }
}

export async function getApplication(req, res, next) {
  try {
    const app = await applicationService.getApplicationById(req.params.id, req.user.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    res.json({ success: true, data: app });
  } catch (error) {
    next(error);
  }
}

export async function saveDraft(req, res, next) {
  try {
    const app = await applicationService.saveDraft(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: app });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

export async function submitApplication(req, res, next) {
  try {
    const app = await applicationService.submitApplication(req.params.id, req.user.id);
    res.json({ success: true, data: app, message: 'Application submitted successfully' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message, errors: error.errors });
    }
    next(error);
  }
}

export async function withdrawApplication(req, res, next) {
  try {
    const app = await applicationService.withdrawApplication(req.params.id, req.user.id);
    res.json({ success: true, data: app, message: 'Application withdrawn' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

export async function respondToMI(req, res, next) {
  try {
    const app = await applicationService.respondToMissingInfo(req.params.id, req.user.id);
    res.json({ success: true, data: app, message: 'Response submitted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileInfo = {
      ...req.file,
      documentType: req.body.document_type || 'other'
    };

    const doc = await applicationService.addDocument(req.params.id, req.user.id, fileInfo);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}

export async function removeDocument(req, res, next) {
  try {
    await applicationService.removeDocument(req.params.docId, req.user.id);
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
}
