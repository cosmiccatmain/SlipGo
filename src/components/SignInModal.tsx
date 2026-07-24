import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = "signin" | "signup";

export function SignInModal({ open, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (open) {
      setError(null);
      setNotice(null);
      setPassword("");
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    const res = mode === "signup" ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if ("needsEmailConfirm" in res && res.needsEmailConfirm) {
      setNotice("Check your email to confirm your account, then sign in.");
      return;
    }
    onClose(); // signed in — App opens the plans popup after a fresh sign-up
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "signup" ? "Create a BoatGoat account" : "Sign in to BoatGoat"}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="modal-brand">
          <img src="/logo-mark.png" alt="" className="modal-logo" />
          <div className="modal-title">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </div>
          <div className="modal-sub">
            Save searches, favorite slips, and plan Trips across Southern California.
          </div>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={mode === "signin"}
            className={"auth-tab" + (mode === "signin" ? " active" : "")}
            onClick={() => { setMode("signin"); setError(null); setNotice(null); }}
          >
            Sign in
          </button>
          <button
            role="tab"
            aria-selected={mode === "signup"}
            className={"auth-tab" + (mode === "signup" ? " active" : "")}
            onClick={() => { setMode("signup"); setError(null); setNotice(null); }}
          >
            Create account
          </button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          <label className="modal-field">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="modal-field">
            <span>Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {notice && <div className="auth-notice">{notice}</div>}

          <button type="submit" className="modal-submit" disabled={busy}>
            {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="modal-note">
          {mode === "signup"
            ? "You'll pick a plan next. Free stays free."
            : "New here? Create an account to save searches and plan Trips."}
        </p>
      </div>
    </div>
  );
}
