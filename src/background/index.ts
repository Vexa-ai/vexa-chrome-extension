import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import OFFSCREEN_DOCUMENT_PATH from 'url:~src/offscreen.html'
import { type AuthorizationData, StorageService, StoreKeys } from "~lib/services/storage.service";
import { getIdFromUrl } from "~shared/helpers/meeting.helper";

let previousUrl = null;

chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
    if (previousUrl && previousUrl !== details.url) {
        const regexPattern = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9]+)$/;
        if (regexPattern.test(details.url)) {
            chrome.tabs.reload(details.tabId);
        }
    }

    previousUrl = details.url;
});

chrome.webNavigation.onCompleted.addListener(details => {
    const youtubeRegexPattern = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9]+)$/;
    const meetRegex = /^(?:http(s)?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]+)(?:\?.*)?$/;
    if (previousUrl && previousUrl !== details.url) {
        if (youtubeRegexPattern.test(details.url) || meetRegex.test(details.url)) {
            resetRecordingState();
        }
    }

    if (details.url.includes('meet.google.com') || youtubeRegexPattern.test(details.url)) {
        resetRecordingState();
    }
    previousUrl = details.url;
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

const pipeOffscreenToTab = (evtData) => {
    const tab: chrome.tabs.Tab = evtData.tab;
    delete evtData.tab;
    messageSender.sendTabMessage(tab, evtData);
}

const resetRecordingState = () => {
    StorageService.set(StoreKeys.CAPTURED_TAB_ID, null);
    StorageService.set(StoreKeys.CAPTURING_STATE, false);
    StorageService.set(StoreKeys.RECORD_START_TIME, 0);
}

MessageListenerService.registerMessageListener(MessageType.OFFSCREEN_TO_TAB_MESSAGE, pipeOffscreenToTab);
MessageListenerService.registerMessageListener(MessageType.OPEN_SETTINGS, () => chrome.runtime.openOptionsPage());
MessageListenerService.registerMessageListener(MessageType.GET_MY_TAB, async (message, sender, sendResponse) => sendResponse({ tab: sender.tab }));
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
MessageListenerService.registerMessageListener(MessageType.OFFSCREEN_TRANSCRIPTION_RESULT, async (message) => {
    const { tabId, transcripts } = message.data;
    const tabs = await chrome.tabs.query({ active: true });
    const targetTab = tabs.find(tab => tabId === tabId);
    if (targetTab) {
        messageSender.sendTabMessage(targetTab, {
            type: MessageType.TRANSCRIPTION_RESULT,
            data: {
                transcripts,
                tabId,
            },
        });
    }
});
MessageListenerService.registerMessageListener(MessageType.ON_RECORDING_STARTED, (message, sender) => {
    StorageService.set(StoreKeys.CAPTURED_TAB_ID, sender.tab.id);
    StorageService.set(StoreKeys.CAPTURING_STATE, true);
    StorageService.set(StoreKeys.RECORD_START_TIME, new Date().getTime());
    StorageService.set(StoreKeys.MIC_LEVEL_STATE, { level: 0, pointer: 0 });
});
MessageListenerService.registerMessageListener(MessageType.USER_UNAUTHORIZED, (message) => {
    messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
});
MessageListenerService.registerMessageListener(MessageType.ON_RECORDING_END, (message) => {
    resetRecordingState();
});

MessageListenerService.registerMessageListener(MessageType.MIC_LEVEL_STREAM_RESULT, (message) => {
    const { level, pointer, tab } = message.data;
    messageSender.sendTabMessage(tab, { type: MessageType.MICROPHONE_LEVEL_STATUS, data:  { level, pointer }})
});

MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_REQUEST, async (message, sender, sendResponse) => {
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_domain: ""
    });
    const { prompt } = message.data;
    fetch(`${process.env.PLASMO_PUBLIC_MAIN_AWAY_BASE_URL}/api/v1/assistant/copilot?token=${authData.__vexa_token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: prompt,
            meeting_id: getIdFromUrl(sender.tab.url),
            chain: 0,
        })
    }).then(async res => {
        if (!(res.status < 401)) {
            if (res.status === 401) {
                messageSender.sendTabMessage(sender.tab, { type: MessageType.USER_UNAUTHORIZED });
            }
            return;
        }
        const responseJson = await res.json();
        messageSender.sendTabMessage(sender.tab, {
            type: MessageType.ASSISTANT_PROMPT_RESULT,
            data: responseJson || [],
        });
    }, err => {
        console.error(err);
        sendResponse(null);
    });
});

MessageListenerService.registerMessageListener(MessageType.REQUEST_START_RECORDING, (message, sender) => {
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
                    meetingId: sender.tab.url,
                }
            });
        });
    });
});

chrome.runtime.onInstalled.addListener(async () => {
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
        chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_INTERMEDIARY_URL });
        chrome.runtime.openOptionsPage(); //TODO: Uncomment when done
    }, 500);

});
createOffscreenDocument();
resetRecordingState();