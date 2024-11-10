import { LogOut } from "lucide-react"
import React from "react"

import { Button } from "~components/ui/Button"
import { StorageService, StoreKeys } from "~lib/services/storage.service"
import { MessageSenderService } from "~lib/services/message-sender.service"
import { MessageType } from "~lib/services/message-listener.service"

export interface DeauthorizeButtonProps {
  className?: string
}

export function DeauthorizeButton({ className = "" }: DeauthorizeButtonProps) {
  const [_, setAuthData] = StorageService.useHookStorage(StoreKeys.AUTHORIZATION_DATA)
  const messageSender = new MessageSenderService()

  const handleDeauthorize = async () => {
    try {
      // Clear all storage first
      await chrome.storage.local.clear()
      await StorageService.clear()
      
      // Clear localStorage
      Object.keys(localStorage)
        .filter(key => key.startsWith('__vexa'))
        .forEach(key => localStorage.removeItem(key))
      
      // Set empty auth data
      const emptyAuth = {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: ""
      }
      
      await setAuthData(emptyAuth)
      await StorageService.set(StoreKeys.AUTHORIZATION_DATA, emptyAuth)
      
      // Reset all states
      await StorageService.set(StoreKeys.CAPTURED_TAB_ID, null)
      await StorageService.set(StoreKeys.CAPTURING_STATE, false)
      await StorageService.set(StoreKeys.WINDOW_STATE, true)
      await StorageService.set(StoreKeys.RECORD_START_TIME, 0)
      await StorageService.set(StoreKeys.SELECTED_MICROPHONE, null)
      
      // Send message to background script to open login popup
      messageSender.sendBackgroundMessage({ 
        type: MessageType.OPEN_LOGIN_POPUP,
        data: {
          url: `${process.env.PLASMO_PUBLIC_LOGIN_ENDPOINT}?caller=vexa-ext`
        }
      })

    } catch (error) {
      console.error("Deauthorize error:", error)
    }
  }

  return (
    <div className={`flex w-full py-2 ${className}`}>
      <Button
        onClick={handleDeauthorize}
        variant="destructive"
        size="sm" 
        className="w-full flex items-center gap-2 justify-center">
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </Button>
    </div>
  )
} 