"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SupportedLocale } from "@/lib/case/types";

export type VoiceTurnState =
  | "idle"
  | "requesting"
  | "speaking"
  | "listening"
  | "paused"
  | "processing"
  | "error";

const SILENCE_AFTER_SPEECH_MS = 1_350;
const SILENCE_AFTER_LONG_ANSWER_MS = 2_200;
const LONG_ANSWER_MS = 8_000;
const MAX_ANSWER_MS = 120_000;
const SPEECH_LEVEL = 0.022;

export function useVoiceTurn(locale: SupportedLocale = "en-US") {
  const [state, setState] = useState<VoiceTurnState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState("");
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const shouldTranscribeRef = useRef(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopMeter = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setLevel(0);
    void audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  const finishAnswer = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      shouldTranscribeRef.current = true;
      recorder.stop();
    }
  }, []);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state !== "recording") return;
    recorder.pause();
    stopMeter();
    setState("paused");
  }, [stopMeter]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state !== "paused") return;
    recorder.resume();
    setState("listening");
  }, []);

  const ensureMicrophone = useCallback(async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      !("MediaRecorder" in window)
    ) {
      throw new Error(
        "Voice recording is not supported here. You can use the keyboard fallback.",
      );
    }
    if (streamRef.current?.active) return streamRef.current;
    setState("requesting");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;
    return stream;
  }, []);

  const unlockAudioOutput = useCallback(async () => {
    const AudioContextConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextConstructor) return null;
    if (
      !playbackContextRef.current ||
      playbackContextRef.current.state === "closed"
    ) {
      playbackContextRef.current = new AudioContextConstructor();
    }
    if (playbackContextRef.current.state === "suspended") {
      await playbackContextRef.current.resume();
    }
    return playbackContextRef.current;
  }, []);

  const activate = useCallback(async () => {
    setError(null);
    try {
      // Resume the output context while the Start button's user activation is
      // still current. This keeps fetched TTS audible after the async
      // microphone permission prompt, including on strict mobile browsers.
      await unlockAudioOutput();
      await ensureMicrophone();
      setState("idle");
    } catch (activationError) {
      const failure =
        activationError instanceof Error
          ? activationError
          : new Error("Microphone access did not work.");
      setError(failure.message);
      setState("error");
      throw failure;
    }
  }, [ensureMicrophone, unlockAudioOutput]);

  const speak = useCallback(async (text: string) => {
    setError(null);
    setState("speaking");
    try {
      playbackSourceRef.current?.stop();
    } catch {
      // The previous source already ended.
    }
    playbackSourceRef.current = null;
    audioRef.current?.pause();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const context = await unlockAudioOutput();
        if (context) {
          const buffer = await context.decodeAudioData(await blob.arrayBuffer());
          const source = context.createBufferSource();
          source.buffer = buffer;
          source.connect(context.destination);
          playbackSourceRef.current = source;
          await new Promise<void>((resolve) => {
            source.addEventListener("ended", () => resolve(), { once: true });
            source.start();
          });
          playbackSourceRef.current = null;
        } else {
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;
          await new Promise<void>((resolve, reject) => {
            audio.addEventListener("ended", () => resolve(), { once: true });
            audio.addEventListener(
              "error",
              () => reject(new Error("Generated speech could not play.")),
              { once: true },
            );
            audio.play().catch(reject);
          });
          audioRef.current = null;
          URL.revokeObjectURL(url);
          audioUrlRef.current = null;
        }
        setState("idle");
        return;
      }
    } catch {
      // Browser speech below is the no-network and autoplay-safe fallback.
    }
    if (
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      setState("idle");
      return;
    }
    await new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.lang = locale;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      window.setTimeout(resolve, Math.max(4_000, text.length * 85));
    });
    utteranceRef.current = null;
    setState("idle");
  }, [locale, unlockAudioOutput]);

  const listen = useCallback(async (): Promise<string> => {
    setError(null);
    const stream = await ensureMicrophone();
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ].find((candidate) => MediaRecorder.isTypeSupported(candidate));
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    recorderRef.current = recorder;
    chunksRef.current = [];
    shouldTranscribeRef.current = true;

    return new Promise<string>((resolve, reject) => {
      let settled = false;
      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        setError(message);
        setState("error");
        reject(new Error(message));
      };

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      });
      recorder.addEventListener(
        "stop",
        async () => {
          stopMeter();
          recorderRef.current = null;
          if (!shouldTranscribeRef.current) {
            fail("Listening stopped.");
            return;
          }
          setState("processing");
          try {
            const blob = new Blob(chunksRef.current, {
              type: recorder.mimeType || "audio/webm",
            });
            const form = new FormData();
            form.append("audio", blob, "voice-answer.webm");
            form.append("locale", locale);
            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: form,
            });
            const body = (await response.json()) as {
              transcript?: string;
              error?: string;
            };
            if (!response.ok || !body.transcript?.trim()) {
              throw new Error(
                body.error ||
                  "I could not hear a clear answer. Please say it again.",
              );
            }
            if (settled) return;
            settled = true;
            const transcript = body.transcript.trim();
            setLastTranscript(transcript);
            setState("idle");
            resolve(transcript);
          } catch (transcriptionError) {
            fail(
              transcriptionError instanceof Error
                ? transcriptionError.message
                : "Voice transcription is unavailable.",
            );
          }
        },
        { once: true },
      );

      recorder.start(250);
      setState("listening");
      startSilenceMeter({
        stream,
        onLevel: setLevel,
        onStop: () => {
          if (recorder.state !== "inactive") recorder.stop();
        },
        animationRef,
        audioContextRef,
      });
    });
  }, [ensureMicrophone, locale, stopMeter]);

  const ask = useCallback(
    async (prompt: string) => {
      await speak(prompt);
      return listen();
    },
    [listen, speak],
  );

  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
      audioRef.current = null;
      try {
        playbackSourceRef.current?.stop();
      } catch {
        // The source already ended.
      }
      playbackSourceRef.current = null;
      void playbackContextRef.current?.close();
      playbackContextRef.current = null;
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      stopMeter();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        shouldTranscribeRef.current = false;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    },
    [stopMeter],
  );

  return {
    activate,
    ask,
    error,
    finishAnswer,
    lastTranscript,
    level,
    listen,
    pause,
    resume,
    speak,
    state,
  };
}

