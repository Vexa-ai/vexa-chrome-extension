import {MessageType} from "~lib/services/message-listener.service";

export default class AsyncMessengerService {
  private static readonly pendingPromises = new Map()
  private static currentMessageId = 0;

  private static intervalHandler = null;

  // TODO: move it to right place
  public static threads = [];
  public static selectedThread = null
  public static threadMessages = []

  constructor() {
    if (!AsyncMessengerService.intervalHandler) {
      AsyncMessengerService.intervalHandler = setInterval(() => {
        const now = Date.now();
        for (const [messageId, { reject, expirationTime }] of AsyncMessengerService.pendingPromises) {
          if (now >= expirationTime) {
            AsyncMessengerService.pendingPromises.delete(messageId);
            console.log("Rejected timeout promise");
            reject(new Error('Request timed out'));
          }
        }
      }, 1000)


      chrome.runtime.onMessage.addListener((message) => {
        if (message.messageId && AsyncMessengerService.pendingPromises.has(message.messageId)) {
          const { resolve } = AsyncMessengerService.pendingPromises.get(message.messageId);
          console.log("ASYNC", {message});
          AsyncMessengerService.pendingPromises.delete(message.messageId);
          resolve(message.data);
        }
      });
    }
  }

  static generateMessageId() {
    return `msg_${this.currentMessageId++}`;
  }

  // Function to send message to service worker and return a promise
  sendMessageToServiceWorker(message: any, timeout = 25000): Promise<object> {
    return new Promise((resolve, reject) => {
      const messageId = AsyncMessengerService.generateMessageId();

      // Store the promise callbacks and expiration time
      AsyncMessengerService.pendingPromises.set(messageId, {
        resolve,
        reject,
        expirationTime: Date.now() + timeout
      });

      // Send message to service worker
      chrome.runtime.sendMessage({
        type: 'ASYNC_MESSAGE',
        message,
        messageId: messageId
      });
    });
  }

  sendFetchRequest(method: string, url: string, data: object = null): Promise<object> {
    return this.sendMessageToServiceWorker({
      type: MessageType.FETCH_REQUEST,
      action: method,
      url: "/api/v1" + url,
      data: data
    })
  }

  getRequest(url: string): Promise<object> {
    return this.sendFetchRequest('get', url);
  }

  postRequest(url: string, data: object = null): Promise<object> {
    return this.sendFetchRequest('post', url, data);
  }

  putRequest(url: string, data: object = null): Promise<object> {
    return this.sendFetchRequest('put', url, data);
  }

  deleteRequest(url: string, data: object = null): Promise<object> {
    return this.sendFetchRequest('delete', url, data);
  }


}
