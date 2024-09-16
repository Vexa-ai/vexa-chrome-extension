import minimizeIcon from "data-base64:~assets/images/svg/minimize-01.svg"
import { Minimize } from "lucide-react"
import React from "react"

import { Button } from "~components/ui/Button"
import { StorageService, StoreKeys } from "~lib/services/storage.service"

export interface VexaMinimizeButtonProps {}

export function MinimizeButton({ ...rest }: VexaMinimizeButtonProps) {
  const [_, setIsMaximized] = StorageService.useHookStorage<boolean>(
    StoreKeys.WINDOW_STATE
  )

  const minimizeVexa = () => {
    setIsMaximized(false)
  }

  return (
    <div {...rest} className="VexaMinimizeButton">
      <Button
        onClick={minimizeVexa}
        variant="outline"
        size="sm"
        className="flex items-center gap-2">
        <Minimize size={16} />
        <span>Minimize</span>
      </Button>
    </div>
  )
}
