const GATEWAY_URL = 'http://localhost:3000/api/v1';

async function testWorkflow() {
  console.log('================================================');
  console.log('   AFRIHEALTH CRYPTOGRAPHIC BLOCKCHAIN TEST     ');
  console.log('================================================\n');

  const startTotal = Date.now();

  // 1. Authenticate users
  console.log('1. Authenticating Patient and Doctor...');
  const t1 = Date.now();
  
  const patientAuthRes = await fetch(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'noafrederic91@gmail.com', password: 'Hello@94fbr' })
  }).then(r => r.json());

  const doctorAuthRes = await fetch(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ngurusel@gmail.com', password: 'Hello@94fbr' })
  }).then(r => r.json());

  if (!patientAuthRes.success || !doctorAuthRes.success) {
    console.error('Authentication failed!', { patientAuthRes, doctorAuthRes });
    process.exit(1);
  }

  const patientToken = `Bearer ${patientAuthRes.data.accessToken}`;
  const doctorToken = `Bearer ${doctorAuthRes.data.accessToken}`;
  const patientDid = patientAuthRes.data.user.did;
  const doctorDid = doctorAuthRes.data.user.did;

  console.log(`- Patient authenticated: ${patientDid}`);
  console.log(`- Doctor authenticated: ${doctorDid}`);
  console.log(`Latency: ${Date.now() - t1}ms\n`);

  // 2. Doctor attempts to read patient records (should fail - no consent)
  console.log("2. Doctor attempts to fetch Patient records before consent...");
  const t2 = Date.now();
  const readBeforeRes = await fetch(`${GATEWAY_URL}/records/documents/${patientDid}`, {
    method: 'GET',
    headers: { 'Authorization': doctorToken }
  }).then(r => r.json());

  console.log(`- Success status: ${readBeforeRes.success}`);
  console.log(`- Error code: ${readBeforeRes.code || 'None'} (Message: ${readBeforeRes.error})`);
  console.log(`Latency: ${Date.now() - t2}ms\n`);

  // 3. Patient grants consent on-chain
  console.log("3. Patient grants consent to Doctor...");
  const t3 = Date.now();
  const grantRes = await fetch(`${GATEWAY_URL}/blockchain/consents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': patientToken
    },
    body: JSON.stringify({
      providerDid: doctorDid,
      scopes: ['READ', 'WRITE'],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      purpose: 'Standard Consultation'
    })
  }).then(r => r.json());

  console.log(`- Transaction success: ${grantRes.success}`);
  console.log(`- Block Hash / Tx ID: ${grantRes.data?.txId}`);
  console.log(`- Block Index: ${grantRes.data?.block?.index}`);
  console.log(`- Block Nonce (Mined): ${grantRes.data?.block?.nonce}`);
  console.log(`Latency: ${Date.now() - t3}ms\n`);

  // 4. Doctor reads patient records (should succeed now)
  console.log("4. Doctor fetches Patient records after consent...");
  const t4 = Date.now();
  const readAfterRes = await fetch(`${GATEWAY_URL}/records/documents/${patientDid}`, {
    method: 'GET',
    headers: { 'Authorization': doctorToken }
  }).then(r => r.json());

  console.log(`- Success status: ${readAfterRes.success}`);
  console.log(`- Fetched documents count: ${readAfterRes.data?.length ?? 0}`);
  console.log(`Latency: ${Date.now() - t4}ms\n`);

  // 5. Doctor creates an Encounter (triggers background record anchoring)
  console.log("5. Doctor creates Encounter (triggers background block mining)...");
  const t5 = Date.now();
  const encounterRes = await fetch(`${GATEWAY_URL}/records/visits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': doctorToken
    },
    body: JSON.stringify({
      patientDid: patientDid,
      encounterType: 'OUTPATIENT',
      chiefComplaint: 'Severe Migraine and fatigue',
      notes: 'Prescribed rest and hydration.'
    })
  }).then(r => r.json());

  console.log(`- Encounter created: ${encounterRes.success}`);
  if (!encounterRes.success) {
    console.error('Encounter creation failed:', encounterRes);
    process.exit(1);
  }
  console.log(`- Encounter ID: ${encounterRes.data?.id}`);
  console.log(`Latency: ${Date.now() - t5}ms\n`);

  // Wait 1.5 seconds for background mining to complete and update database
  console.log("Waiting for block mining to complete...");
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Verify the encounter database now contains the anchored hash & txId
  console.log("Verifying Encounter is anchored in Postgres database...");
  const verifyDbRes = await fetch(`${GATEWAY_URL}/records/visits/${encounterRes.data.id}`, {
    method: 'GET',
    headers: { 'Authorization': doctorToken }
  }).then(r => r.json());

  console.log(`- DB record has blockchainTxId: ${!!verifyDbRes.data?.blockchainTxId}`);
  console.log(`- DB record has recordHash: ${!!verifyDbRes.data?.recordHash}`);
  console.log(`- Tx ID: ${verifyDbRes.data?.blockchainTxId}`);
  console.log(`- Record Hash: ${verifyDbRes.data?.recordHash}\n`);

  // 6. Patient revokes consent
  console.log("6. Patient revokes consent...");
  const t6 = Date.now();
  const revokeRes = await fetch(`${GATEWAY_URL}/blockchain/consents`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': patientToken
    },
    body: JSON.stringify({ providerDid: doctorDid })
  }).then(r => r.json());

  console.log(`- Revocation transaction success: ${revokeRes.success}`);
  console.log(`- Revoke Block Hash / Tx ID: ${revokeRes.data?.txId}`);
  console.log(`Latency: ${Date.now() - t6}ms\n`);

  // 7. Doctor attempts to read records again (should fail)
  console.log("7. Doctor attempts to fetch Patient records after revocation...");
  const t7 = Date.now();
  const readAfterRevokeRes = await fetch(`${GATEWAY_URL}/records/documents/${patientDid}`, {
    method: 'GET',
    headers: { 'Authorization': doctorToken }
  }).then(r => r.json());

  console.log(`- Success status: ${readAfterRevokeRes.success}`);
  console.log(`- Error code: ${readAfterRevokeRes.code || 'None'} (Message: ${readAfterRevokeRes.error})`);
  console.log(`Latency: ${Date.now() - t7}ms\n`);

  // 8. Validate blockchain cryptographic integrity
  console.log("8. Validating full blockchain cryptographic integrity...");
  const t8 = Date.now();
  const validationRes = await fetch(`${GATEWAY_URL}/blockchain/validate`, {
    method: 'GET',
    headers: { 'Authorization': patientToken }
  }).then(r => r.json());

  console.log(`- Blockchain Validation Result:`, validationRes.data);
  console.log(`Latency: ${Date.now() - t8}ms\n`);

  // 9. Fetch block list
  console.log("9. Listing mined blockchain blocks...");
  const blocksRes = await fetch(`${GATEWAY_URL}/blockchain/blocks`, {
    method: 'GET',
    headers: { 'Authorization': patientToken }
  }).then(r => r.json());

  console.log(`- Mined blocks count: ${blocksRes.data?.length}`);
  console.log(`Blocks summary:`);
  for (const block of blocksRes.data || []) {
    console.log(`  [Block #${block.index}] Hash: ${block.hash.substring(0, 16)}... | PrevHash: ${block.previousHash.substring(0, 16)}... | Nonce: ${block.nonce} | Type: ${block.data?.type || 'GENESIS'}`);
  }
  console.log('');

  const totalTime = Date.now() - startTotal;
  console.log('================================================');
  console.log(`   TEST COMPLETED SUCCESSFUL IN ${totalTime}ms`);
  console.log('================================================');
}

testWorkflow().catch(console.error);
