import { db, Message } from './db';
import { generateId } from './utils';

export async function addMessage(params: {
    branchId: string;
    role: 'system' | 'user' | 'assistant' | 'data';
    content: string;
    parentId?: string;
}): Promise<Message> {
    const message: Message = {
        id: generateId(),
        branchId: params.branchId,
        role: params.role,
        content: params.content,
        parentId: params.parentId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await db.messages.add(message);
    return message;
}

export async function getBranchMessages(branchId: string) {
    return db.messages.where('branchId').equals(branchId).sortBy('createdAt');
}
