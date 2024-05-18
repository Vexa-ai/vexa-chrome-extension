import rootCssText from "data-text:~root.scss";
import customSelectCss from 'data-text:../shared/components/CustomSelect/CustomSelect.scss';
import microphoneSelectCss from 'data-text:../shared/components/MicrophoneSelector/MicrophoneSelector.scss';
import transcriptListCss from 'data-text:../shared/components/TranscriptList/TranscriptList.scss';
import mainContentViewCss from 'data-text:../shared/components/MainContentView/MainContentView.scss';
import vexaCss from 'data-text:./vexa.scss';
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetOverlayAnchor, PlasmoRender } from "plasmo";
import React, { useEffect } from "react";
import { MainContentView, MicrophoneOptions, VexaToolbar } from "~shared/components";
import { AudioCaptureContext, useAudioCapture } from "~shared/hooks/use-audiocapture";
import { MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import { StorageService, StoreKeys } from "~lib/services/storage.service";
import { createRoot } from "react-dom/client";
import Draggable from "react-draggable";

const messageSender = new MessageSenderService();

const Vexa = () => {
    const audioCapture = useAudioCapture();
    const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);

    return (
        <Draggable>
            <div id="vexa-content-div" className="flex flex-col h-screen w-[400px] bg-slate-950 px-4 pt-4 pb-4 overflow-y-auto overflow-x-hidden">
                <AudioCaptureContext.Provider value={audioCapture}>
                    <VexaToolbar />
                    {isCapturing ? <MainContentView /> : <MicrophoneOptions className="mt-3" />}
                </AudioCaptureContext.Provider>
            </div>
        </Draggable>

    )
};

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = `
        ${rootCssText}
        ${customSelectCss}
        ${microphoneSelectCss}
        ${vexaCss}
        ${transcriptListCss}
        ${mainContentViewCss}
    `
    return style
}

export const getOverlayAnchor: PlasmoGetOverlayAnchor = async () =>
    document.querySelector("body").querySelector('div');

export const config: PlasmoCSConfig = {
    matches: ['*://meet.google.com/*'],
    css: ["./vexa.scss", "../assets/fonts/Inter/inter.face.scss"],
};

export default Vexa;