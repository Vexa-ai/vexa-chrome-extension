import React, { useEffect, useState } from 'react';
import playIcon from "data-base64:~assets/images/svg/play-circle.svg";

import './VexaPlayButton.scss';
import { useAudioCapture } from '~shared/hooks/use-audiocapture';
import { useStorage } from '@plasmohq/storage/hook';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { getIdFromUrl } from '~shared/helpers/meeting.helper';
import { consoleDebug } from '~shared/helpers/utils.helper';
import { sendMessage } from '~shared/helpers/in-content-messaging.helper';

export interface VexaPlayButtonProps {
  [key: string]: any;
}

// Helper function to check if the node matches the criteria
function matchesCriteria(node) {
  return node.nodeType === 1 && // Ensure it's an element
      node.tagName === 'BUTTON' && // Ensure it's a button
      node['__incrementalDOMData']?.['key']?.includes('cJWe5b6:w1Dnpc6:JIvimb');
}

// Create a MutationObserver instance

export function VexaPlayButton({ ...rest }: VexaPlayButtonProps) {
  const audioCapture = useAudioCapture();
  const [selectedMicrophone] = StorageService.useHookStorage(StoreKeys.SELECTED_MICROPHONE);
  const [callTrulyStarted, setCallTrulyStarted] = useState(false);
  const meetingId = getIdFromUrl(location.href);
  const startCapture = (evt) => {
    if (evt.ctrlKey && evt.shiftKey) {
      console.debug('%c Debug recording started', "color: red; font-weight: bold; font-size: 1.4rem;");
      return audioCapture.startAudioCapture(true);
    }
    if (evt.ctrlKey && evt.altKey) {
      console.debug('%c Video debug recording started', "color: red; font-weight: bold; font-size: 1.4rem;");
      return audioCapture.startAudioCapture(false, true);
    }
    consoleDebug('Recording started');
    audioCapture.startAudioCapture();
  }

  useEffect(() => {
  }, [selectedMicrophone]);

  // useEffect(() => {
  //   document.addEventListener("DOMSubtreeModified", () => {
  //     const endCallBtn = Array.from(document.querySelectorAll('button') || []).find(button => button['__incrementalDOMData']?.['key'].includes('cJWe5b6:w1Dnpc6:JIvimb'));
  //     console.log({ endCallBtn });
  //     if(endCallBtn) {
  //       setCallTrulyStarted(true);
  //     } else {
  //       setCallTrulyStarted(false);
  //     }
  //     console.log({callTrulyStarted});
  //     endCallBtn?.addEventListener('click', audioCapture.stopAudioCapture);
  //   });
    
  //   return () => {
  //     // endCallBtn?.removeEventListener('click', audioCapture.stopAudioCapture);
  //   }
  // });

  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
          // Check if nodes were added
          if (mutation.addedNodes.length > 0) {
              for (const node of mutation.addedNodes) {
                  if (matchesCriteria(node)) {
                      // sendMessage({});
                      node.addEventListener('click', audioCapture.stopAudioCapture);
                      return;
                  }
              }
          }
          // Check if nodes were removed
          if (mutation.removedNodes.length > 0) {
              for (const node of mutation.removedNodes) {
                  if (matchesCriteria(node)) {
                    node.removeEventListener('click', audioCapture.stopAudioCapture);
                      return;
                  }
              }
          }
      }
    });
    
    // Specify what to observe
    const config = { childList: true, subtree: true };
    
    // Start observing the document body
    observer.observe(document.body, config);
  
    return () => {
      observer.disconnect();
    }
  }, [])
  

  return <div {...rest} className='VexaPlayButton'>
    <button disabled={!callTrulyStarted && (!selectedMicrophone || !meetingId)} onClick={startCapture} className='bg-[#9E77ED] hover:bg-[#b492f8] disabled:bg-[#CECFD2] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
      <img alt='' className='w-5 h-5' src={playIcon} />
      <span>Start recording</span>
    </button>

  </div>;
}
