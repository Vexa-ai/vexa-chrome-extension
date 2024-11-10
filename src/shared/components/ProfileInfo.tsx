import React, { useEffect, useState } from "react"
import { StorageService, StoreKeys } from "~lib/services/storage.service"
import AsyncMessengerService from "~lib/services/async-messenger.service"
import { DeauthorizeButton } from "./DeauthorizeButton"

interface UserInfo {
  email: string
  username: string
  first_name: string
  last_name: string
  image: string
}

const asyncMessengerService = new AsyncMessengerService()

export function ProfileInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const authData = await StorageService.get<AuthorizationData>(StoreKeys.AUTHORIZATION_DATA, {
          __vexa_token: "",
          __vexa_main_domain: "",
          __vexa_chrome_domain: ""
        })
        const data = await asyncMessengerService.getRequest(
          `/api/v1/users/me?token=${authData["__vexa_token"]}`
        )
        setUserInfo(data)
      } catch (error) {
        console.error("Failed to fetch user info:", error)
      }
    }
    fetchUserInfo()
  }, [])

  const displayName = userInfo ? 
    (userInfo.first_name && userInfo.last_name ? 
      `${userInfo.first_name} ${userInfo.last_name}` : 
      userInfo.username || userInfo.email.split('@')[0]
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