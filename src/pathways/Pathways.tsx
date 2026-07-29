// @ts-nocheck
// ─── CivicQuest · Pathways ──────────────────────────────────────────────────────
// Full four-stage flow: Explore → Build → Enter → Reform.
//   Explore  — civic recon on a real vacant seat            → 🏅 Seat Scout
//   Build    — match YOUR skills to the board's requires[]  → 🏅 Bench Builder
//   Enter    — Board Ready + handoff to SeatFinder / apply  → 🏅 Board Ready
//   Reform   — diagnose the structural fix (the moat)       → 🏅 Reform Fellow
// Rides the SAME verified data the rest of the suite uses: src/states.config.js.
// All matching is deterministic (board.requires[]) — no API key, no backend, private.
// Prove-it: every board carries sourceUrl + lastVerified. Minors-safe: nothing saved.
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

// SeatFinder deep-link: params are inert until SeatFinder adds a reader — then it's seamless.
const seatFinderLink = (state, board, skills) => {
  const p = new URLSearchParams({ state: state.code, board: board.name });
  if (skills && skills.length) p.set("skills", skills.join(","));
  return `${SEATFINDER_URL}/?${p.toString()}`;
};

// ─── small UI atoms ─────────────────────────────────────────────────────────────
const Chip = ({ text, color = GREEN, bg = "#E1F5EE" }) => (
  <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: bg, color, fontWeight: 600 }}>{text}</span>
);
const STAGES = ["Explore", "Build", "Enter", "Reform"];
const stageForStep = (step) => step === "build" ? "Build" : step === "enter" ? "Enter" : (step === "reform" || step === "done") ? "Reform" : "Explore";
const StageRail = ({ active }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }} aria-label="Pathways stages">
    {STAGES.map((s, i) => {
      const on = s === active;
      return (
        <span key={s} style={{
          fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: on ? 700 : 500,
          background: on ? GREEN : "rgba(255,255,255,0.06)", color: on ? "#fff" : "rgba(255,255,255,0.55)",
          border: on ? "none" : "1px solid rgba(255,255,255,0.14)",
        }}>{i + 1} · {s}</span>
      );
    })}
  </div>
);

// ─── main component ─────────────────────────────────────────────────────────────
export default function Pathways({ onExit }) {
  const [stateCode, setStateCode] = useState("");
  const [board, setBoard] = useState(null);
  const [step, setStep] = useState("browse");      // browse | recon | build | enter | reform | done
  const [badges, setBadges] = useState([]);
  const [skills, setSkills] = useState([]);        // player's selected skills (from board.requires)
  const [live, setLiveMsg] = useState("");

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

  const openBoard = (b) => { setBoard(b); setSkills([]); setStep("recon"); setLiveMsg(`Civic recon started for ${b.name}`); };
  const reset = () => { setBoard(null); setSkills([]); setStep("browse"); };

  const subtitle = {
    build: "Build — match your growing skills to what this board actually needs, and see the gap to close.",
    enter: "Enter — you've done the work. Here's how to step into a real seat.",
    reform: "Reform — you've seen the empty seat. Now think like a reformer: what's the structural fix?",
    done: "Path complete — you scouted, matched, and thought like a reformer.",
  }[step] || "Explore — see the real empty seats in your state, and who bears the cost while they sit empty.";

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
        <StageRail active={stageForStep(step)} />
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{subtitle}</p>
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

      {/* ── STEP: recon (Explore) ── */}
      {step === "recon" && board && (
        <ReconQuest
          board={board}
          constituents={allConstituents}
          onExit={reset}
          onComplete={() => { award("Seat Scout"); setStep("build"); }}
        />
      )}

      {/* ── STEP: build (Build) ── */}
      {step === "build" && board && (
        <BuildStage
          board={board}
          liveStates={liveStates}
          skills={skills}
          setSkills={setSkills}
          onComplete={() => { award("Bench Builder"); setStep("enter"); }}
          onBack={reset}
        />
      )}

      {/* ── STEP: enter (Enter) ── */}
      {step === "enter" && board && state && (
        <EnterStage
          board={board}
          state={state}
          skills={skills}
          onComplete={() => { award("Board Ready"); setStep("reform"); }}
        />
      )}

      {/* ── STEP: reform (Reform capstone) ── */}
      {step === "reform" && board && (
        <ReformCapstone
          board={board}
          state={state}
          onBadge={() => award("Reform Fellow")}
          onDone={() => setStep("done")}
          onBack={reset}
        />
      )}

      {/* ── STEP: done ── */}
      {step === "done" && (
        <PathComplete badges={badges} onAgain={reset} />
      )}
    </div>
  );
}

