import { AudioCaptureManagerService } from "~lib/services/audio-capture-manager.service";
import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import OFFSCREEN_DOCUMENT_PATH from 'url:~src/offscreen.html'

async function createOffscreenDocument() {
    const existingContexts = await chrome.runtime.getContexts({});
    const offscreenDocument = existingContexts.find(
        (c) => c.contextType === 'OFFSCREEN_DOCUMENT'
    );

    if (!offscreenDocument) {
        await chrome.offscreen.createDocument({
            url: OFFSCREEN_DOCUMENT_PATH,
            reasons: [chrome.offscreen.Reason.USER_MEDIA],
            justification: 'Recording from chrome.tabCapture API'
        });
    }

    return offscreenDocument;
}


MessageListenerService.initializeListenerService();
const messageSender = new MessageSenderService();
const extensionInstallHandler = () => {
    console.log('Vexa installed');
};

MessageListenerService.registerMessageListener(MessageType.INSTALL, extensionInstallHandler);
MessageListenerService.registerMessageListener(MessageType.REQUEST_MEDIA_STREAM_ID, async (evtData, sender, sendResponse) => {
    chrome.tabs.query({ lastFocusedWindow: true},  async tabs => {
        const tab = tabs[0];
        if(!tab) {
            return;
        }
        chrome.tabCapture.getMediaStreamId({
            targetTabId: tab.id
        }, (streamId) => {
            console.log({streamId})
            sendResponse({streamId});
        });
    })
  });
createOffscreenDocument();
// });