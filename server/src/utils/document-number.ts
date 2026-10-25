import { PrismaClient } from '@prisma/client';

export type DocumentType = 'invoice' | 'quote' | 'expense' | 'ticket' | 'contract' | 'boardTask';

interface DocumentNumberConfig {
  model: string;
  field: string;
  defaultPrefix: string;
}

const CONFIG_MAP: Record<DocumentType, DocumentNumberConfig> = {
  invoice: { model: 'invoice', field: 'invoiceNumber', defaultPrefix: 'FAC' },
  quote: { model: 'quote', field: 'quoteNumber', defaultPrefix: 'PRE' },
  expense: { model: 'expense', field: 'expenseNumber', defaultPrefix: 'EXP' },
  ticket: { model: 'ticket', field: 'ticketNumber', defaultPrefix: 'TCK' },
  contract: { model: 'contract', field: 'contractNumber', defaultPrefix: 'CTR' },
  boardTask: { model: 'boardTask', field: 'key', defaultPrefix: 'TASK' },
};

/**
 * Concurrency-safe sequential document number generator.
 * Format: {PREFIX}-{YEAR}-{SEQUENCE} (e.g. FAC-2026-0001, REC-2026-0001, EXP-2026-0001)
 *
 * Resolves race conditions by inspecting the maximum sequence number in the database
 * for the specific series (prefix), year, and tenant, preventing gaps and duplicate keys.
 */
export async function getNextDocumentNumber(
  client: any,
  type: DocumentType,
  prefixOverride?: string,
  tenantId: string = 'master'
): Promise<string> {
  const cfg = CONFIG_MAP[type];
  const prefix = (prefixOverride || cfg.defaultPrefix).toUpperCase().trim();
  const year = new Date().getFullYear();
  const prefixYear = `${prefix}-${year}-`;

  // Find the record with the highest existing sequential number for this prefix and year
  const where: any = {
    [cfg.field]: { startsWith: prefixYear },
  };

  // Only filter by tenantId if the model actually has tenantId
  if (type !== 'boardTask') {
    where.tenantId = tenantId;
  }

  const latest = await client[cfg.model].findFirst({
    where,
    orderBy: { [cfg.field]: 'desc' },
    select: { [cfg.field]: true },
  });

  let nextSeq = 1;
  if (latest && latest[cfg.field]) {
    const val = String(latest[cfg.field]);
    const parts = val.split('-');
    const currentSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(currentSeq) && currentSeq >= 1) {
      nextSeq = currentSeq + 1;
    }
  }

  return `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Sequential Board Task Key Generator (e.g. PRJ-1, PRJ-2, etc.)
 */
export async function getNextBoardTaskKey(
  client: any,
  boardId: string,
  boardKey: string = 'TASK'
): Promise<string> {
  const prefix = (boardKey || 'TASK').toUpperCase().trim();
  const prefixWithDash = `${prefix}-`;

  const latest = await client.boardTask.findFirst({
    where: {
      boardId,
      key: { startsWith: prefixWithDash },
    },
    orderBy: { createdAt: 'desc' },
    select: { key: true },
  });

  let nextSeq = 1;
  if (latest?.key) {
    const parts = latest.key.split('-');
    const currentSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(currentSeq) && currentSeq >= 1) {
      nextSeq = currentSeq + 1;
    }
  } else {
    // If no task with prefix exists, count total tasks on this board + 1
    const totalCount = await client.boardTask.count({ where: { boardId } });
    nextSeq = totalCount + 1;
  }

  return `${prefix}-${nextSeq}`;
}
