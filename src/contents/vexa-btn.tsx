import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";
import React, { useEffect, useState, type MouseEventHandler } from "react";
import Draggable, { type DraggableData, type DraggableEvent } from "react-draggable";
import rootCssText from "data-text:~root.scss";
import vexaBtnCss from 'data-text:./vexa-btn.scss';
import { VexaIcon } from "~shared/components/VexaLogo/VexaIcon";
import { createRoot } from "react-dom/client";
import { StorageService, StoreKeys } from "../lib/services/storage.service";
import { platform } from "os";
import { Platform, getPlatform } from "~shared/helpers/is-recordable-platform.helper";

const VexaBtn = () => {
    const [isMaximized, setIsMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE, true);
    const [isDragging, setIsDragging] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const platform = getPlatform();
    // const [isYoutubeEnabled] = StorageService.useHookStorage(StoreKeys.YOUTUBE_ENABLED, false);
    const defaultPosition = { x: 0, y: 0 };
    const [position, setPosition] = useState(defaultPosition);

    const handleDrag = (e: DraggableEvent, data: DraggableData) => {
        setPosition({ x: data.x, y: data.y });
        setIsDragging(true);
    };

    const handleStop = (e: DraggableEvent, data: DraggableData) => {
        const { clientWidth, clientHeight } = document.documentElement;
        const { node } = data;
        const rect = node.getBoundingClientRect();
        if (rect.right < 0 || (rect.top > clientHeight || rect.bottom < 0) || rect.left > clientWidth) {
            setPosition(defaultPosition);
        }
    };

    const onClickHandler: MouseEventHandler<HTMLButtonElement> = async (event) => {
        if (event.type === 'mousemove' || event.type === 'touchmove') {
            return;
        }

        if (event.type === 'click' && isDragging) {
            setIsDragging(false);
            return;
        }
        setIsMaximized(true);
    }

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

    useEffect(() => {
        setTimeout(() => {
            setIsReady(true)
        }, 500);

    }, [])


    return (
        <>
            {
                // (platform === Platform.YOUTUBE && isYoutubeEnabled || platform === Platform.MEET) && isReady && !isMaximized && (
                (platform === Platform.MEET) && isReady && !isMaximized && (
                    <div onMouseOver={() => setIsDragging(false)} onMouseOut={() => setIsDragging(false)}>
                        <Draggable
                            position={position}
                            onDrag={handleDrag}
                            onStop={handleStop}
                        >
                            <button onClick={onClickHandler} style={{
                                top: 'calc(50vh - 29px) !important',
                                right: '20px !important',
                                position: 'fixed',
                            }} className="VexaBtn rounded-[15px] w-[58px] h-[58px] p-4 flex items-center justify-center bg-[#7F56D9]">
                                <VexaIcon strokeColor='white' />
                            </button>
                        </Draggable>
                    </div>
                )
            }
        </>
    )
};

export default VexaBtn;

export const config: PlasmoCSConfig = {
    matches: ['*://meet.google.com/*'],
};

export const getInlineAnchor: PlasmoGetInlineAnchor = async () =>
    document.body

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = `
        ${rootCssText}
        ${vexaBtnCss}
    `
    return style
}