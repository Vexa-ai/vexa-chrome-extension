import settingsIcon from "data-base64:~assets/images/svg/gear.svg"
import { Cog } from "lucide-react"
import React from "react"

import { Button } from "~components/ui/Button"
import { MessageType } from "~lib/services/message-listener.service"
import { MessageSenderService } from "~lib/services/message-sender.service"

const messageSender = new MessageSenderService()

export interface VexaSettingsButtonProps {}

export function SettingsButton({ ...rest }: VexaSettingsButtonProps) {
  const openOptions = () => {
    messageSender.sendBackgroundMessage({ type: MessageType.OPEN_SETTINGS })
  }

  return (
    <div {...rest} className="VexaSettingsButton">
      <Button onClick={openOptions} variant="ghost" size="icon">
        <Cog size={16} />
      </Button>
    </div>
  )
}
