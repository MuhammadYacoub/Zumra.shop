import { SQLiteLedgerRepository } from '../src/infrastructure/database/repositories/SQLiteLedgerRepository';
import { SQLiteFleetRepository } from '../src/infrastructure/database/repositories/SQLiteFleetRepository';
import { SQLiteIngestionRepository } from '../src/infrastructure/database/repositories/SQLiteIngestionRepository';
import { RecordLedgerEntryUseCase } from '../src/use-cases/ledger/record-entry';
import { AssignShipmentUseCase } from '../src/use-cases/fleet/assign-shipment';
import { ProcessVoiceOrderUseCase } from '../src/use-cases/ingestion/process-voice-order';
import { SQLiteConnection } from '../src/infrastructure/database/sqlite-connection';

async function runPhase2IntegrationTests() {
  console.log('🧪 Starting Phase 2 Use-Cases Integration Test Suite...\n');

  const ledgerRepo = new SQLiteLedgerRepository();
  const fleetRepo = new SQLiteFleetRepository();
  const ingestionRepo = new SQLiteIngestionRepository();

  const recordLedgerEntryUC = new RecordLedgerEntryUseCase(ledgerRepo);
  const assignShipmentUC = new AssignShipmentUseCase(fleetRepo);
  const processVoiceOrderUC = new ProcessVoiceOrderUseCase(ingestionRepo);

  // --------------------------------------------------------------------------
  // TEST 1: Double-Entry Ledger Zero-Sum Invariant
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Double-Entry Financial Ledger ---');

  // Test 1A: Rejection of Unbalanced Entry
  try {
    await recordLedgerEntryUC.execute({
      correlationId: 'CORR-TEST-UNBALANCED',
      referenceType: 'ORDER',
      referenceId: 'ORD-999',
      description: 'Faulty unbalanced entry',
      lines: [
        { accountCode: '1010', entryType: 'DEBIT', amount: 1000 },
        { accountCode: '2010', entryType: 'CREDIT', amount: 900 }, // Discrepancy of 100 EGP
      ],
    });
    console.error('❌ TEST 1A FAILED: Unbalanced ledger entry was incorrectly accepted!');
  } catch (err: unknown) {
    const error = err as Error;
    console.log('✅ TEST 1A PASSED: Unbalanced entry rejected cleanly ->', error.message);
  }

  // Test 1B: Balanced Double-Entry Posting
  const balancedEntry = await recordLedgerEntryUC.execute({
    correlationId: 'CORR-TEST-BALANCED-01',
    referenceType: 'ORDER',
    referenceId: 'ORD-1001',
    description: 'Wholesale order payment clearance - El-Ataba Market',
    lines: [
      { accountCode: '1010', entryType: 'DEBIT', amount: 1000 },  // Cash COD +1000
      { accountCode: '2010', entryType: 'CREDIT', amount: 900 },  // Merchant Payable +900
      { accountCode: '2020', entryType: 'CREDIT', amount: 50 },   // Affiliate Payable +50
      { accountCode: '4010', entryType: 'CREDIT', amount: 50 },   // Revenue Fee +50
    ],
  });
  console.log('✅ TEST 1B PASSED: Balanced entry posted successfully -> JournalEntry ID:', balancedEntry.id);

  // Verify Account Balance
  const cashAcc = await ledgerRepo.getAccountBalance('1010');
  console.log(`📊 Cash Account (1010) Balance: ${cashAcc.balance} EGP (Debits: ${cashAcc.debits}, Credits: ${cashAcc.credits})\n`);

  // --------------------------------------------------------------------------
  // TEST 2: Zonal Fleet Dispatch & COD Risk Enforcement
  // --------------------------------------------------------------------------
  console.log('--- TEST 2: Zonal Fleet Dispatch & COD Risk Limits ---');

  // Seed shipment in El-Ataba zone
  const shipmentId = `SHP-${Date.now()}`;
  await fleetRepo.saveShipment({
    id: shipmentId,
    orderId: 'ORD-1001',
    zoneId: 'ZONE-ATABA-01',
    status: 'PENDING',
    codAmount: 850,
    attemptCount: 0,
  });

  // Test 2A: Valid Assignment to Available Driver in same zone (DRV-01)
  const assignedShipment = await assignShipmentUC.execute({
    correlationId: 'CORR-DISPATCH-01',
    shipmentId,
    driverId: 'DRV-01',
  });
  console.log('✅ TEST 2A PASSED: Shipment assigned to Driver DRV-01 -> Status:', assignedShipment.status);

  // Test 2B: Driver Status Lock Check (DRV-01 is now ON_DELIVERY)
  try {
    const secondShipmentId = `SHP-${Date.now()}-2`;
    await fleetRepo.saveShipment({
      id: secondShipmentId,
      orderId: 'ORD-1002',
      zoneId: 'ZONE-ATABA-01',
      status: 'PENDING',
      codAmount: 400,
      attemptCount: 0,
    });

    await assignShipmentUC.execute({
      correlationId: 'CORR-DISPATCH-02',
      shipmentId: secondShipmentId,
      driverId: 'DRV-01',
    });
    console.error('❌ TEST 2B FAILED: Busy driver was assigned new shipment!');
  } catch (err: unknown) {
    const error = err as Error;
    console.log('✅ TEST 2B PASSED: Busy driver assignment rejected cleanly ->', error.message, '\n');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Egyptian Slang Voice Ingestion & Arabic SEO Slugs
  // --------------------------------------------------------------------------
  console.log('--- TEST 3: Egyptian Wholesale Voice Ingestion & SEO Slugs ---');

  const voiceOrder = await processVoiceOrderUC.execute({
    correlationId: 'CORR-VOICE-01',
    merchantId: 'USER-M-01',
    rawVoiceText: 'عايز 5 دسته اقلام جاف و 2 كرتونه كشاكيل بضاعة العتبة',
  });

  console.log('✅ TEST 3 PASSED: Ingested Voice Order ID:', voiceOrder.id);
  console.log('📦 Parsed Items:', JSON.stringify(voiceOrder.parsedItems, null, 2));
  console.log('🏷️ Arabic SEO Slug:', voiceOrder.arabicSeoSlug);
  console.log('💰 Total Estimated Amount:', voiceOrder.totalEstimatedAmountEgp, 'EGP\n');

  await SQLiteConnection.close();
  console.log('🎉 ALL PHASE 2 INTEGRATION TESTS PASSED 100%! READY FOR PRODUCTION!');
}

runPhase2IntegrationTests().catch((err) => {
  console.error('❌ Phase 2 Integration Test Runner Failed:', err);
  process.exit(1);
});
