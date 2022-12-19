using System.Collections;
using UnityEngine;

public class ToneGenerator : MonoBehaviour
{
    public AudioSource[] audioSource;
    private int numberOfTones = 3;
    float startValue = 1f;
    float endValue = 0.5f;
    float elapsedTime = 0f;
    float[] elapsedTimes;
    private float toneLength = 10;
    private bool[] canPlay;

    public enum Notes
    {
        A,
        C
    }
    public Notes note;

    private void Start()
    {
        // create array
        audioSource = new AudioSource[numberOfTones];
        canPlay = new bool[numberOfTones];
        elapsedTimes = new float[numberOfTones];

        for (int i = 0; i < 3; i++)
        {
            audioSource[i] = gameObject.AddComponent<AudioSource>();
            audioSource[i].loop = true;
            audioSource[i].clip = CreateClip(GetFrequency(note), 1);
            audioSource[i].volume = 0;
        }

        audioSource[0].Play();
        StartCoroutine(StartPlaying(1, 2));

        //PlayCMajorTone();
    }

    private IEnumerator StartPlaying(int i, float d)
    {
        yield return new WaitForSeconds(d);
        canPlay[i] = true;
        audioSource[i].Play();
        if (!canPlay[2]) StartCoroutine(StartPlaying(2, 2));
    }

    private void FixedUpdate()
    {
        SlideTone(0, toneLength);
        if (canPlay[1]) SlideTone(1, toneLength);
        if (canPlay[2]) SlideTone(2, toneLength);
    }

    float GetFrequency(Notes note)
    {
        switch (note)
        {
            case Notes.A:
                return 440f;
                break;
            case Notes.C:
                return 261;
                break;
            default:
                return 0;
                break;
        }
    }

    public AudioClip CreateClip(float frequency, float duration)
    {
        int sampleRate = 44100;
        int sampleCount = (int)(sampleRate * duration);
        float maxValue = 1f / 4f;

        float[] samples = new float[sampleCount];

        for (int i = 0; i < sampleCount; i++)
        {
            float t = (float)i / (float)sampleRate;
            samples[i] = Mathf.Sin(2 * Mathf.PI * frequency * t) * maxValue;
            //frequency -= step;
        }

        AudioClip audioClip = AudioClip.Create("Tone", sampleCount, 1, sampleRate, false);
        audioClip.SetData(samples, 0);
        return audioClip;

    }


    void SlideTone (int index, float d)
    {
        //time += lerpSpeed * Time.deltaTime;
        float pitch = Mathf.Lerp(startValue, endValue, elapsedTimes[index] / d);
        elapsedTimes[index] += Time.deltaTime;

        
        if (audioSource[index].volume < 1f)
        {
            audioSource[index].volume += 0.05f;
        }
        else audioSource[index].volume = 1f;

        if (elapsedTimes[index] > d) {
            elapsedTimes[index] = 0;
            startValue = 1f;
            audioSource[index].volume = 0;
            print("BOOM");
        };
        // Set the pitch of the audio source
        audioSource[index].pitch = pitch;
    }

}

