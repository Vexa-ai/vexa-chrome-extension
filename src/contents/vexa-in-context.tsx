import type { PlasmoCSConfig } from "plasmo";
import React, {useEffect, useRef, useState} from "react";
import rootCssText from "data-text:~root.scss";
import customSelectCss from 'data-text:../shared/components/CustomSelect/CustomSelect.scss';
import microphoneSelectCss from 'data-text:../shared/components/MicrophoneSelector/MicrophoneSelector.scss';
import transcriptListCss from 'data-text:../shared/components/TranscriptList/TranscriptList.scss';
import mainContentViewCss from 'data-text:../shared/components/MainContentView/MainContentView.scss';
import vexaCss from 'data-text:../shared/components/vexa/vexa.scss';
import vexaBtnCss from 'data-text:./vexa-btn.scss';
import { createRoot } from "react-dom/client";
import Vexa from "../shared/components/vexa/vexa";
import { Platform, getPlatform } from "~shared/helpers/is-recordable-platform.helper";
import { StorageService, StoreKeys } from "~lib/services/storage.service";
import { MessageListenerService } from "~lib/services/message-listener.service";
import {TranscriptionEntryMode} from "~shared/components/TranscriptEntry";

StorageService.set(StoreKeys.TRANSCRIPT_MODE, TranscriptionEntryMode.HtmlContent);


let matchesUrlChecker = () => /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/.test(window.location.href);

const VexaInMeetContext = ({onMaximizedChanged = (isMax: boolean) => {}}) => {
  const platform = getPlatform();
  // const [isYoutubeEnabled] = StorageService.useHookStorage(StoreKeys.YOUTUBE_ENABLED, false);
  const [isMaximized] = StorageService.useHookStorage<boolean>(StoreKeys.WINDOW_STATE, true);
  const [matchesUrl, setMatchesUrl] = useState(matchesUrlChecker());

  useEffect(() => {
    const listener = () => {
      setMatchesUrl(matchesUrlChecker());
    };

    window.navigation.addEventListener("navigate", listener);

    return () => {
      window.navigation.removeEventListener("navigate", listener);
    }
  }, [])

  useEffect(() => {
    onMaximizedChanged(isMaximized);
  }, [isMaximized]);

  useEffect(() => {
    MessageListenerService.initializeListenerService();
    onMaximizedChanged(isMaximized);
  }, []);

  return (
    matchesUrl && <div id="vexa-content-ui" className={platform} style={{
      position: 'fixed',
      zIndex: 99999999
    }}>
      {/* {(platform === Platform.YOUTUBE && isYoutubeEnabled || platform === Platform.MEET) ? <Vexa /> : <></>} */}
      {(platform === Platform.MEET) ? <Vexa /> : <></>}
    </div>
  );
};

export default () => <></>;

/*
let isMaximized = true;
const maximizedChanged = function (isMax: boolean) {
  console.log({isMax});
  isMaximized = isMax;
  const crqnQb = document.querySelector('.crqnQb') as HTMLDivElement;
  if (crqnQb) {
    crqnQb.setAttribute('style', `width: ${(isMax ? 'calc(100% - 400px)!important' : '100%')}`);
  }

  const mP3Ih = document.querySelector('.mP3Ih') as HTMLDivElement;
  if (mP3Ih) {
    mP3Ih.setAttribute('style', `padding-right: ${(isMax ? '420px!important' : 'unset')}`);
  }
};
*/

const maximizedChanged = () => {}

const injectUI = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<VexaInMeetContext onMaximizedChanged={maximizedChanged} />);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectUI);
} else {
  injectUI();
}

/*
console.log("Redefine innerWidth");
let originalWidthGetter = Object.getOwnPropertyDescriptor(window, "innerWidth")?.get;
window.__defineGetter__("innerWidth", function () {
  isMaximized = true;
  let s = originalWidthGetter && originalWidthGetter();
  console.log("innerWidth called", {s, isMaximized});
  return isMaximized ? s - 400 : s
});
document.documentElement?.__defineGetter__("clientWidth", function () {
  return window.innerWidth
});
document.body?.__defineGetter__("clientWidth", function () {
  return window.innerWidth
})
*/


export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    ${rootCssText}
    ${customSelectCss}
    ${microphoneSelectCss}
    ${vexaCss}
    ${mainContentViewCss}
    ${transcriptListCss}
    ${vexaBtnCss}
  `;
  return style
}


export const config: PlasmoCSConfig = {
  matches: ['*://meet.google.com/*'],
  css: ["../shared/components/vexa/vexa.scss", "../assets/fonts/Inter/inter.face.scss"],
};