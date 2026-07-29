// @ts-nocheck
// ─── CivicQuest · Pathways ──────────────────────────────────────────────────
// Stage 1 (Explore) + a thin Stage 4 (Reform) capstone hook.
// Rides the SAME verified data the rest of the suite uses: src/states.config.js
// (STATE_CONFIG). Prove-it: every board shown carries its sourceUrl + lastVerified.
// Minors-safe by design: no sign-in, no personal data, nothing is saved.
// Accessibility: native buttons/inputs, aria-labels, WCAG-AA contrast.
//
// SETUP (one time): copy src/states.config.js from the openquorum-vacancy-clock
// repo into this repo at src/states.config.js. Then this import resolves.
import { useMemo, useState } from "react";
import { STATE_CONFIG } from "../states.config.js";

const GREEN = "#1D9E75", DARK = "#0A1628", INK = "#1a1a1a", MUTE = "#54544E";
const DOMAIN_COLORS = {
  health:"#1D9E75", environment:"#3B6D11", housing:"#EF9F27", education:"#185FA5",
  justice:"#993C1D", equity:"#72243E", disability:"#534AB7",
};
const SEATFINDER_URL = "https://open-quorum-seat-finder-45q6.vercel.app";

const daysBetween = (iso) => {
  if (!iso) return null;
  const d = new Date(iso); if (isNaN(d)) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
};
const fmtVacancy = (iso) => {
  const d = daysBetween(iso);
  if (d === null) return "vacancy date not published";
  const y = (d / 365).toFixed(1);
  return d >= 365 ? `${d.toLocaleString()} days · ${y} yr` : `${d.toLocaleString()} days`;
};
const shuffle = (a) => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);
const uniq = (a) => Array.from(new Set(a));

// ─── small UI atoms ──────────────────────────────────────────────────────────────
const Chip = ({ text, color = GREEN, bg = "#E1F5EE" }) => (
  <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: bg, color, fontWeight: 600 }}>{text}</span>
);
const StageRail = ({ active }) => {
  const stages = ["Explore", "Build", "Enter", "Reform"];
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }} aria-label="Pathways stages">
      {stages.map((s, i) => {
        const on = s === active;
        return (
          <span key={s} style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: on ? 700 : 500,
            background: on ? GREEN : "rgba(255,255,255,0.06)", color: on ? "#fff" : "rgba(255,255,255,0.55)",
            border: on ? "none" : "1px solid rgba(255,255,255,0.14)",
          }}>{i + 1} · {s}{!on && i > 0 ? " ·soon" : ""}</span>
        );
      })}
    </div>
  );
};

