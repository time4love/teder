/**
 * Optional sound for the radio dial: soft filtered static between stations that gives way
 * to a clean tone as a station comes in. Created only after the visitor turns sound on, so
 * the AudioContext starts from a user gesture.
 */
export class TunerSound {
  private readonly ctx: AudioContext;
  private readonly noiseGain: GainNode;
  private readonly toneGain: GainNode;
  private readonly osc: OscillatorNode;

  constructor() {
    this.ctx = new AudioContext();
    const master = this.ctx.createGain();
    master.gain.value = 0.6;
    master.connect(this.ctx.destination);

    // Two seconds of looping white noise, band-passed to sound like radio static.
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const band = this.ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1400;
    band.Q.value = 0.7;
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    source.connect(band).connect(this.noiseGain).connect(master);
    source.start();

    this.osc = this.ctx.createOscillator();
    this.osc.type = "sine";
    this.osc.frequency.value = 330;
    this.toneGain = this.ctx.createGain();
    this.toneGain.gain.value = 0;
    this.osc.connect(this.toneGain).connect(master);
    this.osc.start();
  }

  /** Follow the dial: static fades as clarity rises, the station's own frequency fades in. */
  update(clarity: number, stationHz: number): void {
    const now = this.ctx.currentTime;
    this.noiseGain.gain.setTargetAtTime((1 - clarity) * 0.05, now, 0.05);
    this.toneGain.gain.setTargetAtTime(clarity * clarity * 0.03, now, 0.08);
    this.osc.frequency.setTargetAtTime(stationHz, now, 0.1);
  }

  close(): void {
    void this.ctx.close();
  }
}
