import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { addBoat, boatLimitLabel, deleteBoat, BOAT_LIMIT, type Boat } from "../lib/boats";

interface Props {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function BoatsModal({ open, onClose, onToast }: Props) {
  const { user, tier, boats, refreshBoats } = useAuth();
  const [name, setName] = useState("");
  const [lengthFt, setLengthFt] = useState("");
  const [beamFt, setBeamFt] = useState("");
  const [draftFt, setDraftFt] = useState("");
  const [cruiseKts, setCruiseKts] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const limit = BOAT_LIMIT[tier];
  const atLimit = boats.length >= limit;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !user) return;
    setError(null);
    const loa = Number(lengthFt);
    if (!name.trim() || !Number.isFinite(loa) || loa <= 0) {
      setError("A name and length are required.");
      return;
    }
    setBusy(true);
    const res = await addBoat(user.id, {
      name: name.trim(),
      lengthFt: loa,
      beamFt: beamFt ? Number(beamFt) : null,
      draftFt: draftFt ? Number(draftFt) : null,
      cruiseKts: cruiseKts ? Number(cruiseKts) : 7,
    });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setName(""); setLengthFt(""); setBeamFt(""); setDraftFt(""); setCruiseKts("7");
    await refreshBoats();
    onToast(`${res.boat?.name} added to your fleet.`);
  };

  const remove = async (b: Boat) => {
    if (await deleteBoat(b.id)) {
      await refreshBoats();
      onToast(`${b.name} removed.`);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal boats-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Your boats"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        <div className="modal-brand">
          <div className="modal-title">Your boats</div>
          <div className="modal-sub">
            We use length for slip costs and cruise speed for trip timing. Your plan
            includes {boatLimitLabel(tier)}.
          </div>
        </div>

        {boats.length > 0 && (
          <ul className="boat-list">
            {boats.map((b) => (
              <li className="boat-row" key={b.id}>
                <div>
                  <b>{b.name}</b>
                  <span className="boat-specs">
                    {b.lengthFt} ft
                    {b.beamFt ? ` · ${b.beamFt} ft beam` : ""}
                    {b.draftFt ? ` · ${b.draftFt} ft draft` : ""}
                    {` · ${b.cruiseKts} kn cruise`}
                  </span>
                </div>
                <button className="boat-remove" onClick={() => remove(b)}>Remove</button>
              </li>
            ))}
          </ul>
        )}

        {atLimit ? (
          <div className="tier-note">
            You've reached {boatLimitLabel(tier)} on your plan. Upgrade to add more —
            Pro keeps an unlimited fleet.
          </div>
        ) : (
          <form className="boat-form" onSubmit={submit}>
            <label className="modal-field">
              <span>Boat name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Second Wind" />
            </label>
            <div className="boat-grid">
              <label className="modal-field">
                <span>Length (ft)</span>
                <input type="number" min="1" step="0.5" value={lengthFt} onChange={(e) => setLengthFt(e.target.value)} placeholder="42" />
              </label>
              <label className="modal-field">
                <span>Beam (ft)</span>
                <input type="number" min="1" step="0.5" value={beamFt} onChange={(e) => setBeamFt(e.target.value)} placeholder="13" />
              </label>
              <label className="modal-field">
                <span>Draft (ft)</span>
                <input type="number" min="0.5" step="0.5" value={draftFt} onChange={(e) => setDraftFt(e.target.value)} placeholder="5.5" />
              </label>
              <label className="modal-field">
                <span>Cruise (kn)</span>
                <input type="number" min="1" step="0.5" value={cruiseKts} onChange={(e) => setCruiseKts(e.target.value)} placeholder="7" />
              </label>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="modal-submit" disabled={busy}>
              {busy ? "Saving…" : "Add boat"}
            </button>
          </form>
        )}

        <p className="modal-note">
          Your boat never limits what you see — we'll still show every slip, including
          bigger ones, and just flag how each fits.
        </p>
      </div>
    </div>
  );
}
