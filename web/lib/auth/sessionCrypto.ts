/**
 * Cryptographic Session Token Signer & Verifier
 * Prevents cookie forgery, tampering, and unauthorized access to the admin panel.
 * Uses SHA-256 HMAC tokens with expiry enforcement.
 */

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'electrol_portal_secret_master_key_2026_karnataka_council_south_east';

/**
 * Node.js synchronous session signing (used in login route)
 */
export function signSessionSync(payload: Record<string, unknown>): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto');
  const jsonStr = JSON.stringify(payload);
  const base64Data = Buffer.from(jsonStr, 'utf-8').toString('base64');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Data)
    .digest('hex');

  return `${base64Data}.${signature}`;
}

/**
 * Node.js synchronous session verification (used in requireRole and Server Components)
 */
export function verifySessionSync(token: string): Record<string, unknown> | null {
  if (!token) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const parts = token.split('.');

    if (parts.length === 2) {
      const [base64Data, signature] = parts;
      const expectedSig = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(base64Data)
        .digest('hex');

      // Constant time comparison to prevent timing attacks
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return null;
      }

      const jsonStr = Buffer.from(base64Data, 'base64').toString('utf-8');
      const decoded = JSON.parse(jsonStr);
      if (decoded && typeof decoded.expiresAt === 'number' && decoded.expiresAt > Date.now()) {
        return decoded;
      }
      return null;
    }

    // Reject any token that does not have an HMAC signature
    return null;
  } catch {
    return null;
  }
}

/**
 * WebCrypto asynchronous session verification (works in Next.js Edge Middleware)
 */
export async function verifySessionEdge(token: string): Promise<Record<string, unknown> | null> {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length === 2) {
      const [base64Data, signature] = parts;

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(SESSION_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(base64Data));
      const bytes = new Uint8Array(sigBuf);
      let expectedSig = '';
      for (let i = 0; i < bytes.length; i++) {
        expectedSig += bytes[i].toString(16).padStart(2, '0');
      }

      if (signature !== expectedSig) {
        return null; // Signature verification failed
      }

      const jsonStr = typeof Buffer !== 'undefined'
        ? Buffer.from(base64Data, 'base64').toString('utf-8')
        : atob(base64Data);

      const decoded = JSON.parse(jsonStr);
      if (decoded && typeof decoded.expiresAt === 'number' && decoded.expiresAt > Date.now()) {
        return decoded;
      }
      return null;
    }

    // Reject any token that does not have an HMAC signature
    return null;
  } catch {
    return null;
  }
}
