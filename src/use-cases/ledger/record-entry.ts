import { EntryType, ILedgerRepository, JournalEntry, LedgerLine, ReferenceType } from '../../domain/ledger/ledger';
import { Logger } from '../../infrastructure/logging/logger';

export interface RecordLedgerEntryInputLine {
  accountCode: string;
  entryType: EntryType;
  amount: number;
  currency?: string;
}

export interface RecordLedgerEntryInput {
  correlationId: string;
  referenceType: ReferenceType;
  referenceId: string;
  description: string;
  lines: RecordLedgerEntryInputLine[];
}

export class RecordLedgerEntryUseCase {
  constructor(private ledgerRepo: ILedgerRepository) {}

  async execute(input: RecordLedgerEntryInput): Promise<JournalEntry> {
    const { correlationId, referenceType, referenceId, description, lines } = input;

    Logger.info('Starting financial double-entry posting...', {
      correlationId,
      context: 'RecordLedgerEntryUseCase',
      referenceType,
      referenceId,
      lineCount: lines.length,
    });

    if (!lines || lines.length < 2) {
      const errMessage = 'A double-entry transaction must contain at least 2 lines (1 Debit and 1 Credit).';
      Logger.error(errMessage, { correlationId, context: 'RecordLedgerEntryUseCase' });
      throw new Error(errMessage);
    }

    let totalDebits = 0;
    let totalCredits = 0;
    const validatedLines: LedgerLine[] = [];

    const journalEntryId = `JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    for (const line of lines) {
      if (line.amount <= 0) {
        throw new Error(`Ledger line amount must be greater than zero. Received: ${line.amount}`);
      }

      const account = await this.ledgerRepo.findAccountByCode(line.accountCode);
      if (!account) {
        const errMessage = `Account code '${line.accountCode}' not found in Chart of Accounts.`;
        Logger.error(errMessage, { correlationId, context: 'RecordLedgerEntryUseCase' });
        throw new Error(errMessage);
      }

      if (line.entryType === 'DEBIT') {
        totalDebits += line.amount;
      } else if (line.entryType === 'CREDIT') {
        totalCredits += line.amount;
      } else {
        throw new Error(`Invalid entry type '${line.entryType}'. Must be DEBIT or CREDIT.`);
      }

      validatedLines.push({
        id: `LL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        journalEntryId,
        accountId: account.id,
        accountCode: account.code,
        entryType: line.entryType,
        amount: line.amount,
        currency: line.currency || 'EGP',
      });
    }

    // Zero-Sum Double-Entry Invariant Check (Precision rounding to 4 decimal places)
    const discrepancy = Math.abs(totalDebits - totalCredits);
    if (discrepancy > 0.0001) {
      const errMessage = `Double-Entry Invariant Violation: Unbalanced transaction! Total Debits = ${totalDebits.toFixed(
        4
      )}, Total Credits = ${totalCredits.toFixed(4)}. Discrepancy = ${discrepancy.toFixed(4)}`;

      Logger.error(errMessage, { correlationId, context: 'RecordLedgerEntryUseCase', totalDebits, totalCredits });
      throw new Error(errMessage);
    }

    const journalEntry: JournalEntry = {
      id: journalEntryId,
      correlationId,
      referenceType,
      referenceId,
      description,
      status: 'POSTED',
      lines: validatedLines,
    };

    await this.ledgerRepo.saveJournalEntry(journalEntry);

    Logger.info('Successfully posted zero-sum balanced double-entry transaction.', {
      correlationId,
      context: 'RecordLedgerEntryUseCase',
      journalEntryId,
      balancedAmount: totalDebits,
    });

    return journalEntry;
  }
}
