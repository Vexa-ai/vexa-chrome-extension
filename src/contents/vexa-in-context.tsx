import type { PlasmoCSConfig } from "plasmo";
import React, { useEffect } from "react";
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

const VexaInMeetContext = () => {
  const platform = getPlatform();
  // const [isYoutubeEnabled] = StorageService.useHookStorage(StoreKeys.YOUTUBE_ENABLED, false);

  useEffect(() => {
    MessageListenerService.initializeListenerService();
  }, []);

  return (
    <div id="vexa-content-ui" className={platform} style={{
      position: 'fixed',
      zIndex: 99999999
    }}>
      {/* {(platform === Platform.YOUTUBE && isYoutubeEnabled || platform === Platform.MEET) ? <Vexa /> : <></>} */}
      {(platform === Platform.MEET) ? <Vexa /> : <></>}
    </div>
  );
};

export default () => <></>;

const injectUI = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<VexaInMeetContext />);
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