// ─── Recon quest (Explore) ──────────────────────────────────────────────────────
function ReconQuest({ board, constituents, onExit, onComplete }) {
  const questions = useMemo(() => buildQuestions(board, constituents), [board, constituents]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const q = questions[idx];

  const choose = (opt) => { if (picked !== null) return; setPicked(opt); };
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

// ─── Build stage (deterministic skills match) ───────────────────────────────────
function BuildStage({ board, liveStates, skills, setSkills, onComplete, onBack }) {
  const reqs = Array.isArray(board.requires) ? board.requires : [];
  const toggle = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const matched = reqs.filter(r => skills.includes(r));
  const gap = reqs.filter(r => !skills.includes(r));
  const fit = reqs.length ? Math.round((matched.length / reqs.length) * 100) : null;

  const otherFits = useMemo(() => {
    if (!skills.length) return [];
    return liveStates
      .flatMap(s => s.boards.map(b => ({ s, b })))
      .filter(x => x.b.id !== board.id && Array.isArray(x.b.requires) && x.b.requires.length)
      .map(x => ({ ...x, overlap: x.b.requires.filter(r => skills.includes(r)).length }))
      .filter(x => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3);
  }, [skills, liveStates, board.id]);

  const fitColor = fit === null ? MUTE : fit >= 60 ? GREEN : fit >= 30 ? "#EF9F27" : "#E24B4A";

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "1.25rem", background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#4A4A44", textTransform: "uppercase", letterSpacing: "0.06em" }}>Build your bench</p>
        <button onClick={onBack} style={{ fontSize: 11, background: "none", border: "none", color: MUTE, cursor: "pointer" }}>← boards</button>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: 13, color: MUTE }}>{board.name}</p>

      {reqs.length === 0 ? (
        <>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: INK, lineHeight: 1.6 }}>
            This board's skill profile isn't catalogued yet — but the path is the same: build real skills through courses, majors, and internships, then match them to a seat.
          </p>
          <button onClick={onComplete} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Continue · earn 🏅 Bench Builder
          </button>
        </>
      ) : (
        <>
          <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.5 }}>
            This board needs these skills. Which are you already building — through courses, a major, or an internship (like a Governor's School)?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {reqs.map(s => {
              const on = skills.includes(s);
              return (
                <button key={s} onClick={() => toggle(s)} aria-pressed={on}
                  style={{ padding: "7px 12px", borderRadius: 20, border: `1.5px solid ${on ? GREEN : "#d5d5d2"}`, background: on ? "#E1F5EE" : "#fff", color: on ? "#0F6E56" : INK, cursor: "pointer", fontSize: 12.5, fontWeight: on ? 600 : 400 }}>
                  {on ? "✓ " : ""}{s}
                </button>
              );
            })}
          </div>

          {skills.length > 0 && (
            <div style={{ borderTop: "1px solid #eee", paddingTop: 12, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: fitColor }}>{fit}%</span>
                <span style={{ fontSize: 12, color: MUTE }}>fit — {matched.length} of {reqs.length} skills this board needs</span>
              </div>
              {gap.length > 0 ? (
                <p style={{ margin: "0 0 4px", fontSize: 12.5, color: INK, lineHeight: 1.6 }}>
                  <strong>To close the gap</strong>, aim your studies and internships at: {gap.join(", ")}.
                </p>
              ) : (
                <p style={{ margin: "0 0 4px", fontSize: 12.5, color: "#0F6E56", lineHeight: 1.6 }}>
                  You already match everything this board asks for. That's a seat with your name on it.
                </p>
              )}

              {otherFits.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#4A4A44", textTransform: "uppercase", letterSpacing: "0.06em" }}>Other seats that already fit you</p>
                  {otherFits.map(({ s, b, overlap }) => (
                    <div key={b.id} style={{ fontSize: 12, color: INK, marginBottom: 3 }}>
                      <span style={{ color: GREEN, fontWeight: 600 }}>{overlap} match{overlap === 1 ? "" : "es"}</span> · {b.name} <span style={{ color: MUTE }}>({s.label})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button onClick={onComplete} disabled={skills.length === 0}
            style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: skills.length ? GREEN : "#c7c7c2", color: "#fff", cursor: skills.length ? "pointer" : "default", fontSize: 14, fontWeight: 600 }}>
            {skills.length ? "Continue · earn 🏅 Bench Builder" : "Pick the skills you're building"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Enter stage (Board Ready + handoff) ────────────────────────────────────────
function EnterStage({ board, state, skills, onComplete }) {
  const sf = seatFinderLink(state, board, skills);
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "1.25rem", background: "#fff" }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#4A4A44", textTransform: "uppercase", letterSpacing: "0.06em" }}>Enter — you're Board Ready</p>
      <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.5 }}>
        You scouted a real seat and matched your skills to it. This isn't a game anymore — here's how to actually step in.
      </p>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <a href={sf} target="_blank" rel="noreferrer"
          style={{ display: "block", padding: "12px 14px", borderRadius: 10, background: `linear-gradient(160deg,${DARK} 0%,#0D2136 100%)`, textDecoration: "none" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>Draft a Letter of Interest with SeatFinder →</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Opens SeatFinder — match your skills to a live seat and generate your letter.</span>
        </a>
        {state.applyUrl && (
          <a href={state.applyUrl} target="_blank" rel="noreferrer"
            style={{ display: "block", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${GREEN}`, textDecoration: "none" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0F6E56", marginBottom: 2 }}>Apply directly · {state.applyAuthority || `${state.label} appointments`} ↗</span>
            <span style={{ fontSize: 11, color: MUTE }}>The official place {state.label} accepts board and commission applications.</span>
          </a>
        )}
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 11.5, color: MUTE, lineHeight: 1.6 }}>
        🏅 <strong>Board Ready</strong> is the credential that carries across the OpenQuorum pipeline — next, professionals step into <strong>The Pipeline</strong> (coming soon).
      </p>
      <button onClick={onComplete} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: GREEN, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
        One more thing — think like a reformer →
      </button>
    </div>
  );
}

// ─── Reform capstone (the moat) ─────────────────────────────────────────────────
function ReformCapstone({ board, state, onBadge, onDone, onBack }) {
  const [choice, setChoice] = useState(null);
  const options = [
    { key: "fill", label: "Fill this one empty seat",
      note: "That helps today — but the seat may sit empty again next year. Placement alone tends to produce heroics, not durable change." },
    { key: "recruit", label: "Fix how members are recruited & confirmed",
      note: "Now you're thinking structurally: a board that can find and seat qualified people reliably stops going vacant in the first place." },
    { key: "load", label: "Reduce the board's procedural load so it can actually meet",
      note: "Also structural: right-sizing what the board must do makes the seats it does have far more effective." },
  ];
  const chosen = options.find(o => o.key === choice);
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: "1.25rem", background: "#fff" }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#4A4A44", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reform capstone</p>
      <p style={{ margin: "0 0 4px", fontSize: 13, color: MUTE }}>{board.name}{state ? ` · ${state.label}` : ""}</p>
      <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.5 }}>
        A placement fills the seat once. A <span style={{ color: GREEN }}>reformer</span> asks why it keeps going empty. What's the structural fix?
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
            Finish path →
          </button>
        </>
      )}
      <button onClick={onBack} style={{ marginTop: 10, fontSize: 11, background: "none", border: "none", color: MUTE, cursor: "pointer" }}>← back to boards</button>
    </div>
  );
}

// ─── Path complete ──────────────────────────────────────────────────────────────
function PathComplete({ badges, onAgain }) {
  return (
    <div style={{ borderRadius: 14, padding: "1.6rem", background: `linear-gradient(160deg,${DARK} 0%,#0D2136 100%)`, textAlign: "center" }}>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: GREEN, letterSpacing: "0.08em", textTransform: "uppercase" }}>Path complete</p>
      <p style={{ margin: "0 0 14px", fontSize: 15, color: "#fff", fontWeight: 500, lineHeight: 1.6 }}>
        You explored a real seat, built your skills against it, learned how to enter, and thought like a reformer. That's the whole path.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {badges.map(b => <Chip key={b} text={`🏅 ${b}`} color="#0F6E56" bg="#E1F5EE" />)}
      </div>
      <button onClick={onAgain} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "rgba(255,255,255,0.85)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
        Explore another board
      </button>
    </div>
  );
}
