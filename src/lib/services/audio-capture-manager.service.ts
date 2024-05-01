import type { StoreKeys } from "./storage.service";

export class AudioCaptureManagerService {

    constructor() {
        this.init();
    }

    init() {

    }

    initializeMessageListeners(request: { type: StoreKeys, data: any}, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
        // Initialize and handle audio capture related messages here
    }
}