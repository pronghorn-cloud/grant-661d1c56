import * as authService from '../services/authService.js';

// POST /api/auth/aca - Mock ACA SSO callback
export async function loginWithACA(req, res, next) {
  try {
    const { email, displayName, acaId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await authService.authenticateWithACA({
      email,
      displayName: displayName || email.split('@')[0],
      acaId: acaId || `aca-${Date.now()}`
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/microsoft - Mock Microsoft SSO callback
export async function loginWithMicrosoft(req, res, next) {
  try {
    const { email, displayName, msId } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await authService.authenticateWithMicrosoft({
      email,
      displayName: displayName || email.split('@')[0],
      msId: msId || `ms-${Date.now()}`
    });

    res.json({ success: true, data: result });
  } catch (error) {
    if (error.message.includes('not authorized')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
}

// POST /api/auth/dev-login - Development only login
export async function devLogin(req, res, next) {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await authService.devLogin(email, role);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me - Get current user profile
export async function getMe(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/refresh - UC-AUTH-04: Session Refresh
export async function refreshToken(req, res, next) {
  try {
    const result = await authService.refreshSession(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/logout - Logout (client-side token removal, server-side audit)
export async function logout(req, res, next) {
  try {
    // In a real system, we'd invalidate the token server-side
    // For now, just log the logout event
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
