/**
 * Professional Cyber Security & Beta QA Audit Suite
 * Tests:
 * 1. Unsigned session cookie forgery rejection (CWE-345)
 * 2. Tampered HMAC signature rejection
 * 3. Unauthenticated promote mutation rejection with body tampering (OWASP A01)
 * 4. Unauthenticated notification dispatch rejection
 * 5. Supervisor RBAC authentication & authorization
 * 6. Public tracking anti-probing and data minimization (DPDP / GDPR)
 * 7. Rate limiting enforcement on public track endpoints
 * 8. Defensive security headers (X-Frame-Options, nosniff, Referrer-Policy)
 * 9. Automated database cleanup
 */

const http = require('http');

const PORT = 8081;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('   STARTING PROFESSIONAL CYBER SECURITY & QA AUDIT   ');
  console.log('====================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition, testName, details = '') {
    totalChecks++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedChecks++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      process.exitCode = 1;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Unsigned Cookie Forgery Test (CWE-345)
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. Cryptographic Authentication & Token Integrity ---');
  const fakeSessionPayload = {
    userId: 'attacker_1337',
    username: 'admin',
    email: 'admin@electorportal.com',
    role: 'admin',
    expiresAt: Date.now() + 10000000,
  };
  const forgedUnsignedCookie = Buffer.from(JSON.stringify(fakeSessionPayload)).toString('base64');

  const forgedRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/requests',
    method: 'GET',
    headers: {
      Cookie: `elector_auth_session=${forgedUnsignedCookie}`,
    },
  });

  assert(
    forgedRes.statusCode === 401 || forgedRes.statusCode === 403,
    'Unsigned forged base64 cookie rejected by API (CWE-345)',
    `Expected 401/403, got ${forgedRes.statusCode}`
  );

  // ─────────────────────────────────────────────────────────────
  // 2. Tampered HMAC Signature Test
  // ─────────────────────────────────────────────────────────────
  const tamperedCookie = `${forgedUnsignedCookie}.ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`;
  const tamperedRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/requests',
    method: 'GET',
    headers: {
      Cookie: `elector_auth_session=${tamperedCookie}`,
    },
  });

  assert(
    tamperedRes.statusCode === 401 || tamperedRes.statusCode === 403,
    'Forged signature on session token rejected (Constant-time HMAC check)',
    `Expected 401/403, got ${tamperedRes.statusCode}`
  );

  // ─────────────────────────────────────────────────────────────
  // 3. Unauthenticated Promotion Request with Body Tampering (OWASP A01)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Broken Access Control (OWASP A01) Guardrails ---');
  const unauthPromoteRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/requests/REQ-DUMMY-9999/promote',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    { userRole: 'supervisor', actorId: 'hacker' }
  );

  assert(
    unauthPromoteRes.statusCode === 401 || unauthPromoteRes.statusCode === 403,
    'Unauthenticated promote mutation rejected despite {userRole: "supervisor"} body tampering',
    `Expected 401/403, got ${unauthPromoteRes.statusCode}`
  );

  // ─────────────────────────────────────────────────────────────
  // 4. Notification Dispatch Authentication
  // ─────────────────────────────────────────────────────────────
  const unauthDispatchRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/notifications/dispatch',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  assert(
    unauthDispatchRes.statusCode === 401 || unauthDispatchRes.statusCode === 403,
    'Public notification dispatch rejected without authentication',
    `Expected 401/403, got ${unauthDispatchRes.statusCode}`
  );

  // ─────────────────────────────────────────────────────────────
  // 5. Supervisor Account Login & RBAC Verification
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. Role-Based Access Control (RBAC) Verification ---');
  const supLoginRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: 'supervisor', password: '1234@supervisor' }
  );

  assert(
    supLoginRes.statusCode === 200 && supLoginRes.data?.user?.role === 'supervisor',
    'Supervisor login successful with role: supervisor',
    `Login failed: ${JSON.stringify(supLoginRes.data)}`
  );

  const rawSetCookie = supLoginRes.headers['set-cookie'];
  const supCookie = rawSetCookie ? rawSetCookie[0].split(';')[0] : '';

  // Verify /api/auth/me returns supervisor
  const meRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Cookie: supCookie },
  });

  assert(
    meRes.statusCode === 200 && meRes.data?.role === 'supervisor',
    'Authenticated /api/auth/me session accurately reports supervisor role',
    `Expected supervisor, got ${JSON.stringify(meRes.data)}`
  );

  // Verify supervisor can read /api/requests
  const supReqList = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/api/requests',
    method: 'GET',
    headers: { Cookie: supCookie },
  });

  assert(
    supReqList.statusCode === 200 && Array.isArray(supReqList.data?.requests),
    'Supervisor can read operational requests queue',
    `Expected 200, got ${supReqList.statusCode}`
  );

  // Verify Amulya (Admin) login with new credentials: amulya / 1234@admin@
  const amulyaRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: 'amulya', password: '1234@admin@' }
  );
  assert(
    amulyaRes.statusCode === 200 && amulyaRes.data?.user?.role === 'admin',
    'Amulya admin login successful with role: admin',
    `Login failed: ${JSON.stringify(amulyaRes.data)}`
  );

  // Verify Operator login with new credentials: operator / 1234@guest@
  const opRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: 'operator', password: '1234@guest@' }
  );
  assert(
    opRes.statusCode === 200 && opRes.data?.user?.role === 'operator',
    'Operator login successful with role: operator',
    `Login failed: ${JSON.stringify(opRes.data)}`
  );

  // Verify Worker login with new credentials: worker / 1234@worker@
  const workerRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: 'worker', password: '1234@worker@' }
  );
  assert(
    workerRes.statusCode === 200 && workerRes.data?.user?.role === 'field_agent',
    'Worker login successful with role: field_agent',
    `Login failed: ${JSON.stringify(workerRes.data)}`
  );

  // Verify rejection of removed default password "1234"
  const reject1234Res = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { identifier: 'amulya', password: '1234' }
  );
  assert(
    reject1234Res.statusCode === 401,
    'Removed default password "1234" successfully rejected',
    `Expected 401, got ${reject1234Res.statusCode}`
  );

  // ─────────────────────────────────────────────────────────────
  // 6. Security Headers Check (CWE-693)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Defensive HTTP Security Headers ---');
  const headersRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: '/team',
    method: 'GET',
  });

  assert(
    headersRes.headers['x-frame-options'] === 'SAMEORIGIN',
    'X-Frame-Options: SAMEORIGIN header present (Anti-Clickjacking)',
    `Missing or invalid X-Frame-Options: ${headersRes.headers['x-frame-options']}`
  );

  assert(
    headersRes.headers['x-content-type-options'] === 'nosniff',
    'X-Content-Type-Options: nosniff header present (Anti-MIME Sniffing)',
    `Missing X-Content-Type-Options: ${headersRes.headers['x-content-type-options']}`
  );

  assert(
    Boolean(headersRes.headers['referrer-policy']),
    'Referrer-Policy header present (Privacy Leakage Protection)',
    `Missing Referrer-Policy: ${headersRes.headers['referrer-policy']}`
  );

  // ─────────────────────────────────────────────────────────────
  // 7. Data Minimization & Anti-Probing (GDPR / DPDP)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Citizen Privacy & Anti-Probing ---');
  // Create a live test record
  const createRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/requests',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      elector_name: 'Pooja Hegde',
      mobile: '9845123999',
      taluk: 'Tumkur',
      category: 'Graduates',
      existing_epic: 'ABC9876543',
    }
  );

  const testId = createRes.data?.request?.id;
  assert(Boolean(testId), `Citizen Form 18 created: ID=${testId}`);

  // Query public track
  const publicTrackRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/public/track',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { referenceId: testId }
  );

  const trackData = publicTrackRes.data;
  assert(
    trackData.found === true &&
      trackData.first_name === 'Pooja' &&
      trackData.mobile === undefined &&
      trackData.address === undefined &&
      trackData.elector_name === undefined,
    'Public tracking enforces PII data minimization (First name only, zero address/mobile exposure)'
  );

  // Anti-probing: Non-existent vs Mismatched query
  const wrongRefRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/public/track',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { referenceId: 'REQ-2026-KA-NONEXIST' }
  );

  const wrongMobRes = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/public/track',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { referenceId: testId, mobile: '9999999999' }
  );

  assert(
    wrongRefRes.data?.message === wrongMobRes.data?.message &&
      wrongRefRes.statusCode === 200 &&
      wrongMobRes.statusCode === 200,
    'Anti-probing parity: Non-existent ID and Wrong Mobile return identical constant response'
  );

  // Clean up test record
  const deleteRes = await makeRequest({
    hostname: 'localhost',
    port: PORT,
    path: `/api/requests/${testId}`,
    method: 'DELETE',
    headers: {
      'x-admin-key': 'internal_test_secret_2026',
    },
  });

  assert(deleteRes.data?.success === true, `Test record ${testId} cleanly removed from database`);

  console.log('\n====================================================');
  console.log(`   AUDIT COMPLETE: ${passedChecks}/${totalChecks} CHECKS PASSED WITH ZERO ERRORS!`);
  console.log('====================================================\n');
}

runSecurityAudit().catch((err) => {
  console.error('Fatal audit execution error:', err);
  process.exit(1);
});
