import React, { createContext, useEffect, useRef, useState } from 'react';
import useStateRef from 'react-usestateref';
import { MessageSenderService } from '~lib/services/message-sender.service';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { StorageService, StoreKeys, type AuthorizationData } from '~lib/services/storage.service';
import { getIdFromUrl } from '~shared/helpers/meeting.helper';
import { downloadFileInContent } from '~shared/helpers/is-recordable-platform.helper';

export type AudioCaptureState = boolean;
MessageListenerService.initializeListenerService();

let globalMediaRecorder: MediaRecorder;
let globalStreamsToClose: MediaStream[] = [];

const initialState: Partial<AudioCapture> = {
    isCapturing: false,
    captureTime: 0,
    selectedAudioInput: {} as MediaDeviceInfo,
    availableAudioInputs: [],
    availableAudioOutputs: [],
};

export interface AudioCapture {
    isCapturing: boolean;
    state: typeof initialState;
    selectedAudioInput?: MediaDeviceInfo;
    startAudioCapture: (isDebug?: boolean) => void;
    stopAudioCapture: () => void;
    captureTime: number;
    pauseAudioCapture: () => void;
    requestMicrophones: () => void;
    setSelectedAudioInputDevice(device: MediaDeviceInfo);
    availableAudioInputs: MediaDeviceInfo[];
    availableAudioOutputs: MediaDeviceInfo[];
}

export const AudioCaptureContext = createContext<AudioCapture>({} as AudioCapture);

