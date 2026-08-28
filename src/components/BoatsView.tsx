import { useState } from "react";
import { useAuth } from "../lib/auth";
import { addBoat, boatLimitLabel, deleteBoat, BOAT_LIMIT, type Boat } from "../lib/boats";
import { boatPortrait, type BoatKind } from "../lib/boatArt";
import { PHOTO_ACCEPT, bust, photoUrl, removeBoatPhoto, uploadBoatPhoto } from "../lib/boatPhotos";

interface Props {
  onToast: (msg: string) => void;
  onPricing: () => void;
  onSignIn: () => void;
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.4 4h5.2l1.2 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.2l1.2-2Zm2.6 5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
      />
    </svg>
  );
}

/**
 * A boat's picture. Only ever the owner's own upload — nothing is searched for
 * or generated. Until they upload, the drawn placeholder stands in and the
 * whole tile is the button that starts an upload.
 */
function BoatPhotoView({
  boat,
  userId,
  onChanged,
  onToast,
}: {
  boat: Boat;
  userId: string;
  onChanged: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const placeholder = boatPortrait(boat.id, boat.lengthFt, boat.kind);
  const [busy, setBusy] = useState(false);
  // Storage reuses the URL on re-upload, so bump this to defeat the cache.
  const [version, setVersion] = useState(0);
  const inputId = `boat-photo-${boat.id}`;

  const stored = photoUrl(boat.photoPath);
  const src = stored ? bust(stored, version) : placeholder;

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be chosen again after a failure
    if (!file || busy) return;
    setBusy(true);
    const res = await uploadBoatPhoto(userId, boat.id, file);
    setBusy(false);
    if (res.error) {
      onToast(res.error);
      return;
    }
    setVersion((v) => v + 1);
    await onChanged();
    onToast(`Photo added to ${boat.name}.`);
  };

  const clear = async () => {
    if (!boat.photoPath || busy) return;
    setBusy(true);
    const res = await removeBoatPhoto(boat.id, boat.photoPath);
    setBusy(false);
    if (res.error) {
      onToast(res.error);
      return;
    }
    await onChanged();
    onToast("Photo removed.");
  };

  return (
    <div className={"boat-photo" + (stored ? " has-photo" : "")}>
      <img src={src} alt={stored ? `${boat.name}` : ""} loading="lazy" />

      <input
        id={inputId}
        type="file"
        accept={PHOTO_ACCEPT}
        className="visually-hidden"
        onChange={pick}
        disabled={busy}
      />

      {busy ? (
        <span className="boat-photo-busy">Uploading…</span>
      ) : stored ? (
        <div className="boat-photo-actions">
          <label htmlFor={inputId} className="photo-action">Replace</label>
          <button type="button" className="photo-action" onClick={clear}>Remove</button>
        </div>
      ) : (
        <label htmlFor={inputId} className="boat-photo-add">
          <span className="photo-add-pill">
            <CameraIcon />
            Add a photo
          </span>
        </label>
      )}
    </div>
  );
}

function BoatCard({
  boat, userId, onRemove, onChanged, onToast,
}: {
  boat: Boat;
  userId: string;
  onRemove: (b: Boat) => void;
  onChanged: () => Promise<void>;
  onToast: (msg: string) => void;
}) {
  return (
    <article className="boat-card">
      <BoatPhotoView boat={boat} userId={userId} onChanged={onChanged} onToast={onToast} />
      <div className="boat-card-body">
        <div className="boat-card-head">
          <h3>{boat.name}</h3>
          <span className={"boat-kind " + boat.kind}>{boat.kind === "sail" ? "Sail" : "Power"}</span>
        </div>
        {boat.model && <div className="boat-model">{boat.model}</div>}
        <ul className="boat-stats">
          <li><span>LOA</span><b>{boat.lengthFt} ft</b></li>
          {boat.beamFt != null && <li><span>Beam</span><b>{boat.beamFt} ft</b></li>}
          {boat.draftFt != null && <li><span>Draft</span><b>{boat.draftFt} ft</b></li>}
          <li><span>Cruise</span><b>{boat.cruiseKts} kn</b></li>
        </ul>
        <button className="boat-card-remove" onClick={() => onRemove(boat)}>Remove</button>
      </div>
    </article>
  );
}

