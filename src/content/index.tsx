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


    // --- 2. Inject Buttons Logic (Existing) ---
    function injectButtons() {
        // Robust selector strategy for ChatGPT
        const messageBlocks = document.querySelectorAll('[data-message-author-role]');

        messageBlocks.forEach((el, idx) => {
            // Find the text content container
            const contentEl = el.querySelector('.markdown') || el.querySelector('.text-message-content');
            if (!contentEl) return;

            // Avoid double injection
            if (el.querySelector('.branch-gpt-fork-btn')) return;

            // Container
            const actionContainer = document.createElement('div');
            actionContainer.className = 'branch-gpt-fork-btn';
            actionContainer.style.cssText = `
            margin-top: 8px;
            display: flex;
            align-items: center;
            padding-left: 0px;
        `;

            const btn = document.createElement('button');
            btn.title = "Fork this conversation";
            btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 3V15C6 16.6569 7.34315 18 9 18H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 15L21 18L18 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="6" cy="3" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span style="margin-left: 6px; font-size: 12px; font-weight: 600; letter-spacing: 0.02em;">Fork</span>
        `;

            // Premium styling: blending with dark mode but distinct
            btn.style.cssText = `
            display: flex;
            align-items: center;
            background: transparent; 
            color: #a78bfa;
            border: 1px solid rgba(139, 92, 246, 0.4);
            padding: 4px 10px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
        `;

            // Hover
            btn.onmouseenter = () => {
                btn.style.background = 'rgba(139, 92, 246, 0.15)';
                btn.style.boxShadow = '0 0 8px rgba(139, 92, 246, 0.2)';
                btn.style.transform = 'translateY(-1px)';
            };
            btn.onmouseleave = () => {
                btn.style.background = 'transparent';
                btn.style.boxShadow = 'none';
                btn.style.transform = 'translateY(0)';
            };

            btn.onclick = (e) => {
                e.stopPropagation();

                // Scrape all messages up to this point to capture context
                const history: { role: string, content: string }[] = [];
                const allBlocks = document.querySelectorAll('[data-message-author-role]');

                for (let i = 0; i <= idx; i++) {
                    const block = allBlocks[i];
                    if (!block) continue;

                    const role = block.getAttribute('data-message-author-role') || 'unknown';
                    const textEl = block.querySelector('.markdown') || block.querySelector('.text-message-content');
                    const content = textEl?.textContent || '';

                    if (content) {
                        history.push({ role, content });
                    }
                }

                chrome.runtime.sendMessage({
                    type: 'FORK_BRANCH',
                    payload: {
                        content: contentEl.textContent?.slice(0, 100),
                        fullHistory: history,
                        position: idx
                    }
                });

                // Visual feedback
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `<span style="font-size: 12px;">✅ Forked</span>`;
                setTimeout(() => btn.innerHTML = originalHTML, 2000);
            };

            actionContainer.appendChild(btn);

            // Append contextually based on where the text ends
            if (contentEl.parentElement) {
                contentEl.parentElement.appendChild(actionContainer);
            } else {
                el.appendChild(actionContainer);
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
