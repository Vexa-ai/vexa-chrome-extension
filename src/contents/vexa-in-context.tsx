import type { PlasmoCSConfig } from "plasmo";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import rootCssText from "data-text:~root.scss";
import customSelectCss from 'data-text:../shared/components/CustomSelect/CustomSelect.scss';
import microphoneSelectCss from 'data-text:../shared/components/MicrophoneSelector/MicrophoneSelector.scss';
import transcriptListCss from 'data-text:../shared/components/TranscriptList/TranscriptList.scss';
import mainContentViewCss from 'data-text:../shared/components/MainContentView/MainContentView.scss';
import vexaCss from 'data-text:./vexa.scss';
import vexaBtnCss from 'data-text:./vexa-btn.scss';
import { createRoot } from "react-dom/client";
import Vexa from "./vexa";
import { getPlatform, isRecordablePlatform } from "~shared/helpers/is-recordable-platform.helper";

const VexaInMeetContext = () => {
  // const isValidContext = isRecordablePlatform();
  const platform =  getPlatform();
  return (
    <>
      {/* {isValidContext && ( */}
      {(
        <div id="vexa-content-ui" className={platform} style={{
          position: 'fixed',
          zIndex: 99999999
        }}>
          <Vexa />
        </div>
      )}
    </>
  );
};

export default () => <></>;

const injectUI = () => {
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
  matches: ['*://meet.google.com/*', '*://www.youtube.com/watch?*'],
  css: ["./vexa.scss", "../assets/fonts/Inter/inter.face.scss"],
};