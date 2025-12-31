import { db, Branch } from './db';
import { generateId } from './utils';

export async function createBranch(params: {
    parentBranchId?: string;
    rootMessageId?: string;
    label?: string;
}): Promise<Branch> {
    const branch: Branch = {
        id: generateId(),
        label: params.label || 'New Branch',
        parentBranchId: params.parentBranchId || null,
        rootMessageId: params.rootMessageId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
    };

    await db.branches.add(branch);
    return branch;
}

export async function getBranch(id: string) {
    return db.branches.get(id);
}

export async function getRootBranches() {
    return db.branches
        .filter(branch => branch.parentBranchId === null && !branch.isDeleted)
        .toArray();
}

export async function getAllBranches() {
    return db.branches
        .filter(branch => !branch.isDeleted)
        .toArray();
}

export async function deleteBranch(id: string) {
    // Soft delete
    await db.branches.update(id, { isDeleted: true });

    // Recursive delete (Pruning)
    // Find all children
    const children = await db.branches.where('parentBranchId').equals(id).toArray();
    for (const child of children) {
        await deleteBranch(child.id);
    }
}

export async function mergeBranch(sourceId: string, targetId: string) {
    // 1. Get messages from source branch
    const sourceMessages = await db.messages.where('branchId').equals(sourceId).sortBy('createdAt');
    if (sourceMessages.length === 0) return false;

    // 2. Append them to target branch
    // We need to link the first message of source to the last message of target? 
    // Or just dump them in. For MVP, we'll just add them as new messages in the target branch.
    // Ideally, we'd add a "System" message saying "Merged from Branch X"

    await db.messages.add({
        id: generateId(),
        branchId: targetId,
        role: 'system',
        content: `🔄 Merged content from branch: ${sourceId}`,
        parentId: null, // simplification
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    for (const msg of sourceMessages) {
        await db.messages.add({
            id: generateId(), // New ID to avoid collision
            branchId: targetId,
            role: msg.role,
            content: msg.content,
            parentId: null, // simplification
            createdAt: new Date().toISOString(), // effectively 'now'
            updatedAt: new Date().toISOString()
        });
    }

    return true;
}
