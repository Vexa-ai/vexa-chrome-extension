import type { MessageType } from "~lib/services/message-listener.service";

export function sendMessage<T>(eventType: MessageType, data: T = undefined): void {
    const event = new CustomEvent<T>(eventType, { detail: data });
    window.dispatchEvent(event);
  }
  
  export function onMessage<T>(eventType: MessageType, callback: (data: T) => void): () => void {
    const handler = (event: CustomEvent<T>) => {
      callback(event.detail);
    };
  
    window.addEventListener(eventType, handler as EventListener);
  
    // Return a function to remove the event listener
    return () => {
      window.removeEventListener(eventType, handler as EventListener);
    };
  }
  