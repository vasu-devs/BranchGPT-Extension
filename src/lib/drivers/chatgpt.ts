import { ChatDriver, ScrapedMessage } from '../driver';

export const ChatGPTDriver: ChatDriver = {
    name: 'ChatGPT',

    matches(url: string) {
        return url.includes('chatgpt.com');
    },

    getMessages(): ScrapedMessage[] {
        // Selects generic ChatGPT message blocks (selectors might change)
        const elements = document.querySelectorAll('[data-message-author-role]');
        const messages: ScrapedMessage[] = [];

        elements.forEach((el) => {
            const isUser = el.closest('[data-message-author-role="user"]') !== null;
            messages.push({
                role: isUser ? 'user' : 'assistant',
                content: el.textContent || '',
            });
        });

        return messages;
    },

    getInputElement() {
        return document.querySelector('#prompt-textarea') as HTMLTextAreaElement;
    },

    getSubmitButton() {
        return document.querySelector('[data-testid="send-button"]') as HTMLButtonElement;
    },

    injectSidebar(sidebarElement: HTMLElement) {
        // Not needed if using Side Panel API, but useful for inline injection
        document.body.appendChild(sidebarElement);
    }
};
