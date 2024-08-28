import React, {useEffect, useRef, useState} from 'react';
import './options.scss';
import {StorageService, type AuthorizationData, StoreKeys} from '~lib/services/storage.service';
import vexaPermissionsImage from "data-base64:~assets/images/svg/permissions-popup.png";
import googleMeetLogo from "data-base64:~assets/images/svg/google-meet-logo.svg";
import messageChat from "data-base64:~assets/images/svg/message-chat-circle.svg";
import searchIcon from "data-base64:~assets/images/svg/search.svg";
import {VexaBuildInfo, VexaLogo} from '~shared/components';
import {VexaIcon} from '~shared/components/VexaLogo/VexaIcon';

const OptionsIndex = () => {

  const [hasMediaPermissions, setHasMediaPermissions] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(false);

  const [isLoadingUserSettings, setIsLoadingUserSettings] = useState(false);
  const [doSendInitialChatMessage, setDoSendInitialChatMessage] = useState(false);

  const [isClosed, setIsClosed] = useState(false);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const [_, setVexaToken] = StorageService.useHookStorage<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
    __vexa_token: "",
    __vexa_main_domain: "",
    __vexa_chrome_domain: "",
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

  const goToGooleMeet = () => {
    window.open('https://meet.google.com', '__blank');
  }

  const goToVexaDashboard = () => {
    window.open('https://dashboard.vexa.ai', '__blank');
  }

  useEffect(() => {
    getMediaPermissions();
  }, []);


  const onSendInitialChatMessageChanged = (e) => {
    setDoSendInitialChatMessage(e.target.checked);
    setIsLoadingUserSettings(true);

    StorageService
      .get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {__vexa_token: "", __vexa_main_domain: "", __vexa_chrome_domain: ""})
      .then(authData => {
        fetch(`${authData['__vexa_main_domain']}/api/v1/users/update?token=${authData['__vexa_token']}`, {
          method: 'PATCH',
          headers: {'Content-type': 'application/json'},
          body: JSON.stringify({
            is_allowed_send_init_message: e.target.checked,
          }),
        })
          .finally(() => {
            setIsLoadingUserSettings(false);
          })
      });
  }

  useEffect(() => {
    setIsLoadingUserSettings(true);

    StorageService
      .get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {__vexa_token: "", __vexa_main_domain: "", __vexa_chrome_domain: ""})
      .then(authData => {
        console.log({authData});

        fetch(`${authData['__vexa_main_domain']}/api/v1/users/me?token=${authData['__vexa_token']}`)
          .then(res => res.json())
          .then(async res => {
            console.log({res});
            setDoSendInitialChatMessage(res.is_allowed_send_init_message || false);
          })
          .finally(() => {
            setIsLoadingUserSettings(false);
          })
        ;
      });

  }, []);

  return <div className='OptionsMain w-full h-screen flex flex-col bg-[#161B26]'>

    {(hasMediaPermissions || isClosed) ? <></> : <div className="absolute right-5 top-5 rounded-3xl bg-[#0C111D] border border-[#333741] flex flex-col p-8 w-[360px]">
      <VexaLogo/>
      <h2 className='text-base mt-7 font-semibold text-[#F5F5F6]'>Give Vexa microphone permissions to transcribe your audio</h2>
      <p className="text-sm font-normal text-[#94969C] mt-1">Don’t worry! We never keep your audio stored</p>
      <img className='my-7' src={vexaPermissionsImage} alt="Permissions popup"/>
      <button onClick={() => setIsClosed(true)} className='text-[#CECFD2] border border-[#333741] rounded-lg p-2 bg-[#101828] hover:bg-[#202c44]'>Dismiss</button>
    </div>}
    <div className="w-full h-screen grid grid-cols-2">
      <div className="flex flex-col items-end justify-center p-8 w-3/5">
        <div>
          <h1 className="font-semibold text-4xl text-[#F5F5F6]">SUCCESS!</h1>
          <p className="text-xl font-normal text-[#94969C] mt-1">Now you are ready to join the meetings</p>
        </div>
      </div>
      <div className="flex flex-col gap-[60px] items-start justify-center w-3/5">
        <div className="flex gap-2">
          <div className="w-[48px] h-[48px] rounded-lg border border-[#333741] flex items-center justify-center">
            <img src={messageChat} alt="Chat icon"/>
          </div>
          <div className='flex flex-col gap-2 flex-1'>
            <h1 className="font-semibold text-xl text-[#F5F5F6] flex items-center h-[48px]">Real-Time Transcription and Analysis</h1>
            <p className="text-base font-normal text-[#94969C]">Automatically transcribe meetings and analyze conversations in real-time to capture key points and action items.</p>
          </div>
        </div>

        <button onClick={goToGooleMeet} className="p-2 rounded-lg border border-[#333741] gap-2 flex items-center justify-center">
          <img src={googleMeetLogo} alt="Start a meeting"/>
          <span className="font-semibold text-[#CECFD2]">Go to Google Meet</span>
        </button>

        <div className="flex gap-2">
          <div className="w-[48px] h-[48px] rounded-lg border border-[#333741] flex items-center justify-center">
            <img src={searchIcon} alt="Search icon"/>
          </div>
          <div className='flex flex-col gap-2 flex-1'>
            <h1 className="font-semibold text-xl text-[#F5F5F6] flex items-center h-[48px]">AI-Powered Search & Prompts</h1>
            <p className="text-base font-normal text-[#94969C]">Quickly find relevant information from past meetings and communications using AI-powered search capabilities.</p>
          </div>
        </div>

        <button onClick={goToVexaDashboard} className="p-2 rounded-lg border border-[#333741] flex gap-2 items-center justify-center">
          <VexaIcon/>
          <span className="font-semibold text-[#CECFD2]">Go to Vexa Dashboard</span>
        </button>

        {!isLoadingUserSettings ? <label className="relative flex items-center mb-5 cursor-pointer">
          <input type="checkbox" value="" className="sr-only peer" checked={doSendInitialChatMessage} onChange={onSendInitialChatMessageChanged}/>
          <div
            className="w-9 h-5 bg-gray-200 hover:bg-gray-300 peer-focus:outline-0  rounded-full peer transition-all ease-in-out duration-500 peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600 hover:peer-checked:bg-indigo-700 "></div>
          <span className="ml-3 text-sm font-medium text-gray-600 ">Send notification in the chat about using vexa</span>
        </label> : <span className={"text-white"}>Loading...</span>}

      </div>
    </div>

    <VexaBuildInfo className=' mx-auto mt-auto mb-3 text-[#CECFD2]'/>

    <form action="" className="flex-col gap-3 w-96 shadow-md p-4 bg-gray-100 rounded-lg hidden">
      <p className='font-semibold'>
        {hasMediaPermissions
          ? <span className="text-green-500">Microphone permission enabled</span>
          : <span className="text-red-500">Microphone permission required</span>}
      </p>
      <div className="flex flex-col gap-2">
        <label htmlFor="token" className='font-semibold text-gray-600'>Token</label>
        <input id='token' ref={tokenInputRef} type="text" name="token" className="border rounded-lg w-full p-2 font-semibold text-gray-700"/>
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
  </div>;
}

export default OptionsIndex;