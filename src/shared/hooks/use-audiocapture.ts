import React, { createContext, useContext, useEffect, useState } from 'react';
import useStateRef from 'react-usestateref';

export type AudioCaptureState = boolean;

const initialState = {
    isCapturing: false,
};

export interface AudioCapture {
    isCapturing: boolean;
    state: typeof initialState;
    startAudioCapture: () => void;
    stopAudioCapture: () => void;
    captureTime: number, //Stream the capture time here every second
    pauseAudioCapture: () => void;
}

export const AudioCaptureContext = createContext<AudioCapture>({} as AudioCapture);

export const useAudioCapture = (): AudioCapture => {
    const [_, setState, stateRef] = useStateRef(initialState);
    const [isCapturing, setIsCapturing] = useStateRef(false);
    const [captureTime, setCaptureTime] = useStateRef(0);


    const startAudioCapture = () => {
        debugger;
        setIsCapturing(true);
        setState({
            ...initialState,
            isCapturing: true,
        });
    };

    const stopAudioCapture = () => {
        debugger;
        setIsCapturing(false);
        setState({
            ...initialState,
            isCapturing: false,
        });
    };

    const pauseAudioCapture = () => {
        setIsCapturing(false);
        setState({
            ...initialState,
            isCapturing: false,
        });
    };

    useEffect(() => {
        console.log('Capturing toggled', isCapturing);
    }, [isCapturing, stateRef.current.isCapturing]);

    return {
        isCapturing,
        state: stateRef.current,
        startAudioCapture,
        stopAudioCapture,
        captureTime, //Stream the capture time here every second
        // resetTranscript: speechRecognition.resetTranscript,
        pauseAudioCapture,
    };
};
