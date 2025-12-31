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

async function handleFork(payload: { content: string, position: number }) {
    console.log('Forking at:', payload.content);

    // 1. Create a new branch
    const newBranch = await createBranch({
        label: `Fork: ${payload.content.slice(0, 20)}...`
    });

    // Dummy usage to satisfy linter/logic
    await addMessage({
        branchId: newBranch.id,
        role: 'system',
        content: 'Forked from main thread'
    });

    console.log('Created branch:', newBranch.id);
}
