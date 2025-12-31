// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { db } from '../lib/db';
import { createBranch } from '../lib/branches';
import { addMessage } from '../lib/messages';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((request: { type: string; payload: any }, _sender, _sendResponse) => {
    if (request.type === 'FORK_BRANCH') {
        handleFork(request.payload);
    }
    return true;
});

async function handleFork(payload: { content: string, fullHistory?: { role: string, content: string }[], position: number }) {
    console.log('Forking w/ history size:', payload.fullHistory?.length || 0);

    // 1. Get active branch context
    const storage = await chrome.storage.local.get(['activeBranchId']);
    const parentBranchId = (storage.activeBranchId as string) || undefined;

    // 2. Create a new branch
    const newBranch = await createBranch({
        label: payload.content ? `${payload.content.slice(0, 15)}...` : 'Forked Branch',
        parentBranchId: parentBranchId
    });

    // Update active branch to the new one immediately
    await chrome.storage.local.set({ activeBranchId: newBranch.id });

    // 2. Import History (if provided)
    if (payload.fullHistory && payload.fullHistory.length > 0) {
        let previousMessageId: string | undefined = undefined;

        for (const msg of payload.fullHistory) {
            // Normalize role
            const role = (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') ? msg.role : 'user';

            const addedMsg = await addMessage({
                branchId: newBranch.id,
                role: role,
                content: msg.content,
                parentId: previousMessageId
            });
            previousMessageId = addedMsg.id;
        }
    } else {
        // Fallback: Add just the fork point message if history failed for some reason
        await addMessage({
            branchId: newBranch.id,
            role: 'system',
            content: 'Fork created (no history captured)'
        });
    }

    console.log('Created branch:', newBranch.id);

    // Notify UI (Side Panel logic)
    chrome.runtime.sendMessage({ type: 'REFRESH_BRANCHES' });

    // Notify Content Scripts (Injected Sidebar)
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'REFRESH_BRANCHES' });
    }
}
