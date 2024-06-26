import type { PlasmoCSConfig } from "plasmo";
import { MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import { type AuthorizationData, StorageService, StoreKeys } from "~lib/services/storage.service";

export const config: PlasmoCSConfig = {
    matches: [
        "https://dashboard.vexa.ai/signin?caller=vexa-ext*",
    ]
}
const messageSender = new MessageSenderService();

const dataCollectFn = async () => {
    const authData = JSON.parse(JSON.stringify(localStorage));
    if (Object.keys(authData).includes('__vexa_token') && authData.__vexa_token?.trim()) {
        await StorageService.set(StoreKeys.AUTHORIZATION_DATA, authData);
        messageSender.sendBackgroundMessage({ type: MessageType.AUTH_SAVED });
    }
    const pageUrl = new URL(window.location.href);
    if (pageUrl.searchParams.has('caller') && pageUrl.searchParams.get('caller') === 'vexa-ext' && authData.__vexa_token?.trim()) {
        try {
            window.close();
        } catch (e) {
            console.error(e);
        }
    }
    window.addEventListener('beforeunload', () => {
        dataCollectFn();
    });
}

dataCollectFn();