function startSilenceMeter({
  animationRef,
  audioContextRef,
  onLevel,
  onStop,
  stream,
}: {
  animationRef: React.MutableRefObject<number | null>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  onLevel: (level: number) => void;
  onStop: () => void;
  stream: MediaStream;
}) {
  const AudioContextConstructor =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!AudioContextConstructor) {
    // Keep recording until the applicant uses the visible "done speaking"
    // control when voice activity detection is unavailable.
    return;
  }
  const context = new AudioContextConstructor();
  void context.resume();
  audioContextRef.current = context;
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  context.createMediaStreamSource(stream).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);
  const startedAt = performance.now();
  let heardSpeech = false;
  let lastSpeechAt = startedAt;

  const tick = () => {
    analyser.getByteTimeDomainData(samples);
    let squareTotal = 0;
    samples.forEach((sample) => {
      const centered = (sample - 128) / 128;
      squareTotal += centered * centered;
    });
    const rms = Math.sqrt(squareTotal / samples.length);
    onLevel(Math.min(1, rms * 8));
    const now = performance.now();
    if (rms >= SPEECH_LEVEL) {
      heardSpeech = true;
      lastSpeechAt = now;
    }
    if (
      shouldFinishRecording({
        elapsedMs: now - startedAt,
        heardSpeech,
        silenceMs: now - lastSpeechAt,
      })
    ) {
      onStop();
      return;
    }
    animationRef.current = window.requestAnimationFrame(tick);
  };
  animationRef.current = window.requestAnimationFrame(tick);
}

export function shouldFinishRecording({
  elapsedMs,
  heardSpeech,
  silenceMs,
}: {
  elapsedMs: number;
  heardSpeech: boolean;
  silenceMs: number;
}) {
  if (!heardSpeech) return false;
  const silenceThreshold =
    elapsedMs >= LONG_ANSWER_MS
      ? SILENCE_AFTER_LONG_ANSWER_MS
      : SILENCE_AFTER_SPEECH_MS;
  return (
    (elapsedMs >= 1_800 && silenceMs >= silenceThreshold) ||
    elapsedMs >= MAX_ANSWER_MS
  );
}
