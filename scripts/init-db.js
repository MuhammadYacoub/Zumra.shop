const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'zumra.sqlite');
const sqlPath = path.join(__dirname, 'init-db.sql');

console.log('⚡ [Ziad & Hazem] Initializing Zumra.shop SQLite Database...');

if (fs.existsSync(dbPath)) {
  console.log('🗑️ Removing existing SQLite DB file for clean setup...');
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
    process.exit(1);
  }
  console.log('✅ SQLite Database file created at:', dbPath);
});

const sqlScript = fs.readFileSync(sqlPath, 'utf8');

db.exec(sqlScript, (err) => {
  if (err) {
    console.error('❌ DDL Execution failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Base DDL schema executed successfully.');

  // Seed default chart of accounts and market zones
  seedInitialData();
});

function seedInitialData() {
  db.serialize(() => {
    console.log('🌱 [Hazem & Tarek] Seeding Chart of Accounts & Wholesale Zones...');

    // 1. Zones
    const stmtZone = db.prepare(`INSERT INTO zones (id, code, name_ar, name_en, market_type) VALUES (?, ?, ?, ?, ?)`);
    stmtZone.run('ZONE-ATABA-01', 'ATABA', 'سوق العتبة بالجملة', 'El-Ataba Wholesale Market', 'EL_ATABA');
    stmtZone.run('ZONE-FAGALA-01', 'FAGALA', 'الفجالة للأدوات المكتبية', 'El-Fagala Stationeries', 'EL_FAGALA');
    stmtZone.finalize();

    // 2. Chart of Accounts (Double-Entry Baseline)
    const stmtAcc = db.prepare(`INSERT INTO accounts (id, code, name, type, currency) VALUES (?, ?, ?, ?, ?)`);
    stmtAcc.run('ACC-1010-CASH', '1010', 'Cash & COD Escrow', 'ASSET', 'EGP');
    stmtAcc.run('ACC-1020-BANK', '1020', 'Bank Operational Account', 'ASSET', 'EGP');
    stmtAcc.run('ACC-2010-PAYABLE-MERCHANT', '2010', 'Merchant Payable Escrow', 'LIABILITY', 'EGP');
    stmtAcc.run('ACC-2020-PAYABLE-AFFILIATE', '2020', 'Affiliate Payable Escrow', 'LIABILITY', 'EGP');
    stmtAcc.run('ACC-4010-REV-COMMISSION', '4010', 'Platform Commission Revenue', 'REVENUE', 'EGP');
    stmtAcc.run('ACC-5010-EXP-DELIVERY', '5010', 'Driver Fleet Delivery Expense', 'EXPENSE', 'EGP');
    stmtAcc.finalize();

    // 3. Sample User & Driver Setup
    const stmtUser = db.prepare(`INSERT INTO users (id, role, name, phone, email) VALUES (?, ?, ?, ?, ?)`);
    stmtUser.run('USER-M-01', 'MERCHANT', 'الحاج محمود - العتبة', '+201001112233', 'mahmoud@ataba-trade.eg');
    stmtUser.run('USER-D-01', 'DRIVER', 'الكابتن سيد - اسطول العتبة', '+201114445566', 'sayed@zumra-fleet.eg');
    stmtUser.run('USER-A-01', 'AFFILIATE', 'احمد طارق - مسوق', '+201227778899', 'ahmed@affiliate.eg');
    stmtUser.finalize();

    const stmtDriver = db.prepare(`INSERT INTO drivers (id, user_id, zone_id, vehicle_type, phone, status) VALUES (?, ?, ?, ?, ?, ?)`);
    stmtDriver.run('DRV-01', 'USER-D-01', 'ZONE-ATABA-01', 'TRICYCLE', '+201114445566', 'AVAILABLE');
    stmtDriver.finalize();

    console.log('🎉 [Phase 1 Database Init Complete] Ready for Clean Architecture Application Layer!');
    db.close();
  });
}
