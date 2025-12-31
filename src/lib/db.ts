import Dexie, { Table } from 'dexie';

export interface Branch {
    id: string;
    label: string | null;
    parentBranchId: string | null;
    rootMessageId: string | null;
    createdAt: string;
    updatedAt: string;
    isDeleted?: boolean;
}

export interface Message {
    id: string;
    branchId: string;
    role: 'system' | 'user' | 'assistant' | 'data';
    content: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export class BranchGPTDatabase extends Dexie {
    branches!: Table<Branch>;
    messages!: Table<Message>;

    constructor() {
        super('BranchGPTDatabase');
        this.version(1).stores({
            branches: 'id, parentBranchId, rootMessageId, createdAt, updatedAt',
            messages: 'id, branchId, parentId, role, createdAt',
        });
    }
}

export const db = new BranchGPTDatabase();