export const useAudioCapture = (): AudioCapture => {
    const [_, setState, stateRef] = useStateRef(initialState);
    const [isCapturing, setIsCapturing] = useStateRef(false);
    const [captureTime, setCaptureTime] = useStateRef(0);
    const [selectedAudioInput, setSelectedAudioInput, selectedAudioInputRef] = useStateRef<MediaDeviceInfo>();
    const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
    const [availableSpeakers, setAvailableSpeakers] = useState<MediaDeviceInfo[]>([]);
    const [selectedMicrophone, setSelectedMicrophone] = StorageService.useHookStorage<MediaDeviceInfo>(StoreKeys.SELECTED_MICROPHONE);
    const [capturingState, setIsCapturingStoreState] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
    const [___, setRecordStartTime] = StorageService.useHookStorage<number>(StoreKeys.RECORD_START_TIME);
    const messageSender = new MessageSenderService();
    const [authData] = StorageService.useHookStorage<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA);
    const recorderRef = useRef<MediaRecorder | null>(null);

    const requestMicrophonesInContent = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setDevices(devices);
        } catch (error) {
            if (error.message === 'Permission dismissed') {
                messageSender.sendBackgroundMessage({ type: MessageType.OPEN_SETTINGS });
            }
            console.log('Failed to get media permissions', error);
            setDevices([]);
        }
    };

    const getConnectionId = async () => {
        const uuid = String(self.crypto.randomUUID());
        await chrome.storage.local.set({ _dl_connection_id: uuid, _dl_connection_session: 0 });

        return uuid;
    }

    const startAudioCapture = async (isDebug = false) => {
        const connectionId = await getConnectionId();
        const domain = process.env.PLASMO_PUBLIC_CHROME_AWAY_BASE_URL;
        const token = authData.__vexa_token;
        const url = authData.__vexa_domain;
        const meetingId = getIdFromUrl(location.href);

        startRecording(selectedMicrophone.label, connectionId, meetingId, token, domain, url, isDebug);
        globalMediaRecorder = recorderRef.current;
    };

    const setSelectedAudioInputDevice = async (device: MediaDeviceInfo) => {
        setSelectedAudioInput(device);
        await setSelectedMicrophone(device);
        setState({
            ...stateRef.current,
            selectedAudioInput: device,
        });
        messageSender.sendBackgroundMessage({ type: MessageType.START_MIC_LEVEL_STREAMING, data: { micLabel: device.label || selectedMicrophone?.label } });
    };

    const requestMicrophones = async () => {
        await requestMicrophonesInContent();
        messageSender.sendOffscreenMessage({ type: MessageType.REQUEST_MEDIA_DEVICES });
    };

    const stopAudioCapture = () => {
        stopRecording();
    };

    const pauseAudioCapture = () => {
        setIsCapturing(false);
    };

    const setDevices = (devices: MediaDeviceInfo[]) => {
        if (!devices) return;
        const microphones = devices.filter(device => device.kind === 'audioinput');
        const speakers = devices.filter(device => device.kind === 'audiooutput');
        setAvailableMicrophones(microphones);
        setAvailableSpeakers(speakers);
        setState({
            ...stateRef.current,
            availableAudioOutputs: speakers,
            availableAudioInputs: microphones,
        });
        return devices;
    };

    async function startRecording(micLabel, connectionId, meetingId, token, domain, url, isDebug = false) {
        try {
            // Capture microphone audio
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Capture display (screen/tab) with system audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true, preferCurrentTab: true } as any);
            const displayAudioTracks = displayStream.getAudioTracks();
            const micAudioTracks = micStream.getAudioTracks();
            const combinedStream = new MediaStream();
            displayAudioTracks.forEach(track => combinedStream.addTrack(track));
            micAudioTracks.forEach(track => combinedStream.addTrack(track));
            // const videoTracks = displayStream.getVideoTracks();
            // videoTracks.forEach(track => combinedStream.addTrack(track));
            [...displayAudioTracks, ...micAudioTracks].forEach(track => {
                track.onended = () => {
                    stopRecording();
                }
            });

            displayStream.addEventListener('removetrack', () => {
                stopRecording();
            });

            micStream.addEventListener('removetrack', () => {
                stopRecording();
            });

            globalStreamsToClose = [micStream, displayStream];

            // Initialize MediaRecorder with the combined stream
            const thisRecorder = new MediaRecorder(combinedStream);
            let countIndex = 0;

            thisRecorder.ondataavailable = async (event: BlobEvent) => {
                try {
                    if (event.data.size > 0) {
                        if (isDebug) {
                            downloadFileInContent(`vexa_${Date.now()}.webm`, event.data);
                            return;
                        }

                        const blob = event.data;
                        const chunk = await blobToBase64(blob);
                        const bufferChunk = await blob.arrayBuffer();
                        const bufferString = new TextDecoder().decode(bufferChunk);
                        const bufferChunkData = bufferChunk;

                        console.log(event.data, bufferChunk, bufferString, bufferChunkData);

                        messageSender.sendOffscreenMessage({
                            type: MessageType.ON_MEDIA_CHUNK_RECEIVED,
                            data: {
                                chunk,
                                chunkType: blob.type,
                                bufferChunkData,
                                bufferString,
                                connectionId,
                                domain,
                                token,
                                url,
                                meetingId,
                                countIndex: countIndex++,
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error processing data available event:', error);
                }
            };

            thisRecorder.onerror = async (error) => {
                console.error(error);
                await stopRecording();
            };

            thisRecorder.onstop = async () => {
                await stopRecording();
            };

            if (isDebug) {
                thisRecorder.start();
            } else {
                thisRecorder.start(3000);
            }

            recorderRef.current = thisRecorder;
            globalMediaRecorder = thisRecorder;
            setIsCapturing(true);
            await setIsCapturingStoreState(true);
            await setRecordStartTime(new Date().getTime());
            setState({
                ...stateRef.current,
                isCapturing: true,
            });
            messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_STARTED });

        } catch (error) {
            await stopRecording();
        }
    }

    function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result instanceof ArrayBuffer) {
                    resolve(reader.result);
                } else {
                    reject(new Error("FileReader result is not an ArrayBuffer"));
                }
            };
            reader.onerror = () => {
                reject(new Error("FileReader failed to read blob"));
            };
            reader.readAsArrayBuffer(blob);
        });
    }


    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                } else {
                    reject(new Error("FileReader result is not a string"));
                }
            };
            reader.onerror = () => {
                reject(new Error("FileReader failed to read blob"));
            };
            reader.readAsDataURL(blob);
        });
    }

    async function stopRecording() {
        try {
            const recorder = globalMediaRecorder;
            debugger;
            if (recorder && ["recording", "paused"].includes(recorder.state)) {
                recorder.stop();
                recorder.stream.getTracks().forEach(t => t.stop());

                globalStreamsToClose.forEach(stream => {
                    stream.getTracks().forEach(track => track.stop());
                });


                globalStreamsToClose?.forEach(stream => {
                    stream.getTracks().forEach(track => track.stop());
                });
                messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'Recording stopped' } });
            }
            return true;
        } catch (e) {
            messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: e?.message } });
        }
        return false;
    }

    const getCombinedStream = async (deviceId) => {
        const streamOriginal = await navigator.mediaDevices.getDisplayMedia({
            audio: { echoCancellation: true, deviceId: deviceId ? { exact: deviceId } : undefined, mandatory: { chromeMediaSource: "tab" } },
            video: true,
        } as any);

        globalStreamsToClose = [streamOriginal];

        const context = new AudioContext();
        const stream = context.createMediaStreamSource(streamOriginal);
        stream.connect(context.destination);

        const audioContext = new AudioContext();
        const audioSources = [];

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0;

        let audioTracksLength = 0;
        [streamOriginal].forEach(function (stream) {
            if (!stream.getTracks().filter(function (t) {
                return t.kind === 'audio';
            }).length) {
                return;
            }

            audioTracksLength++;

            let audioSource = audioContext.createMediaStreamSource(stream);
            audioSource.connect(gainNode);
            audioSources.push(audioSource);
        });

        const audioDestination = audioContext.createMediaStreamDestination();
        audioSources.forEach(function (audioSource) {
            audioSource.connect(audioDestination);
        });
        return audioDestination.stream;
    };

    MessageListenerService.unRegisterMessageListener(MessageType.ON_RECORDING_STARTED);
    MessageListenerService.unRegisterMessageListener(MessageType.ON_RECORDING_END);
    MessageListenerService.registerMessageListener(MessageType.ON_RECORDING_END, async () => {
        setIsCapturing(false);
        await setIsCapturingStoreState(false);
        await setRecordStartTime(0);
        setState({
            ...stateRef.current,
            isCapturing: false,
        });
    });

    MessageListenerService.unRegisterMessageListener(MessageType.MEDIA_DEVICES);
    MessageListenerService.registerMessageListener(MessageType.MEDIA_DEVICES, (evtData) => {
        return setDevices(evtData.data.devices);
    });

    useEffect(() => {
        requestMicrophones();
    }, []);

    useEffect(() => {
        if (typeof capturingState === 'boolean' && !capturingState) {
            console.log('Stopping')
            stopAudioCapture();
        }
    }, [capturingState]);

    useEffect(() => {
        setState(prevState => ({
            ...prevState,
            selectedAudioInput: selectedAudioInput,
        }));
    }, [selectedAudioInput]);

    return {
        isCapturing,
        state: stateRef.current,
        selectedAudioInput: selectedAudioInputRef.current,
        startAudioCapture,
        stopAudioCapture,
        captureTime, //Stream the capture time here every second
        availableAudioInputs: availableMicrophones,
        availableAudioOutputs: availableSpeakers,
        pauseAudioCapture,
        requestMicrophones,
        setSelectedAudioInputDevice,
    };
};
