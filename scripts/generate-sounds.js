const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION = 0.5; // seconds

function generateWav(freq, duration = DURATION, volume = 0.3) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Generate sine wave with fade in/out
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.min(1, Math.min(t * 50, (duration - t) * 50));
    const sample = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  return buffer;
}

const sounds = {
  'notification': 800,
  'approved': 1200,
  'rejected': 300,
  'shipment': 600,
  'completed': 1000,
};

const outDir = path.join(__dirname, '..', 'frontend', 'public', 'sounds');

for (const [name, freq] of Object.entries(sounds)) {
  const wav = generateWav(freq);
  fs.writeFileSync(path.join(outDir, `${name}.wav`), wav);
  console.log(`Created ${name}.wav (${freq}Hz)`);
}

console.log('All sounds generated!');
