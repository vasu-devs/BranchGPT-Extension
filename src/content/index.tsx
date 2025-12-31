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

            const btn = document.createElement('button');
            btn.className = 'branch-gpt-fork-btn';
            btn.innerText = '🌿 Fork';
            btn.style.cssText = `
        margin-left: 10px; 
        font-size: 12px; 
        background: #8b5cf6; 
        color: white; 
        border: none; 
        padding: 2px 6px; 
        border-radius: 4px; 
        cursor: pointer;
      `;

            btn.onclick = () => {
                chrome.runtime.sendMessage({
                    type: 'FORK_BRANCH',
                    payload: {
                        content: el.textContent,
                        position: idx
                    }
                });
            };

            el.parentElement?.appendChild(btn);
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

init();
