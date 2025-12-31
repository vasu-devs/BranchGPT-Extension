export interface ChatDriver {
    name: string;
    matches(url: string): boolean;
    getMessages(): ScrapedMessage[];
    getInputElement(): HTMLTextAreaElement | null;
    getSubmitButton(): HTMLButtonElement | null;
    injectSidebar(sidebarElement: HTMLElement): void;
}

export interface ScrapedMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string; // If the site provides IDs
}
