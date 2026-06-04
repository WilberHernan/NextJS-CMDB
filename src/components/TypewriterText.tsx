"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TypewriterTextProps {
  text: string;
  className?: string;
  /** Base ms per character (default: 35) */
  speed?: number;
  /** Random jitter ±ms for the "hacker" uneven feel (default: 20) */
  jitter?: number;
  /** Show a blinking cursor after the text (default: true) */
  cursor?: boolean;
  /** Called once when the full text has been typed out */
  onComplete?: () => void;
}

/**
 * Types out `text` character by character with a slightly uneven
 * rhythm (jitter) for that "hacker terminal" feel.
 * Re‑triggers the animation every time `text` changes.
 */
export function TypewriterText({
  text,
  className = "",
  speed = 35,
  jitter = 20,
  cursor = true,
  onComplete,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const prevRef = useRef(text);
  const intervalRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const completedRef = useRef(false);

  const stableOnComplete = useCallback(onComplete ?? (() => {}), [onComplete]);

  useEffect(() => {
    // Ignore if the text hasn't semantically changed (avoids re-render storms)
    if (text === prevRef.current && displayed === text) return;
    prevRef.current = text;
    completedRef.current = false;

    setDisplayed("");

    let i = 0;

    function tick() {
      i++;
      const partial = text.slice(0, i);
      setDisplayed(partial);
      if (i < text.length) {
        const delay = speed + (Math.random() - 0.5) * jitter * 2;
        intervalRef.current = setTimeout(tick, Math.max(delay, 8));
      } else if (!completedRef.current) {
        completedRef.current = true;
        stableOnComplete();
      }
    }

    intervalRef.current = setTimeout(tick, 60);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, jitter, stableOnComplete]);

  return (
    <span className={className}>
      {displayed}
      {cursor && (
        <span
          className="inline-block w-[2px] h-[1em] ml-[1px] align-middle bg-current animate-pulse"
          style={{ animationDuration: "0.7s" }}
        />
      )}
    </span>
  );
}
