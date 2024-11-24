import { LogOut } from "lucide-react"
import React, { useState } from "react"
import { MessageType } from "~lib/services/message-listener.service"
import { MessageSenderService } from "~lib/services/message-sender.service"
import { StorageService, StoreKeys } from "~lib/services/storage.service"

export interface DeauthorizeButtonProps {
  className?: string
}

export function DeauthorizeButton({ className = "" }: DeauthorizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [_, setAuthData] = StorageService.useHookStorage(StoreKeys.AUTHORIZATION_DATA)
  const messageSender = new MessageSenderService()

  const clearStorages = async () => {
    await Promise.all([
      chrome.storage.local.clear(),
      chrome.storage.sync.clear(),
      StorageService.clear()
    ])

    // Clear web storages
    [localStorage, sessionStorage].forEach(storage => 
      Object.keys(storage)
        .filter(key => key.startsWith('__vexa'))
        .forEach(key => storage.removeItem(key))
    )
  }

  const clearCookies = async () => {
    const domains = ["dashboard.vexa.ai", "ext-dev.vexa.ai", ".vexa.ai"]
    await Promise.all(domains.map(async domain => {
      const cookies = await chrome.cookies.getAll({ domain })
      return Promise.all(cookies.map(cookie => 
        chrome.cookies.remove({
          url: `https://${domain}${cookie.path}`,
          name: cookie.name
        })
      ))
    }))
  }

  const handleDeauthorize = async () => {
    try {
      setIsLoading(true)
      
      await clearStorages()
      await clearCookies()

      const emptyAuth = {
        __vexa_token: "",
        __vexa_main_domain: "",
        __vexa_chrome_domain: ""
      }
      
      // Reset storage keys
      await Promise.all([
        setAuthData(emptyAuth),
        StorageService.set(StoreKeys.AUTHORIZATION_DATA, emptyAuth),
        StorageService.set(StoreKeys.CAPTURED_TAB_ID, null),
        StorageService.set(StoreKeys.CAPTURING_STATE, false),
        StorageService.set(StoreKeys.WINDOW_STATE, true),
        StorageService.set(StoreKeys.RECORD_START_TIME, 0),
        StorageService.set(StoreKeys.SELECTED_MICROPHONE, null)
      ])

      // Redirect to login
      messageSender.sendBackgroundMessage({ 
        type: MessageType.OPEN_LOGIN_POPUP,
        data: {
          url: `${process.env.PLASMO_PUBLIC_LOGIN_ENDPOINT}?caller=vexa-ext`
        }
      })
    } catch (error) {
      console.error("Deauthorize error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleDeauthorize}
      disabled={isLoading}
      className={`p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <LogOut className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
    </button>
  )
} 