import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Visual-only sign-in. Per safety rules we never actually collect or submit
// credentials — the form is a styled placeholder for the MVP.
export function SignInModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to BoatGoat"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="modal-brand">
          <img src="/logo-mark.png" alt="" className="modal-logo" />
          <div className="modal-title">Welcome to BoatGoat</div>
          <div className="modal-sub">Save searches, favorite slips, and get price alerts.</div>
        </div>

        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <label className="modal-field">
            <span>Email</span>
            <input type="email" placeholder="you@example.com" autoComplete="off" />
          </label>
          <label className="modal-field">
            <span>Password</span>
            <input type="password" placeholder="••••••••" autoComplete="off" />
          </label>
          <button type="submit" className="modal-submit">Continue</button>
        </form>

        <p className="modal-note">Demo only — no account is created and nothing is submitted.</p>
      </div>
    </div>
  );
}
