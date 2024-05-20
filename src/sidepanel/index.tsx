// import rootCssText from "data-text:~root.scss";
// import './index.scss';
// import type { PlasmoCSConfig } from "plasmo";
// import React, { useEffect } from "react";
// import { MainContentView, MicrophoneOptions, VexaToolbar } from "~shared/components";
// import { AudioCaptureContext, useAudioCapture } from "~shared/hooks/use-audiocapture";
// import { MessageType } from "~lib/services/message-listener.service";
// import { MessageSenderService } from "~lib/services/message-sender.service";
// import { StorageService, StoreKeys } from "~lib/services/storage.service";
// const messageSender = new MessageSenderService();

// const SidePanel = () => {
//     const audioCapture = useAudioCapture();
//     const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);

//     useEffect(() => {
//         chrome.runtime.connect({ name: 'mySidepanel' });
//         messageSender.sendBackgroundMessage({ type: MessageType.ON_APP_OPEN });
//     }, []);

//     return (
//         // <div className="m-4">
//             <div className="flex flex-col h-screen w-full px-4 pt-4 pb-4 overflow-y-auto">
//                 <AudioCaptureContext.Provider value={audioCapture}>
//                     <VexaToolbar />
//                     {isCapturing ? <MainContentView /> : <MicrophoneOptions className="mt-3" />}
//                 </AudioCaptureContext.Provider>
//             </div>
//         // </div>

//     )
// };

// export const getStyle = () => {
//     const style = document.createElement("style")
//     style.textContent = rootCssText
//     return style
// }

// export const config: PlasmoCSConfig = {
//     matches: ['<all_urls>'],
//     css: ["./index.scss"],
// };

// export default SidePanel;