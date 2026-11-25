import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'rewear-dsu-bengaluru-circular-jwt-secret-2026';

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input) {
  const padLength = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
  return Buffer.from(padded, 'base64').toString('utf8');
}

/**
 * Signs a zero-dependency HS256 JWT token for unified Lender + Borrower accounts
 */
export function signJwtToken(payload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signingInput}.${signature}`;
}

/**
 * Verifies an HS256 JWT token and returns the decoded payload or null
 */
export function verifyJwtToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signingInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Hashes a user password with PBKDF2-SHA256
 */
export function hashPassword(password, salt = 'rewear_dsu_salt_2026') {
  return crypto.pbkdf2Sync(String(password), salt, 10000, 32, 'sha256').toString('hex');
}

/**
 * Generates an anonymized third-party KYC provider reference token (DigiLocker / Cashfree)
 * Never includes raw Aadhaar digits or card images.
 */
export function generateAnonymizedKycToken(provider = 'DIGILOCKER') {
  const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
  const prefix = provider.toUpperCase().includes('CASHFREE') ? 'CF_VKYC_TKN' : 'DIGILOCKER_TKN';
  return `${prefix}_${randomHex}_BLR26`;
}

/**
 * Generates a DSU Student Verification token
 */
export function generateStudentToken(srnOrEmail = 'DSU') {
  const cleanTag = String(srnOrEmail)
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase();
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `DSU_STU_ID_${cleanTag}_${suffix}`;
}
