import type { PlasmoCSConfig } from "plasmo";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Draggable, { type DraggableData, type DraggableEvent } from "react-draggable";
import rootCssText from "data-text:~root.scss";
import vexaBtnCss from 'data-text:./vexa-btn.scss';
import { StorageService, StoreKeys } from "~lib/services/storage.service";
import { VexaIcon } from "~shared/components/VexaLogo/VexaIcon";
import { createRoot } from "react-dom/client";
import { getIdFromUrl } from "~shared/helpers/meeting.helper";

const VexaBtn = () => {
    const [isMaximized, setIsMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE, true);
    const isValidContext = getIdFromUrl(location.href);
    const defaultPosition = { x: 0, y: 0 };
    const [position, setPosition] = useState(defaultPosition);
    
    const handleDrag = (e: DraggableEvent, data: DraggableData) => {
        setPosition({ x: data.x, y: data.y });
    };

    const handleStop = (e: DraggableEvent, data: DraggableData) => {
        const { clientWidth, clientHeight } = document.documentElement;
        const { node } = data;
        const rect = node.getBoundingClientRect();
        if (rect.right < 0 || (rect.top > clientHeight || rect.bottom < 0) || rect.left > clientWidth) {
            setPosition(defaultPosition);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (isMaximized) {
                const { clientWidth, clientHeight } = document.documentElement;
                const node = document.getElementById("vexa-content-div");
                if (node) {
                    const rect = node.getBoundingClientRect();
                    if (rect.right < 0 || (rect.top > clientHeight || rect.bottom < 0) || rect.left > clientWidth) {
                        setPosition(defaultPosition);
                    }
                }
            }
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [isMaximized]);

    return (
        <>
            {
                isValidContext && !isMaximized && (<Draggable
                    position={position}
                    onDrag={handleDrag}
                    onStop={handleStop}
                >
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