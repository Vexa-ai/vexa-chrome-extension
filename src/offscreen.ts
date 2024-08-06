import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";

const VOLUME_PROCESSOR_PATH = chrome.runtime.getURL('js/volume-processor.js');

export interface AudioChunkEntry {
  chunk: string;
  chunkType: string;
  bufferChunkData: ArrayBuffer;
  bufferString: string;
  connectionId: string;
  chrome_domain: string;
  main_domain: string;
  token: string;
  url: string;
  meetingId: string;
  isDebug: boolean;
  countIndex: number;
  tab: chrome.tabs.Tab;
  chunkBufferBlob: Blob;
}

const queue: AudioChunkEntry[] = [];
let messagesCounter = 1;
let currentChunkBeingSent: AudioChunkEntry = null;
let recordingStopped = true;
let queueInterval = setInterval(() => {
  if (currentChunkBeingSent) {
    return;
  }

  function sentNextChunk() {
    if (queue.length === 0) {
      return;
    }

    currentChunkBeingSent = queue.shift();

    if (!currentChunkBeingSent) return;
    const { chunkBufferBlob, chunkType, connectionId, chrome_domain, token, main_domain, meetingId, countIndex, isDebug, tab } = currentChunkBeingSent;
    if (chunkBufferBlob.size === 0) {
      currentChunkBeingSent = null;
      return;
    }
    const audioURL = `${chrome_domain}/api/v1/extension/audio?meeting_id=${meetingId}&connection_id=${connectionId}&token=${token}&i=${countIndex}`;
    messageSender.sendBackgroundMessage({ type: MessageType.BACKGROUND_DEBUG_MESSAGE, data: { url: audioURL, destinationTabId: tab.id } });
    fetch(audioURL, {
      method: 'PUT',
      body: chunkBufferBlob,
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    }).then((res) => {
      if (!(res.status < 400)) {
        stopRecording();
        messageSender.sendBackgroundMessage({ type: MessageType.USER_UNAUTHORIZED, data: { code: res.status } });

        queue.unshift(currentChunkBeingSent);
        currentChunkBeingSent = null;

        return;
      }
      currentChunkBeingSent = null;
      messagesCounter++;

      setTimeout(sentNextChunk, 200);
      pollTranscript(main_domain, meetingId, token, tab.id);
    }).catch(() => {
      queue.unshift(currentChunkBeingSent);
      currentChunkBeingSent = null;
    }).finally(() => {
      currentChunkBeingSent = null;
    });
  }
  sentNextChunk();
}, 10000);

MessageListenerService.initializeListenerService();
const messageSender = new MessageSenderService();
let recorder: MediaRecorder = null;
let streamsToClose: MediaStream[] = [];
let lastValidTranscriptTimestamp = null;
let lastMeetingId = '';
let isDebugMode = false;
const blobChunks: AudioChunkEntry[] = [];

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


MessageListenerService.registerMessageListener(MessageType.START_MIC_LEVEL_STREAMING, async (evtData, sender) => {
  // TODO: fix mic levels
  return;

  try {
    const micLabel: string = evtData.data.micLabel;
    micCheckStopper();
    const deviceId = await getMicDeviceIdByLabel(micLabel, sender.tab);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    });

    audioContext = new AudioContext();
    await audioContext.resume();
    await audioContext.audioWorklet.addModule(VOLUME_PROCESSOR_PATH);
    const microphone = audioContext.createMediaStreamSource(stream);
    // DOMException: Failed to construct 'AudioWorkletNode': AudioWorkletNode cannot be created: No execution context available.
    let volumeProcessorNode: AudioWorkletNode;
    try {
      volumeProcessorNode = new AudioWorkletNode(audioContext, 'volume-processor');
      microphone.connect(volumeProcessorNode).connect(audioContext.destination);
    } catch (error) {

    }

    const micLevelAccumulator = new Array(100);
    let pointer = 0;
    const ACC_CAPACITY = 50;

    if (volumeProcessorNode) {
      volumeProcessorNode.port.onmessage = (event) => {
        micLevelAccumulator[pointer % ACC_CAPACITY] = +event.data;
        pointer++;
      };
    }


    const _interval = setInterval(() => {
      const level = micLevelAccumulator.reduce((a, b) => +a + +b, 0) / (ACC_CAPACITY / 10);
      messageSender.sendBackgroundMessage({ type: MessageType.MIC_LEVEL_STREAM_RESULT, data: { level, pointer, tab: sender.tab } })
    }, 150);

    micCheckStopper = async () => {
      if (audioContext && audioContext.state !== 'closed') {
        await audioContext.close();
      }
      microphone.disconnect();
      if (volumeProcessorNode) {
        volumeProcessorNode.disconnect();
      }

      clearInterval(_interval);
    };
  } catch (err) {
    console.error(err);
    stopRecording();
  }
});

