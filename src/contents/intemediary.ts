import type { PlasmoCSConfig } from "plasmo";
import { MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import { type AuthorizationData, StorageService, StoreKeys } from "~lib/services/storage.service";

export const config: PlasmoCSConfig = {
    matches: ["https://ext-dev.vexa.ai/intermediary.html*"]
}
const messageSender = new MessageSenderService();

const dataCollectFn = async () => {
    const authData = JSON.parse(JSON.stringify(localStorage));
    await StorageService.set(StoreKeys.AUTHORIZATION_DATA, authData);
    const savedAuthData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA);
    console.log({authData, savedAuthData});
    console.log('collected');
    messageSender.sendBackgroundMessage( { type: MessageType.AUTH_SAVED});
}

dataCollectFn();
