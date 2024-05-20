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
import Draggable from "react-draggable";

const messageSender = new MessageSenderService();

const Vexa = () => {
    const audioCapture = useAudioCapture();
    const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
    const [isMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE, true);

    return (
        <>
            {
                isMaximized && (<Draggable>
                    <div id="vexa-content-div" className="flex flex-col h-screen w-[400px] bg-slate-950 px-4 pt-4 pb-4 overflow-y-auto overflow-x-hidden">
                        <AudioCaptureContext.Provider value={audioCapture}>
                            <VexaToolbar />
                            {isCapturing ? <MainContentView /> : <MicrophoneOptions className="mt-3" />}
                        </AudioCaptureContext.Provider>
                    </div>
                </Draggable>)
            }
        </>


    )
};

export const config: PlasmoCSConfig = {
    matches: ['https://example.com/*'], // This prevents duplicate UI renders by only rendering the UI directly on example.com. Removing config doesn't work. Needs further experimentation to determine why.
    css: ["./no-vexa.scss"],
};

export default Vexa;