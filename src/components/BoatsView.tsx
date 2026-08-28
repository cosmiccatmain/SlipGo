import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { addBoat, boatLimitLabel, deleteBoat, BOAT_LIMIT, type Boat } from "../lib/boats";
import { fetchBoatPhoto, boatPortrait, type BoatKind, type BoatPhoto } from "../lib/boatArt";

interface Props {
  onToast: (msg: string) => void;
  onPricing: () => void;
  onSignIn: () => void;
}

/**
 * A boat's picture: a real photograph of its make/model when one can be found,
 * otherwise the drawn placeholder. The photo is credited to the page it came
 * from — these are third-party images, not ours and not the owner's own boat.
 */
function BoatPhotoView({ boat }: { boat: Boat }) {
  const placeholder = boatPortrait(boat.id, boat.lengthFt, boat.kind);
  const [photo, setPhoto] = useState<BoatPhoto | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let alive = true;
    setPhoto(null);
    setBroken(false);
    fetchBoatPhoto(boat.model, boat.kind).then((r) => {
      if (alive) setPhoto(r.photo);
    });
    return () => {
      alive = false;
    };
  }, [boat.model, boat.kind]);

  // A hotlinked image can 404 or block us at any time; fall back silently.
  const showPhoto = photo && !broken;

  return (
    <div className="boat-photo">
      <img
        src={showPhoto ? photo.url : placeholder}
        alt={showPhoto ? photo.title : ""}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
      {showPhoto && (
        <a
          className="boat-photo-credit"
          href={photo.sourcePage}
          target="_blank"
          rel="noopener noreferrer nofollow"
          title={`Photo of a ${boat.model} from ${photo.sourceName}`}
        >
          {photo.sourceName}
        </a>
      )}
    </div>
  );
}

function BoatCard({ boat, onRemove }: { boat: Boat; onRemove: (b: Boat) => void }) {
  return (
    <article className="boat-card">
      <BoatPhotoView boat={boat} />
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
          {boats.map((b) => <BoatCard key={b.id} boat={b} onRemove={remove} />)}
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
            Add a make and model and we'll find a photo of that model for your card.
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
