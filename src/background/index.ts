import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import OFFSCREEN_DOCUMENT_PATH from 'url:~src/offscreen.html'
import { type AuthorizationData, StorageService, StoreKeys } from "~lib/services/storage.service";
import { getIdFromUrl } from "~shared/helpers/meeting.helper";
import { consoleDebug } from "~shared/helpers/utils.helper";

let previousUrl = null;

chrome.action.onClicked.addListener(async () => {
    // const youtubeEnabled = await StorageService.get(StoreKeys.YOUTUBE_ENABLED, false);
    // StorageService.set(StoreKeys.YOUTUBE_ENABLED, !youtubeEnabled);
});

// chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
    // if (previousUrl && previousUrl !== details.url) {
    //     const regexPattern = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)$/;
    //     if (regexPattern.test(details.url)) {
    // chrome.tabs.reload(details.tabId);
    // resetRecordingState();
    //     }
    // }

    // previousUrl = details.url;
// });

chrome.webNavigation.onCompleted.addListener(async details => {
    // const youtubeRegexPattern = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)$/;
    const meetRegex = /^(?:https?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]{3,}(?:-[a-zA-Z0-9-]{4,})?(?:-[a-zA-Z0-9-]{3,})?)/; // /^(?:http(s)?:\/\/)?meet\.google\.com\/([a-zA-Z0-9-]+)(?:\?.*)?$/;   
    const isRecording = await StorageService.get(StoreKeys.CAPTURING_STATE);
    if (previousUrl && previousUrl !== details.url) {
        // if ((youtubeRegexPattern.test(details.url) || meetRegex.test(details.url) && !isRecording)) {
        //     resetRecordingState();
        // }
        // if ((meetRegex.test(details.url) && !isRecording)) {

        if ((meetRegex.test(details.url))) {
            resetRecordingState();
        }
    }

    // if ((details.url.includes('meet.google.com') || youtubeRegexPattern.test(details.url) && !isRecording)) {
    //     resetRecordingState();
    // }
    previousUrl = details.url;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    const capturingTabId = await StorageService.get(StoreKeys.CAPTURED_TAB_ID);
    if (capturingTabId && capturingTabId === tabId) {
        messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
        messageSender.sendOffscreenMessage({ type: MessageType.STOP_RECORDING });
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

const resetRecordingState = () => {
    StorageService.set(StoreKeys.CAPTURED_TAB_ID, null);
    StorageService.set(StoreKeys.CAPTURING_STATE, false);
    StorageService.set(StoreKeys.WINDOW_STATE, true);
    StorageService.set(StoreKeys.RECORD_START_TIME, 0);
}

MessageListenerService.registerMessageListener(MessageType.OPEN_SETTINGS, () => chrome.runtime.openOptionsPage());
MessageListenerService.registerMessageListener(MessageType.INSTALL, extensionInstallHandler);
MessageListenerService.registerMessageListener(MessageType.AUTH_SAVED, () => {
    chrome.tabs.query({ url: process.env.PLASMO_PUBLIC_LOGIN_ENDPOINT }, async (tabs) => {
        const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
            __vexa_token: "",
            __vexa_main_domain: "",
            __vexa_chrome_domain: "",
        });
        if (authData.__vexa_main_domain && authData.__vexa_token) {
            tabs.forEach(tab => {
                chrome.tabs.remove(tab.id);
            });
        }

    });
});
MessageListenerService.registerMessageListener(MessageType.OFFSCREEN_TRANSCRIPTION_RESULT, async (message) => {
    const { tabId, transcripts } = message.data;
    const tabs = await chrome.tabs.query({});
    const targetTab = tabs.find(tab => tab.id === tabId);
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
    messageSender.sendOffscreenMessage({ type: MessageType.STOP_RECORDING });
    StorageService.set<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: "",
    });
    chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_DASHBOARD_URL });
});
MessageListenerService.registerMessageListener(MessageType.ON_RECORDING_END, (message) => {
    resetRecordingState();
});

