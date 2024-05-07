import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
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
  try {
    await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    navigator.mediaDevices.enumerateDevices().then(devices => {
      messageSender.sendSidebarMessage({ type: MessageType.MEDIA_DEVICES, data: { devices } })
    }).catch(error => console.error('Error getting available microphones:', error));
  } catch (error) {
    if (error.message === 'Permission dismissed') {
      messageSender.sendBackgroundMessage({ type: MessageType.OPEN_SETTINGS })
    }
    console.log('Failed to get media permissions', error);
    // sendResponse([]);
    messageSender.sendSidebarMessage({ type: MessageType.MEDIA_DEVICES, data: { devices: [] } })
  }
});

MessageListenerService.registerMessageListener(MessageType.START_MIC_LEVEL_STREAMING, async (evtData, sender, sendResponse) => {
  const micLabel: string = evtData.data.micLabel;
  micCheckStopper(); // Stop previous checker
  const deviceId = await getMicDeviceIdByLabel(micLabel, sender.tab);

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: deviceId } },
  });

  audioContext = new AudioContext();
  console.log("Creating processor");
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
    messageSender.sendSidebarMessage({ type: MessageType.MIC_LEVEL_STREAM_RESULT, data: { level, pointer } })
  }, 150);

  micCheckStopper = async () => {
    console.log("Kill checker");
    if (audioContext) {
      await audioContext.close(); // Close any existing audio context
    }
    microphone.disconnect();
    volumeProcessorNode.disconnect();
    clearInterval(_interval);
  };

});

MessageListenerService.registerMessageListener(MessageType.PAUSE_RECORDING, async (message, sender, sendResponse) => {
  sendResponse(pauseRecording());
});

MessageListenerService.registerMessageListener(MessageType.RESUME_RECORDING, async (message, sender, sendResponse) => {
  sendResponse(unpauseRecording());
});

MessageListenerService.registerMessageListener(MessageType.START_RECORDING, async (message, sender, sendResponse) => {
  sendResponse(startRecording(message.data.micLabel, message.data.streamId, message.data.connectionId, message.data.meetingId, message.data.token, message.data.domain, message.data.url));
});

MessageListenerService.registerMessageListener(MessageType.STOP_RECORDING, async (message, sender, sendResponse) => {
  stopRecording();
});

let timestamp;
let counter;

async function startRecording(micLabel, streamId, connectionId, meetingId, token, domain, url) {
  let deviceId;
  try {
    deviceId = await getMicDeviceIdByLabel(micLabel);
  } catch (e) {
    console.log("Get mic", e);

    throw e;
  }

  if (!streamId || recorder?.state === 'recording') {
    return;
  }

  try {
    let isStopped = false;

    timestamp = Math.floor((new Date()).getTime() / 1000);
    counter = 1;

    let combinedStream = await getCombinedStream(deviceId, streamId);
    if (!combinedStream) {
      return;
    }

    recorder = new MediaRecorder(combinedStream, {
      mimeType: 'audio/webm;codecs=opus',
    });


    let i = 0;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        const timestamp = new Date();
        fetch(`${domain}/audio?meeting_id=${meetingId}&connection_id=${connectionId}&token=${token}&i=${i++}&url=${url}`, {
          method: 'PUT',
          body: event.data,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        }).then(response => {
          // We are only polling for transcripts only if the user has sent a chunk.
          // We wait 1 second, then poll for a transcript, may change implementation
          pollTranscript(meetingId, token, timestamp);
        });
      }
    };

    recorder.onerror = (error) => {
      console.log("Error", error);
      messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'An error occured' } })
    };

    recorder.onstop = () => {
      recorder = null;
      window.location.hash = '';
      isStopped = true;
      messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'Recording stopped' }  })

    }

    recorder.start(3000);
    window.location.hash = 'recording';
    messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_STARTED })

    return true;
  } catch (error) {
    console.log(error)
    await stopRecording();
  }

  return false;
}

async function pollTranscript(meetingId: string, token: string, timestamp = new Date()) {
  setTimeout(() => {
    fetch(`https://main.away.guru/api/v1/transcription?meetingId=${meetingId}&token=${token}&last_msg_timestamp=${timestamp.toISOString()}`, {
    method: 'GET',
    }).then(async res => {
      console.log('Transcript', await res.json());
    });
  }, 1500);
  
}

async function stopRecording() {
  try {
    if (["recording", "paused"].includes(recorder?.state)) {
      recorder.stop(); // WS disconnect after recorder stop
      recorder.stream.getTracks().forEach(t => t.stop());

      streamsToClose.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      })
    }
    window.location.hash = '';
    messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: 'Recording stopped' } })

    return true;
  } catch (e) {
    console.log(e)
    messageSender.sendBackgroundMessage({ type: MessageType.ON_RECORDING_END, data: { message: e?.message } })
  }

  return false;
}

async function pauseRecording() {
  recorder.pause();

  return true;
}

async function unpauseRecording() {
  recorder.resume();

  return true;
}


const getCombinedStream = async (deviceId, streamId) => {
  // Capturing microphone and tab audio
  const microphone = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, deviceId: deviceId ? { exact: deviceId } : undefined }
  });

  const streamOriginal = await navigator.mediaDevices.getUserMedia({
    audio: {mandatory: {chromeMediaSource: "tab", chromeMediaSourceId: streamId}},
  } as any);

  streamsToClose = [microphone, streamOriginal];

  // Making original sound available in the tab
  const context = new AudioContext();
  const stream = context.createMediaStreamSource(streamOriginal);
  stream.connect(context.destination);


  // Merging stream together
  const audioContext = new AudioContext();
  const audioSources = [];

  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 0; // don't hear self

  let audioTracksLength = 0;
  [microphone, streamOriginal].forEach(function (stream) {
    if (!stream.getTracks().filter(function (t) {
      return t.kind === 'audio';
    }).length) {
      return;
    }

    audioTracksLength++;

    let audioSource = audioContext.createMediaStreamSource(stream);
    audioSource.connect(gainNode);
    audioSources.push(audioSource);
  });

  const audioDestination = audioContext.createMediaStreamDestination();
  audioSources.forEach(function (audioSource) {
    audioSource.connect(audioDestination);
  });
  return audioDestination.stream;
};

