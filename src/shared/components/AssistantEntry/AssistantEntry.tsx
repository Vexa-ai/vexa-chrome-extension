import React, {useEffect, useRef, useState} from 'react';
import '@mdxeditor/editor/style.css';
import './AssistantEntry.scss';
import {type ThreadMessage} from '../AssistantList';
import {CopyButton} from '../CopyButton';
import Markdown from 'markdown-to-jsx';
import {EditPenButton} from '../EditPenButton';
import {onMessage, sendMessage} from '~shared/helpers/in-content-messaging.helper';
import {MessageType} from '~lib/services/message-listener.service';

export interface AssistantEntryProps {
  entryData: ThreadMessage;
  onTextUpdated?: (updatedEntry: ThreadMessage) => void;
  pending?: boolean
}

export function AssistantEntry({ entryData, onTextUpdated, pending }: AssistantEntryProps) {
  const editorRef = useRef<HTMLTextAreaElement>();
  const [entry, setEntry] = useState<ThreadMessage>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(pending);

  const copyText = () => {
    navigator.clipboard.writeText(entryData.text);
  };

  const showEditor = () => {
    sendMessage(MessageType.ASSISTANT_ENTRY_EDIT_STARTED, entry);
    setIsEditing(true);
  }

  const hideEditor = () => {
    setIsEditing(false);
  }

  const handleTextUpdate = () => {
    onTextUpdated?.(entry);
    hideEditor();
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEntry(entry.cloneWithText(e.target.value));
  };

  useEffect(() => {
    setIsPending(pending);
  }, [pending])

  useEffect(() => {
    setEntry(entryData);
    const onEntryEditClickCleanup = onMessage(MessageType.ASSISTANT_ENTRY_EDIT_STARTED, (entryToEdit: ThreadMessage) => {
      console.log({entryToEdit});
      // if (entryToEdit.)
    });

    return onEntryEditClickCleanup;
  }, [])


  return (
    <div className='AssistantEntry'>
      {entry ? (
        <div className="flex flex-col mt-4 mb-[18px] text-[#CECFD2] rounded-[10px] border border-[#1F242F] bg-[#161B26] relative group">
          <div className="relative p-2">
            <span className="absolute gap-2 bottom-[-12px]  right-3 z-10 group-hover:flex hidden">
              {entry.role === 'user' && (
                isEditing ? (
                  <button
                    onClick={handleTextUpdate}
                    disabled={!entry.text?.trim()}
                    className='bg-[#121824] border border-[#333741] hover:bg-[#7F56D9] disabled:bg-[#4c4c4d] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g id="check">
                        <path id="Icon" d="M16.6668 5L7.50016 14.1667L3.3335 10" stroke="#FFF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </svg>
                  </button>
                ) : (
                  <span className='w-9 h-9 bg-[#121824] border border-[#333741] hover:bg-[#293347] disabled:bg-[#4c4c4d] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
                    <EditPenButton svgClassName='w-[14px] h-[15.4px]' onClick={showEditor} />
                  </span>
                )
              )}

              {isEditing
                ? <button
                  onClick={hideEditor}
                  className='bg-[#121824] border border-[#333741] hover:bg-[#293347] disabled:bg-[#4c4c4d] p-2 flex gap-1 items-center justify-center rounded-lg font-medium text-white'>
                  <svg className='font-medium text-white' width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="x-close">
                      <path id="Icon" d="M15 5L5 15M5 5L15 15" stroke="#FFFFFF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                </button>
                : <span className='w-9 h-9'>
                  <CopyButton onClick={copyText} />
                </span>
              }
            </span>
            <p className='flex gap-2 mb-1 break-words'>
              <span className="font-semibold text-white select-text break-words">{entry.role}</span>
            </p>
            <div className="select-text break-words">
              {/*{ isPending ? 'Sending: ' : '' }*/}

              {isEditing
                ? <textarea
                  ref={editorRef}
                  onChange={handleInputChange}
                  value={entry.text}
                  className='w-full bg-[#121824] border border-[#333741] p-2 flex rounded-lg font-medium text-white'
                  name="editor" id="editor" cols={5}></textarea>
                : <div className='markdown'><Markdown options={{
                  overrides: {
                    a: {
                      props: {
                        target: '_blank',
                      },
                    },
                  },
                }}
                >{entry.text}</Markdown></div>
              }
              {/* <MDXEditor markdown='Hello world' /> */}
            </div>

          </div>

        </div>
      ) : null}
    </div>
  );
}