export function BoatsView({ onToast, onPricing, onSignIn }: Props) {
  const { user, tier, boats, refreshBoats } = useAuth();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [kind, setKind] = useState<BoatKind>("sail");
  const [lengthFt, setLengthFt] = useState("");
  const [beamFt, setBeamFt] = useState("");
  const [draftFt, setDraftFt] = useState("");
  const [cruiseKts, setCruiseKts] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="page-wrap">
        <div className="page-head">
          <h1>Your boats</h1>
          <p>Save your fleet to get slip-fit badges, trip timings, and costs based on your own boat.</p>
        </div>
        <div className="empty-state">
          <p>Sign in to keep your boats on SlipGo.</p>
          <button className="btn-primary" onClick={onSignIn}>Sign in</button>
        </div>
      </div>
    );
  }

  const limit = BOAT_LIMIT[tier];
  const atLimit = boats.length >= limit;

  const reset = () => {
    setName(""); setModel(""); setKind("sail"); setLengthFt("");
    setBeamFt(""); setDraftFt(""); setCruiseKts("7"); setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const loa = Number(lengthFt);
    if (!name.trim() || !Number.isFinite(loa) || loa <= 0) {
      setError("A name and a length are required.");
      return;
    }
    setBusy(true);
    const res = await addBoat(user.id, {
      name: name.trim(),
      model: model.trim() || null,
      kind,
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
    const added = res.boat?.name;
    reset();
    setAdding(false);
    await refreshBoats();
    onToast(`${added} added to your fleet.`);
  };

  const remove = async (b: Boat) => {
    if (await deleteBoat(b.id)) {
      await refreshBoats();
      onToast(`${b.name} removed.`);
    } else {
      onToast("Could not remove that boat.");
    }
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1>Your boats</h1>
          <p>
            Length sets slip costs and fit, cruise speed sets trip timing. Your plan
            includes {boatLimitLabel(tier)}.
          </p>
        </div>
        {!adding && !atLimit && (
          <button className="btn-primary" onClick={() => setAdding(true)}>Add a boat</button>
        )}
      </div>

      {boats.length === 0 && !adding && (
        <div className="empty-state">
          <p>No boats yet. Add one and we'll tailor slip fit, costs, and trip timings to it.</p>
          <button className="btn-primary" onClick={() => setAdding(true)}>Add your first boat</button>
        </div>
      )}

      {boats.length > 0 && (
        <div className="boat-grid">
          {boats.map((b) => (
            <BoatCard
              key={b.id}
              boat={b}
              userId={user.id}
              onRemove={remove}
              onChanged={refreshBoats}
              onToast={onToast}
            />
          ))}
        </div>
      )}

      {atLimit && !adding && (
        <div className="upgrade-strip">
          <div>
            <b>You've filled {boatLimitLabel(tier)}.</b>
            <span>Plus keeps 3 boats, Pro keeps an unlimited fleet.</span>
          </div>
          <button className="btn-primary" onClick={onPricing}>Compare plans</button>
        </div>
      )}

      {adding && (
        <form className="boat-form-panel" onSubmit={submit}>
          <h2>Add a boat</h2>
          <div className="form-row">
            <label className="modal-field">
              <span>Boat name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Second Wind" />
            </label>
            <label className="modal-field">
              <span>Make &amp; model <i>optional</i></span>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Catalina 42"
              />
            </label>
          </div>
          <p className="field-hint">
            The make and model is shown on the card. Add a photo of your boat once it's saved.
          </p>

          <div className="kind-toggle" role="group" aria-label="Boat type">
            <button
              type="button"
              className={kind === "sail" ? "active" : ""}
              onClick={() => setKind("sail")}
            >
              Sail
            </button>
            <button
              type="button"
              className={kind === "power" ? "active" : ""}
              onClick={() => setKind("power")}
            >
              Power
            </button>
          </div>

          <div className="boat-grid-fields">
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

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={() => { reset(); setAdding(false); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Add boat"}
            </button>
          </div>
        </form>
      )}

      <p className="page-note">
        Your boat never limits what you see — every slip stays in your results, including
        bigger ones. We only flag how each one fits.
      </p>
    </div>
  );
}