MessageListenerService.registerMessageListener(MessageType.STOP_RECORDING, async (message, sender) => {
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

MessageListenerService.registerMessageListener(MessageType.ON_MEDIA_CHUNK_RECEIVED, async (message, sender) => {
  const chunkBuffer = base64ToArrayBuffer(message.data.chunk);
  const chunkBufferBlob = arrayBufferToBlob(chunkBuffer, message.data.chunkType);
  if (isDebugMode) {
    const audioUrl = URL.createObjectURL(chunkBufferBlob);
    const audio = new Audio(audioUrl);
    audio.play().then(() => {
    }).catch(error => {
      console.error('Error playing audio:', error);
    });
    return;
  }

  message.data['tab'] = sender.tab;
  message.data['chunkBufferBlob'] = chunkBufferBlob;
  if(recordingStopped) {
    queue.length = 0;
    recordingStopped = false;
  }
  queue.push(message.data);
  console.log(queue.map(el => el.countIndex));
});

function arrayBufferToBlob(arrayBuffer: ArrayBuffer, mimeType: string): Blob {
  return new Blob([arrayBuffer], { type: mimeType });
}


async function pollTranscript(main_domain: string, meetingId: string, token: string, tabId: chrome.tabs.Tab['id']) {
  if (meetingId !== lastMeetingId) {
    lastMeetingId = meetingId;
    lastValidTranscriptTimestamp = null;
  }
  setTimeout(async () => {
    const transcriptionURL = `${main_domain}/api/v1/transcription?meeting_id=${meetingId}&token=${token}${lastValidTranscriptTimestamp ? '&last_msg_timestamp=' + lastValidTranscriptTimestamp.toISOString() : ''}`;
    messageSender.sendBackgroundMessage({ type: MessageType.BACKGROUND_DEBUG_MESSAGE, data: { url: transcriptionURL } });
    fetch(transcriptionURL, {
      method: 'GET',
    }).then(async res => {
      if (!(res.status < 400)) {
        stopRecording();
        messageSender.sendBackgroundMessage({ type: MessageType.USER_UNAUTHORIZED, data: { code: res.status } });
        return;
      }
      const transcripts = await res.json();
      console.log({ transcripts });
      if (transcripts && transcripts.length) {
        const dateBackBy5Minute = new Date(transcripts[transcripts.length - 1].timestamp);
        dateBackBy5Minute.setMinutes(dateBackBy5Minute.getMinutes() + 1);
        lastValidTranscriptTimestamp = dateBackBy5Minute;
      }
      messageSender.sendBackgroundMessage({
        type: MessageType.OFFSCREEN_TRANSCRIPTION_RESULT,
        data: {
          transcripts,
          tabId,
        },
      });
    }, error => {
    });
  }, 10000);

}

async function stopRecording() {
  isDebugMode = false;
  recordingStopped = true;
  queue.length = 0;
  messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'Recording stopped' } })
}

async function pauseRecording() {
  recorder.pause();
}

async function unpauseRecording() {
  recorder.resume();
}


