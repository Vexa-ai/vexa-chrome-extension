import { type AuthorizationData, StorageService, StoreKeys } from "./storage.service";

export class ApiService {

    private readonly baseURL = process.env.PLASMO_PUBLIC_API_ENDPOINT;
    private readonly loginURL = process.env.PLASMO_PUBLIC_LOGIN_ENDPOINT;
    private static loggedInUser?: AuthorizationData;

    constructor() {
        ApiService.watchUserChanges();
    }

    async post<T>(
        endpoint: string,
        body: { [key: string]: any } | FormData = {},
        loaderConfig = { showLoader: true, message: 'Loading...' },
        headers: { [key: string]: string } = {}): Promise<T> {
        headers = this.setRequestBearer(headers); // { ...headers, "Content-Type": "application/json"};
        if (loaderConfig.showLoader) {
            this.presentLoading(loaderConfig.message);
        }
        const response = fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers
        });
        response.finally(() => {
            if (loaderConfig.showLoader) {
                // this.loadingService.hide();
                // Hide loader
            }
        });
        const result = await response;
        if (result.ok) {
            return Promise.resolve(await result.json() as T);
        } else {
            return Promise.reject(await result.json());
        }
    }

    async get<T>(
        endpoint: string,
        parameters?: { [key: string]: string },
        loaderConfig: { showLoader: boolean; message?: string } = { showLoader: true, message: 'Loading...' },
        headers: { [key: string]: string } = {}): Promise<T> {
        if (loaderConfig.showLoader) {
            this.presentLoading(loaderConfig?.message);
        }
        this.objectToQueryString(parameters);
        headers = this.setRequestBearer(headers); // { ...headers, "Content-Type": "application/json"};
        const response = fetch(`${this.baseURL}${endpoint}${parameters && '?' + this.objectToQueryString(parameters) || ''}`, {
            method: 'GET',
            headers
        });
        response.finally(() => {
            if (loaderConfig.showLoader) {
                // this.loadingService.hide();
                // Hide loader
            }
        });
        const result = await response;
        if (result.ok) {
            return Promise.resolve(await result.json() as T);
        } else {
            return Promise.reject(await result.json());
        }
    }

    async put<T = any>(
        endpoint: string,
        body: { [key: string]: any } | FormData = {},
        loaderConfig = { showLoader: true, message: 'Loading...' },
        headers: { [key: string]: string } = {}): Promise<T> {

        if (loaderConfig.showLoader) {
            this.presentLoading(loaderConfig.message);
        }
        headers = this.setRequestBearer(headers); // { ...headers, "Content-Type": "application/json"};
        const response = fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers
        });
        response.finally(() => {
            if (loaderConfig.showLoader) {
                // this.loadingService.hide();
                // Hide loader
            }
        });
        const result = await response;
        if (result.ok) {
            return Promise.resolve(await result.json() as T);
        } else {
            return Promise.reject(await result.json());
        }
    }

    async patch<T = any>(
        endpoint: string,
        body: { [key: string]: any } | FormData = {},
        loaderConfig = { showLoader: true, message: 'Loading...' },
        headers: { [key: string]: string } = {}): Promise<T> {

        if (loaderConfig.showLoader) {
            this.presentLoading(loaderConfig.message);
        }
        headers = this.setRequestBearer(headers); // { ...headers, "Content-Type": "application/json"};
        const response = fetch(`${this.baseURL}${endpoint}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
            headers
        });
        response.finally(() => {
            if (loaderConfig.showLoader) {
                // this.loadingService.hide();
                // Hide loader
            }
        });
        const result = await response;
        if (result.ok) {
            return Promise.resolve(await result.json() as T);
        } else {
            return Promise.reject(await result.json());
        }
    }

    async delete<T = any>(
        endpoint: string,
        parameters?: { [key: string]: any },
        loaderConfig: { showLoader: boolean; message?: string } = { showLoader: true, message: 'Loading...' },
        headers: { [key: string]: string } = {}): Promise<T> {
        if (loaderConfig.showLoader) {
            this.presentLoading(loaderConfig.message);
        }
        if (loaderConfig.showLoader) {
            this.presentLoading(loaderConfig?.message);
        }
        this.objectToQueryString(parameters);
        headers = this.setRequestBearer(headers); // { ...headers, "Content-Type": "application/json"};
        const response = fetch(`${this.baseURL}${endpoint}${parameters && '?' + this.objectToQueryString(parameters) || ''}`, {
            method: 'DELETE',
            headers
        });
        response.finally(() => {
            if (loaderConfig.showLoader) {
                // this.loadingService.hide();
                // Hide loader
            }
        });
        const result = await response;
        if (result.ok) {
            return Promise.resolve(await result.json() as T);
        } else {
            return Promise.reject(await result.json());
        }
    }

    async head<T = any>(
        endpoint: string,
        parameters?: { [key: string]: any },
        loaderConfig: { showLoader: boolean; message?: string } = { showLoader: true, message: 'Loading...' },
        headers: { [key: string]: string } = {}): Promise<T> {
        if (loaderConfig.showLoader) {
            this.presentLoading(loaderConfig.message);
        }
        if (loaderConfig.showLoader) {
            this.presentLoading(loaderConfig?.message);
        }
        this.objectToQueryString(parameters);
        headers = this.setRequestBearer(headers); // { ...headers, "Content-Type": "application/json"};
        const response = fetch(`${this.baseURL}${endpoint}${parameters && '?' + this.objectToQueryString(parameters) || ''}`, {
            method: 'HEAD',
            headers
        });
        response.finally(() => {
            if (loaderConfig.showLoader) {
                // this.loadingService.hide();
                // Hide loader
            }
        });
        const result = await response;
        if (result.ok) {
            return Promise.resolve(await result.json() as T);
        } else {
            return Promise.reject(await result.json());
        }
    }

    async presentLoading(message?: string) {
        // this.loadingService.show({
        //     message,
        //     spinner: 'bubbles'
        // });
    }

    async getLoggedInUser(logoutIfNoUser = false) {
        ApiService.loggedInUser = await StorageService.get<AuthorizationData>(StoreKeys.USER, null);
        if(logoutIfNoUser && !ApiService.loggedInUser) {
            StorageService.clear(true);
            chrome.tabs.create({ url: this.loginURL }, function (tab) {
                console.log('Login tab created');
            });
            return;
        }
        return ApiService.loggedInUser;
    }

    // This has to be defined static for approach to work.
    private static watchUserChanges() {
        StorageService.watchValueChange(StoreKeys.USER, (updatedData) => {
            ApiService.loggedInUser = updatedData.newValue
        });
    }

    private objectToQueryString(obj = {}) {
        const keys = Object.keys(obj || {});
        const keyValuePairs = keys.map(key => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
        });
        return keyValuePairs.join('&');
    }

    private setRequestBearer(headers: { [key: string]: string } = {}) {
        const { token } = ApiService.loggedInUser || { token: '' };
        return { ...headers, "Content-Type": "application/json", ...{ Authorization: `Bearer ${ token }` }}
    }
}