MessageListenerService.registerMessageListener(MessageType.DELETE_THREAD, async (message, sender) => {
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: "",
    });
    const { chain } = message.data;
    fetch(`${authData.__vexa_main_domain}/api/v1/assistant/chain/delete?token=${authData.__vexa_token}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            meeting_id: getIdFromUrl(sender.tab.url),
            chain,
        })
    }).then(async res => {
        if (!(res.status < 400)) {
            messageSender.sendTabMessage(sender.tab, { type: MessageType.USER_UNAUTHORIZED });
            return;
        }
        const responseJson = await res.json();
        messageSender.sendTabMessage(sender.tab, {
            type: MessageType.THREAD_DELETED,
            data: { chain },
        });
    }, err => {
        messageSender.sendTabMessage(sender.tab, { type: MessageType.THREAD_DELETED_ERROR });
        console.error(err);
    });
});

// MessageListenerService.registerMessageListener(MessageType.DUPLICATE_THREAD, (message) => {
//     resetRecordingState();
// });

MessageListenerService.registerMessageListener(MessageType.MIC_LEVEL_STREAM_RESULT, (message) => {
    const { level, pointer, tab } = message.data;
    messageSender.sendTabMessage(tab, { type: MessageType.MICROPHONE_LEVEL_STATUS, data: { level, pointer } })
});

MessageListenerService.registerMessageListener(MessageType.BACKGROUND_DEBUG_MESSAGE, async (evt) => {
    consoleDebug(evt.data.url);
});


// TODO: make it prettier
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === 'ASYNC_MESSAGE') {
        const { action, url, data, domain = 'main' } = message.message;

        const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
            __vexa_token: "",
            __vexa_main_domain: "",
            __vexa_chrome_domain: "",
        });

        let fetchOptions = {
            method: action.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.__vexa_token}`,
            }
        };

        if (['post', 'put', 'delete'].includes(action)) {
            fetchOptions['body'] = JSON.stringify(data);
        }


        /*
        setTimeout(() => {
            sendResponse({success: null});
        }, 10);
        */

        fetch((domain === 'main' ? authData.__vexa_main_domain : authData.__vexa_chrome_domain) + url, fetchOptions)
          .then(response => response.json())
          .then(data => {
              chrome.tabs.sendMessage(sender.tab.id, {
                  messageId: message.messageId,
                  data,
              });
          })
          .catch(error => {
              chrome.tabs.sendMessage(sender.tab.id, {
                  messageId: message.messageId,
                  data: {
                      error: error.message,
                  }
              });
          });
    }

    // Return true to indicate that we will respond asynchronously
    return false;
});


MessageListenerService.registerMessageListener(MessageType.ASSISTANT_HISTORY_REQUEST, async (message, sender) => {
    const chainId = message?.data?.chain || 1;
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: "",
    });
    fetch(`${authData.__vexa_main_domain}/api/v1/assistant/messages?token=${authData.__vexa_token}&meeting_id=${getIdFromUrl(sender.tab.url)}&chain=${chainId}`)
    .then(async res => {
        if (!(res.status < 400)) {
            messageSender.sendTabMessage(sender.tab, { type: MessageType.USER_UNAUTHORIZED });
            return;
        }
        const responseJson = await res.json();
        messageSender.sendTabMessage(sender.tab, {
            type: MessageType.ASSISTANT_PROMPT_HISTORY,
            data: responseJson || [],
        });
    }, err => {
        console.error(err);
    });
});

MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_REQUEST, async (message, sender) => {
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: "",
    });
    const { prompt, chain = 1 } = message.data;
    fetch(`${authData.__vexa_main_domain}/api/v1/assistant/copilot?token=${authData.__vexa_token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: prompt,
            meeting_id: getIdFromUrl(sender.tab.url),
            chain,
        })
    }).then(async res => {
        if (!(res.status < 400)) {
            messageSender.sendTabMessage(sender.tab, { type: MessageType.USER_UNAUTHORIZED });
            return;
        }
        const responseJson = await res.json();
        messageSender.sendTabMessage(sender.tab, {
            type: MessageType.ASSISTANT_PROMPT_RESULT,
            data: responseJson || [],
        });
    }, err => {
        messageSender.sendTabMessage(sender.tab, { type: MessageType.ASSISTANT_PROMPT_ERROR });
        console.error(err);
    });
});

MessageListenerService.registerMessageListener(MessageType.FORK_MESSAGE_CHAIN, async (message, sender) => {
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: "",
    });
    const { prompt, chain } = message.data;
    fetch(`${authData.__vexa_main_domain}/api/v1/assistant/fork?token=${authData.__vexa_token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: prompt,
            meeting_id: getIdFromUrl(sender.tab.url),
            chain,
        })
    }).then(async res => {
        if (!(res.status < 400)) {
            messageSender.sendTabMessage(sender.tab, { type: MessageType.USER_UNAUTHORIZED });
            return;
        }
        const responseJson = await res.json();
        messageSender.sendTabMessage(sender.tab, {
            type: MessageType.ASSISTANT_PROMPT_RESULT,
            data: responseJson || [],
        });
    }, err => {
        messageSender.sendTabMessage(sender.tab, { type: MessageType.ASSISTANT_PROMPT_ERROR });
        console.error(err);
    });
});

