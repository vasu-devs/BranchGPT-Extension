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
    // In a real app, this copies messages. 
    // For this extension MVP, we'll verify the logic in the UI layer or background.
    console.log(`Merging ${sourceId} into ${targetId}`);
    return true;
}
