import { useEffect } from "react";

interface Props {
  message: string | null;
  onDone: () => void;
}

// Lightweight auto-dismissing toast. App owns the message string.
export function Toast({ message, onDone }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      <div className="toast">
        <span className="toast-goat" aria-hidden="true">🐐</span>
        {message}
      </div>
    </div>
  );
}
