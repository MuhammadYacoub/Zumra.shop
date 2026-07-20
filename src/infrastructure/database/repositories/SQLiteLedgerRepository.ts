import { Account, ILedgerRepository, JournalEntry, LedgerLine } from '../../../domain/ledger/ledger';
import { SQLiteConnection } from '../sqlite-connection';

interface AccountRow {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

interface JournalEntryRow {
  id: string;
  correlation_id: string;
  reference_type: 'ORDER' | 'PAYOUT' | 'REFUND' | 'COD_DEPOSIT' | 'SYSTEM_ADJUSTMENT';
  reference_id: string;
  description: string;
  status: 'DRAFT' | 'POSTED' | 'VOIDED';
  created_at: string;
}

interface LedgerLineRow {
  id: string;
  journal_entry_id: string;
  account_id: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  created_at: string;
  account_code?: string;
}

export class SQLiteLedgerRepository implements ILedgerRepository {
  async findAccountByCode(code: string): Promise<Account | null> {
    const rows = await SQLiteConnection.query<AccountRow>(
      'SELECT id, code, name, type, currency, status, created_at FROM accounts WHERE code = ?',
      [code]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async findAccountById(id: string): Promise<Account | null> {
    const rows = await SQLiteConnection.query<AccountRow>(
      'SELECT id, code, name, type, currency, status, created_at FROM accounts WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    await SQLiteConnection.withTransaction(async () => {
      await SQLiteConnection.execute(
        `INSERT INTO journal_entries (id, correlation_id, reference_type, reference_id, description, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          entry.id,
          entry.correlationId,
          entry.referenceType,
          entry.referenceId,
          entry.description,
          entry.status,
        ]
      );

      for (const line of entry.lines) {
        await SQLiteConnection.execute(
          `INSERT INTO ledger_lines (id, journal_entry_id, account_id, entry_type, amount, currency)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            line.id,
            entry.id,
            line.accountId,
            line.entryType,
            line.amount,
            line.currency || 'EGP',
          ]
        );
      }
    });
  }

  async getJournalEntryById(id: string): Promise<JournalEntry | null> {
    const entryRows = await SQLiteConnection.query<JournalEntryRow>(
      `SELECT id, correlation_id, reference_type, reference_id, description, status, created_at
       FROM journal_entries WHERE id = ?`,
      [id]
    );
    if (entryRows.length === 0) return null;
    const entryRow = entryRows[0];

    const lineRows = await SQLiteConnection.query<LedgerLineRow>(
      `SELECT l.id, l.journal_entry_id, l.account_id, l.entry_type, l.amount, l.currency, l.created_at, a.code as account_code
       FROM ledger_lines l
       JOIN accounts a ON l.account_id = a.id
       WHERE l.journal_entry_id = ?`,
      [id]
    );

    const lines: LedgerLine[] = lineRows.map((line) => ({
      id: line.id,
      journalEntryId: line.journal_entry_id,
      accountId: line.account_id,
      accountCode: line.account_code,
      entryType: line.entry_type,
      amount: Number(line.amount),
      currency: line.currency,
      createdAt: line.created_at,
    }));

    return {
      id: entryRow.id,
      correlationId: entryRow.correlation_id,
      referenceType: entryRow.reference_type,
      referenceId: entryRow.reference_id,
      description: entryRow.description,
      status: entryRow.status,
      lines,
      createdAt: entryRow.created_at,
    };
  }

  async getAccountBalance(accountCode: string): Promise<{ debits: number; credits: number; balance: number }> {
    const account = await this.findAccountByCode(accountCode);
    if (!account) {
      throw new Error(`Account code ${accountCode} not found.`);
    }

    const rows = await SQLiteConnection.query<{ entry_type: string; total: number }>(
      `SELECT entry_type, SUM(amount) as total
       FROM ledger_lines
       WHERE account_id = ?
       GROUP BY entry_type`,
      [account.id]
    );

    let debits = 0;
    let credits = 0;

    for (const r of rows) {
      if (r.entry_type === 'DEBIT') debits = Number(r.total);
      if (r.entry_type === 'CREDIT') credits = Number(r.total);
    }

    // Asset and Expense accounts have normal Debit balances; Liabilities, Equity, Revenue have normal Credit balances.
    const isNormalDebit = account.type === 'ASSET' || account.type === 'EXPENSE';
    const balance = isNormalDebit ? debits - credits : credits - debits;

    return { debits, credits, balance };
  }
}
