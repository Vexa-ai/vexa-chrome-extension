import React, { createContext, useEffect, useState } from 'react';
import useStateRef from 'react-usestateref';
import { MessageSenderService } from '~lib/services/message-sender.service';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { StorageService, StoreKeys, type AuthorizationData } from '~lib/services/storage.service';

export type AudioCaptureState = boolean;
MessageListenerService.initializeListenerService();

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
    startAudioCapture: () => void;
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
    const [__, setIsCapturingStoreState] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
    const [___, setRecordStartTime] = StorageService.useHookStorage<number>(StoreKeys.RECORD_START_TIME);
    const messageSender = new MessageSenderService();
    const [authData] = StorageService.useHookStorage<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA);
    const [recorder, setRecorder] = useState<MediaRecorder>(null);
    const [streamsToClose, setStreamsToClose] = useState<MediaStream[]>([]);
    const [timestamp, setTimestamp] = useState<number>();
    const [counter, setCounter] = useState<number>();

    const requestMicrophonesInContent = async () => {
        try {
            navigator.mediaDevices.enumerateDevices().then(async devices => {
                setDevices(devices);
            }).catch(error => console.error('Error getting available microphones:', error));
        } catch (error) {
            if (error.message === 'Permission dismissed') {
                messageSender.sendBackgroundMessage({ type: MessageType.OPEN_SETTINGS })
            }
            console.log('Failed to get media permissions', error);
            setDevices([]);
        }
    }

    async function getConnectionId() {
        const uuid = String(self.crypto.randomUUID());
        await chrome.storage.local.set({ _dl_connection_id: uuid, _dl_connection_session: 0 });

        return uuid;
    }


    const startAudioCapture = async () => {
        const connectionId = await getConnectionId();
        const domain = process.env.PLASMO_PUBLIC_CHROME_AWAY_BASE_URL;
        const token = authData.__vexa_token;
        const url = authData.__vexa_domain;
        const meetingId = 'meeting1';
        startRecording(selectedMicrophone.label, connectionId, meetingId, token, domain, url)
    }

    const setSelectedAudioInputDevice = async (device: MediaDeviceInfo) => {
        setSelectedAudioInput(device);
        await setSelectedMicrophone(device);
        setState({
            ...stateRef.current,
            selectedAudioInput: device,
        });
        // messageSender.sendSidebarMessage({ type: MessageType.ON_MICROPHONE_SELECTED, data: { device } });
        messageSender.sendBackgroundMessage({ type: MessageType.START_MIC_LEVEL_STREAMING, data: { micLabel: device.label || selectedMicrophone?.label } })
    }

    const requestMicrophones = async () => {
        console.log('Requesting microphones')
        await requestMicrophonesInContent();
        messageSender.sendOffscreenMessage({ type: MessageType.REQUEST_MEDIA_DEVICES });
        // 
    };

    const stopAudioCapture = () => {
        messageSender.sendBackgroundMessage({ type: MessageType.REQUEST_STOP_RECORDING });
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
    }

    async function startRecording(micLabel, connectionId, meetingId, token, domain, url) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let isStopped = false;

            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true, preferCurrentTab: true } as any);
            const audioTracks = displayStream.getAudioTracks();
            if (audioTracks.length > 0) {
                stream.addTrack(audioTracks[0]);
            }

            const thisRecorder = new MediaRecorder(stream);

            let countIndex = 0;
            thisRecorder.ondataavailable = async (event) => {
                const blob = await event.data;
                const chunk = await blobToBase64(blob);
                console.log(event.data);
                messageSender.sendOffscreenMessage({
                    type: MessageType.ON_MEDIA_CHUNK_RECEIVED, data: {
                        chunk,
                        chunkType: blob.type,
                        connectionId,
                        domain,
                        token,
                        url,
                        meetingId,
                        countIndex: countIndex++,
                    }
                });
            };

            thisRecorder.onerror = (error) => {
                debugger
                console.error(error)
                messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'An error occured' } })
            };

            thisRecorder.onstop = () => {
                // debugger;
                // setRecorder(null);
                // window.location.hash = '';
                // isStopped = true;
                messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'Recording stopped' } })

            }

            thisRecorder.start(3000);
            setIsCapturing(true);
            await setIsCapturingStoreState(true);
            await setRecordStartTime(new Date().getTime());
            setState({
                ...stateRef.current,
                isCapturing: true,
            });
            messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_STARTED })

            // return true;
        } catch (error) {
            await stopRecording();
        }
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]); // Only get the base64 part
                } else {
                    reject(new Error("FileReader result is not a string"));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function stopRecording() {
        try {
            if (["recording", "paused"].includes(recorder?.state)) {
                recorder.stop(); // WS disconnect after recorder stop
                recorder.stream.getTracks().forEach(t => t.stop());

                streamsToClose.forEach(stream => {
                    stream.getTracks().forEach(track => track.stop());
                })
            }
            window.location.hash = '';
            messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'Recording stopped' } })

            return true;
        } catch (e) {
            messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: e?.message } })
        }
        return false;
    }

    const getCombinedStream = async (deviceId) => {
        // Capturing microphone and tab audio
        // debugger;
        // const microphone = await navigator.mediaDevices.getUserMedia({
        //   audio: { echoCancellation: true, deviceId: deviceId ? { exact: deviceId } : undefined }
        // });

        const streamOriginal = await navigator.mediaDevices.getDisplayMedia({
            audio: { echoCancellation: true, deviceId: deviceId ? { exact: deviceId } : undefined, mandatory: { chromeMediaSource: "tab" } },
            video: true,
        } as any);
        debugger;
        setStreamsToClose([/*microphone, */ streamOriginal]);

        // Making original sound available in the tab
        const context = new AudioContext();
        const stream = context.createMediaStreamSource(streamOriginal);
        stream.connect(context.destination);


        // Merging stream together
        const audioContext = new AudioContext();
        const audioSources = [];

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0; // don't hear self

        let audioTracksLength = 0;
        [/*microphone, */ streamOriginal].forEach(function (stream) {
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
