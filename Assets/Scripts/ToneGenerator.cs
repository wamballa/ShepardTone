using System.Collections;
using UnityEngine;

public class ShepardToneGenerator : MonoBehaviour
{
    public enum WaveType { Sine, Square, Triangle, Sawtooth }
    public WaveType waveType;  // Public variable to select the waveform type

    public bool pitchGoesUp = true;  // Public toggle for pitch direction (up or down)
    public bool useUploadedClip = false;  // Toggle to choose between tone generation and uploaded mp3/wav

    public AudioClip uploadedClip;  // The uploaded mp3/wav clip
    public AudioSource[] audioSources;  // 3 AudioSources for the Shepard tones

    private int numberOfTones = 3;      // Number of tones (usually 3 for Shepard tone)
    private float toneLength = 10f;     // Duration of each tone's pitch cycle

    // Arrays to store pitch and volume states
    private float[] startValues;
    private float[] elapsedTimes;

    // Shepard tones should start at different octaves
    private float[] octaveMultipliers = { 0.5f, 1f, 2f };  // Low, Mid, High octaves

    // Enum for selecting different notes
    public enum Notes
    {
        A,   // A4 = 440Hz
        C    // C4 = 261.63Hz
    }
    public Notes note;

    private void Start()
    {
        // Initialize arrays
        audioSources = new AudioSource[numberOfTones];
        elapsedTimes = new float[numberOfTones];
        startValues = new float[numberOfTones];

        // Set up the audio sources for each tone or uploaded clip
        for (int i = 0; i < numberOfTones; i++)
        {
            audioSources[i] = gameObject.AddComponent<AudioSource>();
            audioSources[i].loop = true;  // Loop the tone

            // Choose between generated tone or uploaded audio clip
            if (useUploadedClip && uploadedClip != null)
            {
                audioSources[i].clip = uploadedClip;  // Use the uploaded audio file
            }
            else
            {
                audioSources[i].clip = CreateClip(GetFrequency(note) * octaveMultipliers[i], 1f);  // Generate a tone
            }

            audioSources[i].volume = 0;
            audioSources[i].Play();

            // Set pitch ranges for each tone (they all rise or fall)
            startValues[i] = octaveMultipliers[i];
        }
    }

    private void Update()
    {
        for (int i = 0; i < numberOfTones; i++)
        {
            SlideTone(i, toneLength);  // Continuously update pitch and volume
        }
    }

    float GetFrequency(Notes note)
    {
        switch (note)
        {
            case Notes.A:
                return 440f; // A4 = 440 Hz
            case Notes.C:
                return 261.63f; // C4 = 261.63 Hz
            default:
                return 0;
        }
    }

    public AudioClip CreateClip(float frequency, float duration)
    {
        int sampleRate = 44100;
        int sampleCount = (int)(sampleRate * duration);
        float[] samples = new float[sampleCount];

        for (int i = 0; i < sampleCount; i++)
        {
            float t = (float)i / sampleRate;

            // Choose the waveform type based on the selected WaveType enum
            switch (waveType)
            {
                case WaveType.Sine:
                    samples[i] = Mathf.Sin(2 * Mathf.PI * frequency * t);
                    break;
                case WaveType.Square:
                    samples[i] = Mathf.Sign(Mathf.Sin(2 * Mathf.PI * frequency * t));
                    break;
                case WaveType.Triangle:
                    samples[i] = 2f * Mathf.PingPong(frequency * t, 1f) - 1f;
                    break;
                case WaveType.Sawtooth:
                    samples[i] = 2f * (t * frequency - Mathf.Floor(0.5f + t * frequency));
                    break;
            }
        }

        AudioClip audioClip = AudioClip.Create("Tone", sampleCount, 1, sampleRate, false);
        audioClip.SetData(samples, 0);
        return audioClip;
    }

    // Update the pitch and volume of the Shepard tones
    void SlideTone(int index, float duration)
    {
        // Determine if the pitch is going up or down
        float startPitch = pitchGoesUp ? 1f : 2f;  // Start at 1x frequency if going up, 2x if going down
        float endPitch = pitchGoesUp ? 2f : 1f;    // End at 2x frequency if going up, 1x if going down

        // Calculate pitch with Lerp over time (all tones rise or fall together)
        float pitchShift = Mathf.Lerp(startPitch, endPitch, elapsedTimes[index] / duration);
        audioSources[index].pitch = pitchShift;

        // Update the elapsed time
        elapsedTimes[index] += Time.deltaTime;

        // Volume control based on pitch direction
        if (pitchGoesUp)
        {
            // When pitch is going up:
            // Low tone fades in, High tone fades out
            if (index == 0)  // Low tone: fade in
            {
                audioSources[index].volume = Mathf.Lerp(0f, 1f, elapsedTimes[index] / duration);
            }
            else if (index == 1)  // Mid tone: stays constant
            {
                audioSources[index].volume = 1f;
            }
            else if (index == 2)  // High tone: fade out
            {
                audioSources[index].volume = Mathf.Lerp(1f, 0f, elapsedTimes[index] / duration);
            }
        }
        else
        {
            // When pitch is going down:
            // Low tone fades out, High tone fades in
            if (index == 0)  // Low tone: fade out
            {
                audioSources[index].volume = Mathf.Lerp(1f, 0f, elapsedTimes[index] / duration);
            }
            else if (index == 1)  // Mid tone: stays constant
            {
                audioSources[index].volume = 1f;
            }
            else if (index == 2)  // High tone: fade in
            {
                audioSources[index].volume = Mathf.Lerp(0f, 1f, elapsedTimes[index] / duration);
            }
        }

        // Reset the cycle when duration is exceeded
        if (elapsedTimes[index] > duration)
        {
            elapsedTimes[index] = 0;  // Reset time to loop the pitch and volume

            // Ensure all tones loop back to the starting pitch, but maintain the illusion
            audioSources[index].pitch = pitchGoesUp ? 1f : 2f;  // Reset pitch based on the direction
        }
    }
}
