import { buildApp } from '../src/interfaces/http/app';
import { SQLiteConnection } from '../src/infrastructure/database/sqlite-connection';
import { SQLiteFleetRepository } from '../src/infrastructure/database/repositories/SQLiteFleetRepository';

async function runPhase3E2ETests() {
  console.log('🧪 Starting Phase 3 Fastify E2E HTTP Integration Test Suite...\n');

  // Verify DB initialization
  SQLiteConnection.getDatabase();

  const app = buildApp();
  await app.ready();

  const testCorrelationId = 'CORR-HTTP-TEST-999';

  // --------------------------------------------------------------------------
  // TEST 1: Health Check Endpoint
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: GET /health ---');
  const resHealth = await app.inject({
    method: 'GET',
    url: '/health',
    headers: { 'x-correlation-id': testCorrelationId },
  });

  console.log('Status Code:', resHealth.statusCode);
  console.log('Correlation ID Header:', resHealth.headers['x-correlation-id']);
  console.log('Body:', resHealth.body);
  if (resHealth.statusCode !== 200 || resHealth.headers['x-correlation-id'] !== testCorrelationId) {
    throw new Error('TEST 1 FAILED: Health check failed or correlation ID was not propagated.');
  }
  console.log('✅ TEST 1 PASSED: Health check & correlation ID header propagation verified!\n');

  // --------------------------------------------------------------------------
  // TEST 2: Authentication & Session Whitelist Token Acquisition
  // --------------------------------------------------------------------------
  console.log('--- TEST 2: POST /api/v1/auth/login ---');
  const resAuth = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { userId: 'USER-ADMIN-01', role: 'ADMIN', phone: '+201001112233' },
  });

  const authJson = JSON.parse(resAuth.body);
  console.log('Status Code:', resAuth.statusCode);
  console.log('Token Payload:', authJson.data);
  if (resAuth.statusCode !== 200 || !authJson.data.token) {
    throw new Error('TEST 2 FAILED: Could not acquire Bearer JWT token.');
  }
  const authToken = authJson.data.token;
  console.log('✅ TEST 2 PASSED: Acquired valid JWT token from Session Whitelist!\n');

  // --------------------------------------------------------------------------
  // TEST 3: Auth Security Check (Unauthorized Requests)
  // --------------------------------------------------------------------------
  console.log('--- TEST 3: Security Lock (Missing Auth Token) ---');
  const resUnauth = await app.inject({
    method: 'POST',
    url: '/api/v1/ingestion/voice-order',
    payload: { merchantId: 'USER-M-01', rawVoiceText: 'عايز 5 دسته اقلام' },
  });

  console.log('Status Code (Expected 401):', resUnauth.statusCode);
  if (resUnauth.statusCode !== 401) {
    throw new Error('TEST 3 FAILED: Protected endpoint allowed request without Bearer token!');
  }
  console.log('✅ TEST 3 PASSED: Protected route blocked unauthorized request with 401!\n');

  // --------------------------------------------------------------------------
  // TEST 4: Voice Ingestion REST Endpoint (Authenticated)
  // --------------------------------------------------------------------------
  console.log('--- TEST 4: POST /api/v1/ingestion/voice-order ---');
  const resVoice = await app.inject({
    method: 'POST',
    url: '/api/v1/ingestion/voice-order',
    headers: {
      authorization: `Bearer ${authToken}`,
      'x-correlation-id': 'CORR-VOICE-HTTP-01',
    },
    payload: {
      merchantId: 'USER-M-01',
      rawVoiceText: 'عايز 3 كرتونه كشاكيل و 10 دسته اقلام جاف بضاعة العتبة',
    },
  });

  const voiceJson = JSON.parse(resVoice.body);
  console.log('Status Code:', resVoice.statusCode);
  console.log('Ingested Voice Order Response:', JSON.stringify(voiceJson, null, 2));
  if (resVoice.statusCode !== 201 || !voiceJson.data.arabicSeoSlug) {
    throw new Error('TEST 4 FAILED: Voice order ingestion API failed.');
  }
  console.log('✅ TEST 4 PASSED: Voice order parsed and stored via HTTP API!\n');

  // --------------------------------------------------------------------------
  // TEST 5: Double-Entry Financial Ledger REST Endpoint
  // --------------------------------------------------------------------------
  console.log('--- TEST 5: POST /api/v1/ledger/entries ---');
  const resLedger = await app.inject({
    method: 'POST',
    url: '/api/v1/ledger/entries',
    headers: {
      authorization: `Bearer ${authToken}`,
      'x-correlation-id': 'CORR-LEDGER-HTTP-01',
    },
    payload: {
      referenceType: 'ORDER',
      referenceId: 'ORD-HTTP-2001',
      description: 'HTTP API Wholesale Trade Settlement - El-Ataba Market',
      lines: [
        { accountCode: '1010', entryType: 'DEBIT', amount: 2500 },  // Cash COD +2500
        { accountCode: '2010', entryType: 'CREDIT', amount: 2250 }, // Merchant Payable +2250
        { accountCode: '2020', entryType: 'CREDIT', amount: 125 },  // Affiliate Payable +125
        { accountCode: '4010', entryType: 'CREDIT', amount: 125 },  // Revenue Fee +125
      ],
    },
  });

  const ledgerJson = JSON.parse(resLedger.body);
  console.log('Status Code:', resLedger.statusCode);
  console.log('Ledger Response:', ledgerJson);
  if (resLedger.statusCode !== 201 || ledgerJson.data.status !== 'POSTED') {
    throw new Error('TEST 5 FAILED: Financial double-entry HTTP API failed.');
  }
  console.log('✅ TEST 5 PASSED: Zero-sum double-entry transaction posted via HTTP API!\n');

  // --------------------------------------------------------------------------
  // TEST 6: Zonal Fleet Dispatch REST Endpoint
  // --------------------------------------------------------------------------
  console.log('--- TEST 6: POST /api/v1/fleet/dispatch ---');
  
  // Seed pending shipment
  const fleetRepo = new SQLiteFleetRepository();
  const httpShipmentId = `SHP-HTTP-${Date.now()}`;
  await fleetRepo.saveShipment({
    id: httpShipmentId,
    orderId: 'ORD-HTTP-2001',
    zoneId: 'ZONE-ATABA-01',
    status: 'PENDING',
    codAmount: 1200,
    attemptCount: 0,
  });

  // Reset driver status to AVAILABLE for test isolation
  await fleetRepo.updateDriverStatus('DRV-01', 'AVAILABLE');

  const resDispatch = await app.inject({
    method: 'POST',
    url: '/api/v1/fleet/dispatch',
    headers: {
      authorization: `Bearer ${authToken}`,
      'x-correlation-id': 'CORR-DISPATCH-HTTP-01',
    },
    payload: {
      shipmentId: httpShipmentId,
      driverId: 'DRV-01',
    },
  });

  const dispatchJson = JSON.parse(resDispatch.body);
  console.log('Status Code:', resDispatch.statusCode);
  console.log('Dispatch Response:', dispatchJson);
  if (resDispatch.statusCode !== 200 || dispatchJson.data.status !== 'ASSIGNED') {
    throw new Error('TEST 6 FAILED: Zonal fleet dispatch HTTP API failed.');
  }
  console.log('✅ TEST 6 PASSED: Zonal fleet shipment assigned via HTTP API!\n');

  // --------------------------------------------------------------------------
  // TEST 7: Swagger / OpenAPI UI Route
  // --------------------------------------------------------------------------
  console.log('--- TEST 7: GET /documentation ---');
  const resSwagger = await app.inject({
    method: 'GET',
    url: '/documentation/static/index.html',
  });

  console.log('Status Code:', resSwagger.statusCode);
  if (resSwagger.statusCode !== 200) {
    throw new Error('TEST 7 FAILED: Swagger UI documentation is not accessible.');
  }
  console.log('✅ TEST 7 PASSED: OpenAPI / Swagger documentation UI accessible!\n');

  await app.close();
  await SQLiteConnection.close();
  console.log('🎉 ALL PHASE 3 E2E HTTP INTEGRATION TESTS PASSED 100%! FASTIFY SYSTEM READY!');
}

runPhase3E2ETests().catch((err) => {
  console.error('❌ Phase 3 E2E HTTP Test Suite Failed:', err);
  process.exit(1);
});
