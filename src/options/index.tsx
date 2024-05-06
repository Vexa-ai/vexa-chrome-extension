import React, { useEffect } from 'react';

const OptionsIndex = () => {

    const getMediaPermissions = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            navigator.mediaDevices.enumerateDevices().then(devices => {
            }).catch(error => console.error('Error getting available microphones:', error));
          } catch (error) {
            console.log('Failed to get media permissions', error);
          }
    }
    useEffect(() => {
        getMediaPermissions();
    }, []);

    return null;
}

export default OptionsIndex;