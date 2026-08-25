# SlipGo

Slip listings tell you length, beam, and price. They do not tell you the two
things that decide whether you are happy in a slip two years from now: who you
are tied up next to, and whether your boat is safe when you are not there.

This repository holds those two features.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # scoring engines
npm run typecheck
npm run build
```

The app runs on seeded sample data out of the box — no database required. Set
`SUPABASE_URL` and `SUPABASE_ANON_KEY` (see `.env.example`) to read the live
tables instead; if a query fails, the page falls back to sample data rather
than erroring out.

## Slip Neighbors

`/marinas/[slug]/neighbors`

Every slip holder can share an opt-in profile: boat, how often they are
aboard, how long they have been there, and a few traits (quiet, social, dog
aboard, watches boats). From those profiles each dock gets a character —
sociability, liveaboard share, median tenure, and an **eyes-on-dock index**
measuring how often somebody is around to notice a stranger.

The page then scores each dock against the boater's own boat and habits.
Factors, with weights, live in `src/lib/neighbors.ts`:

| Factor | Weight | What it measures |
| --- | ---: | --- |
| Dock personality | 22 | Distance between the dock's sociability and what the boater asked for |
| Eyes on the dock | 16 | Watch coverage from neighbors who are actually aboard |
| Dock stability | 14 | Median tenure — do people stay, or is it a revolving door |
| Liveaboard alignment | 14 | Liveaboard share, read differently depending on whether the boater lives aboard |
| Boats like yours | 12 | Share of the dock running the same type, the people who know your systems |
| Slip size fit | 12 | Whether the boat fits, and whether it is paying for length it does not use |
| Pets and kids | 10 | Only scored when the boater has them |

Factors that do not apply are dropped and the remaining weights renormalized,
so a fit score is always out of 100. Two conditions are hard blockers — a boat
longer than the dock's longest slip, and a liveaboard on a dock that does not
permit them. Blocked docks always rank last and say why.

## Security data

`/marinas/[slug]/security`

A 0–100 score with a letter grade, built from five components
(`src/lib/security.ts`):

| Component | Points | Inputs |
| --- | ---: | --- |
| Incident record | 28 | Recency-weighted reports per 100 slips |
| Access control | 22 | Gated docks, key/code/fob/fob+camera entry |
| On-site presence | 22 | Patrol cadence, staffed hours, watch program, neighbor watch coverage |
| Surveillance | 18 | Camera coverage and cameras per 100 slips |
| Lighting and fire | 10 | Lighting, standpipes, dock extinguishers, NFPA 303 |

Two decisions worth knowing about:

- **Incidents fade.** Each report is weighted by severity and decayed on a
  12-month half-life, then normalized per 100 slips so a big marina is not
  punished for being big. Nothing older than 36 months is scored. A marina
  that cleaned itself up stops being judged on its old record.
- **Unknown is not zero.** Neighbor watch coverage contributes to on-site
  presence, but when no profiles have been shared those points are dropped
  from the denominator instead of scored as a zero. A marina is never marked
  down for data it does not have.

The two features feed each other: watch coverage computed from Slip Neighbors
is an input to the security score, which is why a dock full of liveaboards
scores better on presence than an empty weekender dock with the same cameras.

## Layout

```
src/lib/neighbors.ts   dock stats and fit scoring
src/lib/security.ts    security scoring, incident weighting
src/lib/repository.ts  data source — Supabase (PostgREST) or seeded sample data
src/data/              sample marinas, generated neighbor profiles, incidents
src/app/               pages
tests/                 unit tests for both scoring engines
supabase/migrations/   schema and row-level security
```

## Database

`supabase/migrations/0001_neighbors_and_security.sql` defines the tables and
row-level security. It has been verified against Postgres 16 — it applies
cleanly, re-runs without error, and its policies were tested to confirm that:

- a slip holder sees dockmates' profiles shared at `dock` visibility,
- profiles shared at `marina` visibility reach any current tenant of that marina,
- `private` profiles reach nobody but their owner,
- someone with no slip in the marina sees no profiles at all,
- marina, dock, and security data stay publicly readable.

**It has not been applied to the hosted Supabase project yet.** Neighbor
profiles are personal data about real people, so creating those tables is left
as a deliberate step:

```bash
supabase link --project-ref <ref>
supabase db push
```

## Sample data

Everything under `src/data/` is sample content, generated deterministically
from a seed so a given dock always produces the same neighbors. Names, boats,
and incidents are invented. Replace it with real data before showing this to
anyone who might mistake it for real.
