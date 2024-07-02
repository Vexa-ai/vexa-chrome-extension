import React, { useEffect, useRef, useState } from 'react';

import './AssistantList.scss';
import { AssistantEntry } from '../AssistantEntry';
import { AssistantInput } from '../AssistantInput';
import { MessageListenerService, MessageType } from '~lib/services/message-listener.service';
import { MessageSenderService } from '~lib/services/message-sender.service';
import { getIdFromUrl } from '~shared/helpers/meeting.helper';
import { StorageService, StoreKeys } from '~lib/services/storage.service';
import { BouncingDots } from '../BouncingDots/BouncingDots';
import { CustomSelect, type Option } from '../CustomSelect';
import threadIcon from "data-base64:~assets/images/svg/git-branch-01.svg";
import copyIcon from "data-base64:~assets/images/svg/copy-07.svg";
import trashIcon from "data-base64:~assets/images/svg/trash-03.svg";
import newMessageIcon from "data-base64:~assets/images/svg/message-plus-square.svg";

export interface AssistantEntryData {
  current_chain: number;
  user_message?: AssistantMessageUnit;
  assistant_message?: AssistantMessageUnit;
};

export interface AssistantChains {
  available_chains: (Thread & Option)[];
}

export interface Thread {
  chain: number;
}

export interface AssistantMessageUnit {
  user_id: string;
  meeting_id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface AssistantListProps {
  className?: string;
  chains?: AssistantChains;
  assistantList?: AssistantEntryData[];
  updatedAssistantList?: (assistantList: AssistantEntryData[], updatedChains: AssistantChains) => void;
}

export function AssistantList({ assistantList = [], chains = { available_chains: [] }, className = '', updatedAssistantList = (assistantList, chains) => { console.log({ assistantList }) } }: AssistantListProps) {

  const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const [isMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE);
  const [responses, setResponses] = useState<AssistantEntryData[]>([]);
  const [renderedResponses, setRenderedResponses] = useState<AssistantEntryData[]>([]);
  const [messageChains, setMessageChains] = useState<(Thread & Option)[]>([]);
  const [threads, setThreads] = useState<(Thread & Option)[]>([]);
  const [clearField, setClearField] = useState<boolean>(false);
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  const [previousChainId, setPreviousChainId] = useState(1);
  const [selectedThread, setSelectedThread] = useState<Thread & Option>();
  const [isOpen, setIsOpen] = useState(false);
  const assistantListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef(null);
  const messageSender = new MessageSenderService();

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_RESULT);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_RESULT, (message) => {
    console.log(message.data, responses);
    const response: AssistantEntryData = message.data;
    const newResponses = [...responses.filter(entry => entry.current_chain === selectedThread.chain)];
    newResponses[newResponses.length > 0 ? newResponses.length - 1 : 0] = response;
    setResponses([...newResponses]);
    setClearField(true);
    setIsPrompting(false);
  });

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_HISTORY);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_HISTORY, (result) => {
    const response: AssistantMessageUnit[] = result.data?.messages;
    console.log({ result });
    if (!result.data?.current_chain) return;
    if (!result.data.available_chains?.length && !threads?.length) {
      onStartNewThread();
    } else {
      const threadList: (Thread & Option)[] = result.data.available_chains?.map(chain => ({ chain: chain.number, label: chain.label, value: chain.number }));
      setThreads(threadList);
      setMessageChains(threadList);
    }
    if (response?.length) {
      const responseEntryData: AssistantEntryData[] = response?.map(responseUnit => {
        if (responseUnit.role === 'user') {
          return {
            current_chain: result.data.current_chain || 1,
            user_message: responseUnit,
          };
        } else {
          return {
            current_chain: result.data.current_chain || 1,
            assistant_message: responseUnit,
          };
        }
      });
      setResponses(responseEntryData);
    }
    setClearField(true);
    setIsPrompting(false);
    // console.log('filter assistant 1')
    // filterAssistantList();
  });

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_ERROR);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_ERROR, (message) => {
    setIsPrompting(false);
  });

  const onPrompted = async (prompt: string) => {
    try {
      const unRepliedMessageUnit: AssistantEntryData = {
        current_chain: selectedThread?.chain || 1,
        user_message: {
          user_id: '',
          text: prompt,
          meeting_id: getIdFromUrl(location.href),
          role: 'user',
          timestamp: new Date().toISOString(),
        }
      };
      setResponses([...responses, unRepliedMessageUnit]);
      setIsPrompting(true);
      await messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_PROMPT_REQUEST, data: { prompt, chain: selectedThread?.chain || 1 } });
      return true;
    } catch (error) {
      setIsPrompting(false);
      return false;
    }
  }

  const onStartNewThread = (updatedEntry?: AssistantMessageUnit) => {
    const sortedThreads = [...threads].sort((a, b) => a.chain - b.chain);
    if (!updatedEntry) {
      const lastAddedThread = sortedThreads.at(-1);
      if (lastAddedThread) {
        sortedThreads.push({ label: `New thread started ${lastAddedThread.chain + 1}`, value: lastAddedThread.chain + 1, chain: lastAddedThread.chain + 1 });
      } else {
        sortedThreads.push({ label: `New thread started`, value: 1, chain: 1 });
      }
    }
    // else {
    //   // Creating thread from a message
    //   // Call /fork endpoint to create for this
    //   // messageSender.sendBackgroundMessage({ 
    //   //   type: MessageType.FORK_MESSAGE_CHAIN,
    //   //   data: {
    //   //     "meeting_id": getIdFromUrl(location.href),
    //   //     "meeting_session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    //   //     "content": "string",
    //   //     "message_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    //   //   }
    //   // });
    //   const responsesData = [...responses];
    //   const responseForNewThreadIndex = responsesData.findIndex(rd => rd.user_message?.timestamp === updatedEntry.timestamp);
    //   if (responseForNewThreadIndex > -1) {
    //     responsesData[responseForNewThreadIndex].current_chain = sortedThreads.at(-1)?.chain + 1;
    //     sortedThreads.push({
    //       label: responsesData[responseForNewThreadIndex].user_message.text.substring(0, 10),
    //       value: responsesData[responseForNewThreadIndex].current_chain,
    //       chain: responsesData[responseForNewThreadIndex].current_chain,
    //     });
    //   }
    //   setResponses(responsesData);
    //   onPrompted(updatedEntry.text);
    // }
    // const sortedThreadChainIds = Array.from(new Set(sortedThreads.map(thread => thread.chain)));

    setThreads(sortedThreads);
    setSelectedThread(sortedThreads.at(-1));
    setMessageChains(sortedThreads);
  }

  const handleThreadChange = (newSelectedThread: typeof selectedThread) => {
    console.log({ newSelectedThread });
    setSelectedThread(newSelectedThread[0]);
    setIsOpen(false);
    console.log('filter assistant 2')
    filterAssistantList();
    // messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThread?.chain || 1 } });
  };

  const onDropdownOpenHandler = () => {
    setIsOpen(true);
  };

  const updateThreadList = () => {
    const threadGroupings: { [key: number]: AssistantEntryData[] } = {};
    responses.forEach(response => {
      if (threadGroupings[response.current_chain]) {
        threadGroupings[response.current_chain].push(response);
      } else {
        threadGroupings[response.current_chain] = [];
        threadGroupings[response.current_chain].push(response);
      }
    });
    // const orderedThreadKeys = Array.from(new Set([...Object.keys(threadGroupings).map(groupKey => Number(groupKey)).sort((a, b) => a - b), ...chainIds]));
    // const sortedThreads = orderedThreadKeys.map(threadKey => threadGroupings[threadKey] || []);
    // if (sortedThreads.length > 0) {
    //   console.log(sortedThreads);
    //   const threadOptions: (Thread & Option)[] = sortedThreads.map(threads => ({
    //     chain: threads[0]?.current_chain || 0,
    //     value: threads[0]?.current_chain || 0,
    //     label: threads[0]?.assistant_message ? threads[0]?.assistant_message.text.substring(0, 40) : threads[0]?.user_message.text.substring(0, 40) || 'New thread',
    //   }));
    //   // setThreads(threadOptions);
    //   if(!selectedThread) {
    //     // setSelectedThread(threadOptions[0]);
    //   }
    // }

  }

  const filterAssistantList = () => {
    console.log(selectedThread, previousChainId)
    debugger;
    if (selectedThread && (previousChainId !== selectedThread?.chain)) {
      setPreviousChainId(selectedThread?.chain || 1);
      const filteredChain = responses.filter(response => response.current_chain === selectedThread.chain);
      console.log({ filteredChain });
      if(filteredChain.length === 0) {
        console.log('Got here 1');
        messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThread?.chain || 1 } });
      }
      setRenderedResponses(filteredChain);
    } else {
      console.log('Got here 2');
      setRenderedResponses(responses);
    }
  }

  useEffect(() => {
    if (!selectedThread && threads.length > 0) {
      setSelectedThread(threads[0]);
    }
  }, [threads]);

  useEffect(() => {
    filterAssistantList();
  }, [selectedThread]);


  useEffect(() => {
    if (typeof isMaximized === 'boolean' && isMaximized && !assistantList?.length) {
      messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThread?.chain || 1 } });
      setIsPrompting(true);
    }
  }, [isMaximized]);

  useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    updatedAssistantList(responses, { available_chains: messageChains });
    updateThreadList();
    // console.log('filter assistant 3')
    filterAssistantList();
  }, [responses, messageChains]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownRef.current]);

  useEffect(() => {
    setResponses(assistantList);
    return () => {
      setIsPrompting(false);
      MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_RESULT);
    }
  }, [assistantList]);

  useEffect(() => {
    const threadList: (Thread & Option)[] = chains.available_chains?.map(chain => ({ chain: chain.chain, label: chain.label, value: chain.chain }));
      console.log(threadList);
      setThreads(threadList);
  }, [chains]);

  useEffect(() => {
    console.log('rendered');
    // messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST });
    // filterAssistantList();
    // filterAssistantList();
    // onStartNewThread();
  }, []);


  return <div ref={assistantListRef} className={`AssistantList flex flex-col mb-[60px] max-h-full w-full overflow-hidden ${className}`}>
    <div className="flex py-2 gap-3 w-full max-w-[368px]">
      <div className='flex-grow' ref={dropdownRef}>
        <CustomSelect
          placeholder={<ThreadPlaceholder />}
          selectedComponent={ThreadSelected}
          options={threads}
          isMulti={false}
          keepOpen={isOpen}
          selectedValue={selectedThread}
          isSearchable={false}
          onOpen={onDropdownOpenHandler}
          onChange={handleThreadChange}
          align="left"
          noOptionsComponent={ThreadNoOption}
          optionComponent={ThreadOption}
        />
      </div>

      <button onClick={() => onStartNewThread()} className="flex gap-2 p-2 justify-center items-center rounded-md border border-[#333741] disabled:bg-[#1F242F] bg-[#161B26] text-[#CECFD2] text-center font-semibold text-base">
        <img src={newMessageIcon} alt="New thread" />
        New
      </button>
    </div>
    {
      renderedResponses.length ? <div className="flex-grow overflow-y-auto">
        {/* {renderedResponses.map((res, index) => <span key={index}>{JSON.stringify(res)}</span>)} */}
        {renderedResponses.map((entry, index) => (
          <div key={index} ref={renderedResponses.length - 1 === index ? lastEntryRef : null}>
            {entry.user_message && <AssistantEntry onTextUpdated={onStartNewThread} entryData={entry.user_message} />}
            {entry.assistant_message && <AssistantEntry entryData={entry.assistant_message} />}
          </div>
        ))}
      </div> : null
    }
    {isPrompting && <div className={`flex flex-grow-0 p-3 w-[fit-content] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] ${responses.length ? '' : 'mt-2'}`}>
      <BouncingDots />
    </div>
    }
    <AssistantInput clearField={clearField} setClearField={setClearField} onEnter={onPrompted} className='bg-slate-950 mb-2 ml-1 absolute bottom-3' />
  </div >;
}

