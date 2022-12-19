using UnityEngine;

public class ToneGenerator : MonoBehaviour
{
    public AudioSource audioSource;
    //AudioClip audioClip;


    private void Start()
    {
        audioSource = gameObject.AddComponent<AudioSource>();
        audioSource.loop = true;
        audioSource.clip = CreateClip(440f, 1, 0);
        audioSource.Play();
        //PlayCMajorTone();
    }


    public void PlayCMajorTone()
    {
        // Create an audio clip with a C major tone
        int sampleRate = 44100;
        float frequency = 261.6f; // C major
        float duration = 1.0f;
        int sampleCount = (int)(duration * sampleRate);
        float[] samples = new float[sampleCount];
        for (int i = 0; i < sampleCount; i++)
        {
            float t = (float)i / sampleRate;
            samples[i] = Mathf.Sin(2 * Mathf.PI * frequency * t);
        }
        AudioClip clip = AudioClip.Create("C Major Tone", sampleCount, 1, sampleRate, false);
        clip.SetData(samples, 0);

        // Play the audio clip using the audio source
        audioSource.loop = true;
        audioSource.clip = clip;
        audioSource.Play();
    }

    public AudioClip CreateClip(float frequency, float duration, float step)
    {
        int sampleRate = 44100;
        int sampleCount = (int)(sampleRate * duration);
        float maxValue = 1f / 4f;

        float[] samples = new float[sampleCount];

        for (int i = 0; i < sampleCount; i++)
        {
            float t = (float)i / (float)sampleRate;
            samples[i] = Mathf.Sin(2 * Mathf.PI * frequency * t) * maxValue;
            frequency -= step;
        }

        AudioClip audioClip = AudioClip.Create("Tone", sampleCount, 1, sampleRate, false);
        audioClip.SetData(samples, 0);
        return audioClip;

    }

    void SlideTone(float duration)
    {
        // Calculate the pitch to slide to based on the current time
        float t = Time.time / duration;
        float pitch = Mathf.Lerp(1.0f, 0.5f, t);

        // Set the pitch of the audio source
        audioSource.pitch = pitch;
    }
}

