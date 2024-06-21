import React, { useEffect, useState } from 'react';
import { onMessage, sendMessage } from '~shared/helpers/in-content-messaging.helper';
import './SpeakerEditorModal.scss';
import { MessageType } from '~lib/services/message-listener.service';
import { EditPenButton } from '../EditPenButton';
import closeIcon from "data-base64:~assets/images/svg/x-close.svg";

export interface SpeakerEditorModalProps { }

export function SpeakerEditorModal({ }: SpeakerEditorModalProps) {
  const [speakerData, setSpeakerData] = useState<any>();
  const [showEditorModal, setShowEditorModal] = useState(false);


  const closeModal = () => {
    setShowEditorModal(false);
  }

  useEffect(() => {
    const speakerEditorCleanup = onMessage(MessageType.SPEAKER_EDIT_START, (speakerData: any) => {
      setSpeakerData(speakerData);
      setShowEditorModal(true);
    });

    return speakerEditorCleanup;
  }, []);

  return (
    <div className='SpeakerEditorModal z-50'>
      {showEditorModal && <div>
        <div className="ModalBackdrop top-0 left-0 fixed h-full w-full backdrop-blur">
          <div className="w-full h-full flex items-center justify-center">
            <div className="ModalUi mx-3 p-4 rounded-lg w-full bg-[#0C111D]">
              <div className="flex items-start bg-transparent">
                <EditPenButton svgClassName='w-[18px] h-[18px]' className="border-[1.5px] border-[#333741] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white h-12 w-12" />
                <button onClick={closeModal} className='bg-transparent ml-auto'>
                  <img src={closeIcon} alt="Close modal" />
                </button>
              </div>
              <h1 className="font-semibold text-lg text-[#F5F5F6] mb-5 mt-3">Change Speaker Name</h1>
              <div className="flex flex-col gap-2 mb-6">
                <label htmlFor="name" className='text-[#CECFD2]'>Name</label>
                <input value={speakerData?.speaker} type="text" placeholder='Update speaker name' className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2 text-white" name='name' />
              </div>
              <div className="flex flex-col w-full gap-2">
                <button disabled={!speakerData?.speaker.trim()} className="w-full p-2 rounded-md disabled:bg-[#1F242F] bg-[#7F56D9] disabled:text-[#85888E] text-white text-center font-semibold text-base">Confirm</button>
                <button onClick={closeModal} className="w-full p-2 rounded-md border border-[#333741] disabled:bg-[#1F242F] bg-[#161B26] text-[#CECFD2] text-center font-semibold text-base">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
