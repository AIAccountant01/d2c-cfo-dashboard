// Vercel Serverless Function — POST /api/change-password
// Changes user password (validates current password first)
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'aia-cfo-2026-sk';

// Shared credentials store — in production, use a database
// For Vercel serverless, each invocation reads from this; password changes persist
// only within the same instance. For true persistence, use Vercel KV or a database.
// This works for demo/MVP — passwords reset on cold start.
const VALID_CREDENTIALS = {
  'help@aiaccountant.com': { password: 'aiaccountant2026', name: 'Help', role: 'Admin' },
  'demo@aiaccountant.com': { password: 'demo2026', name: 'Demo', role: 'Viewer' },
  'admin@aiaccountant.com': { password: 'admin2026', name: 'Admin', role: 'Admin' },
  'ronit@aiaccountant.com': { password: 'ronit@123', name: 'Ronit', role: 'Admin' }
};

// Share the same object with auth.js by exporting it
module.exports.CREDENTIALS = VALID_CREDENTIALS;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let payload;
  try {
    payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, error: 'New password must be different from current password' });
  }

  const email = payload.email;
  const user = VALID_CREDENTIALS[email];

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (user.password !== currentPassword) {
    return res.status(401).json({ success: false, error: 'Current password is incorrect' });
  }

  // Update password
  user.password = newPassword;

  // Issue new token (so old one with old session still works)
  const newToken = jwt.sign(
    { email: email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '30m' }
  );

  return res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    token: newToken
  });
};
