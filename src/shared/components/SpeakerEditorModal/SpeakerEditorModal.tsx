import React, { useEffect, useState } from 'react';
import { onMessage } from '~shared/helpers/in-content-messaging.helper';
import './SpeakerEditorModal.scss';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { EditPenButton } from '../EditPenButton';
import closeIcon from "data-base64:~assets/images/svg/x-close.svg";
import { MessageSenderService } from '~lib/services/message-sender.service';
import { BouncingDots } from '../BouncingDots';

export interface SpeakerEditorModalProps { }

export function SpeakerEditorModal({ }: SpeakerEditorModalProps) {
  const [speakerData, setSpeakerData] = useState<any>({});
  const [initialSpeaker, setInitialSpeaker] = useState<string>('');
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [isUpdatingSpeakerName, setIsUpdatingSpeakerName] = useState(false);
  const messageSender = new MessageSenderService();

  const closeModal = () => {
    setIsUpdatingSpeakerName(false);
    setShowEditorModal(false);
  }

  const updateSpeakerName = () => {
    setIsUpdatingSpeakerName(true);
    messageSender.sendBackgroundMessage({
      type: MessageType.UPDATE_SPEAKER_NAME_REQUEST, data: {
        speaker_id: speakerData.speaker_id,
        alias: speakerData.speaker,
      }
    })
  }

  useEffect(() => {
    const speakerEditorCleanup = onMessage(MessageType.SPEAKER_EDIT_START, (speakerData: any) => {
      setSpeakerData(speakerData);
      setInitialSpeaker(speakerData.speaker || '');
      setShowEditorModal(true);
    });

    const speakerEditorCompletedCleanup = onMessage(MessageType.SPEAKER_EDIT_COMPLETE, (speakerData: any) => {
      console.log('In editor modal', {speakerData});
      closeModal();
    });

    return () => {
      speakerEditorCleanup();
      speakerEditorCompletedCleanup()
      MessageListenerService.unRegisterMessageListener(MessageType.UPDATE_SPEAKER_NAME_RESULT);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeakerData({ ...speakerData, speaker: e.target.value });
  };

  return (
    <div className='SpeakerEditorModal z-50'>
      {showEditorModal && (
        <div>
          <div className="ModalBackdrop top-0 left-0 fixed h-full w-full backdrop-blur">
            <div className="w-full h-full flex items-center justify-center">
              <div className="ModalUi mx-3 p-4 rounded-lg w-full bg-[#0C111D]">
                <div className="flex items-start bg-transparent">
                  <EditPenButton
                    svgClassName='w-[18px] h-[18px]'
                    className="border-[1.5px] border-[#333741] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white h-12 w-12"
                  />
                  <button onClick={closeModal} className='bg-transparent ml-auto'>
                    <img src={closeIcon} alt="Close modal" />
                  </button>
                </div>
                <h1 className="font-semibold text-lg text-[#F5F5F6] mb-5 mt-3">Change Speaker Name</h1>
                <div className="flex flex-col gap-2 mb-6">
                  <label htmlFor="name" className='text-[#CECFD2]'>Name</label>
                  <input
                    value={speakerData.speaker || ''}
                    onChange={handleInputChange}
                    type="text"
                    placeholder='Update speaker name'
                    className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2 text-white"
                    name='name'
                  />
                </div>
                <div className="flex flex-col w-full gap-2">
                  <button
                    disabled={isUpdatingSpeakerName || speakerData.speaker?.trim() === initialSpeaker || !speakerData.speaker?.trim()}
                    onClick={updateSpeakerName}
                    className="w-full p-2 rounded-md disabled:bg-[#1F242F] bg-[#7F56D9] disabled:text-[#85888E] text-white text-center font-semibold text-base"
                  >
                    {isUpdatingSpeakerName ? <BouncingDots className='py-[10px]' /> : 'Confirm'}
                  </button>
                  <button disabled={isUpdatingSpeakerName} onClick={closeModal} className="w-full p-2 rounded-md border border-[#333741] disabled:bg-[#1F242F] bg-[#161B26] text-[#CECFD2] text-center font-semibold text-base">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
