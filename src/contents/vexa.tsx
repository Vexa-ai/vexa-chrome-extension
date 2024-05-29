import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetOverlayAnchor, PlasmoRender } from "plasmo";
import React, { useEffect, useState } from "react";
import { MainContentView, MicrophoneOptions, VexaBuildInfo, VexaToolbar } from "~shared/components";
import { AudioCaptureContext, useAudioCapture } from "~shared/hooks/use-audiocapture";
import { MessageSenderService } from "~lib/services/message-sender.service";
import { StorageService, StoreKeys } from "~lib/services/storage.service";
import Draggable, { type DraggableData, type DraggableEvent } from "react-draggable";
import {NotificationContainer, NotificationManager} from 'react-notifications';

const messageSender = new MessageSenderService();

const Vexa = () => {
    const audioCapture = useAudioCapture();
    const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
    const [isMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE, true);
    const defaultPosition = { x: 0, y: 0 };
    const [position, setPosition] = useState(defaultPosition);

    const handleDrag = (e: DraggableEvent, data: DraggableData) => {
        setPosition({ x: data.x, y: data.y });
    };

    const handleStop = (e: DraggableEvent, data: DraggableData) => {
        const { clientWidth, clientHeight } = document.documentElement;
        const { node } = data;
        const rect = node.getBoundingClientRect();
        if (rect.right < 0 || (rect.top > clientHeight || rect.bottom < 0) || rect.left > clientWidth) {
            setPosition(defaultPosition);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (isMaximized) {
                const { clientWidth, clientHeight } = document.documentElement;
                const node = document.getElementById("vexa-content-div");
                if (node) {
                    const rect = node.getBoundingClientRect();
                    if (rect.right < 0 || (rect.top > clientHeight || rect.bottom < 0) || rect.left > clientWidth) {
                        setPosition(defaultPosition);
                    }
                }
            }
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [isMaximized]);

    return (
        <>
            {
                isMaximized && (<Draggable
                    position={position}
                    onDrag={handleDrag}
                    onStop={handleStop}
                >
                    <div id="vexa-content-div" className="flex flex-col w-[400px] bg-slate-950 m-4 p-4 rounded-lg overflow-y-auto overflow-x-hidden">
                        <AudioCaptureContext.Provider value={audioCapture}>
                            <NotificationContainer/>
                            <VexaToolbar />
                            {isCapturing
                                ? <MainContentView />
                                : <>
                                    <MicrophoneOptions className="mt-3" />
                                    <VexaBuildInfo className="mx-auto mt-auto" />
                                </>
                            }
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