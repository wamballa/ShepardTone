# Shepard Tone

A browser-based exploration of Shepard tones, Shepard scales, and Shepard-Risset glissandi.

This project generates looping pitch illusions in real time with the Web Audio API and includes a visualizer for the octave-cycle motion behind the effect.

## What It Does

- Generates continuous Shepard-Risset style glissandi
- Switches between continuous glissando, discrete Shepard scale, and held glissando modes
- Includes multiple timbre options, from pure sine waves to more stylized textures
- Visualizes waveform output and octave-layer motion
- Lets you experiment with layer count, spacing, width, and echo

## Controls

- `Direction`: rising or falling motion
- `Mode`: continuous glissando, discrete Shepard scale, or held glissando
- `Cycle Speed`: how quickly the illusion moves through the octave cycle
- `Center Frequency`: the tonal center of the effect
- `Volume`: overall output level
- `Timbre`: waveform and tone character
- `Layers`: number of octave-spaced voices
- `Echo`: wet mix of the delay effect
- `Width`: stereo spread
- `Spacing`: how evenly the voices are staggered through the cycle

## Running It

This is a static project, so it does not require `npm`.

Open the file directly:

```powershell
start index.html
```

Or run a simple local server:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `index.html` - page structure and controls
- `styles.css` - layout and visual styling
- `script.js` - audio engine, modes, timbres, and visualizer
- `shepard-tone.wav` - reference audio used during development

## Notes

Browsers require a user gesture before audio can begin, so playback starts only after pressing `Start Audio`.
