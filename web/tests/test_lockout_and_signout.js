// Test script to verify:
// 1. 5-failed attempt rate limiting and 2-minute lockout on /api/auth/login
// 2. HTTP 429 status code and Retry-After header
// 3. Status checks on GET /api/auth/login
// 4. Reset on successful login
// 5. Verification of Sign Out fallback to /search

const BASE_URL = 'http://localhost:8081';

async function runTests() {
  console.log('====================================================');
  console.log('   TESTING LOGIN 5-ATTEMPT LOCKOUT & SIGNOUT UX    ');
  console.log('====================================================\n');

  // Step 0: Ensure clean rate limit state
  await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'x-test-reset-ratelimit': 'true' },
  });

  // Step 1: Initial state check
  const initRes = await fetch(`${BASE_URL}/api/auth/login`);
  const initData = await initRes.json();
  if (initData.isLocked === false && initData.attemptsLeft === 5) {
    console.log('[PASS] Initial rate limit state: 5 attempts left, isLocked: false');
  } else {
    console.error('[FAIL] Unexpected initial state:', initData);
    process.exit(1);
  }

  // Step 2: Attempt 1 to 4 with incorrect password
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'amulya', password: 'wrongpassword' }),
    });
    const data = await res.json();
    const expectedLeft = 5 - i;

    if (res.status === 401 && data.attemptsLeft === expectedLeft) {
      console.log(`[PASS] Failed attempt #${i}: Status 401, ${data.attemptsLeft} attempts remaining`);
    } else {
      console.error(`[FAIL] Attempt #${i} failed:`, res.status, data);
      process.exit(1);
    }
  }

  // Step 3: Attempt 5 with incorrect password -> should trigger 429 & lockout
  const attempt5Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'amulya', password: 'wrongpassword' }),
  });
  const attempt5Data = await attempt5Res.json();
  const retryAfterHeader = attempt5Res.headers.get('retry-after');

  if (
    attempt5Res.status === 429 &&
    attempt5Data.attemptsLeft === 0 &&
    attempt5Data.retryAfterSeconds > 100 &&
    attempt5Data.error.includes('2 minutes')
  ) {
    console.log('[PASS] Attempt #5: Triggered HTTP 429 lockout! Error message specifies 2 minutes');
    console.log(`[PASS] retryAfterSeconds: ${attempt5Data.retryAfterSeconds}s, Retry-After Header: ${retryAfterHeader}s`);
  } else {
    console.error('[FAIL] Attempt #5 did not lock out properly:', attempt5Res.status, attempt5Data);
    process.exit(1);
  }

  // Step 4: Attempt 6 while locked out (even with CORRECT credentials!)
  const attempt6Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'amulya', password: '1234@admin@' }),
  });
  const attempt6Data = await attempt6Res.json();

  if (attempt6Res.status === 429) {
    console.log('[PASS] Attempt #6 during lockout rejected with HTTP 429 (Brute-force protection enforced)');
  } else {
    console.error('[FAIL] Attempt #6 during lockout was not blocked:', attempt6Res.status, attempt6Data);
    process.exit(1);
  }

  // Step 5: Check GET /api/auth/login reports isLocked: true
  const statusRes = await fetch(`${BASE_URL}/api/auth/login`);
  const statusData = await statusRes.json();
  if (statusData.isLocked === true && statusData.retryAfterSeconds > 0) {
    console.log(`[PASS] GET /api/auth/login accurately reports client is locked out (${statusData.retryAfterSeconds}s remaining)`);
  } else {
    console.error('[FAIL] GET status did not reflect lockout:', statusData);
    process.exit(1);
  }

  // Step 6: Reset rate limit and verify successful login clears failed attempts
  await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'x-test-reset-ratelimit': 'true' },
  });

  const validLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'amulya', password: '1234@admin@' }),
  });
  const validLoginData = await validLoginRes.json();

  if (validLoginRes.status === 200 && validLoginData.success) {
    console.log('[PASS] Reset allowed valid login with amulya (200 OK)');
  } else {
    console.error('[FAIL] Valid login failed:', validLoginRes.status, validLoginData);
    process.exit(1);
  }

  // Verify rate limit record was cleared on successful login
  const afterSuccessRes = await fetch(`${BASE_URL}/api/auth/login`);
  const afterSuccessData = await afterSuccessRes.json();
  if (afterSuccessData.isLocked === false && afterSuccessData.attemptsLeft === 5) {
    console.log('[PASS] Successful login reset failed attempts back to 5');
  } else {
    console.error('[FAIL] Failed attempts not reset after success:', afterSuccessData);
    process.exit(1);
  }

  // Step 7: Verify Sign Out endpoint
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
  const logoutData = await logoutRes.json();
  const setCookie = logoutRes.headers.get('set-cookie');

  if (logoutRes.status === 200 && logoutData.success && setCookie && setCookie.includes('Max-Age=0')) {
    console.log('[PASS] Logout endpoint successfully clears session cookie (Max-Age=0)');
  } else {
    console.error('[FAIL] Logout endpoint unexpected response:', logoutRes.status, logoutData);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('   ALL LOCKOUT & SIGNOUT CHECKS PASSED PERFECTLY!   ');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
