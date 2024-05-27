import { Storage } from "@plasmohq/storage";
import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import { StorageService, StoreKeys } from "~lib/services/storage.service";
const VOLUME_PROCESSOR_PATH = chrome.runtime.getURL('js/volume-processor.js');

MessageListenerService.initializeListenerService();
const messageSender = new MessageSenderService();
let recorder: MediaRecorder = null;
let streamsToClose: MediaStream[] = [];

let audioContext: AudioContext;

async function getMicDeviceIdByLabel(micLabel, tab?) {
  try {
    await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    const devices = await navigator.mediaDevices.enumerateDevices();

    return devices.find(d => "audioinput" === d.kind && d.label === micLabel)?.deviceId;
  } catch (e) {
    if (tab.url !== chrome.runtime.getURL('settings.html')) {
      chrome.runtime.sendMessage({ action: 'open-settings' }); // open settings once
      // TODO: add preventive timeout
    }
  }
}

let micCheckStopper = () => {
};

MessageListenerService.registerMessageListener(MessageType.REQUEST_MEDIA_DEVICES, async (evtData, sender, sendResponse) => {

});

MessageListenerService.registerMessageListener(MessageType.START_MIC_LEVEL_STREAMING, async (evtData, sender, sendResponse) => {
  try {
    const micLabel: string = evtData.data.micLabel;
    micCheckStopper();
    const deviceId = await getMicDeviceIdByLabel(micLabel, sender.tab);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    });

    audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule(VOLUME_PROCESSOR_PATH); // Load the audio worklet processor
    const microphone = audioContext.createMediaStreamSource(stream);
    const volumeProcessorNode = new AudioWorkletNode(audioContext, 'volume-processor');
    microphone.connect(volumeProcessorNode).connect(audioContext.destination);

    const micLevelAccumulator = new Array(100);
    let pointer = 0;
    const ACC_CAPACITY = 50;
    volumeProcessorNode.port.onmessage = (event) => {
      // pointer = (pointer + 1) % 100;
      micLevelAccumulator[pointer % ACC_CAPACITY] = +event.data;
      pointer++;
    };

    const _interval = setInterval(() => {
      const level = micLevelAccumulator.reduce((a, b) => +a + +b, 0) / (ACC_CAPACITY / 10);
      messageSender.sendBackgroundMessage({ type: MessageType.MIC_LEVEL_STREAM_RESULT, data: { level, pointer, tab: sender.tab } })
    }, 150);

    micCheckStopper = async () => {
      if (audioContext) {
        await audioContext.close(); // Close any existing audio context
      }
      microphone.disconnect();
      volumeProcessorNode.disconnect();
      clearInterval(_interval);
    };
  } catch (err) {
    console.error(err);
    stopRecording();
  }
});

MessageListenerService.registerMessageListener(MessageType.PAUSE_RECORDING, async (message, sender, sendResponse) => {
  sendResponse(pauseRecording());
});

MessageListenerService.registerMessageListener(MessageType.RESUME_RECORDING, async (message, sender, sendResponse) => {
  sendResponse(unpauseRecording());
});

MessageListenerService.registerMessageListener(MessageType.STOP_RECORDING, async (message, sender, sendResponse) => {
  stopRecording();
});

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

MessageListenerService.registerMessageListener(MessageType.ON_MEDIA_CHUNK_RECEIVED, async (message, sender, sendResponse) => {
  const { chunk: base64String, chunkType, connectionId, domain, token, url, meetingId, countIndex, isDebug } = message.data;
  try {
      const chunkBuffer = base64ToArrayBuffer(base64String);
      const chunkBufferBlob = arrayBufferToBlob(chunkBuffer, chunkType);

      if (isDebug) {
          // Play audio
          const audioUrl = URL.createObjectURL(chunkBufferBlob);
          const audio = new Audio(audioUrl);
          audio.play().then(() => {
              sendResponse({ status: 'playing' });
          }).catch(error => {
              console.error('Error playing audio:', error);
              sendResponse({ status: 'error', error });
          });
      } else {
          // Send data chunk
          sendDataChunk(chunkBufferBlob, connectionId, domain, token, url, meetingId, sender.tab, countIndex);
      }
  } catch (error) {
      console.error('Error decoding audio chunk:', error);
      sendResponse({ status: 'error', error });
  }
});

function arrayBufferToBlob(arrayBuffer: ArrayBuffer, mimeType: string): Blob {
  return new Blob([arrayBuffer], { type: mimeType });
}

async function sendDataChunk(data: Blob, connectionId: string, domain: string, token: string, url: string, meetingId: string, tab: chrome.tabs.Tab, countIndex: number) {
  if (data.size > 0) {
    const timestamp = new Date();
    fetch(`${domain}/api/v1/extension/audio?meeting_id=${meetingId}&connection_id=${connectionId}&token=${token}&i=${countIndex}`, {
      method: 'PUT',
      body: data,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    }).then(response => {
      if (!(response.status < 401)) {
        if (response.status === 401) {
          messageSender.sendBackgroundMessage({ type: MessageType.USER_UNAUTHORIZED });
        }
        return;
      }
      pollTranscript(meetingId, token, timestamp, tab.id);
    }, error => {
      console.error('An error occured', error);
    });
  }
}

async function pollTranscript(meetingId: string, token: string, timestamp = new Date(), tabId: chrome.tabs.Tab['id']) {
  timestamp.setMinutes(timestamp.getMinutes() - 5);
  setTimeout(() => {
    fetch(`${process.env.PLASMO_PUBLIC_MAIN_AWAY_BASE_URL}/api/v1/transcription?meeting_id=${meetingId}&token=${token}`, {
      method: 'GET',
    }).then(async res => {
      if (!(res.status < 401)) {
        if (res.status === 401) {
          messageSender.sendBackgroundMessage({ type: MessageType.USER_UNAUTHORIZED });
        }
        return;
      }
      const transcripts = await res.json();
      messageSender.sendBackgroundMessage({
        type: MessageType.OFFSCREEN_TRANSCRIPTION_RESULT,
        data: {
          transcripts,
          tabId,
        },
      });
    }, error => {
    });
  }, 1500);

}

async function stopRecording() {
  messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'Recording stopped' } })
  return true;
}

async function pauseRecording() {
  recorder.pause();

  return true;
}

async function unpauseRecording() {
  recorder.resume();

  return true;
}


