// Vercel Serverless Function — POST /api/auth
// CommonJS module (required by user)
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'aia-cfo-2026-sk';

const VALID_CREDENTIALS = {
  'help@aiaccountant.com': { password: 'aiaccountant2026', name: 'Help', role: 'Admin' },
  'demo@aiaccountant.com': { password: 'demo2026', name: 'Demo', role: 'Viewer' },
  'admin@aiaccountant.com': { password: 'admin2026', name: 'Admin', role: 'Admin' },
  'ronit@aiaccountant.com': { password: 'ronit@123', name: 'Ronit', role: 'Admin' }
};

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

  const { email, password } = req.body || {};
  const user = VALID_CREDENTIALS[email && email.toLowerCase()];

  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { email: email.toLowerCase(), name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '30m' }
  );

  return res.status(200).json({
    success: true,
    token: token,
    user: { email: email.toLowerCase(), name: user.name, role: user.role }
  });
};
