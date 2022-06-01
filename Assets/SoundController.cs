// https://stackoverflow.com/questions/36793628/frequency-and-pitch-relation-for-audioclip-unity3d
// https://www.youtube.com/watch?v=LVWTQcZbLgY

using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class SoundController : MonoBehaviour
{

    public AudioSource audioSourceA;
    public AudioSource audioSourceB;
    public AudioSource audioSourceC;
    float incrementA = 0.1f;
    float incrementB = 0.1f;
    float incrementC = 0.1f;

    private float noteA, noteB, noteC;
    private float startNoteA, startNoteB, startNoteC;
    private float C = 0;
    private float C2 = 12;
    public float transposeA = 0;
    public float transposeB = 1;
    public float transposeC = 2;
    private float octave = 12;

    //    if (Input.GetKeyDown("a")) note = 0;  // C
    //if (Input.GetKeyDown("s")) note = 2;  // D
    //if (Input.GetKeyDown("d")) note = 4;  // E
    //if (Input.GetKeyDown("f")) note = 5;  // F
    //if (Input.GetKeyDown("g")) note = 7;  // G
    //if (Input.GetKeyDown("h")) note = 9;  // A
    //if (Input.GetKeyDown("j")) note = 11; // B
    //if (Input.GetKeyDown("k")) note = 12; // C
    //if (Input.GetKeyDown("l")) note = 14; // D


    // Top note

    // Middle note

    // Bottom note




    // Start is called before the first frame update
    void Start()
    {
        startNoteA = C;
        startNoteB = C2;
        startNoteB = C;
        noteA = startNoteA;
        noteB = startNoteB;
        noteC = startNoteC;

        audioSourceA.volume = 1;
        audioSourceB.volume = 1;
        audioSourceC.volume = 0;

    }

    // Update is called once per frame
    void Update()
    {

        PlayA();
        PlayB();
        PlayC();

    }

    void PlayA()
    {
        if (!audioSourceA) return;

        float inc = Mathf.Pow(2, (noteA + transposeA) / 12);

        audioSourceA.pitch = inc;

        audioSourceA.volume = 1 - (inc - 1);

        noteA += incrementA;
        audioSourceA.volume -= incrementA;
        if (noteA >= startNoteA + octave)
        {
            audioSourceA.volume = 1;
            noteA = startNoteA;
        }

        //float steps = octave / incrementA;
        //print(steps);
        //audioSourceA.volume -= steps;


    }
    void PlayB()
    {
        if (!audioSourceB) return;
        audioSourceB.pitch = Mathf.Pow(2, (noteB + transposeB) / 12);

        noteB += incrementB;
        if (noteB >= startNoteB + octave)
        {
            noteB = startNoteB;
        }
    }
    void PlayC()
    {
        if (!audioSourceC) return;

        float inc = Mathf.Pow(2, (noteA + transposeA) / 12);

        audioSourceC.pitch = inc;

        audioSourceC.volume = (inc - 1);


        noteC += incrementC;
        if (noteC >= startNoteC + octave)
        {
            audioSourceC.volume = 0;
            noteC = startNoteC;
        }
    }

    //private void OnAudioFilterRead(float[] data, int channels)
    //{
    //    increment = frequency * 2 * Mathf.PI / samplingFrequency;

    //    for (int i = 0; i < data.Length; i += channels)
    //    {
    //        phase += increment;
    //        data[i] = gain * Mathf.Sin(phase);
    //        if (channels == 2)
    //        {
    //            //print("DATA LENGTH " + data.Length);
    //            //data[i + 1] = data[i];
    //        }
    //        if (phase > (Mathf.PI * 2))
    //        {
    //            phase = 0;
    //        }
    //    }
    //}
}
