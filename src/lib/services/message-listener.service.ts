import type { StoreKeys } from './storage.service';

export class MessageListenerService {

    private static readonly messages: { 
        [k in MessageType]: { 
            [key: string]: {
                handler: (evtData: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => any,
                sender?: chrome.runtime.MessageSender,
                sendResponse?: (response?: any) => void,
            }
        }
    } = {} as any;
    private static isListenerInitialized = false;

    static initializeListenerService() {
        if (MessageListenerService.isListenerInitialized) {
            console.info('Message listener service has already been initialized');
            return;
        }
        MessageListenerService.registerExtensionMessageEvents();
        console.info('Message listener service initialized successfully');
    }

    static registerMessageListener<T = any, U = any>(messageType: MessageType, handler: (evtData: T, sender: chrome.runtime.MessageSender, sendResponse: any) => U): string {
        const listenerId = MessageListenerService.generateUniqueHandlerID();

        if (!MessageListenerService.messages[messageType]) {
            MessageListenerService.messages[messageType] = {};
        }
        MessageListenerService.messages[messageType][listenerId] = {
            handler
        };
        return listenerId;
    }

    static unRegisterMessageListener(messageType: MessageType, listenerId?: string) {
        if (listenerId) {
            delete MessageListenerService.messages[messageType]?.[listenerId];
        } else {
            delete MessageListenerService.messages?.[messageType];
        }
    }

    private static registerExtensionMessageEvents() {
        chrome.runtime.onMessage.addListener((request: { type: StoreKeys, data: any}, sender, sendResponse) => {
            if(request.type && MessageListenerService.messages[request.type]) {
                const registeredListeners = MessageListenerService.messages[request.type];
                for(const key in registeredListeners) {
                    if(typeof registeredListeners?.[key]?.handler === 'function') {
                        registeredListeners[key].handler(request, sender, sendResponse); // TODO: Add optional sendresponse handling
                    }
                }
            }
        });
        MessageListenerService.isListenerInitialized = true;
    }

    private static generateUniqueHandlerID() {
        const date = new Date();
        return date.getTime().toString();
    }
}

export enum MessageType {
    INSTALL = 'INSTALL',
    REQUEST_MEDIA_DEVICES = "REQUEST_MEDIA_DEVICES",
    REQUEST_MEDIA_STREAM_ID = "REQUEST_MEDIA_STREAM_ID",
    START_RECORDING = "START_RECORDING",
    MEDIA_DEVICES = "MEDIA_DEVICES",
    ON_MICROPHONE_SELECTED = "ON_MICROPHONE_SELECTED",
    MICROPHONE_LEVEL_STATUS = "MICROPHONE_LEVEL_STATUS",
    START_MIC_LEVEL_STREAMING = "START_MIC_LEVEL_STREAMING",
    MIC_LEVEL_STREAM_RESULT = "MIC_LEVEL_STREAM_RESULT",
    OPEN_SETTINGS = "OPEN_SETTINGS",
    REQUEST_START_RECORDING = "REQUEST_START_RECORDING",
    ON_RECORDING_END = "ON_RECORDING_END",
    ON_RECORDING_STARTED = "ON_RECORDING_STARTED",
    STOP_RECORDING = "STOP_RECORDING",
    PAUSE_RECORDING = "PAUSE_RECORDING",
    RESUME_RECORDING = "RESUME_RECORDING",
    TRANSCRIPTION_RESULT = "TRANSCRIPTION_RESULT",
    ON_APP_OPEN = "ON_APP_OPEN",
    ON_APP_CLOSE = "ON_APP_CLOSE",
    SHOW_SIDEBAR = "SHOW_SIDEBAR",
    ASSISTANT_PROMPT_REQUEST = "ASSISTANT_PROMPT_REQUEST",
    ASSISTANT_PROMPT_RESULT = "ASSISTANT_PROMPT_RESULT",
    AUTH_SAVED = "AUTH_SAVED",
    USER_UNAUTHORIZED = "USER_UNAUTHORIZED",
    OFFSCREEN_TO_TAB_MESSAGE = "OFFSCREEN_TO_TAB_MESSAGE",
    GET_MY_TAB = "GET_MY_TAB",
    OFFSCREEN_TRANSCRIPTION_RESULT = "OFFSCREEN_TRANSCRIPTION_RESULT",
    ON_MEDIA_CHUNK_RECEIVED = "ON_MEDIA_CHUNK_RECEIVED",
    DEBUG_MESSAGE = "DEBUG_MESSAGE",
    BACKGROUND_DEBUG_MESSAGE = "BACKGROUND_DEBUG_MESSAGE",
}