import rootCssText from "data-text:~root.scss";
import './index.scss';
import type { PlasmoCSConfig } from "plasmo";
import React from "react";
import { SidebarReloadButton } from "~devtools/components";
import { MicrophoneOptions, VexaToolbar } from "~shared/components";

const Vexa = () => {
    return (
        <div className="flex flex-col h-screen w-full bg-slate-950 p-4">
            {/* <SidebarReloadButton /> */}
            <VexaToolbar />
            <MicrophoneOptions className="mt-3"/>
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