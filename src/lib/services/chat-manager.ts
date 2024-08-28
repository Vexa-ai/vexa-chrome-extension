// const Ig = k(en());

export default class ChatManager {
  constructor() {
  }

  findChatToggleButton() {
    return document.querySelector(`button[aria-label="Chat with everyone"]`)
  }

  findChatSendButton(): HTMLButtonElement {
    let sendButton = document.querySelector(`button[aria-label="Send a message"]`) as HTMLButtonElement;

    return sendButton;
  }

  async getChatInput(): Promise<HTMLInputElement> {
    return await this.waitForElementWithRetry(async () => document.querySelector('textarea[rows="1"]')) as HTMLInputElement;
  }

  async sendChatMessage(message: string) {
    try {
      let chatInput = await this.getChatInput();
      if (!chatInput) {
        console.log("No chat input found, trying to open chat...");
        let chatToggleButton = this.findChatToggleButton();
        if (!chatToggleButton) {
          console.log("No chat toggle button found, trying to find it by the icon");
          chatToggleButton = this.findChatToggleButton();
        }

        if (chatToggleButton) {
          chatToggleButton.click();
          chatInput = await this.getChatInput();
        } else {
          console.log("No chat toggle button found");
          return "no-chat-toggle";
        }
      }
      if (!chatInput) {
        console.log("No chat input found, that is all");
        return "no-chat-input";
      }

      const chatSendButton = this.findChatSendButton();
      if (!chatSendButton) {
        console.log("No send button found, that is all");
        return "no-send-button";
      }

      console.log("Ready to send");
      chatInput.value = message;
      chatSendButton.removeAttribute("disabled");
      chatSendButton.click();
      console.log("Sending succeeded");

      const closeButton = this.findChatToggleButton();
      if (closeButton) {
        closeButton.click();
      }
      return true;
    } catch (error) {
      console.log("Could not send chat message", error);
      return error.message ?? "error";
    }
  }

  async waitForElementWithRetry(elementGetter: () => Promise<HTMLElement>|Promise<Element>|Promise<HTMLInputElement>, { numberOfAttempts = 50, delayMs = 100, initialDelayMs = 0 } = {}): Promise<HTMLElement | HTMLInputElement> {
    if (initialDelayMs > 0) {
      await this.delay(initialDelayMs);
    }
    for (let i = 0; i < numberOfAttempts; i++) {
      try {
        const element = await elementGetter();
        if (element) {
          return element as HTMLInputElement;
        }
        await this.delay(delayMs);
      } catch (error) {
        console.log("Exception", error);
        throw error;
      }
    }
    return null;
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isElementVisible(element: HTMLElement) {
    return element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;
  }
}
