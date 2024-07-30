import React, { useEffect, useRef, useState } from "react";
import { MainContentView, MicrophoneOptions, SpeakerEditorModal, VexaBuildInfo, VexaToolbar } from "~shared/components";
import { AudioCaptureContext, useAudioCapture } from "~shared/hooks/use-audiocapture";
import { MessageSenderService } from "~lib/services/message-sender.service";
import { StorageService, StoreKeys } from "~lib/services/storage.service";
import Draggable, { type DraggableData, type DraggableEvent } from "react-draggable";
import { NotificationContainer, NotificationManager } from 'react-notifications';
import { sendMessage } from "~shared/helpers/in-content-messaging.helper";
import { MessageType } from "~lib/services/message-listener.service";
import { ThreadDeletePromptModal } from "../ThreadDeletePromptModal";
import AsyncMessengerService from "~lib/services/async-messenger.service";

const asyncMessengerService = new AsyncMessengerService();

const messageSender = new MessageSenderService();

const Vexa = () => {
    const audioCapture = useAudioCapture();
    const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
    const [isMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE, true);
    const [hasRecorded, setHasRecorded] = useState(false);
    const [isDraggableDisabled, setIsDraggableDisabled] = useState(true);
    const vexaToolbarRef = useRef(null);
    const defaultPosition = { x: 0, y: 0 };
    const [position, setPosition] = useState(defaultPosition);
    const [outdated, setOutdated] = useState(false);
    const [outdatedClosed, setOutdatedClosed] = useState(false);
    const [latestVersion, setLatestVersion] = useState(0);

    const handleDrag = (e: DraggableEvent, data: DraggableData) => {
        setPosition({ x: data.x, y: data.y });
    };

    const handleStop = (e: DraggableEvent, data: DraggableData) => {
        const { clientWidth, clientHeight } = document.documentElement;
        const node = document.querySelector(".VexaDragHandle");
        const rect = node.getBoundingClientRect();
        if (rect.right < 10 || (rect.top > clientHeight - 20 || rect.bottom < 20) || rect.left > clientWidth - 20) {
            setPosition(defaultPosition);
        }
    };

    const closeAlert = (e: MouseEvent|any) => {
        e.preventDefault();
        setOutdatedClosed(true)
    }

    useEffect(() => {
        asyncMessengerService.putRequest(`/user-applications/check-version`, {
            app_version: chrome.runtime.getManifest()?.version,
        }).then(data => {
            if (false === data['is_actual']) {
                setOutdated(true);
                setLatestVersion(data['actual_version']);
            }
        });
    }, []);

    useEffect(() => {
        if (isCapturing) {
            setHasRecorded(true);
            sendMessage(MessageType.HAS_RECORDING_HISTORY, { hasRecordingHistory: true });
        }
    }, [isCapturing]);


    useEffect(() => {
        const handleResize = () => {
            if (isMaximized) {
                const { clientWidth, clientHeight } = document.documentElement;
                const node = document.querySelector(".VexaDragHandle");
                if (node) {
                    const rect = node.getBoundingClientRect();
                    if (rect.right < 10 || (rect.top > clientHeight || rect.bottom < 20) || rect.left > clientWidth - 20) {
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
                    disabled={isDraggableDisabled}
                >
                    <div id="vexa-content-div" className="flex flex-col w-[400px] bg-slate-950 m-4 p-4 rounded-lg overflow-y-auto overflow-x-hidden">
                        <AudioCaptureContext.Provider value={audioCapture}>
                            <NotificationContainer />
                            <VexaToolbar onDragHandleMouseOut={() => setIsDraggableDisabled(true)} onDragHandleMouseUp={() => setIsDraggableDisabled(true)} onDragHandleMouseOver={() => setIsDraggableDisabled(false)} toolbarRef={vexaToolbarRef} />

                            {outdated && !outdatedClosed && !isCapturing && <div style={{backgroundColor: 'red', color: 'white', padding: '5px 15px', borderRadius: '3px', marginBottom: '5px'}}>
                                Your version ({chrome.runtime.getManifest()?.version}) is outdated, please <a href={"https://chromewebstore.google.com/detail/vexa/ihibgadfkbefnclpbhdlpahfiejhfibl?hl=en&authuser=0&utm_medium=extension&utm_source=update"} target={'_blank'} style={{color: 'white', fontWeight: 'bold'}}>update extension</a> to the latest version. <a href="#" onClick={closeAlert} style={{color: 'white', fontWeight: 'bold'}}>Close</a>
                            </div>}

                            {isCapturing || hasRecorded
                                ? <>
                                    {!isCapturing && <MicrophoneOptions />}
                                    <MainContentView className={hasRecorded ? 'hasRecordingHistory' : ''} onMouseOut={() => setIsDraggableDisabled(true)} />
                                </>
                                : <>
                                    <MicrophoneOptions />
                                    <VexaBuildInfo className="mx-auto mt-auto" />
                                </>
                            }
                            <SpeakerEditorModal />
                            {/*<ThreadDeletePromptModal />*/}
                        </AudioCaptureContext.Provider>
                    </div>
                </Draggable>)
            }
        </>


    )
};

export default Vexa;