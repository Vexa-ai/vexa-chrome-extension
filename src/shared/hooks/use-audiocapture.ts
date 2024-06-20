import React, { createContext, useEffect, useRef, useState } from 'react';
import useStateRef from 'react-usestateref';
import { MessageSenderService } from '~lib/services/message-sender.service';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { StorageService, StoreKeys, type AuthorizationData } from '~lib/services/storage.service';
import { getIdFromUrl } from '~shared/helpers/meeting.helper';
import { downloadFileInContent } from '~shared/helpers/is-recordable-platform.helper';
import { consoleDebug } from '~shared/helpers/utils.helper';

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
    startAudioCapture: (isDebug?: boolean, isVideoDebug?: boolean) => void;
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
            await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            const devices = await navigator.mediaDevices.enumerateDevices();
            setDevices(devices);
        } catch (error) {
            if (error.message === 'Permission dismissed') {
                messageSender.sendBackgroundMessage({ type: MessageType.OPEN_SETTINGS });
            }
            console.log('Failed to get media permissions', error);
            setDevices([]);
            setSelectedMicrophone(null);
        }
    };

    const getConnectionId = async () => {
        const uuid = String(self.crypto.randomUUID());
        await chrome.storage.local.set({ _dl_connection_id: uuid, _dl_connection_session: 0 });

        return uuid;
    }

    const startAudioCapture = async (isDebug = false, isVideoDebug = false) => {
        const connectionId = await getConnectionId();
        const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
            __vexa_token: "",
            __vexa_main_domain: "",
            __vexa_chrome_domain: "",
        });
        const chrome_domain = authData.__vexa_chrome_domain;
        const token = authData.__vexa_token;
        const main_domain = authData.__vexa_main_domain;
        const meetingId = getIdFromUrl(location.href);
        if (!authData?.__vexa_token) {
            const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
            const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
            const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
            const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
            const systemZoom = width / window.screen.availWidth;
            const left = (width - 500) / 2 / systemZoom + dualScreenLeft
            const top = (height - 700) / 2 / systemZoom + dualScreenTop
            window.open(process.env.PLASMO_PUBLIC_LOGIN_ENDPOINT, '__blank', `popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=500,height=700,top=${top},left=${left}`);
            return;
        }

        startRecording(selectedMicrophone.label, connectionId, meetingId, token, chrome_domain, main_domain, isDebug, isVideoDebug);
        globalMediaRecorder = recorderRef.current;
        consoleDebug('Recording started');
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

    async function startRecording(micLabel, connectionId, meetingId, token, chrome_domain, main_domain, isDebug = false, isVideoDebug = false) {
        try {
            const deviceId = await getMicDeviceIdByLabel(micLabel);
            const combinedStream = await getCombinedStream(deviceId, isVideoDebug);
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

                        messageSender.sendOffscreenMessage({
                            type: MessageType.ON_MEDIA_CHUNK_RECEIVED,
                            data: {
                                chunk,
                                chunkType: blob.type,
                                bufferChunkData,
                                bufferString,
                                connectionId,
                                chrome_domain,
                                token,
                                main_domain,
                                meetingId,
                                isDebug,
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
                thisRecorder.start(5000);
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

    async function getMicDeviceIdByLabel(micLabel) {
        try {
            await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            const devices = await navigator.mediaDevices.enumerateDevices();

            return devices.find(d => "audioinput" === d.kind && d.label === micLabel)?.deviceId;
        } catch (e) {
            console.error('unable to enumerate devices', e);
        }
    }

    function blobToBase64(blob): Promise<string> {
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
            // return true;
        } catch (e) {
            messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: e?.message } });
        }
        // return false;
    }

    const getCombinedStream = async (deviceId, isVideoDebug = false) => {
        let videoOptions = { "width": 1, "height": 1, "frameRate": 1 };

        if (isVideoDebug) {
            videoOptions = JSON.parse(prompt("Video options", '{ "width": 1, "height": 1, "frameRate": 1 }'));
            console.log({ videoOptions });
        }
        const deviceStream = await navigator.mediaDevices.getDisplayMedia({ video: videoOptions, audio: { echoCancellation: false }, preferCurrentTab: true } as any);
        const microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, deviceId: deviceId ? { exact: deviceId } : undefined }
        });

        globalStreamsToClose = [deviceStream, microphoneStream];
        const deviceAudoTracks = deviceStream.getAudioTracks();
        const micAudioTracks = microphoneStream.getAudioTracks();

        [...deviceAudoTracks, ...micAudioTracks].forEach(track => {
            track.onended = () => {
                stopRecording();
            }
        });
        deviceStream.addEventListener('removetrack', () => {
            stopRecording();
        });

        microphoneStream.addEventListener('removetrack', () => {
            stopRecording();
        });

        const audioContext = new AudioContext();
        const audioSources = [];

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0;

        let audioTracksLength = 0;
        [deviceStream, microphoneStream].forEach(function (stream) {
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
