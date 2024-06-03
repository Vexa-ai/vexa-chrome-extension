import type { MessageType } from './message-listener.service';

export class MessageSenderService {

    /**
     * Sends message from background to a target tab
     * @param tab Target tab
     * @param payload Data to send to tab
     * @returns Returns the result of the sendResponse in the receiving script
     */
    async sendTabMessage(tab: chrome.tabs.Tab, payload: { type: MessageType, data?: any }) {
        try {
            chrome.tabs.sendMessage(tab.id, payload);
        } catch (error) {
            console.error(error);
        }

    }

    // Sends message to popup or background page
    async sendOffscreenToTabMessage(tab: chrome.tabs.Tab, payload: { type: MessageType, data?: any }) {
        try {
            chrome.runtime.sendMessage({ target: 'background', ...payload, tab });
        } catch (error) {
            console.error(error);
        }

    }

    // Sends message to popup or background page
    async sendBackgroundMessage(payload: { type: MessageType, data?: any }) {
        try {
            chrome.runtime.sendMessage({ target: 'background', ...payload });
        } catch (error) {
            console.error(error);
        }

    }

    // Sends message to offscreen page
    async sendOffscreenMessage(payload: { type: MessageType, data?: any }) {
        try {
            chrome.runtime.sendMessage({ target: 'offscreen', ...payload });
        
        } catch (error) {
            console.error(error);
        }

    }

    // Sends message to popup from background page
    sendPopupMessage(payload: { type: MessageType, data?: any }) {
        chrome.runtime.sendMessage({ target: 'popup', ...payload });
    }

    /**
     * Sends message from background to the Sidebar
     * @param payload Data to send to tab
     * @returns Returns the result of the sendResponse in the receiving script
     */
    async sendSidebarMessage(payload: { type: MessageType, data?: any }) {
        try {
            chrome.runtime.sendMessage({ target: 'sidebar', ...payload });
        } catch (error) {
            console.error(error);
        }

    }

} 