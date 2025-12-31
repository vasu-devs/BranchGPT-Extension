import { Branch, Message } from './db';

// Generic wrapper for sending messages
async function sendRequest<T>(type: string, payload?: any): Promise<T> {
    return chrome.runtime.sendMessage({ type, payload });
}

export const branchProxy = {
    getAllBranches: () => sendRequest<Branch[]>('PROXY_GET_ALL_BRANCHES'),
    getBranchMessages: (branchId: string) => sendRequest<Message[]>('PROXY_GET_MESSAGES', { branchId }),
    createBranch: (params: any) => sendRequest<Branch>('PROXY_CREATE_BRANCH', params),
    deleteBranch: (id: string) => sendRequest<void>('PROXY_DELETE_BRANCH', { id }),
    mergeBranch: (sourceId: string, targetId: string) => sendRequest<boolean>('PROXY_MERGE_BRANCH', { sourceId, targetId })
};
