import React, { createContext, useEffect, useState } from 'react';
import useStateRef from 'react-usestateref';
import { MessageSenderService } from '~lib/services/message-sender.service';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { useStorage } from '@plasmohq/storage/hook';

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
    const [selectedMicrophone] = useStorage<MediaDeviceInfo>('selectedMicrophone');

    const messageSender = new MessageSenderService();


    const startAudioCapture = (label?: string) => {
        debugger;
        setState({
            ...stateRef.current,
            isCapturing: true,
        });
        messageSender.sendBackgroundMessage({ type: MessageType.START_RECORDING, data: { micLabel: label || selectedMicrophone?.label }});
    }

    const setSelectedAudioInputDevice = (device: MediaDeviceInfo) => {
        setSelectedAudioInput(device);
        setState({
            ...stateRef.current,
            selectedAudioInput: device,
        });
        debugger;
        messageSender.sendSidebarMessage({ type: MessageType.ON_MICROPHONE_SELECTED, data: { device }})
    }

    const requestMicrophones = () => {
            messageSender.sendBackgroundMessage({ type: MessageType.REQUEST_MEDIA_DEVICES });
    };

    const stopAudioCapture = () => {
        debugger;
        setIsCapturing(false);
        setState({
            ...stateRef.current,
            isCapturing: false,
        });
    };

    const pauseAudioCapture = () => {
        setIsCapturing(false);
        setState({
            ...stateRef.current,
            isCapturing: false,
        });
    };

    MessageListenerService.unRegisterMessageListener(MessageType.MEDIA_DEVICES);
    MessageListenerService.registerMessageListener(MessageType.MEDIA_DEVICES, (evtData) => {
        const devices = evtData.data?.devices;
        if (!devices) return;
        const microphones = devices.filter(device => device.kind === 'audioinput');
        const speakers = devices.filter(device => device.kind === 'audiooutput');
        setAvailableMicrophones(microphones);
        setAvailableSpeakers(speakers);
        console.log({_}, {...selectedAudioInputRef.current})
        setState({
            ...stateRef.current,
            availableAudioOutputs: speakers,
            availableAudioInputs: microphones,
            // selectedAudioInput: selectedAudioInput,
        });
        return devices;
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
