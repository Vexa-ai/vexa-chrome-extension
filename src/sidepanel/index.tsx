import rootCssText from "data-text:~root.scss";
import './index.scss';
import type { PlasmoCSConfig } from "plasmo";
import React, { useEffect } from "react";
import { SidebarReloadButton } from "~devtools/components";
import { MicrophoneOptions, VexaToolbar } from "~shared/components";
import { AudioCaptureContext, useAudioCapture } from "~shared/hooks/use-audiocapture";
import { Storage } from "@plasmohq/storage"

const Vexa = () => {
    const audioCapture = useAudioCapture();
    const storage = new Storage()

    useEffect(() => {
        storage.clear();
    }, [])
    
    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 p-4">
            <AudioCaptureContext.Provider value={audioCapture}>
                <VexaToolbar />
                <MicrophoneOptions className="mt-3"/>
            </AudioCaptureContext.Provider>
        </div>
    )
};

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = rootCssText
    return style
  }

export const config: PlasmoCSConfig = {
    matches: ['<all_urls>*'],
    css: ["./index.scss"],
};

export default Vexa;