MessageListenerService.registerMessageListener(MessageType.TRANSCRIPTION_HISTORY_REQUEST, async (message, sender) => {
    const meetingId = message.data.meetingId || '';
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: "",
    });
    const transcriptionURL = `${authData.__vexa_main_domain}/api/v1/transcription?meeting_id=${meetingId}&token=${authData.__vexa_token}`;
    messageSender.sendBackgroundMessage({ type: MessageType.BACKGROUND_DEBUG_MESSAGE, data: { url: transcriptionURL } });
    messageSender.sendOffscreenMessage({ type: MessageType.BACKGROUND_DEBUG_MESSAGE, data: { url: transcriptionURL } });
    fetch(transcriptionURL, {
        method: 'GET',
    }).then(async res => {
        if (!(res.status < 400)) {
            messageSender.sendBackgroundMessage({ type: MessageType.USER_UNAUTHORIZED });
            messageSender.sendOffscreenMessage({ type: MessageType.USER_UNAUTHORIZED });
            return;
        }
        const transcripts = await res.json();
        messageSender.sendTabMessage(sender.tab, {
            type: MessageType.TRANSCRIPTION_RESULT,
            data: {
                transcripts,
                tabId: sender.tab.id,
            },
        });
    }, error => {
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
                __vexa_main_domain: "",
                __vexa_chrome_domain: "",
            });
            try {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
                    messageSender.sendOffscreenMessage({ type: MessageType.STOP_RECORDING });
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
                    chrome_domain: authData.__vexa_chrome_domain,
                    token: authData.__vexa_token,
                    main_domain: authData.__vexa_main_domain,
                    tabId: tab.id,
                    meetingId: sender.tab.url,
                }
            });
        });
    });
});

MessageListenerService.registerMessageListener(MessageType.UPDATE_SPEAKER_NAME_REQUEST, async (message, sender) => {
    const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: "",
    });
    const { speaker_id, alias } = message.data;
    const speakerRenameUrl = `${authData.__vexa_main_domain}/api/v1/speakers/add-alias?token=${authData.__vexa_token}`;
    fetch(speakerRenameUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ speaker_id, alias })
    }).then(async res => {
        if (!(res.status < 400)) {
            messageSender.sendBackgroundMessage({ type: MessageType.USER_UNAUTHORIZED });
            messageSender.sendOffscreenMessage({ type: MessageType.USER_UNAUTHORIZED });
            return;
        }
        const result = await res.json();
        messageSender.sendTabMessage(sender.tab, { type: MessageType.UPDATE_SPEAKER_NAME_RESULT, data: { speaker_id, alias } })
    }, error => {
        console.error(error);
    });
});

chrome.runtime.onInstalled.addListener(async () => {
    setTimeout(async () => {
        await messageSender.sendBackgroundMessage({ type: MessageType.STOP_RECORDING });
        messageSender.sendOffscreenMessage({ type: MessageType.STOP_RECORDING });
        const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
            __vexa_token: "",
            __vexa_main_domain: "",
            __vexa_chrome_domain: "",
        });
        await StorageService.clear();
        if (authData.__vexa_main_domain && authData.__vexa_chrome_domain && authData.__vexa_token) {
            await StorageService.set(StoreKeys.AUTHORIZATION_DATA, authData);
        }
        chrome.runtime.openOptionsPage();
        chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_LOGIN_ENDPOINT });
    }, 500);
});
createOffscreenDocument();
resetRecordingState();