// ─── main component ─────────────────────────────────────────────────────────────
export default function Pathways({ onExit }) {
  const [stateCode, setStateCode] = useState("");
  const [board, setBoard] = useState(null);
  const [step, setStep] = useState("browse");      // browse | recon | reform | done
  const [badges, setBadges] = useState([]);        // "Seat Scout" | "Reform Fellow"
  const [live, setLiveMsg] = useState("");         // aria-live announcements

  const liveStates = useMemo(() =>
    Object.values(STATE_CONFIG)
      .filter(s => s.status === "live" && Array.isArray(s.boards) && s.boards.length)
      .sort((a, b) => a.label.localeCompare(b.label)), []);

  const state = stateCode ? STATE_CONFIG[stateCode] : null;
  const allConstituents = useMemo(() =>
    uniq(liveStates.flatMap(s => s.boards.map(b => b.constituent).filter(Boolean))), [liveStates]);

  const award = (name) => setBadges(prev => {
    if (prev.includes(name)) return prev;
    setLiveMsg(`Badge earned: ${name}`);
    return [...prev, name];
  });

  const openBoard = (b) => { setBoard(b); setStep("recon"); setLiveMsg(`Civic recon started for ${b.name}`); };
  const reset = () => { setBoard(null); setStep("browse"); };

  // ── shell ──
  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", maxWidth: 820, margin: "0 auto", padding: "0 16px 3rem", color: INK }}>
      <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{live}</div>

      {/* header */}
      <div style={{ background: DARK, borderRadius: "0 0 14px 14px", padding: "1.25rem 1.4rem", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
            Open<span style={{ color: GREEN }}>Quorum</span>{" "}
            <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>CivicQuest · Pathways</span>
          </span>
          <button onClick={onExit} aria-label="Back to CivicQuest menu"
            style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.75)", cursor: "pointer", fontSize: 12 }}>
            ← Menu
          </button>
        </div>
        <StageRail active={step === "reform" ? "Reform" : "Explore"} />
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
          {step === "reform"
            ? "Reform — you've seen the empty seat. Now think like a reformer: what's the structural fix?"
            : "Explore — see the real empty seats in your state, and who bears the cost while they sit empty."}
        </p>
        {badges.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {badges.map(b => <Chip key={b} text={`🏅 ${b}`} color="#0F6E56" bg="#E1F5EE" />)}
          </div>
        )}
      </div>

      <p style={{ margin: "0 0 14px", fontSize: 11, color: MUTE, lineHeight: 1.6 }}>
        No sign-in, no personal data, nothing is saved — this works the same whether you're 14 or 40.
      </p>

      {/* ── STEP: browse (state picker + board list) ── */}
      {step === "browse" && (
        <>
          <label htmlFor="oq-state" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A4A44", marginBottom: 6 }}>
            Pick your state
          </label>
          <select id="oq-state" value={stateCode} onChange={e => { setStateCode(e.target.value); }}
            style={{ fontSize: 14, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #d5d5d2", width: "100%", maxWidth: 320, background: "#fff", color: INK, marginBottom: 18 }}>
            <option value="">Select a state…</option>
            {liveStates.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>

          {!state && (
            <p style={{ fontSize: 13, color: MUTE, lineHeight: 1.7 }}>
              {liveStates.length} state{liveStates.length === 1 ? "" : "s"} live right now. Choose one to see its real
              boards and commissions — the seats that are empty in your name.
            </p>
          )}

          {state && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#4A4A44", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {state.label} · {state.boards.length} boards tracked
                </p>
                {state.totalBoardsNote && <span style={{ fontSize: 11, color: MUTE }}>{state.totalBoardsNote}</span>}
              </div>

              {state.boards.map(b => {
                const filled = b.totalSeats - b.vacantSeats;
                const dc = DOMAIN_COLORS[b.domain] || "#5A5A54";
                return (
                  <div key={b.id} style={{ border: "1px solid #eee", borderLeft: `4px solid ${dc}`, borderRadius: "0 10px 10px 0", padding: "0.9rem 1rem", marginBottom: 10, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: INK, flex: 1, minWidth: 200 }}>{b.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#E24B4A", whiteSpace: "nowrap" }}>{b.vacantSeats} vacant <span style={{ color: MUTE, fontWeight: 400 }}>of {b.totalSeats}</span></span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                      <Chip text={b.domain} color="#fff" bg={dc} />
                      <span style={{ fontSize: 11, color: MUTE }}>Vacant: {fmtVacancy(b.vacantSince)}</span>
                      <span style={{ fontSize: 11, color: MUTE }}>· Serves: {b.constituent}</span>
                    </div>
                    {b.criticalNote && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#791F1F", lineHeight: 1.5 }}>Why it matters: {b.criticalNote}</p>}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <a href={b.sourceUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize: 10.5, color: "#0F6E56", textDecoration: "none" }}
                        title={`Source verified ${b.lastVerified}`}>
                        ✓ Verified source · {b.lastVerified} ↗
                      </a>
                      <button onClick={() => openBoard(b)} aria-label={`Start civic recon for ${b.name}`}
                        style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Start civic recon →
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {/* ── STEP: recon (auto-graded, derived from the row) ── */}
      {step === "recon" && board && (
        <ReconQuest
          board={board}
          constituents={allConstituents}
          onExit={reset}
          onComplete={() => { award("Seat Scout"); setStep("reform"); }}
        />
      )}

      {/* ── STEP: reform (thin capstone) ── */}
      {step === "reform" && board && (
        <ReformCapstone
          board={board}
          state={state}
          onBadge={() => award("Reform Fellow")}
          onDone={() => setStep("done")}
          onBack={reset}
        />
      )}

      {/* ── STEP: done (handoff) ── */}
      {step === "done" && board && state && (
        <Handoff board={board} state={state} onAgain={reset} />
      )}
    </div>
  );
}

// ─── Recon quest ───────────────────────────────────────────────────────────
function ReconQuest({ board, constituents, onExit, onComplete }) {
  const questions = useMemo(() => buildQuestions(board, constituents), [board, constituents]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const q = questions[idx];

  const choose = (opt) => {
    if (picked !== null) return;
    setPicked(opt);
    if (opt === q.answer) setCorrect(c => c + 1);
  };
  const next = () => {
    if (idx + 1 < questions.length) { setIdx(idx + 1); setPicked(null); }
    else onComplete();
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "1.25rem", background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#4A4A44", textTransform: "uppercase", letterSpacing: "0.06em" }}>Civic recon · {idx + 1} of {questions.length}</p>
        <button onClick={onExit} style={{ fontSize: 11, background: "none", border: "none", color: MUTE, cursor: "pointer" }}>← boards</button>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: 13, color: MUTE }}>{board.name}</p>
      <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.5 }}>{q.prompt}</p>
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {q.options.map(opt => {
          const isAns = opt === q.answer, isPicked = opt === picked;
          const show = picked !== null;
          const bg = show && isAns ? "#E1F5EE" : show && isPicked ? "#FCEBEB" : "#fff";
          const bd = show && isAns ? GREEN : show && isPicked ? "#E24B4A" : "#d5d5d2";
          return (
            <button key={String(opt)} onClick={() => choose(opt)} disabled={show}
              style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${bd}`, background: bg, color: INK, cursor: show ? "default" : "pointer", fontSize: 13, lineHeight: 1.4 }}>
              {opt}{show && isAns ? "  ✓" : ""}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: MUTE, lineHeight: 1.6 }}>{q.explain}</p>
          <button onClick={next} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            {idx + 1 < questions.length ? "Next →" : "Finish recon · earn 🏅 Seat Scout"}
          </button>
        </>
      )}
    </div>
  );
}

function buildQuestions(board, constituents) {
  const filled = board.totalSeats - board.vacantSeats;
  const vac = board.vacantSeats;
  const vacOpts = shuffle(uniq([vac, Math.max(0, vac - 2), vac + 3, Math.max(1, Math.round(vac / 2))]).slice(0, 4));
  const days = daysBetween(board.vacantSince);
  const bucket = days === null ? "not published" : days >= 730 ? "More than 2 years" : days >= 365 ? "More than 1 year" : days >= 180 ? "More than 6 months" : "Less than 6 months";
  const bucketOpts = shuffle(uniq(["Less than 6 months", "More than 6 months", "More than 1 year", "More than 2 years", "not published"]).filter(o => o !== "not published" || bucket === "not published")).slice(0, 4);
  const consDistract = shuffle(constituents.filter(c => c !== board.constituent)).slice(0, 3);
  const consOpts = shuffle(uniq([board.constituent, ...consDistract]));
  return [
    { prompt: "How many seats sit empty on this board right now?", options: vacOpts, answer: vac,
      explain: `${vac} of ${board.totalSeats} seats are vacant — only ${filled} are filled. Empty seats can mean no quorum, and no quorum means decisions stall.` },
    { prompt: "Who bears the cost while this board sits understaffed?", options: consOpts, answer: board.constituent,
      explain: `This board exists to serve: ${board.constituent}. When it can't meet, they wait.` },
    { prompt: "How long has this board had a vacancy?", options: bucketOpts, answer: bucket,
      explain: `Vacant ${fmtVacancy(board.vacantSince)}. The longer a seat stays empty, the more decisions pile up behind it.` },
  ];
}

// ─── Reform capstone (thin) ───────────────────────────────────────────────────
function ReformCapstone({ board, state, onBadge, onDone, onBack }) {
  const [choice, setChoice] = useState(null);
  const options = [
    { key: "fill", label: "Fill this one empty seat", kind: "placement",
      note: "That helps today — but the seat may sit empty again next year. Placement alone tends to produce heroics, not durable change." },
    { key: "recruit", label: "Fix how members are recruited & confirmed", kind: "structural",
      note: "Now you're thinking structurally: a board that can find and seat qualified people reliably stops going vacant in the first place." },
    { key: "load", label: "Reduce the board's procedural load so it can actually meet", kind: "structural",
      note: "Also structural: right-sizing what the board must do makes the seats it does have far more effective." },
  ];
  const chosen = options.find(o => o.key === choice);
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "1.25rem", background: "#fff" }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#4A4A44", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reform capstone</p>
      <p style={{ margin: "0 0 4px", fontSize: 13, color: MUTE }}>{board.name} · {state.label}</p>
      <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.5 }}>
        You've seen the empty seat. A placement fills it once. A <span style={{ color: GREEN }}>reformer</span> asks why it keeps going empty. What's the structural fix?
      </p>
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {options.map(o => {
          const on = o.key === choice;
          return (
            <button key={o.key} onClick={() => { setChoice(o.key); onBadge(); }}
              style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${on ? GREEN : "#d5d5d2"}`, background: on ? "#E1F5EE" : "#fff", color: INK, cursor: "pointer", fontSize: 13, lineHeight: 1.4 }}>
              {o.label}
            </button>
          );
        })}
      </div>
      {chosen && (
        <>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: MUTE, lineHeight: 1.7 }}>{chosen.note}</p>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#0F6E56", lineHeight: 1.7 }}>
            There's no single right answer — the point is that you diagnosed the <em>structure</em>, not just the symptom. That's what a reformer does. 🏅 Reform Fellow (in training).
          </p>
          <button onClick={onDone} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Continue →
          </button>
        </>
      )}
      <button onClick={onBack} style={{ marginTop: 10, fontSize: 11, background: "none", border: "none", color: MUTE, cursor: "pointer" }}>← back to boards</button>
    </div>
  );
}

// ─── Handoff (real placement) ───────────────────────────────────────────────────
function Handoff({ board, state, onAgain }) {
  return (
    <div style={{ borderRadius: 14, padding: "1.6rem", background: `linear-gradient(160deg,${DARK} 0%,#0D2136 100%)`, textAlign: "center" }}>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: GREEN, letterSpacing: "0.08em", textTransform: "uppercase" }}>You just did the work</p>
      <p style={{ margin: "0 0 14px", fontSize: 15, color: "#fff", fontWeight: 500, lineHeight: 1.6 }}>
        You scouted a real seat and thought like a reformer. When you're ready, this isn't a game — you can actually apply.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <a href={SEATFINDER_URL} target="_blank" rel="noreferrer" style={{ padding: "9px 18px", borderRadius: 8, background: GREEN, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Match me to a real seat →</a>
        {state.applyUrl && (
          <a href={state.applyUrl} target="_blank" rel="noreferrer" style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
            {state.applyAuthority || `${state.label} appointments`} ↗
          </a>
        )}
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
        Next on your path: earn <strong style={{ color: "rgba(255,255,255,0.8)" }}>Board Ready</strong> and step into The Pipeline — coming soon.
      </p>
      <button onClick={onAgain} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 12 }}>
        Explore another board
      </button>
    </div>
  );
}
