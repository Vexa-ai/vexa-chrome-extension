import { AudioCaptureManagerService } from "~lib/services/audio-capture-manager.service";
import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import OFFSCREEN_DOCUMENT_PATH from 'url:~src/offscreen.html'

let currentTab = null;
let newTab = null;

const stopRecording = async (tab, isPause = false) => {
    chrome.action.setIcon({ path: "assets/icons/not-recording.png" });
    currentTab = null;
    newTab = null;

    chrome.runtime.sendMessage({
        type: 'stop-recording',
        target: 'offscreen'
    }, {}, result => {
        chrome.storage.session.set({
            '_dl_recording': result ? 0 : 1,
            '_dl_recording_started': 0,
            '_dl_recording_ms_before_pause': 0,
            '_dl_recording_paused': 0,
        });
    });

    chrome.tabs.sendMessage(tab.id, { status: isPause ? 'pause' : 'stop' });
};

async function getConnectionId() {
    const uuid = String(self.crypto.randomUUID());
    await chrome.storage.local.set({_dl_connection_id: uuid, _dl_connection_session: 0});

    return uuid;
}

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

MessageListenerService.registerMessageListener(MessageType.OPEN_SETTINGS, () => chrome.runtime.openOptionsPage());
MessageListenerService.registerMessageListener(MessageType.INSTALL, extensionInstallHandler);

MessageListenerService.registerMessageListener(MessageType.REQUEST_STOP_RECORDING, (message) => {
    messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
});

MessageListenerService.registerMessageListener(MessageType.REQUEST_START_RECORDING, (message) => {
    chrome.tabs.query({ lastFocusedWindow: true, active: true, currentWindow: true }, async tabs => {
        const tab = tabs[0];
        if (!tab) {
            return;
        }
        chrome.tabCapture.getMediaStreamId({
            targetTabId: tab.id
        }, async (streamId) => {
            console.log({ streamId });
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
              }
            messageSender.sendBackgroundMessage({ type: MessageType.START_RECORDING, data: 
                {
                    micLabel: message.data.micLabel,
                    streamId,
                    connectionId: await getConnectionId(),
                    domain: 'https://chrome.away.guru',
                    token: 'expected_secure_token',
                    url: tab.url,
                    meetingId: 'meeting_1', //TODO: Replace with generated or persisted value
                }
            }).then(result => {
                console.log('persisting record starting details')
                chrome.storage.session.set({
                    '_dl_recording': result ? 1 : 0,
                    '_dl_recording_started': (new Date()).getTime(),
                    '_dl_recording_ms_before_pause': 0,
                    '_dl_recording_paused': 0,
                });
            });
        });
    })
});

createOffscreenDocument();
