const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';

async function testDualTrack() {
  console.log('--- Testing Dual Tracking Capabilities ---');

  // Test 1: Submit new voter addition request
  const submitRes = await fetch(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      elector_name: 'Bharath Kumar',
      elector_name_kannada: 'ಭರತ್ ಕುಮಾರ್',
      relative_name: 'Kumar Swamy',
      relation_type: 'Father',
      gender: 'Male',
      mobile: '9845112233',
      existing_epic: 'IUO1234567',
      district: 'Tumkur',
      taluk: 'Tumkur',
      category: 'Graduates / Teachers Enrollment',
      applicant_type: 'Self',
    }),
  });
  const submitData = await submitRes.json();
  const refId = submitData.id || submitData.request?.id;
  console.log(`Created request: refId=${refId}, existing_epic=IUO1234567`);

  // Test 2: Track using Tracking Reference ID only (POST)
  const trackByRef = await (await fetch(`${BASE_URL}/api/public/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referenceId: refId }),
  })).json();
  console.log('Track by Reference ID only:', trackByRef.found, trackByRef.first_name, trackByRef.status);
  if (!trackByRef.found || trackByRef.first_name !== 'Bharath') {
    throw new Error('Track by referenceId failed');
  }

  // Test 3: Track using EPIC Number only (POST)
  const trackByEpic = await (await fetch(`${BASE_URL}/api/public/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epic: 'IUO1234567' }),
  })).json();
  console.log('Track by EPIC Number only:', trackByEpic.found, trackByEpic.first_name, trackByEpic.status);
  if (!trackByEpic.found || trackByEpic.first_name !== 'Bharath') {
    throw new Error('Track by epic failed');
  }

  // Test 4: Track using GET query with ref
  const trackGetRef = await (await fetch(`${BASE_URL}/api/public/track?ref=${encodeURIComponent(refId)}`)).json();
  console.log('Track GET ?ref=...', trackGetRef.found, trackGetRef.first_name);
  if (!trackGetRef.found) throw new Error('GET ?ref failed');

  // Test 5: Track using GET query with epic
  const trackGetEpic = await (await fetch(`${BASE_URL}/api/public/track?epic=IUO1234567`)).json();
  console.log('Track GET ?epic=...', trackGetEpic.found, trackGetEpic.first_name);
  if (!trackGetEpic.found) throw new Error('GET ?epic failed');

  // Test 6: Verify non-existent ID or EPIC gives identical not found message
  const notFound1 = await (await fetch(`${BASE_URL}/api/public/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referenceId: 'REQ-2026-KA-NONEXIST' }),
  })).json();

  const notFound2 = await (await fetch(`${BASE_URL}/api/public/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epic: 'XYZ0000000' }),
  })).json();

  if (notFound1.found !== false || notFound2.found !== false || notFound1.message !== notFound2.message) {
    throw new Error('Anti-probing error message mismatch');
  }
  console.log('Anti-probing response equality verified:', notFound1.message);

  // Cleanup test record
  await fetch(`${BASE_URL}/api/requests/${refId}`, {
    method: 'DELETE',
    headers: { 'x-admin-key': 'internal_test_secret_2026' },
  });
  console.log(`✓ Test Cleanup: Test record ${refId} permanently removed`);

  console.log('✓ All Dual Tracking tests passed successfully!');
}

testDualTrack().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
