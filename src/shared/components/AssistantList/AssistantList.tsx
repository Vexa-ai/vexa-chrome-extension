import React, {type FormEvent, useCallback, useEffect, useRef, useState} from 'react';

import './AssistantList.scss';
import '../AssistantInput/AssistantInput.scss';
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
import {ThreeCircles} from "react-loader-spinner";
import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg";
import {ThreadDeletePromptModal} from "~shared/components/ThreadDeletePromptModal";

export interface AssistantEntryData {
  current_chain?: number;
  user_message?: AssistantMessageUnit;
  assistant_message?: AssistantMessageUnit;
}

/*
export interface AssistantChains {
  available_chains: (Thread & Option)[];
}

export interface Thread extends Option {
  chain: number;
}
*/

export interface AssistantMessageUnit {
  user_id?: string;
  meeting_id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export class ThreadMessage implements AssistantMessageUnit {
  id: string;
  user_id?: string;
  meeting_id: string | null;
  text: string;
  role: 'user' | 'assistant';
  timestamp: string | null;

  constructor({
    id = null,
    user_id = null,
    meeting_id = null,
    text = null,
    role = null,
    timestamp = null,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.meeting_id = meeting_id;
    this.text = text;
    this.role = role;
    this.timestamp = timestamp;
  }

  get isUser() {
    return 'user' === this.role;
  }

  get isAssistant() {
    return 'assistant' === this.role;
  }

  cloneWithText(text: string) {
    return new ThreadMessage({...this, text: text});
  }
}

class Thread implements Option {
  id: string | null
  title: string | null
  messages?: ThreadMessage[] = []

  constructor({
    id = null,
    title = null,
    messages = [],
  } = {}) {
    this.id = id;
    this.title = title;
    this.messages = messages.map(m => new ThreadMessage(m));
  }

  get label() {
    return this.title;
  }

  set label(value) {
    this.title = value;
  }

  get value() {
    return this.id;
  }

  set value(value) {
    this.id = value;
  }
}

function sendFetchRequest(method: string, url: string, data: object = null): Promise<object> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: MessageType.FETCH_REQUEST,
        action: method,
        url: "https://main_andrew.dev.vexa.ai/api/v1" + url,
        data: data
      },
      (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(response.error);
        }
      }
    );
  });
}

function getRequest(url: string): Promise<object> {
  return sendFetchRequest('get', url);
}

function postRequest(url: string, data: object = null): Promise<object> {
  return sendFetchRequest('post', url, data);
}

function putRequest(url: string, data: object = null): Promise<object> {
  return sendFetchRequest('put', url, data);
}

function deleteRequest(url: string, data: object = null): Promise<object> {
  return sendFetchRequest('delete', url, data);
}



export interface AssistantListProps {
  className?: string;
}

