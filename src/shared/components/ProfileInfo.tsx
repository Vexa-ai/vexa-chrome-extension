import React, { useEffect, useState } from "react"
import { MessageType } from "~lib/services/message-listener.service"
import { MessageSenderService } from "~lib/services/message-sender.service"
import { StorageService, StoreKeys, type AuthorizationData } from "~lib/services/storage.service"
import AsyncMessengerService from "~lib/services/async-messenger.service"
import type { UserInfo } from "~shared/types"
import { DeauthorizeButton } from "./DeauthorizeButton"

export function ProfileInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const messageSender = new MessageSenderService()
  const asyncMessenger = new AsyncMessengerService()
  const [authData] = StorageService.useHookStorage<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA)

  const fetchUserInfo = async () => {
    try {
      const currentAuthData = await StorageService.get<AuthorizationData>(
        StoreKeys.AUTHORIZATION_DATA,
        {
          __vexa_token: "",
          __vexa_main_domain: "",
          __vexa_chrome_domain: ""
        }
      )

      if (!currentAuthData.__vexa_token) {
        messageSender.sendBackgroundMessage({ 
          type: MessageType.OPEN_LOGIN_POPUP,
          data: {
            url: `${process.env.PLASMO_PUBLIC_LOGIN_ENDPOINT}?caller=vexa-ext`
          }
        })
        return
      }

      const data = await asyncMessenger.getRequest(
        `/api/v1/users/me?token=${currentAuthData.__vexa_token}`
      )
      setUserInfo(data)
    } catch (error) {
      console.error("Failed to fetch user info:", error)
      if (error.status === 401 || error.status === 403) {
        messageSender.sendBackgroundMessage({ 
          type: MessageType.USER_UNAUTHORIZED
        })
      }
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [authData])

  const displayName = userInfo ? 
    (userInfo.first_name && userInfo.last_name ? 
      `${userInfo.first_name} ${userInfo.last_name}` : 
      (userInfo.username || (userInfo.email ? userInfo.email.split('@')[0] : ''))
    ) : ''

  return (
    <div className="flex flex-col px-4 py-3 border-t border-gray-800 mt-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
          {userInfo?.image ? (
            <img src={userInfo.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg text-white">{displayName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col flex-grow">
          <span className="text-sm font-medium text-white">{displayName}</span>
          <span className="text-xs text-gray-400">{userInfo?.email}</span>
        </div>
        <DeauthorizeButton />
      </div>
    </div>
  )
} 