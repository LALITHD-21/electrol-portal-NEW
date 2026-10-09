/**
 * PHASE 2 ADMIN WORKFLOW TEST SUITE
 * Tests:
 * 1. Role-restricted Promote to Roll Record (/api/requests/[id]/promote)
 * 2. Safe same-status bulk transitions (/api/requests/bulk)
 * 3. Prevention of bulk terminal operations (enrolled/rejected)
 * 4. Mixed-status batch rejection
 */

const {
  createVoterRequest,
  updateVoterRequestStatus,
  getRequestEvents,
} = require('../lib/requestsService');

async function runPhase2Tests() {
  console.log('--- STARTING PHASE 2 ADMIN WORKFLOW TESTS ---');

  // SETUP: Create two test requests
  const req1 = await createVoterRequest({
    elector_name: 'Chandrashekar Patil',
    relative_name: 'Veerabhadrappa',
    relation_type: 'Father',
    gender: 'Male',
    mobile: '9845112233',
    district: 'Chitradurga',
    taluk: 'Chitradurga',
    qualification: 'MSc Physics',
    category: 'Graduates / Teachers Enrollment',
  });

  const req2 = await createVoterRequest({
    elector_name: 'Bhagya M',
    relative_name: 'Malleshappa',
    relation_type: 'Husband',
    gender: 'Female',
    mobile: '9845223344',
    district: 'Davanagere',
    taluk: 'Davanagere',
    qualification: 'BA BEd',
    category: 'Graduates / Teachers Enrollment',
  });

  console.log(`Created test requests: ${req1.id} (status: ${req1.status}), ${req2.id} (status: ${req2.status})`);

  // TEST 1: Bulk Action - Prevent Bulk Terminal (enrolled)
  console.log('\n[Test 1] Verify bulk enrolled is strictly blocked');
  const bulkEnrolledRes = await fetch('http://localhost:3000/api/requests/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestIds: [req1.id, req2.id],
      targetStatus: 'enrolled',
    }),
  });
  const bulkEnrolledData = await bulkEnrolledRes.json();
  console.log(`Bulk enrolled response: status=${bulkEnrolledRes.status}, error="${bulkEnrolledData.error}"`);
  if (bulkEnrolledRes.status !== 400 || !bulkEnrolledData.error.includes('Bulk action not permitted')) {
    throw new Error('Failed to block bulk enrolled operation');
  }

  // TEST 2: Bulk Action - Prevent Mixed Statuses
  console.log('\n[Test 2] Verify mixed status batch is blocked');
  // Transition req1 to 'contacted', leave req2 as 'new'
  await updateVoterRequestStatus(req1.id, { status: 'contacted' });

  const bulkMixedRes = await fetch('http://localhost:3000/api/requests/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestIds: [req1.id, req2.id],
      targetStatus: 'verified',
    }),
  });
  const bulkMixedData = await bulkMixedRes.json();
  console.log(`Bulk mixed response: status=${bulkMixedRes.status}, error="${bulkMixedData.error}"`);
  if (bulkMixedRes.status !== 400 || !bulkMixedData.error.includes('All selected requests must share the same current status')) {
    throw new Error('Failed to block mixed-status batch');
  }

  // TEST 3: Bulk Action - Valid same-status batch
  console.log('\n[Test 3] Execute valid uniform batch (contacted -> verified)');
  // Bring req2 to 'contacted' so both are 'contacted'
  await updateVoterRequestStatus(req2.id, { status: 'contacted' });

  const bulkValidRes = await fetch('http://localhost:3000/api/requests/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestIds: [req1.id, req2.id],
      targetStatus: 'verified',
      actorId: 'admin_bulk_test',
    }),
  });
  const bulkValidData = await bulkValidRes.json();
  console.log(`Bulk valid response: status=${bulkValidRes.status}, updatedCount=${bulkValidData.count}`);
  if (bulkValidRes.status !== 200 || bulkValidData.count !== 2) {
    throw new Error('Valid bulk transition failed');
  }

  // TEST 4: Promote to Roll Record - Role Check
  console.log('\n[Test 4] Verify Promote to Roll role enforcement');
  // Complete lifecycle for req1 to 'enrolled'
  await updateVoterRequestStatus(req1.id, {
    status: 'form_submitted',
    form_ack_number: 'KA/2026/ERO/TEST88',
    form_submitted_at: '2026-10-09T08:00:00Z',
  });
  await updateVoterRequestStatus(req1.id, {
    status: 'enrolled',
    enrolled_part_number: '55',
    enrolled_serial_number: '312',
    enrolled_confirmed_at: '2026-10-09T09:00:00Z',
  });

  // 4a: Operator role should be rejected
  const promoteOpRes = await fetch(`http://localhost:3000/api/requests/${req1.id}/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userRole: 'operator' }),
  });
  const promoteOpData = await promoteOpRes.json();
  console.log(`Promote operator response: status=${promoteOpRes.status}, error="${promoteOpData.error}"`);
  if (promoteOpRes.status !== 403) {
    throw new Error('Failed to block operator role on promote to roll');
  }

  // 4b: Supervisor / Admin role should succeed
  const promoteAdminRes = await fetch(`http://localhost:3000/api/requests/${req1.id}/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userRole: 'supervisor', actorId: 'supervisor_test' }),
  });
  const promoteAdminData = await promoteAdminRes.json();
  console.log(`Promote supervisor response: status=${promoteAdminRes.status}, success=${promoteAdminData.success}`);
  if (promoteAdminRes.status !== 200 || !promoteAdminData.success) {
    throw new Error('Promote to roll record failed for supervisor');
  }

  // Verify audit event for promotion
  const req1Events = await getRequestEvents(req1.id);
  const promoteEvent = req1Events.find((e) => e.action === 'PROMOTED_TO_ROLL_RECORD');
  if (!promoteEvent) {
    throw new Error('Audit trail missing PROMOTED_TO_ROLL_RECORD event');
  }
  console.log(`Verified audit event: action="${promoteEvent.action}", actor="${promoteEvent.actor_id}"`);

  console.log('\n--- ALL PHASE 2 ADMIN WORKFLOW TESTS PASSED SUCCESSFULLY! ---');
}

runPhase2Tests().catch((err) => {
  console.error('\nPHASE 2 TEST FAILED:', err);
  process.exit(1);
});