export function AssistantList({className}: AssistantListProps) {
  const MEETING_ID = getIdFromUrl(window.location.href);

  const [userMessage, setUserMessage] = useState<string>('');
  const [userMessagePending, setUserMessagePending] = useState<ThreadMessage | null>(null);
  const userMessagePendingRef = useRef(userMessagePending);

  const threadsLoadedRef = useRef(false);
  const [threads, setThreads] = useState<(Thread)[]>([]);
  const [selectedThread, setSelectedThread] = useState<(Thread & Option) | undefined>();
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([]);

  const threadsRef = useRef(threads);
  const selectedThreadRef = useRef(selectedThread);
  const threadMessagesRef = useRef(threadMessages);

  useEffect(() => { threadsRef.current = threads; }, [threads]);
  useEffect(() => { threadMessagesRef.current = threadMessages; }, [threadMessages]);
  useEffect(() => { selectedThreadRef.current = selectedThread; }, [selectedThread]);

  const [isPrompting, setIsPrompting] = useState(false);
  // const [isThreadsOpen, setIsOpen] = useState(false);

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagedContainerRef = useRef<HTMLDivElement>(null);
  const bottomDiv = useRef<HTMLDivElement>(null);
  const userMessageInputRef = useRef<HTMLInputElement>(null);

  const isSendingMessageRef = useRef(false);

  const messageSender = new MessageSenderService();
  const [isOpen, setIsOpen] = useState(false);
  const assistantListRef = useRef<HTMLDivElement>(null);

  // TODO: delete?
  const [clearField, setClearField] = useState<boolean>(false);

  const handleThreadChange = (newSelectedThread: typeof selectedThread) => {
    setSelectedThread(newSelectedThread[0]);
    setIsOpen(false);
  };

  const onDropdownOpenHandler = () => {
    setIsOpen(true);
  };

  const loadThreadMessages = useCallback((thread: Thread) => {
    getRequest(`/assistant/messages?thread_id=${thread.id}`)
      .then((messages: ThreadMessage[]) => {
        // Ignore result if the thread changed
        if (selectedThread.id !== thread.id) return;

        setThreadMessages(messages.map(m => new ThreadMessage(m)));
      })
  }, [selectedThread])


  useEffect(() => {
    setThreadMessages([]);
    selectedThread && selectedThread.id && loadThreadMessages(selectedThread);
  }, [loadThreadMessages, selectedThread])

  const onStartNewThread = (callback?: (createdThread:  Thread & Option) => void) => {
    const emptyThread = threads.find(t => !t.id);
    if (emptyThread) {
      setSelectedThread(emptyThread);

      return;
    }

    const thread = new Thread({
      title: 'New thread',
    });
    setThreads(prev => [...prev, thread]);
    setSelectedThread(thread)

    callback && callback(thread);
  }

  const updateThreadFromUserEdit = (message: ThreadMessage) => {
    setUserMessagePending(new ThreadMessage({
      text: message.text || '',
    }))

    setIsPrompting(true);

    setThreadMessages(prev => {
      const messages = [];
      for (let m of prev) {
        if (message.id === m.id) {
          break;
        }

        messages.push(m);
      }

      return messages;
    })

    postRequest(`/assistant/messages/edit`, {
      thread_id: selectedThread.id,
      // meeting_session_id: "107d81b3-dd0a-4674-898d-a1615d54c0b7",
      message_id: message.id,
      content: message.text,
    })
      .then((response: AssistantEntryData) => {
        setThreadMessages(prev => [...prev, ...[response.user_message, response.assistant_message].map(m => new ThreadMessage(m))])
      })
      .catch(err => {
        setUserMessage(userMessagePendingRef.current.text)
      })
      .finally(() => {
        setUserMessagePending(null)
        userMessagePendingRef.current = null
        setIsPrompting(false)
      })
    ;
  }

  const deleteThread = () => {
    console.log("Delete");
    const thread = selectedThread;
    deleteRequest(`/assistant/threads/delete`, {
      ids: [thread.id],
    })
      .then(() => {
        onThreadDeleted(thread)
        sendMessage(MessageType.DELETE_THREAD_COMPLETE, { });
      }, error => {
        alert('Thread delete failed. Try again.');
        // toast('Failed to delete thread. Try again.', { type: 'error' });
      });
  }

  const onThreadDeleted = function (thread: Thread) {
    setThreads(prev => {
      const threads = prev.filter(t => t !== thread);
      if (threads.length === 0) {
        onStartNewThread();
      } else {
        setSelectedThread(threads[0]);
      }

      return threads;
    });
  }



  const sendUserMessage = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    userMessagePendingRef.current = new ThreadMessage({
      id: null,
      text: userMessage,
      role: "user",
    });
    setUserMessagePending(userMessagePendingRef.current);
    setIsPrompting(true)
    isSendingMessageRef.current = true;

    if (selectedThread?.id) {
      // post message in thread
      postRequest('/assistant/copilot', {
        thread_id: selectedThread.id,
        content: userMessage,
      })
        .then((response: AssistantEntryData) => {
          setThreadMessages(prev => [...prev, ...[response.user_message, response.assistant_message].map(m => new ThreadMessage(m))])
        })
        .catch(err => {
          setUserMessage(userMessagePendingRef.current.text)
        })
        .finally(() => {
          setUserMessagePending(null)
          userMessagePendingRef.current = null
          setIsPrompting(false)
          isSendingMessageRef.current = false;
        })
    } else {
      postRequest('/assistant/threads/create', {
        // title: selectedThread.label,
        // meeting_id: MEETING_ID,
        prompt: userMessage,
        meeting_session_id: "107d81b3-dd0a-4674-898d-a1615d54c0b7",
      })
        .then((response: Thread) => {
          if (selectedThread) {
            selectedThread.id = response.id;
            selectedThread.title = response.title;
          } else {
            const thread = new Thread({
              id: response.id,
              title: response.title,
            })
            setSelectedThread(thread);
            setThreads(prev => [...prev, thread]);
          }

          setThreadMessages(prev => [...prev, ...response.messages.map(m => new ThreadMessage(m))])
        })
        .catch(err => {
          setUserMessage(userMessagePendingRef.current.text)
        })
        .finally(() => {
          setUserMessagePending(null)
          userMessagePendingRef.current = null
          setIsPrompting(false)
          isSendingMessageRef.current = false;
        })
    }

    setUserMessage('')
  }, [userMessagePending, userMessage])



  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    userMessageInputRef?.current?.focus();
  }, [threadMessages]);

  return <div ref={assistantListRef} className={`AssistantList flex flex-col max-h-full w-full overflow-hidden ${className}`}>
    {threads.length > 0 && selectedThread && <div className="flex py-2 gap-3 w-full max-w-[368px]">
      <div className='flex-grow' ref={dropdownRef}>
        <CustomSelect
          placeholder={<ThreadPlaceholder/>}
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
        <img src={newMessageIcon} alt="New thread"/>
        New
      </button>
    </div>}

    {threadMessages?.length || userMessagePending ? <div className="flex-grow overflow-y-auto" ref={messagedContainerRef}>
      {threadMessages?.map((entry: ThreadMessage, index) => (
        <div>
          {entry.isUser && <AssistantEntry key={entry.id} onTextUpdated={updateThreadFromUserEdit} entryData={entry}/>}
          {entry.isAssistant && <AssistantEntry key={entry.id} entryData={entry}/>}
        </div>
      ))}
      {userMessagePending && <AssistantEntry key={"pending"} entryData={userMessagePending} pending/>}


      {isPrompting && <div className={`flex flex-grow-0 p-3 w-[fit-content] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] ${selectedThread?.messages.length ? '' : 'mt-2'}`}>
        <BouncingDots/>
      </div>
      }

      <div ref={bottomDiv}/>
    </div> : (
      <div className='flex items-center justify-center flex-grow overflow-hidden'>
        <span>{isLoadingMessages && !isPolling ? 'Loading your chat history...' : 'Type your message. E.g. "What action points were on the call?"'}</span>
      </div>
    )
    }


    {/*
      renderedResponses.length ? <div className="flex-grow overflow-y-auto">
        {renderedResponses.map((entry, index) => (
          <div key={index} ref={renderedResponses.length - 1 === index ? lastEntryRef : null}>
            {entry.user_message && <AssistantEntry onTextUpdated={createThreadFromUserPrompt} entryData={entry.user_message} />}
            {entry.assistant_message && <AssistantEntry entryData={entry.assistant_message} />}
          </div>
        ))}
      </div> : null
      {isPrompting && <div className={`flex flex-grow-0 p-3 w-[fit-content] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] ${threadMessages.length ? '' : 'mt-2'}`}>
        <BouncingDots/>
      </div>
    */}

    {/*<AssistantInput clearField={clearField} setClearField={setClearField} onEnter={onPrompted} className='bg-slate-950 mb-2 ml-1 absolute bottom-3' />*/}

    <div className={`AssistantInput mt-auto ${className}`}>
      {/* <AssistantSuggestions suggestions={suggestions} selectSuggestion={handleSuggestionSelection}/> */}
      <form autoComplete="off" onSubmit={sendUserMessage} className="flex gap-1">
        <input
          disabled={isPrompting}
          value={userMessage}
          onChange={e => setUserMessage(e.target.value)}
          type="text"
          placeholder='Start typing...'
          className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2"
          style={{color: 'white'}}
          name='assistant-input'
        />

        <button disabled={isPrompting} type='submit'>
          <img src={vexaLogoIcon} alt=""/>
        </button>
      </form>
    </div>

    <ThreadDeletePromptModal deleteThread={deleteThread} />
  </div>;
}




const ThreadNoOption: React.FC = () => (
  <div className={`flex gap-2 items-center bg-[#1F242F] py-1 px-2 text-[#F5F5F6] rounded-lg`}>
    <p className='min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full mx-auto text-sm flex items-center'>No threads</p>
  </div>
);

const ThreadPlaceholder: React.FC = () => (
  <div className='flex gap-2 text-[#CECFD2] font-semibold items-center w-full overflow-hidden'>
    <img alt='' className='w-5' src={threadIcon}/>
    <p className='flex items-center justify-center min-h-6 text-sm'>Threads</p>
  </div>
);

const ThreadSelected: React.FC<{ value: any; label: string }> = (values) => (
  <div className='flex w-full gap-1 overflow-hidden'>
    <img alt='' className='w-5' src={threadIcon}/>
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
