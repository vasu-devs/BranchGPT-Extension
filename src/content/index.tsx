import { ChatGPTDriver } from '../lib/drivers/chatgpt';

const drivers = [ChatGPTDriver];

function init() {
    const driver = drivers.find(d => d.matches(window.location.href));
    if (!driver) return;

    console.log(`BranchGPT: Active driver ${driver.name}`);

    // 1. Observer to inject "Fork" buttons
    const observer = new MutationObserver(() => {
        // This is a naive implementation; in reality, we'd need to be specific to avoid performance issues
        // const messages = driver.getMessages(); 
        // Better: Observe the container of messages

        // Inject Fork Buttons
        document.querySelectorAll('.text-message-content').forEach((el, idx) => {
            if (el.parentElement?.querySelector('.branch-gpt-fork-btn')) return;

            // Container for the button to ensure it sits below
            const actionContainer = document.createElement('div');
            actionContainer.className = 'branch-gpt-fork-btn';
            actionContainer.style.cssText = `
                margin-top: 8px;
                display: flex;
                align-items: center;
            `;

            const btn = document.createElement('button');
            btn.title = "Fork this conversation";
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3V15C6 16.6569 7.34315 18 9 18H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18 15L21 18L18 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="6" cy="3" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <span style="margin-left: 6px; font-size: 13px; font-weight: 500;">Fork Branch</span>
            `;
            
            // Modern, visible styling
            btn.style.cssText = `
                display: flex;
                align-items: center;
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 9999px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
                z-index: 50;
            `;

            // Hover effects
            btn.onmouseenter = () => {
                btn.style.transform = 'translateY(-1px)';
                btn.style.boxShadow = '0 4px 6px rgba(139, 92, 246, 0.4)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.3)';
            };

            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent intervening with other click handlers
                chrome.runtime.sendMessage({
                    type: 'FORK_BRANCH',
                    payload: {
                        content: el.textContent,
                        position: idx 
                    }
                });
            };

            actionContainer.appendChild(btn);
            
            // Append BELOW the text content
            el.parentElement?.appendChild(actionContainer);
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

init();
