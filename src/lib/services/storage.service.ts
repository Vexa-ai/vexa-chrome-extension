import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

export class StorageService {
    private static readonly storage = new Storage();

    /**
     * 
     * @param key Set the value. If it is a secret, it will only be set in extension storage. Returns a warning if storage capacity is almost full. Throws error if the new item will make storage full
     * @param value Value to set
     * @param watchFn If a watch function is supplied, the set value will be watched for changes and the function ran everytime the value changes
     */
    static async set<T = any>(key: StoreKeys, value: T) {
        return await StorageService.storage.set(key, value);
    }

    /**
     * 
     * @param key Key for store value to watch for changes
     * @param watchFn Watch function to run when the store value changes
     * @returns boolean
     */
    static watchValueChange<T = any>(key: StoreKeys, watchFn?: (data: chrome.storage.StorageChange & { newValue: T; oldValue: T }) => any) {
        const watchConfig: { [k in StoreKeys]: (data: chrome.storage.StorageChange & { newValue: T; oldValue: T }) => any } = {
            [key]: watchFn,
        } as { [k in StoreKeys]: (data: chrome.storage.StorageChange & { newValue: T; oldValue: T }) => any };
        return StorageService.storage.watch(watchConfig);
    }

    /**
     * 
     * @param key Key for store value to stop watching for changes
     * @param watchFn Watch function to run when the store value changes
     * @returns boolean
     */
    static unWatchValueChange<T = any>(key: StoreKeys, watchFn?: (data: chrome.storage.StorageChange & { newValue: T; oldValue: T }) => any) {
        const watchConfig: { [k in StoreKeys]: (data: chrome.storage.StorageChange & { newValue: T; oldValue: T }) => any } = {
            [key]: watchFn,
        } as { [k in StoreKeys]: (data: chrome.storage.StorageChange & { newValue: T; oldValue: T }) => any };
        return StorageService.storage.unwatch(watchConfig);
    }

    /**
     * 
     * @param key Get value from either local storage or chrome storage.
     * @param fallback An optional fallback value that is returned if the data does not exist
     * @returns 
     */
    static async get<T = any>(key: StoreKeys, fallback?: T): Promise<T> {
        return (await StorageService.storage.get(key) || fallback);
    }

    /**
     * 
     * @param key Store key to delete
     * @returns void
     */
    static delete(key: StoreKeys) {
        // this.storage.
        return StorageService.storage.remove(key);
    }

    /**
     * 
     * @param includeCopies — Also cleanup copied data from secondary storage
     */
    static clear(includeCopies = true) {
        return StorageService.storage.clear(includeCopies);
    }

    /**
     * @param key 
     * @param onInit — If it is a function, the returned value will be rendered and persisted. If it is a static value, it will only be rendered, not persisted
     */
    static useHookStorage<T>(key: StoreKeys, onInit?: T) {
        return useStorage<T>(key, onInit)
    }
}

export enum StoreKeys {
    USER = 'USER',
    FIRST_INSTALL = 'FIRST_INSTALL',
    RECORD_START_TIME = 'RECORD_START_TIME',
    SELECTED_MICROPHONE = "SELECTED_MICROPHONE",
    CAPTURING_STATE = "CAPTURING_STATE",
    CAPTURED_TAB_ID = "CAPTURED_TAB_ID",
    AUTHORIZATION_DATA = "AUTHORIZATION_DATA",
    MIC_LEVEL_STATE = "MIC_LEVEL_STATE",
    WINDOW_STATE = "WINDOW_STATE",
    RECORDER_INSTANCE = "RECORDER_INSTANCE",
    RECORDER_STREAM_INSTANCE = "RECORDER_STREAM_INSTANCE",
}

export interface AuthorizationData {
    __vexa_token: string;
    __vexa_domain: string;
  }