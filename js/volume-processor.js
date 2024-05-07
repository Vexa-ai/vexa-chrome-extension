class VolumeProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (input) {
            const inputData = input[0];
            let sum = 0;
            for (let i = 0; i < inputData?.length; i++) {
                sum += inputData[i] * inputData[i];
            }
            let volume = Math.sqrt(sum / inputData.length);
            this.port.postMessage(volume.toFixed(2));
        }
        return true;
    }
}

registerProcessor('volume-processor', VolumeProcessor);