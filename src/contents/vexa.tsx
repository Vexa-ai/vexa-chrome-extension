import rootCssText from "data-text:~root.scss";
import customSelectCss from 'data-text:../shared/components/CustomSelect/CustomSelect.scss';
import microphoneSelectCss from 'data-text:../shared/components/MicrophoneSelector/MicrophoneSelector.scss';
import './vexa.scss';
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetOverlayAnchor, PlasmoRender } from "plasmo";
import React, { useEffect } from "react";
import { MainContentView, MicrophoneOptions, VexaToolbar } from "~shared/components";
import { AudioCaptureContext, useAudioCapture } from "~shared/hooks/use-audiocapture";
import { MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import { StorageService, StoreKeys } from "~lib/services/storage.service";
const messageSender = new MessageSenderService();

const Vexa = () => {
    const audioCapture = useAudioCapture();
    const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);

    useEffect(() => {
        chrome.runtime.connect({ name: 'mySidepanel' });
        messageSender.sendBackgroundMessage({ type: MessageType.ON_APP_OPEN });
    }, []);

    return (
        <div className="flex flex-col h-screen w-[400px] bg-slate-950 px-4 pt-4 pb-4 overflow-y-auto">
            <AudioCaptureContext.Provider value={audioCapture}>
                <VexaToolbar />
                {isCapturing ? <MainContentView /> : <MicrophoneOptions className="mt-3" />}
            </AudioCaptureContext.Provider>
        </div>
    )
};

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = `
        ${rootCssText}
        ${customSelectCss}
        ${microphoneSelectCss}
    `
    return style
}

// export const getInlineAnchor: PlasmoGetInlineAnchor = async () =>
//     document.querySelector("body").querySelector('div');

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
    document.querySelector("body").querySelector('div');

// export const getRootContainer = () =>
//     new Promise((resolve) => {
//         const checkInterval = setInterval(() => {
//             const rootContainer = document.querySelector("body"); // .querySelector('div')
//             if (rootContainer) {
//                 clearInterval(checkInterval)
//                 resolve(rootContainer)
//             }
//         }, 137)
//     })

// export const render: PlasmoRender<HTMLDivElement> = async ({
//     anchor, // the observed anchor, OR document.body.
//     createRootContainer // This creates the default root container
// }) => {
//     const rootContainer = await createRootContainer();
//     document.body.click();
//     setTimeout(() => {
//         const root = createRoot(rootContainer) // Any root
//         root.render(
//             <div id="vexa-content-div" style={{
//                 position: 'fixed',
//                 width: '400px',
//                 height: '100vh',
//                 top: 0,
//             }}>
//                 <Vexa />
//             </div>
//         )
//     }, 25000);

// }

export const config: PlasmoCSConfig = {
    matches: ['*://*.meet.google.com/*'],
    css: ["./vexa.scss"],
    // world: 'MAIN',
};

export default Vexa;

/**
 * Using overlay anchor doesn't get google meet to block, but doesn't load dropdown
 * styling
 * 
 * https://react-select.com/home
 * https://www.radix-ui.com/primitives/docs/components/dropdown-menu
 * https://react-component.github.io/dropdown/
 * 
 */
