import type { MessageType } from './message-listener.service';

export class MessageSenderService {

    // Sends message from background to tab change
    async sendTabMessage(tab: chrome.tabs.Tab, payload: { type: MessageType, data?: any}) {
        const response = await chrome.tabs.sendMessage(tab.id, payload);
        return response;
    }

    // Sends message to popup or background page
    async sendBackgroundMessage(payload: { type: MessageType, data?: any}) {
        const response = await chrome.runtime.sendMessage({ target: 'background', ...payload });
        return response;
    }

    // Sends message to popup from background page
    sendPopupMessage(payload: { type: MessageType, data?: any}) {
        chrome.runtime.sendMessage({ target: 'popup', ...payload });
    }

    async sendSidebarMessage(payload: { type: MessageType, data?: any}) {
        const response = await chrome.runtime.sendMessage({ target: 'sidebar', ...payload });
        return response;
    }

} 