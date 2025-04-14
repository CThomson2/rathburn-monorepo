import { Prisma } from "@prisma/client/index";
import { PrismaTransactions } from "../base";

// Base type directly from Prisma schema
export type TransactionBase = PrismaTransactions;

// General transaction interface with better type safety
export interface Transaction extends TransactionBase {
  tx_type: "string";
  direction: "IN" | "OUT";
}

// Specialized transaction types
export interface TransactionIntake extends Transaction {
  direction: "IN";
  drum_id: number;
  delivery_id: number;
}

export interface TransactionProcessed extends Transaction {
  direction: "OUT";
  drum_id: number;
  // process_id will reference the distillation records in the production schema
}

// Response type for transaction queries
export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

// Formatted type for client-side display
export interface FormattedTransaction
  extends Omit<Transaction, "tx_date" | "created_at" | "updated_at"> {
  tx_date: string;
  created_at: string;
  updated_at: string;
}

// Create transaction payload
export interface CreateTransactionPayload {
  tx_type: TransactionVariant.Type;
  tx_date: string;
  material: string;
  drum_id?: number;
  repro_id?: number;
  process_id?: number;
  delivery_id?: number;
  tx_notes?: string;
}
