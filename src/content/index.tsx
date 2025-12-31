import { createRoot } from 'react-dom/client';
import { ChatGPTDriver } from '../lib/drivers/chatgpt';
import Sidebar from '../components/Sidebar';
// @ts-ignore
import css from '../index.css?inline';

const drivers = [ChatGPTDriver];

function init() {
    const driver = drivers.find(d => d.matches(window.location.href));
    // Even if no driver matches for *scraping*, we might still want the sidebar? 
    // But for now, let's stick to the logic.
    if (!driver) return;

    console.log(`BranchGPT: Active driver ${driver.name}`);

    // --- 1. Inject Sidebar ---
    const sidebarHost = document.createElement('div');
    sidebarHost.id = 'branch-gpt-sidebar-host';
    document.body.appendChild(sidebarHost);

    const shadow = sidebarHost.attachShadow({ mode: 'open' });

    // Inject Styles
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    shadow.appendChild(styleEl);

    // Mount React
    const rootEl = document.createElement('div');
    shadow.appendChild(rootEl);

    // Create Root
    createRoot(rootEl).render(<Sidebar />);


    // --- 2. Inject Buttons Logic ---
    function injectButtons() {
        // Strategy 1: Standard Article blocks (reliable for now)
        const articles = document.querySelectorAll('article');

        // Strategy 2: Data attributes (fallback)
        const dataBlocks = document.querySelectorAll('[data-message-author-role]');

        const elements = articles.length > 0 ? articles : dataBlocks;

        elements.forEach((el, _idx) => {
            // Identify role (default to assistant if unclear)
            // const roleEl = el.querySelector('[data-message-author-role]');
            // const role = roleEl?.getAttribute('data-message-author-role') || 'assistant'; 

            // Find the text content container
            // ChatGPT structure: .markdown for AI, .whitespace-pre-wrap for User
            const contentEl = el.querySelector('.markdown') || el.querySelector('.whitespace-pre-wrap') || el.querySelector('.text-message-content');

            if (!contentEl) return;

            // Avoid double injection
            if (el.querySelector('.branch-gpt-fork-btn')) return;

            // Find where to inject (Action Bar)
            // It's usually a div with class containing 'text-gray-400' or similar at bottom
            // Or we just append to the content parent
            const buttonParent = contentEl.parentElement;

            if (!buttonParent) return;

            // Container
            const actionContainer = document.createElement('div');
            actionContainer.className = 'branch-gpt-fork-btn';
            actionContainer.style.cssText = `
                margin-top: 8px;
                display: flex;
                align-items: center;
                padding-left: 0px;
                opacity: 0.6;
                transition: opacity 0.2s;
            `;
            actionContainer.onmouseenter = () => { actionContainer.style.opacity = '1'; };
            actionContainer.onmouseleave = () => { actionContainer.style.opacity = '0.6'; };

            const btn = document.createElement('button');
            btn.title = "Fork from this message";
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="6" y1="3" x2="6" y2="15"></line>
                    <circle cx="18" cy="6" r="3"></circle>
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Fork (Edit)</span>
            `;

            // Modern subtle styling
            btn.style.cssText = `
                display: flex;
                align-items: center;
                background: transparent; 
                color: currentColor;
                border: 1px solid transparent;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
                font-family: inherit;
            `;

            btn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();

                // Find native edit button
                // Strategy 1: exact aria-label
                let nativeEditBtn = el.querySelector('button[aria-label="Edit message"]') as HTMLButtonElement | null;

                // Strategy 2: Look for button with Pencil Icon SVG path
                if (!nativeEditBtn) {
                    const buttons = Array.from(el.querySelectorAll('button'));
                    nativeEditBtn = buttons.find(b => b.innerHTML.includes('d="M18.5 2.5a2.121 2.121')) as HTMLButtonElement | null;
                    // Alternate pencil path check (ChatGPT varies)
                    if (!nativeEditBtn) {
                        nativeEditBtn = buttons.find(b => b.innerHTML.includes('path') && b.innerHTML.includes('2.121')) as HTMLButtonElement | null;
                    }
                }

                if (nativeEditBtn) {
                    console.log('[BranchGPT] Triggering native edit...');
                    nativeEditBtn.click();

                    // Visual feedback on our button
                    const span = btn.querySelector('span');
                    if (span) span.innerText = 'Editing...';
                    setTimeout(() => { if (span) span.innerText = 'Fork (Edit)'; }, 2000);
                } else {
                    console.warn('[BranchGPT] Edit button hidden. Force-revealing...');

                    // Force reveal action bar
                    // The action bar usually has opacity 0 or display none until hover.
                    // We try to find the container of buttons and force style it.
                    const actionBars = Array.from(el.querySelectorAll('div')).filter(d => d.querySelector('button'));
                    // The one with the most buttons is likely the action bar
                    const possibleActionBar = actionBars.sort((a, b) => b.querySelectorAll('button').length - a.querySelectorAll('button').length)[0];

                    if (possibleActionBar) {
                        possibleActionBar.style.opacity = '1';
                        possibleActionBar.style.visibility = 'visible';
                        possibleActionBar.style.display = 'flex';
                    }

                    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

                    setTimeout(() => {
                        // Retry Strategy 1 & 2
                        let retryBtn = el.querySelector('button[aria-label="Edit message"]') as HTMLButtonElement | null;
                        if (!retryBtn) {
                            const buttons = Array.from(el.querySelectorAll('button'));
                            retryBtn = buttons.find(b => b.innerHTML.includes('d="M18.5 2.5a2.121 2.121')) as HTMLButtonElement | null;
                            if (!retryBtn) retryBtn = buttons.find(b => b.innerHTML.includes('path') && b.innerHTML.includes('2.121')) as HTMLButtonElement | null;
                        }

                        if (retryBtn) {
                            retryBtn.click();
                        } else {
                            alert('Could not find ChatGPT "Edit" button even after forcing hover.\n\nPlease manually click the Pencil icon on the message.');
                        }
                    }, 300); // Increased timeout
                }
            };

            // --- Merge Button ---
            const mergeBtn = document.createElement('button');
            mergeBtn.innerHTML = `
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 5v14M5 12h14"/>  <!-- Simple Plus/Cross for now? No, let's use a Merge icon -->
                    <path d="M6 3v18M18 9a9 9 0 0 1-9 9"/>
                 </svg>
                 <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Merge</span>
            `;
            mergeBtn.style.cssText = btn.style.cssText; // Reuse fork button styles
            mergeBtn.style.marginLeft = '8px';
            mergeBtn.title = "Copy this context to merge elsewhere";

            mergeBtn.onmouseenter = btn.onmouseenter;
            mergeBtn.onmouseleave = btn.onmouseleave;

            mergeBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();

                // 1. Scrape Context
                const context = [];
                const allNodes = document.querySelectorAll('[data-message-author-role]');
                for (let i = 0; i < allNodes.length; i++) {
                    const node = allNodes[i];
                    const txtEl = node.querySelector('.markdown') || node.querySelector('.text-message-content');
                    const rEl = node.querySelector('[data-message-author-role]');
                    const role = rEl?.getAttribute('data-message-author-role') || 'unknown';
                    const text = txtEl?.textContent || '';
                    if (text) context.push(`${role.toUpperCase()}: ${text.slice(0, 300)}...`); // Truncate for sanity
                    if (node === el) break;
                }

                const summary = context.join('\n\n');

                // 2. Save for Paste
                chrome.storage.local.set({ pendingMerge: summary }, () => {
                    const span = mergeBtn.querySelector('span');
                    if (span) span.innerText = 'Copied!';
                    setTimeout(() => { if (span) span.innerText = 'Merge'; }, 2000);
                });
            };

            actionContainer.appendChild(btn);
            actionContainer.appendChild(mergeBtn);

            // Try to append to the "interaction" bar if it exists (the row with copy/thumbs up)
            // It usually has explicit classes. If not found, append to content parent.
            const interactionBar = el.querySelector('.mb-2.flex.gap-4') || el.querySelector('[class*="gizmo-shadow-stroke"]')?.parentElement;

            if (interactionBar) {
                // Prepend to interaction bar for better visibility
                interactionBar.appendChild(actionContainer);
                actionContainer.style.marginTop = '0';
                actionContainer.style.marginLeft = '8px';
            } else {
                buttonParent.appendChild(actionContainer);
            }
        });
    }

    // --- 3. Inject Paste Button (Input Area) ---
    function injectPasteButton() {
        const inputArea = document.querySelector('textarea') || document.querySelector('#prompt-textarea');
        if (!inputArea) return;

        const parent = inputArea.parentElement;
        if (!parent || parent.querySelector('.branch-gpt-paste-btn')) return;

        // Check if we have a pending merge
        chrome.storage.local.get(['pendingMerge'], (result) => {
            if (!result.pendingMerge) return;

            const pasteBtn = document.createElement('button');
            pasteBtn.className = 'branch-gpt-paste-btn';
            pasteBtn.innerText = '↳ Paste Merge Context';
            pasteBtn.style.cssText = `
                position: absolute;
                bottom: 100%;
                left: 0;
                margin-bottom: 8px;
                background: #10a37f;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                z-index: 999;
                border: none;
            `;

            pasteBtn.onclick = () => {
                const prompt = `[MERGE CONTEXT]\nI am merging a side-branch into this conversation. Here is the summary of that branch:\n\n${result.pendingMerge}\n\n[INSTRUCTION]\nPlease integrate this context and continue.`;

                // Insert into textarea
                const nativeTextArea = inputArea as HTMLTextAreaElement;
                nativeTextArea.value += prompt;
                nativeTextArea.focus();
                nativeTextArea.dispatchEvent(new Event('input', { bubbles: true }));

                // Clear storage
                chrome.storage.local.remove('pendingMerge');
                pasteBtn.remove();
            };

            // Make parent relative relative if needed
            if (window.getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
            parent.appendChild(pasteBtn);
        });
    }

    // 1. Observer
    const observer = new MutationObserver(() => {
        injectButtons();
        injectPasteButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 2. Interval fallback (every 1s)
    setInterval(() => {
        injectButtons();
        injectPasteButton();
    }, 1000);
}

init();
