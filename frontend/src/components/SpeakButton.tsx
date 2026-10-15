"use client";

import { useEffect, useRef, useState } from "react";
import { speak, pauseSpeak, resumeSpeak, stopSpeak, canSpeak, hasVoiceFor, playAudioBlob } from "@/lib/speak";

// Plays the spoken alert. Hindi tries Amazon Polly first (POST /api/speak).
// If Polly is not configured, or the call fails, it uses the browser voice.
// Kannada and English stay on the browser voice. A missing voice is never
// faked in the wrong language.
export default function SpeakButton({
  text,
  voice,
  labels,
  autoPlay = false,
  className = "btn btn-ghost",
  style,
}: {
  text: string;
  voice: string; // e.g. "hi-IN"
  labels: { play: string; pause: string; resume: string; noVoice: string };
  autoPlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [available, setAvailable] = useState(true);
  const [pollyVoice, setPollyVoice] = useState<string | null>(null);
  const first = useRef(true);
  const gen = useRef(0);
  const key = `${voice}|${text}`;
  const hindi = voice.toLowerCase().startsWith("hi");

  useEffect(() => {
    const check = () => setAvailable(hindi || hasVoiceFor(voice));
    check();
    if (!canSpeak()) return;
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
  }, [voice, hindi]);

  useEffect(() => {
    if (autoPlay) void start();
    return () => {
      gen.current += 1;
      stopSpeak();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    gen.current += 1;
    stopSpeak();
    setState("idle");
    setPollyVoice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function start() {
    const my = ++gen.current;
    setPollyVoice(null);
    if (hindi) {
      try {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, lang: "hi-IN" }),
        });
        if (my !== gen.current) return;
        const type = res.headers.get("content-type") || "";
        if (res.ok && type.includes("audio")) {
          const blob = await res.blob();
          if (my !== gen.current) return;
          await playAudioBlob(blob, () => {
            if (my === gen.current) setState("idle");
          });
          if (my !== gen.current) return;
          setPollyVoice(res.headers.get("x-polly-voice") || "Polly");
          setState("playing");
          return;
        }
      } catch {
        if (my !== gen.current) return;
      }
    }
    if (!canSpeak() || !hasVoiceFor(voice)) {
      setAvailable(false);
      setState("idle");
      return;
    }
    speak(text, voice, () => {
      if (my === gen.current) setState("idle");
    });
    setState("playing");
  }

  function toggle() {
    if (state === "idle") void start();
    else if (state === "playing") { pauseSpeak(); setState("paused"); }
    else { resumeSpeak(); setState("playing"); }
  }

  if (!canSpeak() && !hindi) return null;

  if (!available) {
    return (
      <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.4, ...style, alignSelf: "flex-start" }}>
        {labels.noVoice}
      </div>
    );
  }

  const label = state === "playing" ? labels.pause : state === "paused" ? labels.resume : labels.play;
  return (
    <div style={{ alignSelf: "flex-start" }}>
      <button className={className} style={style} onClick={toggle} aria-live="polite">
        {label}
      </button>
      {pollyVoice && (
        <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>
          Amazon Polly · {pollyVoice} · hi-IN
        </div>
      )}
    </div>
  );
}
