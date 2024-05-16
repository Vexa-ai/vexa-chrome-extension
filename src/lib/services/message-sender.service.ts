import type { MessageType } from './message-listener.service';

export class MessageSenderService {

    /**
     * Sends message from background to a target tab
     * @param tab Target tab
     * @param payload Data to send to tab
     * @returns Returns the result of the sendResponse in the receiving script
     */
    async sendTabMessage(tab: chrome.tabs.Tab, payload: { type: MessageType, data?: any}) {
        const response = await chrome.tabs.sendMessage(tab.id, payload);
        return response;
    }

    // Sends message to popup or background page
    async sendOffscreenToTabMessage(tab: chrome.tabs.Tab, payload: { type: MessageType, data?: any}) {
        const response = await chrome.runtime.sendMessage({ target: 'background', ...payload, tab });
        return response;
    }

    // Sends message to popup or background page
    async sendBackgroundMessage(payload: { type: MessageType, data?: any}) {
        const response = await chrome.runtime.sendMessage({ target: 'background', ...payload });
        return response;
    }

    // Sends message to offscreen page
    async sendOffscreenMessage(payload: { type: MessageType, data?: any}) {
        const response = await chrome.runtime.sendMessage({ target: 'offscreen', ...payload });
        return response;
    }

    // Sends message to popup from background page
    sendPopupMessage(payload: { type: MessageType, data?: any}) {
        chrome.runtime.sendMessage({ target: 'popup', ...payload });
    }

    /**
     * Sends message from background to the Sidebar
     * @param payload Data to send to tab
     * @returns Returns the result of the sendResponse in the receiving script
     */
    async sendSidebarMessage(payload: { type: MessageType, data?: any}) {
        const response = await chrome.runtime.sendMessage({ target: 'sidebar', ...payload });
        return response;
    }

} 