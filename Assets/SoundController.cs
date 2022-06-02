// https://stackoverflow.com/questions/36793628/frequency-and-pitch-relation-for-audioclip-unity3d
// https://www.youtube.com/watch?v=LVWTQcZbLgY

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class SoundController : MonoBehaviour
{
    [Header("Global stuff")]
    public float octave = 24;
    public float increment = 0.01f;
    public bool isAscending = false;


    [Header("High Note")]
    public AudioSource audioSourceA;
    public float startNoteA = 0;
    public float transposeA = 0;
    public float volA = 1f;

    [Header("Middle Note")]
    public AudioSource audioSourceB;
    public float startNoteB = 0;
    public float transposeB = 0;
    public float volB = 1f;

    [Header("Low Note")]
    public AudioSource audioSourceC;
    public float startNoteC = 12;
    public float transposeC = 0;
    public float volC = 0f;

    private float noteA, noteB, noteC;

    public TMP_Text transposeAtext;
    public TMP_Text noteAtext;
    public TMP_Text transposeBtext;
    public TMP_Text noteBtext;
    public TMP_Text transposeCtext;
    public TMP_Text noteCtext;
    public TMP_Text volAtext;
    public TMP_Text volBtext;
    public TMP_Text volCtext;


    // Start is called before the first frame update
    void Start()
    {
        print("START");
        noteA = startNoteA;
        noteB = startNoteB;
        noteC = startNoteC;

        audioSourceA.volume = 1;
        audioSourceB.volume = 1;
        audioSourceC.volume = 0;

        if (!isAscending) increment = -Mathf.Abs(increment);
        else increment = Mathf.Abs(increment);

        print(">>>" + increment);

    }

    // Update is called once per frame
    void FixedUpdate()
    {

        PlayA();
        PlayB();
        PlayC();
    }

    void PlayA()
    {
        if (!audioSourceA.isActiveAndEnabled) return;

        float inc = Mathf.Pow(2, (noteA + transposeA) / 12);
        audioSourceA.pitch = inc;

        volA -= 1 / octave * increment;
        audioSourceA.volume = volA;

        noteA += increment;
        if (noteA >= startNoteA + octave)
        {
            volA = 1;
            noteA = startNoteA;
        }
        //if (!isAscending && noteA <= startNoteA - octave)
        //{
        //    volA = 1;
        //    noteA = startNoteA;
        //}
        // UPDATE TEXT
        transposeAtext.text = "Transpose A = " + transposeA.ToString();
        noteAtext.text = "Note A = " + noteA.ToString();
        volAtext.text = "Vol A = " + volA.ToString();

    }
    void PlayB()
    {
        if (!audioSourceB.isActiveAndEnabled) return;
        audioSourceB.pitch = Mathf.Pow(2, (noteB + transposeB) / 12);

        noteB += increment;
        if (noteB >= startNoteB + octave)
        {
            noteB = startNoteB;
        }
        //if (!isAscending && noteB <= startNoteB - octave)
        //{
        //    noteB = startNoteB;
        //}
        // UPDATE TEXT
        transposeBtext.text = "Transpose B = " + transposeB.ToString();
        noteBtext.text = "Note B = " + noteB.ToString();
        volBtext.text = "Vol B = " + volB.ToString();
    }
    void PlayC()
    {
        //if (!audioSourceC.isPlaying) return;

        float inc = Mathf.Pow(2, (noteC + transposeC) / 12);

        audioSourceC.pitch = inc;
        audioSourceC.volume = volC;

        noteC += increment;

        volC += 1 / octave * increment;
        if (noteC >= startNoteC + octave)
        {
            noteC = startNoteC;
            volC = 0;
        }
        //if (!isAscending && noteC <= startNoteC - octave)
        //{
        //    noteC = startNoteC;
        //    volC = 0;
        //}

        //// UPDATE TEXT
        transposeCtext.text = "Transpose C = " + transposeC.ToString();
        noteCtext.text = "Note C = " + noteC.ToString();
        volCtext.text = "Vol C = " + volC.ToString();
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
