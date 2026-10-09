/* global AudioWorkletProcessor, registerProcessor, sampleRate */
// A plain script asset loaded by URL, because the page CSP allows no blob: scripts. The target rate arrives in processorOptions.

class Pcm16 extends AudioWorkletProcessor {
  constructor(options) {
    super()
    const rate = options.processorOptions.rate
    this.step = sampleRate / rate
    this.t = this.step
    this.prev = 0
    this.size = rate / 10
    this.frame = new Int16Array(this.size)
    this.n = 0
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (!channel) return true
    while (this.t < channel.length) {
      const i = Math.floor(this.t)
      const f = this.t - i
      const a = i === 0 ? this.prev : channel[i - 1]
      const b = channel[i]
      const s = Math.max(-1, Math.min(1, a + (b - a) * f))
      this.frame[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff
      if (this.n === this.frame.length) {
        this.port.postMessage(this.frame.buffer, [this.frame.buffer])
        this.frame = new Int16Array(this.size)
        this.n = 0
      }
      this.t += this.step
    }
    this.t -= channel.length
    this.prev = channel[channel.length - 1]
    return true
  }
}
registerProcessor('pcm16', Pcm16)
