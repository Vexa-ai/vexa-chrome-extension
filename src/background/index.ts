import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import OFFSCREEN_DOCUMENT_PATH from 'url:~src/offscreen.html'
import { type AuthorizationData, StorageService, StoreKeys } from "~lib/services/storage.service";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
chrome.runtime.onConnect.addListener(port => {
    if (port.name === 'mySidepanel') {
        port.onDisconnect.addListener(() => {
            chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
            console.log('Side panel closed!');
        });
    }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    const capturingTabId = await StorageService.get(StoreKeys.CAPTURED_TAB_ID);
    if (capturingTabId && capturingTabId === tabId) {
        messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
    }
});

async function getConnectionId() {
    const uuid = String(self.crypto.randomUUID());
    await chrome.storage.local.set({ _dl_connection_id: uuid, _dl_connection_session: 0 });

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
const extensionInstallHandler = async () => {
    console.log('Extension install complete');
};

MessageListenerService.registerMessageListener(MessageType.OPEN_SETTINGS, () => chrome.runtime.openOptionsPage());
MessageListenerService.registerMessageListener(MessageType.INSTALL, extensionInstallHandler);
MessageListenerService.registerMessageListener(MessageType.ON_APP_OPEN, () => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});
MessageListenerService.registerMessageListener(MessageType.AUTH_SAVED, () => {
    chrome.tabs.query({ url: process.env.PLASMO_PUBLIC_INTERMEDIARY_URL }, async (tabs) => {
        const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
            __vexa_token: "",
            __vexa_domain: ""
        });
        if (authData.__vexa_domain && authData.__vexa_token) {
            tabs.forEach(tab => {
                chrome.tabs.remove(tab.id);
            });
        }

    });
});
MessageListenerService.registerMessageListener(MessageType.ON_RECORDING_STARTED, (message) => {
    const { tabId } = message.data;
    StorageService.set(StoreKeys.CAPTURED_TAB_ID, tabId);
});
MessageListenerService.registerMessageListener(MessageType.USER_UNAUTHORIZED, (message) => {
    messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
});
MessageListenerService.registerMessageListener(MessageType.ON_RECORDING_END, (message) => {
    StorageService.set(StoreKeys.CAPTURED_TAB_ID, null);
});
MessageListenerService.registerMessageListener(MessageType.REQUEST_STOP_RECORDING, (message) => {
    messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
});

MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_REQUEST, async (message, sender, sendResponse) => {
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_domain: ""
    });
    const { prompt, meetingId } = message.data;
    fetch(`${process.env.PLASMO_PUBLIC_MAIN_AWAY_BASE_URL}/api/v1/copilot?token=${authData.__vexa_token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: prompt,
            meeting_id: 'meeting1',
            context_id: '1',
            user_id: 'user_1'
        })
    }).then(async res => {
        if (!(res.status < 401)) {
            if (res.status === 401) {
                messageSender.sendBackgroundMessage({ type: MessageType.USER_UNAUTHORIZED });
            }
            return;
        }
        const responseJson = await res.json();
        console.log('Response', responseJson);
        messageSender.sendBackgroundMessage({
            type: MessageType.ASSISTANT_PROMPT_RESULT,
            data: responseJson?.messages || [],
        });
    }, err => {
        console.error(err);
        debugger;
        sendResponse(null);
    });
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
            const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
                __vexa_token: "",
                __vexa_domain: ""
            });
            console.log({ streamId });
            try {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
                    return;
                }
            } catch (error) {
                console.error(error);
                return;
            }

            messageSender.sendBackgroundMessage({
                type: MessageType.START_RECORDING, data:
                {
                    micLabel: message.data.micLabel,
                    streamId,
                    connectionId: await getConnectionId(),
                    domain: process.env.PLASMO_PUBLIC_CHROME_AWAY_BASE_URL,
                    token: authData.__vexa_token,
                    url: authData.__vexa_domain,
                    tabId: tab.id,
                    meetingId: 'meeting1', //TODO: Replace with generated or persisted value
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
    });
});

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Vexa install');
    setTimeout(async () => {
        await messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
        const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
            __vexa_token: "",
            __vexa_domain: ""
        });
        await StorageService.clear();
        if (authData.__vexa_domain && authData.__vexa_token) {
            await StorageService.set(StoreKeys.AUTHORIZATION_DATA, authData);
        }
        // chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_INTERMEDIARY_URL });
        // chrome.runtime.openOptionsPage(); //TODO: Uncomment when done
    }, 500);

});
createOffscreenDocument();
