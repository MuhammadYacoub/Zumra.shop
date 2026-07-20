export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type EntryType = 'DEBIT' | 'CREDIT';
export type ReferenceType = 'ORDER' | 'PAYOUT' | 'REFUND' | 'COD_DEPOSIT' | 'SYSTEM_ADJUSTMENT';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface LedgerLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode?: string;
  entryType: EntryType;
  amount: number;
  currency: string;
  createdAt?: string;
}

export interface JournalEntry {
  id: string;
  correlationId: string;
  referenceType: ReferenceType;
  referenceId: string;
  description: string;
  status: 'DRAFT' | 'POSTED' | 'VOIDED';
  lines: LedgerLine[];
  createdAt?: string;
}

export interface ILedgerRepository {
  findAccountByCode(code: string): Promise<Account | null>;
  findAccountById(id: string): Promise<Account | null>;
  saveJournalEntry(entry: JournalEntry): Promise<void>;
  getJournalEntryById(id: string): Promise<JournalEntry | null>;
  getAccountBalance(accountCode: string): Promise<{ debits: number; credits: number; balance: number }>;
}