const ThreadNoOption: React.FC = () => (
  <div className={`flex gap-2 items-center bg-[#1F242F] py-1 px-2 text-[#F5F5F6] rounded-lg`}>
    <p className='min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full mx-auto text-sm flex items-center'>No threads</p>
  </div>
);

const ThreadPlaceholder: React.FC = () => (
  <div className='flex gap-2 text-[#CECFD2] font-semibold items-center w-full overflow-hidden'>
    <img alt='' className='w-5' src={threadIcon} />
    <p className='flex items-center justify-center min-h-6 text-sm'>Threads</p>
  </div>
);

const ThreadSelected: React.FC<{ value: any; label: string }> = (values) => (
  <div className='flex w-full gap-1 overflow-hidden'>
    <img alt='' className='w-5' src={threadIcon} />
    <p className='text-[#F5F5F6] min-h-6 mr-auto w-auto whitespace-nowrap text-ellipsis flex items-center overflow-hidden text-sm' title={values.label}>{values.label}</p>
  </div>
);

const ThreadOption: React.FC<{ option: Option; selected: boolean; onClick: () => void }> = ({ option, selected, onClick }) => {
  const newFromThread = () => { };
  const deleteThread = () => { };

  return <div className={`flex gap-2 ${selected ? 'bg-[#333741]' : 'bg-[#1F242F]'} py-2 px-2 group hover:bg-[#333741] text-[#CECFD2] text-sm font-semibold rounded-lg`}>
    <p onClick={onClick} className='mr-auto min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full flex-grow text-left' title={option.label}>
      {option.label}
    </p>
    <div className="flex gap-2">
      <button onClick={newFromThread} className="bg-transparent h-5 w-5 hidden group-hover:block">
        <img src={copyIcon} alt="Copy thread" />
      </button>

      <button onClick={deleteThread} className="bg-transparent h-5 w-5 hidden group-hover:block">
        <img src={trashIcon} alt="Delete thread" />
      </button>
    </div>
  </div>
};
