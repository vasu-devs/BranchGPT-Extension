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
                    <circle cx="6" cy="18" r="3"></circle>
                    <path d="M18 9a9 9 0 0 1-9 9"></path>
                </svg>
                <span style="margin-left: 6px; font-size: 12px; font-weight: 500;">Fork</span>
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

                // 1. Capture History
                // We must traverse ALL previous articles/blocks to build history
                const history: { role: string, content: string }[] = [];
                const allNodes = articles.length > 0 ? document.querySelectorAll('article') : document.querySelectorAll('[data-message-author-role]');

                for (let i = 0; i < allNodes.length; i++) {
                    // Stop once we pass the current index (inclusive)
                    // Note: 'idx' from forEach might not match 'i' if DOM changed. 
                    // Safe approach: check if node is same or precedes current 'el'
                    const node = allNodes[i];

                    // Get Content
                    const txtEl = node.querySelector('.markdown') || node.querySelector('.whitespace-pre-wrap') || node.querySelector('.text-message-content');
                    const txt = txtEl?.textContent || '';

                    // Get Role
                    const rEl = node.querySelector('[data-message-author-role]');
                    const r = rEl?.getAttribute('data-message-author-role') || (node.querySelector('.whitespace-pre-wrap') ? 'user' : 'assistant');

                    if (txt) {
                        history.push({ role: r, content: txt });
                    }

                    if (node === el) break; // Reached current message
                }

                console.log('[BranchGPT] Forking with history length:', history.length);

                chrome.runtime.sendMessage({
                    type: 'FORK_BRANCH',
                    payload: {
                        content: contentEl.textContent?.slice(0, 100),
                        fullHistory: history,
                        position: history.length
                    }
                });

                // Visual feedback
                const icon = btn.querySelector('svg');
                if (icon) icon.style.color = '#22c55e'; // green
                const span = btn.querySelector('span');
                if (span) span.innerText = 'Forked!';

                setTimeout(() => {
                    if (icon) icon.style.color = 'currentColor';
                    if (span) span.innerText = 'Fork';
                }, 2000);
            };

            actionContainer.appendChild(btn);

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

    // 1. Observer
    const observer = new MutationObserver(() => injectButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    // 2. Interval fallback (every 1s)
    setInterval(injectButtons, 1000);
}

init();
