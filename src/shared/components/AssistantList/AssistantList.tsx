import React, {type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react';

import './AssistantList.scss';
import '../AssistantInput/AssistantInput.scss';
import {AssistantEntry} from '../AssistantEntry';
import {MessageType} from '~lib/services/message-listener.service';
import {MessageSenderService} from '~lib/services/message-sender.service';
import {getIdFromUrl} from '~shared/helpers/meeting.helper';
import {BouncingDots} from '../BouncingDots/BouncingDots';
import {CustomSelect, type Option} from '../CustomSelect';
import threadIcon from "data-base64:~assets/images/svg/git-branch-01.svg";
import copyIcon from "data-base64:~assets/images/svg/copy-07.svg";
import trashIcon from "data-base64:~assets/images/svg/trash-03.svg";
import newMessageIcon from "data-base64:~assets/images/svg/message-plus-square.svg";
import {sendMessage} from '~shared/helpers/in-content-messaging.helper';
import vexaLogoIcon from "data-base64:~assets/images/svg/vexa-logo.svg";
import {ThreadDeletePromptModal} from "~shared/components/ThreadDeletePromptModal";
import AsyncMessengerService from "~lib/services/async-messenger.service";
import type {ActionButton} from "~shared/components/TranscriptList";

// TODO: place in correct place
const asyncMessengerService = new AsyncMessengerService();


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
  meta: object;
  role: 'user' | 'assistant';
  timestamp: string | null;

  constructor({
    id = null,
    user_id = null,
    meeting_id = null,
    text = null,
    label = null,
    meta = {},
    role = null,
    timestamp = null,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.meeting_id = meeting_id;
    this.text = text;
    this.meta = meta || {};
    this.role = role;
    this.timestamp = timestamp;

    this.label = null !== label ? label : this.meta['label'];
  }

  get label(): string {
    return this.meta['label'] || this.text;
  }

  set label(value: string) {
    this.meta['label'] = value;
  }

  get isUser() {
    return 'user' === this.role;
  }

  get isAssistant() {
    return 'assistant' === this.role;
  }

  cloneWithText(text: string) {
    return new ThreadMessage({...this, text: text, label: text});
  }
}

export interface ThreadsResponse {
  total: number;
  threads: (Thread & Option)[];
}

class Thread implements Option {
  id: string | null
  title: string | null
  messages?: ThreadMessage[] = []
  created_timestamp?: string

  constructor({
    id = null,
    title = null,
    messages = [],
    created_timestamp = null,
  } = {}) {
    this.id = id;
    this.title = title;
    this.messages = messages.map(m => new ThreadMessage(m));
    this.created_timestamp = created_timestamp;
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

export interface AssistantListProps {
  className?: string;
  actionButtonClicked?: ActionButton
}

export function AssistantList({className = '', actionButtonClicked = null}: AssistantListProps) {
  const MEETING_ID = getIdFromUrl(window.location.href);

  const [userMessage, setUserMessage] = useState<string>('');
  const [userMessagePending, setUserMessagePending] = useState<ThreadMessage | null>(null);
  const userMessagePendingRef = useRef(userMessagePending);

  const [threads, setThreads] = useState<(Thread)[]>(AsyncMessengerService.threads);
  const [selectedThread, setSelectedThread] = useState<(Thread & Option) | undefined>(AsyncMessengerService.selectedThread);
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>(AsyncMessengerService.threadMessages);
  const [lastErrorMessage, setLastErrorMessage] = useState<String|null>();

  useEffect(() => {AsyncMessengerService.threads = threads;}, [threads]);
  useEffect(() => {AsyncMessengerService.threadMessages = threadMessages;}, [threadMessages]);
  useEffect(() => {AsyncMessengerService.selectedThread = selectedThread;}, [selectedThread]);

  const [isPrompting, setIsPrompting] = useState(false);
  // const [isThreadsOpen, setIsOpen] = useState(false);

  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagedContainerRef = useRef<HTMLDivElement>(null);
  const bottomDiv = useRef<HTMLDivElement>(null);
  const userMessageInputRef = useRef<HTMLTextAreaElement>(null);

  const isSendingMessageRef = useRef(false);
  const lastErrorMessageTimeoutRef = useRef<number|any>(null);

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
    asyncMessengerService.getRequest(`/assistant/messages?thread_id=${thread.id}`)
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

  const onStartNewThread = (callback?: (createdThread: Thread & Option) => void) => {
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
      text: message.text?.trim() || '',
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

    asyncMessengerService.postRequest(`/assistant/messages/edit`, {
      thread_id: selectedThread.id,
      message_id: message.id,
      content: message.text,
    })
      .then((response: AssistantEntryData) => {
        if (response.user_message && response.assistant_message) {
          setThreadMessages(prev => [...prev, ...[response.user_message, response.assistant_message].map(m => new ThreadMessage(m))])
        }
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

  const deleteThread = (thread: Thread) => {
    if (!thread.id) {
      onThreadDeleted(thread)
      sendMessage(MessageType.DELETE_THREAD_COMPLETE, {});

      return;
    }

    asyncMessengerService.deleteRequest(`/assistant/threads/delete`, {
      ids: [thread.id],
    })
      .then(() => {
        onThreadDeleted(thread)
        sendMessage(MessageType.DELETE_THREAD_COMPLETE, {});
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


  useEffect(() => {
    if (actionButtonClicked) {
      createThread(actionButtonClicked.prompt, actionButtonClicked.name);
    }
  }, [actionButtonClicked])


  const sendUserMessage = useCallback(async (event: FormEvent) => {
    event.preventDefault();

    let content = userMessage?.trim();
    if (content?.length === 0) {
      return;
    }

    setUserMessage('');

    if (selectedThread?.id) {
      return sendMessageIntoThread(content);
    }

    return createThread(content);
  }, [userMessagePending, userMessage]);


  function sendMessageIntoThread(content: string) {
    content = content.trim();
    userMessagePendingRef.current = new ThreadMessage({
      text: content,
      role: "user",
    });

    setUserMessagePending(userMessagePendingRef.current);

    // post message in thread
    return asyncMessengerService.postRequest('/assistant/copilot', {
      thread_id: selectedThread.id,
      content,
    })
      .then((response: AssistantEntryData) => {
        if (response.user_message && response.assistant_message) {
          setThreadMessages(prev => [...prev, ...[response.user_message, response.assistant_message].map(m => new ThreadMessage(m))])
        } else {
          setLastErrorMessage("Ooops... can't send message to selected thread. Try again later.");
        }
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

  const createThread = (prompt: string, label = null) => {
    userMessagePendingRef.current = new ThreadMessage({
      text: prompt,
      role: "user",
      label,
    });

    setUserMessagePending(userMessagePendingRef.current);
    setIsPrompting(true)
    isSendingMessageRef.current = true;


    const thread = (() => {
      if (selectedThread && !selectedThread.id) {
        return selectedThread;
      }

      const thread = new Thread({
        title: 'Starting thread...',
      });
      setThreads(prev => [...prev, thread]);
      setSelectedThread(thread);

      return thread;
    })();

    const showErrorMessage = (message: string) => {
      if (lastErrorMessageTimeoutRef.current) {
        clearTimeout(lastErrorMessageTimeoutRef.current);
      }

      setLastErrorMessage(message);

      lastErrorMessageTimeoutRef.current = setTimeout(() => {
        setLastErrorMessage(null);
      }, 4000);
    }

    return asyncMessengerService.postRequest('/assistant/threads/create', {
      meeting_id: MEETING_ID,
      prompt: prompt,
      meta: {label},
    })
      .then((response: Thread) => {
        if (!response.id || !response.title || !response.messages) {
          // TODO: show error
          showErrorMessage("Ooops... can't create thread. Try again later.");
          return;
        }

        thread.id = response.id;
        thread.title = response.title;
        setSelectedThread(thread);

        setThreadMessages(prev => [...prev, ...response.messages?.map(m => new ThreadMessage(m))])
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


  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;

      // Ignore clicking special places
      if (target.closest('div.ThreadSelected') || target.closest('div.ThreadOption')) {
        return;
      }

      setIsOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // keep cursor in input fields
  useEffect(() => {
    userMessageInputRef?.current?.focus();
  }, [threadMessages]);


  // Auto resize textarea
  useEffect(() => {
    const element = userMessageInputRef?.current;

    element.style.height = '5px';
    element.style.height = (element.scrollHeight + 5) + 'px';
  }, [userMessage]);

  useEffect(() => {
    bottomDiv?.current?.scrollIntoView({ behavior: 'instant' });
  }, [userMessagePendingRef.current, threadMessages]);

  const fetchThreads = function () {
    asyncMessengerService.getRequest(`/assistant/threads/all?meeting_id=${MEETING_ID}`)
      .then((response: ThreadsResponse) => {
        console.log(response);

        const responseThreads = response.threads
          .map(t => new Thread(t))
          .sort((a, b) => a.created_timestamp?.localeCompare(b.created_timestamp) || 0);

        if (responseThreads?.length) {
          setThreads(responseThreads);

          const thread = responseThreads.find(t => t.id === AsyncMessengerService.selectedThread?.id)
          setSelectedThread(thread || responseThreads[0])
        }
      })
      .catch(err => {
      })
      .finally(() => {
      })
    ;
  }

  // Initial
  let beingCalled = useRef(0);
  useEffect(() => {
    if (beingCalled.current++ !== 0) return;

    fetchThreads();
  }, []);



  return <div ref={assistantListRef} className={`AssistantList flex flex-col max-h-full w-full overflow-hidden ${className}`}>
    {lastErrorMessage && <div style={{backgroundColor: 'red', color: 'white', padding: '5px 15px', borderRadius: '3px', margin: '5px 0'}}>
      {lastErrorMessage}
    </div>}


    {<div className="flex py-2 gap-3 w-full max-w-[368px]">
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
        <div key={index}>
          {entry.isUser && <AssistantEntry onTextUpdated={updateThreadFromUserEdit} entryData={entry}/>}
          {entry.isAssistant && <AssistantEntry entryData={entry}/>}
        </div>
      ))}

      {userMessagePending && <AssistantEntry key={"pending"} entryData={userMessagePending} pending/>}


      {isPrompting && <div className={`flex flex-grow-0 p-3 w-[fit-content] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] ${selectedThread?.messages.length ? '' : 'mt-2'}`}>
        <BouncingDots/>
      </div>}

      <div style={{height: '10px'}} ref={bottomDiv}/>
    </div> : (
      <div className='flex items-center justify-center flex-grow overflow-hidden'>
        <span>{isLoadingMessages && !isPolling ? 'Loading your chat history...' : 'Type your message. E.g. "What action points were on the call?"'}</span>
      </div>
    )
    }

    <div className={`AssistantInput mt-auto bg-slate-950 pb-2 pl-1`} style={{marginTop: '3px'}}>
      {/* <AssistantSuggestions suggestions={suggestions} selectSuggestion={handleSuggestionSelection}/> */}
      <form autoComplete="off" onSubmit={sendUserMessage} className="flex gap-1">
        <textarea
          ref={userMessageInputRef}
          disabled={isPrompting}
          value={userMessage}
          onKeyDown={(e: KeyboardEvent) => {if (e.key === 'Enter' && !e.shiftKey) sendUserMessage(e) }}
          onChange={e => setUserMessage(e.target.value)}
          placeholder='Start typing...'
          className="flex-grow rounded-lg border border-[#333741] h-11 bg-transparent p-2"
          style={{color: 'white', resize: 'none', maxHeight: '180px', minHeight: '39px'}}
          name='assistant-input'
        />

        <button disabled={isPrompting || userMessage?.trim()?.length === 0} type='submit'>
          <img src={vexaLogoIcon} alt=""/>
        </button>
      </form>
    </div>

    <ThreadDeletePromptModal deleteThread={deleteThread}/>
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
  <div className='flex w-full gap-1 overflow-hidden ThreadSelected'>
    <img alt='' className='w-5' src={threadIcon}/>
    <p className='text-[#F5F5F6] min-h-6 mr-auto w-auto whitespace-nowrap text-ellipsis flex items-center overflow-hidden text-sm' title={values.label}>{values.label}</p>
  </div>
);

const ThreadOption: React.FC<{ option: Option; options: Option[]; selected: boolean; onClick: () => void }> = ({option, options, selected, onClick}) => {
  const newFromThread = () => {
    // sendMessage(MessageType.DELETE_THREAD_START, { thread: option });
  };
  const deleteThread = () => {
    sendMessage(MessageType.DELETE_THREAD_START, {thread: option});
  };

  return <div className={`flex gap-2 ${selected ? 'bg-[#333741]' : 'bg-[#1F242F]'} py-2 px-2 group hover:bg-[#333741] text-[#CECFD2] text-sm font-semibold rounded-lg ThreadOption`}>
    <p onClick={onClick} className='mr-auto min-h-6 whitespace-nowrap text-ellipsis overflow-hidden max-w-full flex-grow text-left' title={option.label}>
      {option.label}
    </p>
    <div className="flex gap-2">
      <button onClick={newFromThread} className="bg-transparent h-5 w-5 hidden">
        <img src={copyIcon} alt="Copy thread"/>
      </button>

      <button onClick={deleteThread} className="bg-transparent h-5 w-5 hidden group-hover:block">
        <img src={trashIcon} alt="Delete thread"/>
      </button>
    </div>
  </div>
};
