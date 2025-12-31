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
    return db.branches.filter(branch => branch.parentBranchId === null).toArray();
}
