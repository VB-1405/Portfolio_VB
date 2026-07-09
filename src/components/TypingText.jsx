import { useEffect, useState } from "react";

/**
 * TypingText — types out `text` character-by-character once mounted, with
 * a blinking block cursor, for a lightweight terminal feel. Runs once;
 * final rendered text is fully present in the DOM immediately (no content
 * is ever hidden behind the animation, just revealed slightly faster/slower).
 */
export default function TypingText({ text, speed = 40, className = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= text.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(id);
  }, [count, text, speed]);

  return (
    <span className={className}>
      <span aria-hidden="true">
        {text.slice(0, count)}
        <span className="inline-block w-[0.5em] h-[1em] bg-cyan-400 ml-0.5 align-middle animate-pulse" />
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
