import { AudioCaptureManagerService } from "~lib/services/audio-capture-manager.service";
import type { StoreKeys } from "~lib/services/storage.service";

console.log('background here');
const audioCaptureManagerService = new AudioCaptureManagerService();

chrome.runtime.onMessage.addListener((request: { type: StoreKeys, data: any}, sender, sendResponse) => {
    audioCaptureManagerService.initializeMessageListeners(request, sender, sendResponse);
});