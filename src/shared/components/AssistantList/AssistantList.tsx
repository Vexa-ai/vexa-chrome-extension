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
  number: number;
}

export interface AssistantMessageUnit {
  id: string;
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

let pollTimeoutRef: NodeJS.Timeout;

export function AssistantList({ assistantList = [], chains = { available_chains: [] }, className = '', updatedAssistantList = (assistantList, chains) => { console.log({ assistantList }) } }: AssistantListProps) {
  const [isCapturing] = StorageService.useHookStorage<boolean>(StoreKeys.CAPTURING_STATE);
  const [isMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE);
  const [responses, setResponses] = useState<AssistantEntryData[]>([]);
  const [renderedResponses, setRenderedResponses] = useState<AssistantEntryData[]>([]);
  const [messageChains, setMessageChains] = useState<(Thread & Option)[]>([]);
  const [threads, setThreads] = useState<(Thread & Option)[]>([]);
  const [clearField, setClearField] = useState<boolean>(false);
  const [isPrompting, setIsPrompting] = useState<boolean>(false);
  // const [previousChainId, setPreviousChainId] = useState(1);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread & Option>();
  const [editingEntry, setEditingEntry] = useState(false);
  const editingEntryRef = useRef(editingEntry);
  const [pollingPaused, setPollingPaused] = useState(false);
  const pollingPausedRef = useRef(pollingPaused);
  const [isOpen, setIsOpen] = useState(false);
  const threadsRef = useRef(threads);
  const selectedThreadRef = useRef(selectedThread);
  const isCreatingThreadRef = useRef(false);
  const assistantListRef = useRef<HTMLDivElement>(null);
  const lastEntryRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef(null);
  const messageSender = new MessageSenderService();

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_RESULT);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_RESULT, (message) => {
    const response: AssistantEntryData = message.data;
    const newResponses = [...responses.filter(entry => entry.current_chain === selectedThreadRef.current?.number)];
    newResponses[newResponses.length > 0 ? newResponses.length - 1 : 0] = response;
    console.log(71, { newResponses });
    setResponses([...newResponses]);
    setClearField(true);
    setIsPrompting(false);
  });

  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_HISTORY, (result) => {
    const response: AssistantMessageUnit[] = result.data?.messages;
    if (!result.data.available_chains.length) {
      if(!isCreatingThreadRef.current) {
        setTimeout(onStartNewThread, 0);
      }
      return;
    } 
    updateThreads(result.data.available_chains.map(chain => ({ ...chain, value: chain.number })));
    if (!result.data.available_chains.find(chain => selectedThreadRef?.current?.number === chain.number) && result.data.available_chains.length) {
      console.log('Called 1');
      updateSelectedThread(result.data.available_chains[0]);
    }
    if (response?.length) {
      const responseEntryData: AssistantEntryData[] = response?.map(responseUnit => {
        if (responseUnit.role === 'user') {
          return {
            current_chain: result.data.current_chain,
            user_message: responseUnit,
          };
        } else {
          return {
            current_chain: result.data.current_chain,
            assistant_message: responseUnit,
          };
        }
      });
      console.log({responseEntryData})
      setResponses(responseEntryData);
      setRenderedResponses(responseEntryData);
    } else {
      setResponses([]);
      setRenderedResponses([]);
    }
    setClearField(true);
    setIsPrompting(false);
  });

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_ERROR);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_ERROR, (message) => {
    setIsPrompting(false);
  });

  MessageListenerService.unRegisterMessageListener(MessageType.THREAD_DELETED);
  MessageListenerService.registerMessageListener(MessageType.THREAD_DELETED, (message) => {
    const threadIndex = threads.findIndex(thread => thread.number === message.data.chain);
    sendMessage(MessageType.DELETE_THREAD_COMPLETE);
    if (threadIndex !== -1) {
      const updatedThreads = [...threads];
      updatedThreads.splice(threadIndex, 1);
      updateThreads(updatedThreads);
      console.log('Called 2')

      updateSelectedThread(updatedThreads.at(-1));
    }
  });

  MessageListenerService.unRegisterMessageListener(MessageType.ASSISTANT_PROMPT_EDIT_SUCCESS);
  MessageListenerService.registerMessageListener(MessageType.ASSISTANT_PROMPT_EDIT_SUCCESS, (message) => {
    console.log({ chain: selectedThreadRef?.current?.number });
    messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThreadRef.current?.number } });
  });

  MessageListenerService.unRegisterMessageListener(MessageType.CREATE_THREAD_SUCCESS);
  MessageListenerService.registerMessageListener(MessageType.CREATE_THREAD_SUCCESS, (message) => {
    isCreatingThreadRef.current = false;
    updateThreads(message.data.available_chains, (updatedThreads) => {
      updateSelectedThread(message.data.available_chains.at(-1));
      setResponses(message.data.messages);
    });
  });

  const onPrompted = async (prompt: string, messageId = undefined) => {
    try {
      const unRepliedMessageUnit: AssistantEntryData = {
        current_chain: selectedThreadRef?.current?.number || 1,
        user_message: {
          user_id: '',
          id: '',
          text: prompt,
          meeting_id: getIdFromUrl(location.href),
          role: 'user',
          timestamp: new Date().toISOString(),
        }
      };
      if(!messageId) {
        setResponses([...responses, unRepliedMessageUnit]);
      }
      setIsPrompting(true);
      if (!messageId) {
        await messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_PROMPT_REQUEST, data: { prompt, chain: selectedThreadRef?.current?.number } });
      } else {
        await messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_PROMPT_EDIT, data: { prompt, chain: selectedThreadRef?.current?.number, messageId } });
      }
      return true;
    } catch (error) {
      setIsPrompting(false);
      return false;
    }
  };

  const updateThreads = useCallback((newThreads: (Thread & Option)[] | undefined, callback?: (updatedThreads: (Thread & Option)[] | undefined) => void) => {
    setThreads((prevThreads) => {
      threadsRef.current = newThreads;
      return newThreads;
    });

    setTimeout(() => {
      if (callback) callback(threadsRef.current);
    }, 0);
  }, []);

  const updateSelectedThread = useCallback((newThreads: (Thread & Option) | undefined, callback?: (updatedThreads: (Thread & Option) | undefined) => void) => {
    setSelectedThread(() => {
      selectedThreadRef.current = newThreads;
      return newThreads;
    });

    setTimeout(() => {
      if (callback) callback(selectedThreadRef.current);
    }, 0);
  }, []);

  const updateUserPrompt = (updatedEntry?: AssistantMessageUnit) => {
    onPrompted(updatedEntry.text, updatedEntry.id);
  }

  const onStartNewThread = (callback?: (createdThread: Thread & Option) => void) => {
    if(isCreatingThreadRef.current) return;
    isCreatingThreadRef.current = true;
    messageSender.sendBackgroundMessage({ type: MessageType.CREATE_THREAD });
  }

  const handleThreadChange = (newSelectedThread: typeof selectedThread) => {
    console.log('Called 4')

    updateSelectedThread(newSelectedThread[0], () => {
      messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThreadRef.current?.number } });
    });
    setIsOpen(false);
  };

  const updatePollingPaused = useCallback((newState: boolean, callback?: ((updatedThreads: boolean) => void)) => {
    setPollingPaused(() => {
      pollingPausedRef.current = newState;
      return newState;
    });

    setTimeout(() => {
      if (callback) callback(pollingPausedRef.current);
    }, 0);
  }, []);

  const onDropdownOpenHandler = () => {
    setIsOpen(true);
  };

  const pollThread = () => {
    if (pollTimeoutRef) {
      clearInterval(pollTimeoutRef);
      setIsPolling(false);
    }
    pollTimeoutRef = setInterval(async () => {
      console.log('Polling...', editingEntryRef.current, pollingPausedRef.current);
      if (editingEntryRef.current || pollingPausedRef.current) return;
      setIsPolling(true);
      messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThreadRef?.current?.number } });
    }, 5000);
  }

  const editingStarted = () => {
    console.log('Started edit')
    setEditingEntry(() => {
      editingEntryRef.current = true;
      return true;
    })
  }

  const editingCancelled = () => {
    console.log('Cancelled edit')
    setEditingEntry(() => {
      editingEntryRef.current = false;
      return false;
    })
  }

  useEffect(() => {
    if (isMaximized) {
      messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThreadRef?.current?.number } });
      setIsPrompting(true);
    }
  }, [isMaximized]);

  useEffect(() => {
    if (!isPolling) {
      pollThread();
    }

    if (selectedThreadRef?.current?.value) {
      messageSender.sendBackgroundMessage({ type: MessageType.ASSISTANT_HISTORY_REQUEST, data: { chain: selectedThreadRef?.current?.number } });
    }
  }, [selectedThreadRef?.current]);

  useEffect(() => {
    if (lastEntryRef.current) {
      lastEntryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    updatedAssistantList(responses, { available_chains: messageChains });
    setRenderedResponses(responses);
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
    const threadList: (Thread & Option)[] = chains.available_chains?.map(chain => ({ number: chain.number, chain: chain.number, label: chain.label, value: chain.number }));
    updateThreads(threadList);
  }, [chains]);

  useEffect(() => {
    const deleteThreadCleanup = onMessage(MessageType.DELETE_THREAD, (data: { chain: number }) => {
      messageSender.sendBackgroundMessage({ type: MessageType.DELETE_THREAD, data });
    });
    pollThread();
    return () => {
      deleteThreadCleanup();
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
          selectedValue={selectedThreadRef.current}
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
            {entry.user_message && <AssistantEntry onTextUpdateStarted={editingStarted} onTextUpdateCancelled={editingCancelled} onTextUpdated={updateUserPrompt} entryData={entry.user_message} />}
            {entry.assistant_message && entry.assistant_message.text !== "Welcome to the new thread for your messages!" &&  <AssistantEntry entryData={entry.assistant_message} />}
          </div>
        ))}
      </div> : null
    }
    {isPrompting && <div className={`flex flex-grow-0 p-3 w-[fit-content] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] ${responses.length ? '' : 'mt-2'}`}>
      <BouncingDots />
    </div>
    }
    <AssistantInput onBlur={() => updatePollingPaused(false)} onFocus={() => updatePollingPaused(true)} clearField={clearField} setClearField={setClearField} onEnter={onPrompted} className='bg-slate-950 mb-2 ml-1 absolute bottom-3' />
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
