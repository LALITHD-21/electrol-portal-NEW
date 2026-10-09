/**
 * PHASE 4 NOTIFICATIONS OUTBOX TEST SUITE
 * Tests:
 * 1. Notifications queue inspect (/api/notifications)
 * 2. Outbox dispatch worker (/api/notifications/dispatch)
 * 3. Verify status transition automatically queues notification
 */

const {
  createVoterRequest,
  updateVoterRequestStatus,
} = require('../lib/requestsService');

async function runPhase4Tests() {
  console.log('--- STARTING PHASE 4 NOTIFICATIONS OUTBOX TESTS ---');

  // STEP 1: Create request and update status to queue notification
  console.log('\n[Test 1] Transition status to queue notification');
  const req = await createVoterRequest({
    elector_name: 'Suma Prabhakar',
    relative_name: 'Prabhakar K',
    relation_type: 'Husband',
    gender: 'Female',
    mobile: '9845778899',
    district: 'Kolar',
    taluk: 'Kolar',
    qualification: 'MTech Digital Electronics',
    category: 'Graduates / Teachers Enrollment',
  });

  await updateVoterRequestStatus(req.id, {
    status: 'contacted',
    actor_id: 'test_notif_runner',
  });

  // STEP 2: Inspect outbox
  console.log('\n[Test 2] Query /api/notifications outbox');
  const outboxRes = await fetch('http://localhost:3000/api/notifications');
  const outboxData = await outboxRes.json();
  console.log(`Outbox stats: total=${outboxData.stats.total}, queued=${outboxData.stats.queued}`);
  if (outboxData.stats.queued === 0) {
    throw new Error('Expected at least 1 queued notification in outbox');
  }

  // STEP 3: Dispatch outbox
  console.log('\n[Test 3] Trigger /api/notifications/dispatch');
  const dispatchRes = await fetch('http://localhost:3000/api/notifications/dispatch', {
    method: 'POST',
  });
  const dispatchData = await dispatchRes.json();
  console.log(`Dispatch response: success=${dispatchData.success}, sent=${dispatchData.sent}`);
  if (!dispatchData.success || dispatchData.sent === 0) {
    throw new Error('Outbox dispatch failed to send queued notifications');
  }

  // STEP 4: Verify outbox queue is cleared
  console.log('\n[Test 4] Verify outbox queue is now 0');
  const outboxVerifyRes = await fetch('http://localhost:3000/api/notifications');
  const outboxVerifyData = await outboxVerifyRes.json();
  console.log(`Remaining queued: ${outboxVerifyData.stats.queued}, total sent: ${outboxVerifyData.stats.sent}`);
  if (outboxVerifyData.stats.queued !== 0) {
    throw new Error('Queued notifications still present after dispatch');
  }

  console.log('\n--- ALL PHASE 4 NOTIFICATIONS TESTS PASSED SUCCESSFULLY! ---');
}

runPhase4Tests().catch((err) => {
  console.error('\nPHASE 4 TEST FAILED:', err);
  process.exit(1);
});
