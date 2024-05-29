import React, { useEffect, useRef, useState } from 'react';
import './options.scss';
import { StorageService, type AuthorizationData, StoreKeys } from '~lib/services/storage.service';
import { VexaBuildInfo } from '~shared/components';

const OptionsIndex = () => {

  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(false);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const [_, setVexaToken] = StorageService.useHookStorage<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
    __vexa_token: "",
    __vexa_domain: ""
  });

  const getMediaPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      navigator.mediaDevices.enumerateDevices().then(devices => {
      }).catch(error => console.error('Error getting available microphones:', error));
      setHasMediaPermissions(true);
    } catch (error) {
      console.log('Failed to get media permissions', error);
      setHasMediaPermissions(false);
    }
  };

  const saveToken = (evt) => {
    evt.preventDefault();
    setVexaToken({
      ..._,
      __vexa_token: tokenInputRef.current?.value.trim(),
    });
    alert('Token saved!');
    tokenInputRef.current.value = '';
  };

  const checkToken = (evt) => {
    evt.preventDefault();
    setIsCheckingToken(true);
    fetch(`${process.env.PLASMO_PUBLIC_CHROME_AWAY_BASE_URL}/api/v1/extension/check-token?token=${tokenInputRef.current?.value.trim()}`).then(async res => {
      setIsCheckingToken(false);
      if (res.status >= 400) {
        if (res.status == 401) {
          alert('Token IS INCORRECT');
        } else {
          alert('Error occured while checking token');
        }
      } else {
        alert('Token correct');
      }
    }, err => {
      setIsCheckingToken(false);
      alert('Token IS INCORRECT');
    });
  };

  useEffect(() => {
    getMediaPermissions();
  }, []);

  return <div className='OptionsMain w-full h-screen items-center justify-center flex flex-col'>
    <form action="" className="flex flex-col gap-3 w-96 shadow-md p-4 bg-gray-100 rounded-lg">
      <p className='font-semibold'>
        {hasMediaPermissions
          ? <span className="text-green-500">Microphone permission enabled</span>
          : <span className="text-red-500">Microphone permission required</span>}
      </p>
      <div className="flex flex-col gap-2">
        <label htmlFor="token" className='font-semibold text-gray-600'>Token</label>
        <input id='token' ref={tokenInputRef} type="text" name="token" className="border rounded-lg w-full p-2 font-semibold text-gray-700" />
      </div>
      <div className="flex justify-between w-full">
        <button disabled={isCheckingToken} onClick={saveToken} className="p-3 text-white font-medium bg-blue-700 rounded-xl">
          Save token
        </button>

        <button disabled={isCheckingToken} onClick={checkToken} className="p-3 text-blue-600 font-bold bg-transparent">
          Check token
        </button>
      </div>
    </form>
    <VexaBuildInfo className='mt-4'/>
  </div>;
}

export default OptionsIndex;