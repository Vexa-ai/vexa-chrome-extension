import React, { useCallback, useEffect, useRef, useState } from 'react';

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
import { onMessage, sendMessage } from '~shared/helpers/in-content-messaging.helper';

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
    const response: AssistantEntryData = message.data;
    const newResponses = [...responses.filter(entry => entry.current_chain === selectedThread.chain)];
    newResponses[newResponses.length > 0 ? newResponses.length - 1 : 0] = response;
    console.log(71, { newResponses });
    setResponses([...newResponses]);
    setClearField(true);
    setIsPrompting(false);
  });

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_HISTORY);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_HISTORY, (result) => {
    const response: AssistantMessageUnit[] = result.data?.messages;
    if (!result.data?.current_chain) {
      if (!result.data.available_chains?.length && !threads?.length) {
        onStartNewThread();
      }
      setClearField(true);
      setIsPrompting(false);
      return;
    };
    if (!result.data.available_chains?.length && !threads?.length) {
      onStartNewThread();
    } else {
      const threadList: (Thread & Option)[] = result.data.available_chains?.map(chain => ({ chain: chain.number, label: chain.label, value: chain.number }));
      setThreads(threadList);
      setMessageChains(threadList);
    }
    if (response?.length) {
      // console.log({response});
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
      console.log(111, { responseEntryData })
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

  MessageListenerService.unRegisterMessageListener(MessageType.THREAD_DELETED);
  MessageListenerService.registerMessageListener(MessageType.THREAD_DELETED, (message) => {
    const threadIndex = threads.findIndex(thread => thread.chain === message.data.chain);
    sendMessage(MessageType.DELETE_THREAD_COMPLETE);
    if (threadIndex !== -1) {
      const updatedThreads = [...threads];
      updatedThreads.splice(threadIndex, 1);
      setThreads(updatedThreads);
      setSelectedThread(updatedThreads.at(-1));
    }
  });

  MessageListenerService.unRegisterMessageListener(MessageType.THREAD_DELETED_ERROR);
  MessageListenerService.registerMessageListener(MessageType.THREAD_DELETED_ERROR, (message) => {
    // setIsPrompting(false);
  });

  const onPrompted = async (prompt: string, chain = undefined) => {
    try {
      const unRepliedMessageUnit: AssistantEntryData = {
        current_chain: chain || selectedThread?.chain || 1,
        user_message: {
          user_id: '',
          text: prompt,
          meeting_id: getIdFromUrl(location.href),
          role: 'user',
          timestamp: new Date().toISOString(),
        }
      };
      console.log(153, { xx: [...responses, unRepliedMessageUnit] })
      setResponses([...responses, unRepliedMessageUnit]);
      setIsPrompting(true);
      await messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_PROMPT_REQUEST, data: { prompt, chain: chain || selectedThread?.chain || 1 } });
      return true;
    } catch (error) {
      setIsPrompting(false);
      return false;
    }
  };

  const createThreadFromUserPrompt = (updatedEntry?: AssistantMessageUnit) => {
    debugger;
    onStartNewThread((createdThread) => {
      if (updatedEntry?.text) {
        console.log(selectedThread);
        onPrompted(updatedEntry.text, createdThread.chain);
      }
    });
  }

  const onStartNewThread = (callback?: (createdThread:  Thread & Option) => void) => {
    const sortedThreads = [...threads].sort((a, b) => a.chain - b.chain);
    const lastAddedThread = sortedThreads.at(-1);
    if (lastAddedThread) {
      sortedThreads.push({ label: `New thread started ${lastAddedThread.chain + 1}`, value: lastAddedThread.chain + 1, chain: lastAddedThread.chain + 1 });
    } else {
      sortedThreads.push({ label: `New thread started`, value: 1, chain: 1 });
    }
    setThreads(sortedThreads);
    const newThread = sortedThreads.at(-1);
    
    setMessageChains(sortedThreads);
    setResponses([]);
    if (callback) {
      // callback();
      setSelectedThread(() => {
        callback(newThread);
        return {...newThread};
    });
    } else {
      setSelectedThread({...newThread});
    }
  }

  const handleThreadChange = (newSelectedThread: typeof selectedThread) => {
    setSelectedThread(newSelectedThread[0]);
    setIsOpen(false);
    filterAssistantList();
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
  }

  const filterAssistantList = () => {
    if (selectedThread && (previousChainId !== selectedThread?.chain)) {
      setPreviousChainId(selectedThread?.chain || 1);
      const filteredChain = responses.filter(response => response.current_chain === selectedThread.chain);
      console.log({ filteredChain });
      if (filteredChain.length === 0) {
        messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThread?.chain || 1 } });
      }
      setRenderedResponses(filteredChain);
    } else {
      setRenderedResponses(responses);
    }
  }

  useEffect(() => {
    if (!selectedThread && threads.length > 0) {
      setSelectedThread(threads[0]);
    }
  }, [threads]);

  useEffect(() => {
    console.log({selectedThread});
    debugger;
    filterAssistantList();
  }, [selectedThread]);


  useEffect(() => {
    if (isMaximized) {
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
    console.log(311, { assistantList });
    setResponses(assistantList);
    return () => {
      setIsPrompting(false);
      MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_RESULT);
    }
  }, [assistantList]);

  useEffect(() => {
    const threadList: (Thread & Option)[] = chains.available_chains?.map(chain => ({ chain: chain.chain, label: chain.label, value: chain.chain }));
    setThreads(threadList);
  }, [chains]);

  useEffect(() => {
    const deleteThreadCleanup = onMessage(MessageType.DELETE_THREAD, (data: { chain: number }) => {
      messageSender.sendBackgroundMessage({ type: MessageType.DELETE_THREAD, data });
    });
    // const duplicateThreadCleanup = onMessage(MessageType.DUPLICATE_THREAD, (data: { chain: number}) => {
    //   duplicateThread(threads.find(thread => thread.chain === data.chain));
    // });
    return () => {
      deleteThreadCleanup();
      // duplicateThreadCleanup();
    }
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
            {entry.user_message && <AssistantEntry onTextUpdated={createThreadFromUserPrompt} entryData={entry.user_message} />}
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

const ThreadOption: React.FC<{ option: Option; options: Option[]; selected: boolean; onClick: () => void }> = ({ option, options, selected, onClick }) => {
  const newFromThread = () => {
    // sendMessage(MessageType.DELETE_THREAD_START, { thread: option });
  };
  const deleteThread = () => {
    sendMessage(MessageType.DELETE_THREAD_START, { thread: option });
  };

  return <div className={`flex gap-2 ${selected ? 'bg-[#333741]' : 'bg-[#1F242F]'} py-2 px-2 group hover:bg-[#333741] text-[#CECFD2] text-sm font-semibold rounded-lg`}>
    <p onClick={onClick} className='mr-auto min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full flex-grow text-left' title={option.label}>
      {option.label}
    </p>
    <div className="flex gap-2">
      <button onClick={newFromThread} className="bg-transparent h-5 w-5 hidden">
        <img src={copyIcon} alt="Copy thread" />
      </button>

      {options.length > 1 && <button onClick={deleteThread} className="bg-transparent h-5 w-5 hidden group-hover:block">
        <img src={trashIcon} alt="Delete thread" />
      </button>}
    </div>
  </div>
};
