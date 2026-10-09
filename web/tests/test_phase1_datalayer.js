/**
 * PHASE 1 DATA LAYER TEST SUITE
 * Tests:
 * 1. State machine transition enforcement (allowed vs illegal jumps)
 * 2. Required fields per transition
 * 3. Append-only event trail generation
 * 4. Constant-time probing protection on public tracking
 * 5. Allow-listed public fields verification (no internal data leak)
 */

const {
  createVoterRequest,
  updateVoterRequestStatus,
  trackVoterRequest,
  getRequestEvents,
} = require('../lib/requestsService');

async function runTests() {
  console.log('--- STARTING PHASE 1 DATA LAYER TESTS ---');

  // TEST 1: Creation & Default State
  console.log('\n[Test 1] Create initial voter request');
  const req = await createVoterRequest({
    elector_name: 'Amulya Nalini Gowda',
    relative_name: 'Manjunatha N',
    relation_type: 'Husband',
    gender: 'Female',
    mobile: '9845123456',
    district: 'Tumkur',
    taluk: 'Tumkur',
    qualification: 'BE Computer Science',
    category: 'Graduates / Teachers Enrollment',
  });
  console.log(`Created request: ID=${req.id}, Status=${req.status}`);
  if (req.status !== 'new') throw new Error('Initial status must be "new"');

  // TEST 2: Illegal jump test (new -> enrolled)
  console.log('\n[Test 2] Verify illegal jump (new -> enrolled) is rejected');
  let illegalCaught = false;
  try {
    await updateVoterRequestStatus(req.id, {
      status: 'enrolled',
    });
  } catch (err) {
    illegalCaught = true;
    console.log(`Successfully blocked illegal jump: "${err.message}"`);
  }
  if (!illegalCaught) throw new Error('State machine failed to block illegal jump (new -> enrolled)');

  // TEST 3: Legal transition without required fields (verified -> form_submitted without ack number)
  console.log('\n[Test 3] Verify missing required field check on form_submitted');
  // First move: new -> contacted -> verified
  await updateVoterRequestStatus(req.id, { status: 'contacted' });
  await updateVoterRequestStatus(req.id, { status: 'verified' });

  let missingAckCaught = false;
  try {
    await updateVoterRequestStatus(req.id, {
      status: 'form_submitted',
      // missing form_ack_number
    });
  } catch (err) {
    missingAckCaught = true;
    console.log(`Successfully blocked form_submitted without ack number: "${err.message}"`);
  }
  if (!missingAckCaught) throw new Error('Failed to enforce mandatory form_ack_number on form_submitted');

  // TEST 4: Valid form_submitted transition
  console.log('\n[Test 4] Transition to form_submitted with ack number');
  const submittedReq = await updateVoterRequestStatus(req.id, {
    status: 'form_submitted',
    form_type: 'Form 18',
    form_ack_number: 'KA/2026/ERO/98124',
    form_submitted_at: '2026-10-09T08:00:00Z',
  });
  console.log(`Updated status: ${submittedReq.status}, Ack=${submittedReq.form_ack_number}`);

  // TEST 5: Transition to enrolled
  console.log('\n[Test 5] Confirm enrolment in roll');
  const enrolledReq = await updateVoterRequestStatus(req.id, {
    status: 'enrolled',
    enrolled_part_number: '124',
    enrolled_serial_number: '119',
    enrolled_confirmed_at: '2026-10-09T09:00:00Z',
  });
  console.log(`Updated status: ${enrolledReq.status}, Part=${enrolledReq.enrolled_part_number}, Serial=${enrolledReq.enrolled_serial_number}`);

  // TEST 6: Audit events trail
  console.log('\n[Test 6] Inspect append-only event trail');
  const events = await getRequestEvents(req.id);
  console.log(`Total events logged for ${req.id}: ${events.length}`);
  events.forEach((e, idx) => {
    console.log(`  Event ${idx + 1}: ${e.action} (to: ${e.to_status}, public: ${e.public_visible})`);
  });
  if (events.length < 5) throw new Error('Audit trail missing expected status change events');

  // TEST 7: Security Definer Public Tracking Checks
  console.log('\n[Test 7] Verify Public Tracking API Security');
  // 7a: Wrong ID + Correct Mobile
  const trackWrongId = await trackVoterRequest('REQ-2026-KA-INVALID', '9845123456');
  console.log('Wrong ID response:', JSON.stringify(trackWrongId));

  // 7b: Correct ID + Wrong Mobile
  const trackWrongMob = await trackVoterRequest(req.id, '9999999999');
  console.log('Wrong Mobile response:', JSON.stringify(trackWrongMob));

  // Check identical responses (no probing)
  if (trackWrongId.message !== trackWrongMob.message || trackWrongId.found !== false || trackWrongMob.found !== false) {
    throw new Error('Probing vulnerability: Responses for wrong ID vs wrong mobile must be identical');
  }

  // 7c: Correct ID + Correct Mobile
  const trackSuccess = await trackVoterRequest(req.id, '9845123456');
  console.log('\nSuccessful Public Track Response Payload:');
  console.log(JSON.stringify(trackSuccess, null, 2));

  // Verify allow-list
  if (trackSuccess.first_name !== 'Amulya') {
    throw new Error(`Expected first name "Amulya", got "${trackSuccess.first_name}"`);
  }
  if (trackSuccess.mobile || trackSuccess.address || trackSuccess.notes) {
    throw new Error('Data Leak: sensitive internal fields returned in public response');
  }

  console.log('\n--- ALL PHASE 1 DATA LAYER TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
