import { MessageListenerService, MessageType } from "~lib/services/message-listener.service";
import { MessageSenderService } from "~lib/services/message-sender.service";
import { getPort } from "@plasmohq/messaging/port"
import { relayMessage } from "@plasmohq/messaging";


MessageListenerService.initializeListenerService();

const messageSender = new MessageSenderService();
// const mediaDevicesPort = getPort("media-devices");

let recorder = null;
let streamsToClose = [];

let audioContext;

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
  console.log('Here');
  console.log(evtData.data);
  try {
    await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    navigator.mediaDevices.enumerateDevices().then(devices => {
      messageSender.sendSidebarMessage({ type: MessageType.MEDIA_DEVICES, data: { devices }})
      // sendResponse(devices);
    }).catch(error => console.error('Error getting available microphones:', error));
  } catch (error) {
    console.log('Failed to get media permissions', error);
    // sendResponse([]);
    messageSender.sendSidebarMessage({ type: MessageType.MEDIA_DEVICES, data: { devices: [] }})

  }
});

// mediaDevicesPort.onMessage.addListener(async (message, port) => {
//   console.log(message);
//   try {
//     await navigator.mediaDevices.getUserMedia({
//       audio: true,
//       video: false,
//     });
//     navigator.mediaDevices.enumerateDevices().then(devices => {
//       // const microphones = devices.filter(device => device.kind === 'audioinput');
//       // const speakers = devices.filter(device => device.kind === 'audiooutput');
//       port.postMessage(devices);
//     }).catch(error => console.error('Error getting available microphones:', error));
//   } catch (error) {
//     console.log('Failed to get media permissions', error);
//   }
// });

chrome.runtime.onMessage.addListener(async (message, { tab }, callback) => {
  if (message.target === 'offscreen') {
    switch (message.type) {
      case 'stop-mic-level-check':
        micCheckStopper();

        break;
      case 'start-mic-level-check':
        // TODO: restart every X minutes or depend on background script to stop on tab closed
        micCheckStopper(); // Stop previous checker

        const micLabel = message.micLabel;

        const deviceId = await getMicDeviceIdByLabel(micLabel, tab);

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });

        audioContext = new AudioContext();
        console.log("Creating processor");
        await audioContext.audioWorklet.addModule('volume-processor.js'); // Load the audio worklet processor

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
          chrome.runtime.sendMessage({ tabId: message.tabId, action: 'mic-level', level, pointer });
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

        break;
      // case 'stop-mic-level-check':
      //   startRecording(message.data.deviceId, message.data.streamId, message.data.connectionId);
      //   break;
      case 'start-recording':
        callback(startRecording(message.data.deviceId, message.data.streamId, message.data.connectionId, message.data.token, message.data.domain, message.data.url));
        break;
      case 'stop-recording':
        callback(stopRecording());
        break;
      case 'pause-recording':
        callback(pauseRecording());
        break;
      case 'unpause-recording':
        callback(unpauseRecording());
        break;
      default:
        throw new Error('Unrecognized message:', message.type);
    }
  }

  return true;
});


function downloadFile(name, blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

let timestamp;
let counter;

async function startRecording(micLabel, streamId, connectionId, token, domain, url) {
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
      // mimeType: 'video/webm;codecs=vp8,opus',
      mimeType: 'audio/webm;codecs=opus',
    });


    let i = 0;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // downloadFile(`${timestamp}-${counter++}.webm`, event.data); return;

        fetch(`${domain}/audio?connection_id=${connectionId}&token=${token}&i=${i++}&url=${url}`, {
          method: 'PUT',
          body: event.data,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });
      }
    };

    recorder.onerror = (error) => {
      console.log("Error", error);
      // socket.close();
    };

    recorder.onstop = () => {
      recorder = null;
      window.location.hash = '';

      isStopped = true;

      // Wait a bit before socket to be closed
      // setTimeout(_ => socket.close(), 5000);
    }

    // setTimeout(() => {
    recorder.start(3000);
    // recorder.start();
    // }, 1000);

    window.location.hash = 'recording';

    return true;
  } catch (error) {
    console.log(error)
    // sendMsgToSW({action: 'getPermission'});
    await stopRecording();
  }

  return false;
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

    return true;
  } catch (e) {
    console.log(e)
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
    audio: {
      deviceId: {
        exact: streamId
      }
    },
    // video: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId } },
  });

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

