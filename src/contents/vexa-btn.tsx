import type { PlasmoCSConfig } from "plasmo";
import React from "react";
import ReactDOM from "react-dom";
import Draggable from "react-draggable";
import rootCssText from "data-text:~root.scss";
import vexaBtnCss from 'data-text:./vexa-btn.scss';
import { StorageService, StoreKeys } from "~lib/services/storage.service";
import { VexaIcon } from "~shared/components/VexaLogo/VexaIcon";
import { createRoot } from "react-dom/client";
import { getIdFromUrl } from "~shared/helpers/meeting.helper";

const VexaBtn = () => {
    const [isMaximized, setIsMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE, true);
    const isValidContext = getIdFromUrl(location.href);

    return (
        <>
            {
                isValidContext && !isMaximized && (<Draggable>
                    <button style={{
                        top: 'calc(50vh - 29px) !important',
                        right: '20px !important',
                        position: 'fixed',
                    }} onClick={() => setIsMaximized(true)} className="VexaBtn rounded-[15px] w-[58px] h-[58px] p-4 flex items-center justify-center bg-[#7F56D9]">
                        <VexaIcon strokeColor='white' />
                    </button>
                </Draggable>)
            }
        </>
    )
};

export default VexaBtn;

export const config: PlasmoCSConfig = {
    matches: ['*://meet.google.com/*', '*://www.youtube.com/watch?*'],
};

const injectUI = () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    root.render(<VexaBtn />);
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectUI);
} else {
    injectUI();
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = `
        ${rootCssText}
        ${vexaBtnCss}
    `
    return style
}