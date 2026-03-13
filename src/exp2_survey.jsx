import { useState, useCallback, useMemo, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// EXPERIMENT 2 — Visualization Deception Study
// ═══════════════════════════════════════════════════════════

// ── CONFIG ──
const TECHNIQUES = ["bar", "line", "pie", "bubble"];
const STYLE_LEVELS = [1, 3, 5, 7];
const NUM_TRIALS = 4;

// Technique-specific claims for Q1
const Q1_CLAIMS = {
  bar: "The value in 2022 is nearly double the value in 2021.",
  line: "South Korea's GDP per capita increased only slightly from 2010 to 2024.",
  pie: "Transport is the largest sector in the chart.",
  bubble: "Bruno Mars has more than twice the monthly listeners of Ed Sheeran.",
};

// Q2 magnitude questions & options
const Q2_CONFIG = {
  bar: {
    question: "Roughly how much higher is the value in 2022 compared to 2021?",
    options: ["<25%", "25–50%", "50–75%", "75–100%", ">100%"],
  },
  line: {
    question: "Roughly how much did South Korea's GDP per capita increase from 2010 to 2024?",
    options: ["<10%", "10–20%", "20–30%", "30–50%", ">50%"],
  },
  pie: {
    question: "Compared with Energy, how much larger or smaller does Transport appear?",
    options: ["Much smaller", "Slightly smaller", "About the same", "Slightly larger", "Much larger"],
  },
  bubble: {
    question: "Roughly how much larger is Bruno Mars's monthly audience than Ed Sheeran's?",
    options: ["<1.5×", "1.5–2×", "2–3×", "3–5×", ">5×"],
  },
};

// Trust inventory (Wang et al.)
const TRUST_STATEMENTS = [
  "I find this visualization easy to understand.",
  "I find this visualization difficult to use.",
  "I am skeptical about the information presented in this visualization.",
  "I trust this data.",
];
const LIKERT_LABELS = [
  "Strongly Disagree", "Disagree", "Slightly Disagree",
  "Slightly Agree", "Agree", "Strongly Agree",
];

// Need for Cognition 18
const NFC_ITEMS = [
  "I would prefer complex to simple problems.",
  "I like to have the responsibility of handling a situation that requires a lot of thinking.",
  "Thinking is not my idea of fun.",
  "I would rather do something that requires little thought than something that is sure to challenge my thinking abilities.",
  "I try to anticipate and avoid situations where there is a likely chance I will have to think in depth about something.",
  "I find satisfaction in deliberating hard and for long hours.",
  "I only think as hard as I have to.",
  "I prefer to think about small, daily projects to long-term ones.",
  "I like tasks that require little thought once I've learned them.",
  "The idea of relying on thought to make my way to the top appeals to me.",
  "I really enjoy a task that involves coming up with new solutions to problems.",
  "Learning new ways to think doesn't excite me very much.",
  "I prefer my life to be filled with puzzles that I must solve.",
  "The notion of thinking abstractly is appealing to me.",
  "I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.",
  "I feel relief rather than satisfaction after completing a task that required a lot of mental effort.",
  "It's enough for me that something gets the job done; I don't care how or why it works.",
  "I usually end up deliberating about issues even when they do not affect me personally.",
];
const NFC_SCALE = [
  "Extremely Uncharacteristic",
  "Somewhat Uncharacteristic",
  "Uncertain",
  "Somewhat Characteristic",
  "Extremely Characteristic",
];

// 6 integrity patterns: which 2 techniques are deceptive
const INTEGRITY_PATTERNS = [
  ["bar", "line"],
  ["bar", "pie"],
  ["bar", "bubble"],
  ["line", "pie"],
  ["line", "bubble"],
  ["pie", "bubble"],
];

// ── Utility ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Reusable components (matching exp1 style) ──

function Page({ children }) {
  return (
    <div style={{
      maxWidth: 800, margin: "0 auto", padding: "40px 24px",
      fontFamily: "'Source Sans 3', 'Segoe UI', system-ui, sans-serif",
    }}>{children}</div>
  );
}

function Nav({ onBack, onNext, nextLabel = "→", nextDisabled = false, showBack = false }) {
  return (
    <div style={{ display: "flex", justifyContent: showBack ? "space-between" : "flex-end", marginTop: 36 }}>
      {showBack && (
        <button onClick={onBack} style={{
          padding: "12px 28px", borderRadius: 6, border: "1px solid #cbd5e0",
          background: "#fff", color: "#4a5568", fontSize: 16, cursor: "pointer",
        }}>← Back</button>
      )}
      <button onClick={onNext} disabled={nextDisabled} style={{
        padding: "12px 32px", borderRadius: 6, border: "none",
        background: nextDisabled ? "#a0aec0" : "#2a8fc1", color: "#fff",
        fontSize: 16, fontWeight: 600, cursor: nextDisabled ? "not-allowed" : "pointer",
      }}>{nextLabel}</button>
    </div>
  );
}

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.label;
        return (
          <label key={val} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 8,
            background: value === val ? "#e8f4fb" : "#f7f8fa",
            border: value === val ? "1px solid #2a8fc1" : "1px solid transparent",
            cursor: "pointer", transition: "all .15s",
          }}>
            <input type="radio" name={name} value={val}
              checked={value === val} onChange={() => onChange(val)}
              style={{ accentColor: "#2a8fc1", width: 18, height: 18 }} />
            <span style={{ color: "#374151", fontSize: 15 }}>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

function LikertRow({ statement, name, value, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, color: "#2d3748", fontWeight: 600, marginBottom: 8 }}>
        {statement}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {LIKERT_LABELS.map((label, li) => (
          <label key={li} style={{
            flex: "1 1 0", minWidth: 80, textAlign: "center",
            padding: "8px 4px", borderRadius: 6,
            background: value === li ? "#e8f4fb" : "#f7f8fa",
            border: value === li ? "1px solid #2a8fc1" : "1px solid #e2e8f0",
            cursor: "pointer", fontSize: 12, lineHeight: 1.3,
            color: value === li ? "#2a8fc1" : "#4a5568",
            fontWeight: value === li ? 600 : 400,
            transition: "all .15s",
          }}>
            <input type="radio" name={name} value={li}
              checked={value === li} onChange={() => onChange(li)}
              style={{ display: "none" }} />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,.6)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000,
      cursor: "pointer", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 12, padding: 16,
        maxWidth: "90vw", maxHeight: "90vh",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)",
        cursor: "default", display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <button onClick={onClose} style={{
          alignSelf: "flex-end", width: 32, height: 32, borderRadius: 8,
          border: "none", background: "#f7f8fa", cursor: "pointer",
          fontSize: 18, color: "#718096", marginBottom: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>✕</button>
        <img src={src} alt="Enlarged chart" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 6 }} />
      </div>
    </div>
  );
}

function ProgressBar({ trialIdx, pageLabel }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <span style={{
        fontSize: 12, color: "#2a8fc1", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: 1,
        background: "#e8f4fb", padding: "4px 10px", borderRadius: 4,
      }}>Chart {trialIdx + 1} of {NUM_TRIALS} — {pageLabel}</span>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i <= trialIdx ? "#2a8fc1" : "#e2e8f0",
          }} />
        ))}
      </div>
    </div>
  );
}

function ChartDisplay({ imagePath, onEnlarge }) {
  return (
    <div style={{
      textAlign: "center", margin: "24px 0",
      background: "#fafbfc", borderRadius: 10, padding: 20,
      border: "1px solid #e2e8f0",
    }}>
      <img
        src={imagePath} alt="Data visualization"
        onClick={onEnlarge}
        style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 6, cursor: "pointer" }}
      />
      <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 8 }}>
        Click the image to enlarge
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function Exp2Survey() {
  const [step, setStep] = useState(0);
  const [modalImage, setModalImage] = useState(null);

  // ── Prolific ID ──
  const [prolificId, setProlificId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("PROLIFIC_PID") || "";
  });

  // ── Experimental conditions (assigned once) ──
  const styleLevel = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("level")) return parseInt(params.get("level"));
    return STYLE_LEVELS[Math.floor(Math.random() * STYLE_LEVELS.length)];
  }, []);

  const integrityPatternIdx = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("pattern")) return parseInt(params.get("pattern"));
    return Math.floor(Math.random() * INTEGRITY_PATTERNS.length);
  }, []);

  const techniqueOrder = useMemo(() => shuffle([...TECHNIQUES]), []);

  const getIntegrity = useCallback((technique) => {
    return INTEGRITY_PATTERNS[integrityPatternIdx].includes(technique) ? "deceptive" : "honest";
  }, [integrityPatternIdx]);

  const getImagePath = useCallback((trialIdx) => {
    const technique = techniqueOrder[trialIdx];
    const integrity = getIntegrity(technique);
    return `${import.meta.env.BASE_URL}images/${integrity}-${technique}-${styleLevel}.png`;
  }, [techniqueOrder, getIntegrity, styleLevel]);

  // ── Trial responses ──
  const [q1Answers, setQ1Answers] = useState([null, null, null, null]);
  const [q2Answers, setQ2Answers] = useState([null, null, null, null]);
  const [trustInventory, setTrustInventory] = useState(() =>
    Array.from({ length: 4 }, () => [null, null, null, null])
  );
  const [q4Reflection, setQ4Reflection] = useState(["", "", "", ""]);
  const [q5Positive, setQ5Positive] = useState(["", "", "", ""]);
  const [q5Negative, setQ5Negative] = useState(["", "", "", ""]);

  // ── Timing ──
  const [pageStartTime, setPageStartTime] = useState(null);
  const [pageTimes, setPageTimes] = useState({});

  const startTimer = (trialIdx, pageName) => {
    setPageStartTime(Date.now());
  };

  const stopTimer = (trialIdx, pageName) => {
    if (pageStartTime) {
      const key = `trial_${trialIdx}_${pageName}`;
      setPageTimes((prev) => ({
        ...prev,
        [key]: Math.round((Date.now() - pageStartTime) / 1000),
      }));
    }
  };

  // ── Demographics ──
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [education, setEducation] = useState("");

  // ── NFC 18 ──
  const [nfcAnswers, setNfcAnswers] = useState(new Array(18).fill(null));

  // ── Submission ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Google Apps Script URL — replace after deploying
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxWjvHRqTY54Tj57z4d_u-9FblMeR-yO6hyJFelLkHd7-Dyvb2oC3Uhj5mnJJHCUokP/exec";

  const inputStyle = {
    display: "block", width: "100%", marginTop: 8,
    padding: "10px 14px", borderRadius: 6,
    border: "1px solid #cbd5e0", fontSize: 15,
    outline: "none", boxSizing: "border-box",
  };

  // ── Navigation ──
  const next = () => {
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  // ── Data collection ──
  const collectData = useCallback(() => {
    const trials = techniqueOrder.map((technique, i) => ({
      trial: i + 1,
      technique,
      integrity: getIntegrity(technique),
      styleLevel,
      imagePath: getImagePath(i),
      q1_factCheck: q1Answers[i],
      q2_magnitude: q2Answers[i],
      trust_easy: trustInventory[i][0] !== null ? LIKERT_LABELS[trustInventory[i][0]] : "",
      trust_difficult: trustInventory[i][1] !== null ? LIKERT_LABELS[trustInventory[i][1]] : "",
      trust_skeptical: trustInventory[i][2] !== null ? LIKERT_LABELS[trustInventory[i][2]] : "",
      trust_data: trustInventory[i][3] !== null ? LIKERT_LABELS[trustInventory[i][3]] : "",
      q4_reflection: q4Reflection[i],
      q5_positive: q5Positive[i],
      q5_negative: q5Negative[i],
      time_q1: pageTimes[`trial_${i}_q1`] || 0,
      time_q2: pageTimes[`trial_${i}_q2`] || 0,
      time_q3: pageTimes[`trial_${i}_q3`] || 0,
    }));

    return {
      prolificId,
      styleLevel,
      integrityPattern: integrityPatternIdx,
      integrityPatternLabel: INTEGRITY_PATTERNS[integrityPatternIdx].join("+") + " deceptive",
      techniqueOrder: techniqueOrder.join("-"),
      trials,
      age,
      gender,
      education,
      nfcAnswers: nfcAnswers.map((v) => (v !== null ? NFC_SCALE[v] : "")),
      submittedAt: new Date().toISOString(),
    };
  }, [prolificId, styleLevel, integrityPatternIdx, techniqueOrder, getIntegrity, getImagePath,
      q1Answers, q2Answers, trustInventory, q4Reflection, q5Positive, q5Negative,
      pageTimes, age, gender, education, nfcAnswers]);

  const submitToGoogle = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const data = collectData();
    console.log("Experiment 2 data:", JSON.stringify(data, null, 2));

    if (GOOGLE_SCRIPT_URL === "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
      console.warn("Google Apps Script URL not set — data logged to console only.");
      setSubmitting(false);
      next();
      return;
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSubmitting(false);
      next();
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  // Log conditions on mount
  useEffect(() => {
    console.log("Exp2 conditions:", {
      styleLevel,
      integrityPattern: integrityPatternIdx,
      integrityPatternLabel: INTEGRITY_PATTERNS[integrityPatternIdx].join("+") + " deceptive",
      techniqueOrder,
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // STEP ROUTING
  // Step 0: Consent
  // Step 1: Instructions
  // Steps 2–13: 4 trials × 3 pages (q1, q2, q3)
  // Step 14: Demographics + NFC
  // Step 15: Thank you
  // ═══════════════════════════════════════════════════════════

  // ── STEP 0: Consent ──
  if (step === 0) {
    return (
      <Page>
        <div style={{
          background: "#fff", borderRadius: 12, padding: "40px 36px",
          boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e8ecf1",
          maxWidth: 700, margin: "0 auto",
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a202c", margin: "0 0 24px" }}>
            Visualization Perception Study — Consent
          </h1>
          <div style={{ color: "#4a5568", lineHeight: 1.7, fontSize: 15, marginBottom: 24 }}>
            <p>Thank you for your interest in this study. You will be shown a series of data visualizations and asked questions about each one. The study takes approximately <strong>15 minutes</strong>.</p>
            <p style={{ marginTop: 12 }}>Your participation is voluntary. You may withdraw at any time without penalty. All data will be stored anonymously using your Prolific ID.</p>
            <p style={{ marginTop: 12 }}>By clicking <strong>"I Consent"</strong> below, you confirm that you have read and understood this information and agree to participate.</p>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 14 }}>
              Prolific ID <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <input type="text" placeholder="e.g. 5f3c2a1b..." value={prolificId}
              onChange={(e) => setProlificId(e.target.value)} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={next} disabled={!prolificId.trim()} style={{
              padding: "10px 24px", borderRadius: 6, border: "none",
              background: !prolificId.trim() ? "#a0aec0" : "#2a8fc1",
              color: "#fff", fontWeight: 600, fontSize: 15,
              cursor: !prolificId.trim() ? "not-allowed" : "pointer",
            }}>I Consent</button>
            <button style={{
              padding: "10px 24px", borderRadius: 6, border: "none",
              background: "transparent", color: "#718096", fontSize: 15, cursor: "pointer",
            }}>I Do Not Consent</button>
          </div>
        </div>
      </Page>
    );
  }

  // ── STEP 1: Instructions ──
  if (step === 1) {
    return (
      <Page>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#4a5568", margin: "0 0 24px" }}>Welcome!</h1>
          <div style={{ color: "#6b7a8d", fontSize: 17, lineHeight: 1.75, marginBottom: 32 }}>
            <p>In this study, you will be shown <strong>4 data visualizations</strong>, one at a time. For each visualization, you will answer a few questions about what you see, then provide your evaluation.</p>
            <p style={{ marginTop: 20 }}>There is <strong>no back button</strong> — once you move to the next page, you cannot return. Please read each question carefully before answering.</p>
            <p style={{ marginTop: 20 }}>The entire study should take approximately <strong>15 minutes</strong>.</p>
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 24 }}>
            <p style={{ color: "#6b7a8d", fontSize: 16, lineHeight: 1.75 }}>
              For each visualization you will:
            </p>
            <p style={{ color: "#6b7a8d", fontSize: 16, lineHeight: 1.75, marginTop: 8 }}>
              1. Answer a factual question about the chart<br />
              2. Estimate a magnitude shown in the chart<br />
              3. Evaluate the visualization and share your thoughts
            </p>
          </div>
          <Nav showBack={false} onNext={() => { startTimer(0, "q1"); next(); }} nextLabel="Begin →" />
        </div>
      </Page>
    );
  }

  // ── STEPS 2–13: Trial pages ──
  const trialStep = step - 2;
  if (trialStep >= 0 && trialStep < 12) {
    const trialIdx = Math.floor(trialStep / 3);
    const pageIdx = trialStep % 3;
    const technique = techniqueOrder[trialIdx];
    const integrity = getIntegrity(technique);
    const imagePath = getImagePath(trialIdx);

    // ── Q1: Binary Fact-Check ──
    if (pageIdx === 0) {
      const answer = q1Answers[trialIdx];
      return (
        <Page>
          <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
          <ProgressBar trialIdx={trialIdx} pageLabel="Page 1 of 3" />
          <ChartDisplay imagePath={imagePath} onEnlarge={() => setModalImage(imagePath)} />

          <div style={{
            background: "#fff", borderRadius: 12, padding: "28px 32px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e8ecf1",
            marginTop: 20,
          }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 16 }}>
              Does the chart support the following statement? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{
              background: "#f0f4f8", borderRadius: 8, padding: "14px 18px",
              margin: "12px 0 16px", borderLeft: "4px solid #2a8fc1",
            }}>
              <p style={{ fontSize: 15, color: "#2d3748", fontStyle: "italic", margin: 0 }}>
                "{Q1_CLAIMS[technique]}"
              </p>
            </div>
            <RadioGroup name={`q1_${trialIdx}`} options={["Yes", "No"]}
              value={answer === "yes" ? "Yes" : answer === "no" ? "No" : ""}
              onChange={(val) => {
                const copy = [...q1Answers];
                copy[trialIdx] = val.toLowerCase();
                setQ1Answers(copy);
              }} />
            <Nav onNext={() => {
              stopTimer(trialIdx, "q1");
              startTimer(trialIdx, "q2");
              next();
            }} nextLabel="Next →" nextDisabled={!answer} />
          </div>
        </Page>
      );
    }

    // ── Q2: Magnitude Estimation ──
    if (pageIdx === 1) {
      const config = Q2_CONFIG[technique];
      const answer = q2Answers[trialIdx];
      return (
        <Page>
          <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
          <ProgressBar trialIdx={trialIdx} pageLabel="Page 2 of 3" />
          <ChartDisplay imagePath={imagePath} onEnlarge={() => setModalImage(imagePath)} />

          <div style={{
            background: "#fff", borderRadius: 12, padding: "28px 32px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e8ecf1",
            marginTop: 20,
          }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 16 }}>
              {config.question} <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ marginTop: 12 }}>
              <RadioGroup name={`q2_${trialIdx}`} options={config.options}
                value={answer || ""} onChange={(val) => {
                  const copy = [...q2Answers];
                  copy[trialIdx] = val;
                  setQ2Answers(copy);
                }} />
            </div>
            <Nav onNext={() => {
              stopTimer(trialIdx, "q2");
              startTimer(trialIdx, "q3");
              next();
            }} nextLabel="Next →" nextDisabled={!answer} />
          </div>
        </Page>
      );
    }

    // ── Q3: Evaluation & Reflection ──
    if (pageIdx === 2) {
      const trustVals = trustInventory[trialIdx];
      const allTrustFilled = trustVals.every((v) => v !== null);
      const reflectionFilled = q4Reflection[trialIdx].trim().length > 0;
      const canProceed = allTrustFilled && reflectionFilled;

      return (
        <Page>
          <ProgressBar trialIdx={trialIdx} pageLabel="Page 3 of 3" />

          <div style={{
            background: "#fff", borderRadius: 12, padding: "28px 32px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e8ecf1",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a202c", margin: "0 0 20px" }}>
              Evaluation and Reflection
            </h2>

            {/* Q3: Trust Inventory */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15, display: "block", marginBottom: 16 }}>
                Please rate how much you agree with each statement about the visualization you just saw. <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              {TRUST_STATEMENTS.map((stmt, si) => (
                <LikertRow key={si} statement={stmt} name={`trust_${trialIdx}_${si}`}
                  value={trustVals[si]}
                  onChange={(val) => {
                    const copy = trustInventory.map((arr) => [...arr]);
                    copy[trialIdx][si] = val;
                    setTrustInventory(copy);
                  }} />
              ))}
            </div>

            {/* Q4: Reflection (required) */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
                What made you trust or not trust this visualization? <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <textarea value={q4Reflection[trialIdx]}
                onChange={(e) => {
                  const copy = [...q4Reflection];
                  copy[trialIdx] = e.target.value;
                  setQ4Reflection(copy);
                }}
                rows={3} placeholder="Please explain what influenced your level of trust..."
                style={{ ...inputStyle, marginTop: 8, resize: "vertical", fontFamily: "inherit" }}
                onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
              {!reflectionFilled && (
                <p style={{ fontSize: 12, color: "#e53e3e", margin: "4px 0 0" }}>This field is required.</p>
              )}
            </div>

            {/* Q5d: Positive (optional) */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
                Is there anything positive you would like to remark about the visualization?{" "}
                <span style={{ color: "#718096", fontWeight: 400 }}>(optional)</span>
              </label>
              <p style={{ color: "#718096", fontSize: 13, marginTop: 4, fontStyle: "italic" }}>
                e.g., visual clarity, presentation, message clarity
              </p>
              <textarea value={q5Positive[trialIdx]}
                onChange={(e) => {
                  const copy = [...q5Positive];
                  copy[trialIdx] = e.target.value;
                  setQ5Positive(copy);
                }}
                rows={2} placeholder="Optional positive remarks..."
                style={{ ...inputStyle, marginTop: 8, resize: "vertical", fontFamily: "inherit" }}
                onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
            </div>

            {/* Q5e: Negative (optional) */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
                Is there anything negative you would like to remark about the visualization?{" "}
                <span style={{ color: "#718096", fontWeight: 400 }}>(optional)</span>
              </label>
              <p style={{ color: "#718096", fontSize: 13, marginTop: 4, fontStyle: "italic" }}>
                e.g., confusing/misleading aspects, unclear presentation
              </p>
              <textarea value={q5Negative[trialIdx]}
                onChange={(e) => {
                  const copy = [...q5Negative];
                  copy[trialIdx] = e.target.value;
                  setQ5Negative(copy);
                }}
                rows={2} placeholder="Optional negative remarks..."
                style={{ ...inputStyle, marginTop: 8, resize: "vertical", fontFamily: "inherit" }}
                onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
            </div>

            <Nav onNext={() => {
              stopTimer(trialIdx, "q3");
              if (trialIdx < 3) startTimer(trialIdx + 1, "q1");
              next();
            }} nextLabel={trialIdx < 3 ? "Next Chart →" : "Continue →"} nextDisabled={!canProceed} />
          </div>
        </Page>
      );
    }
  }

  // ── STEP 14: Demographics + NFC ──
  if (step === 14) {
    const nfcAllFilled = nfcAnswers.every((v) => v !== null);
    const canProceed = age && gender && education && nfcAllFilled;

    return (
      <Page>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a202c", margin: "0 0 6px" }}>About You</h2>
          <p style={{ color: "#718096", fontSize: 15, margin: "0 0 32px" }}>Almost done! Please answer the following questions.</p>

          {/* Age */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
              What is your age range? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <select value={age} onChange={(e) => setAge(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              <option value="">Select...</option>
              <option>18–24</option><option>25–34</option><option>35–44</option>
              <option>45–54</option><option>55–64</option><option>65+</option>
            </select>
          </div>

          {/* Gender */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
              Please select your gender. <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ marginTop: 8 }}>
              <RadioGroup name="gender" options={["Male", "Female", "Non-binary", "Prefer not to say"]}
                value={gender} onChange={setGender} />
            </div>
          </div>

          {/* Education */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
              Please select your highest level of completed education. <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ marginTop: 8 }}>
              <RadioGroup name="education"
                options={["High School Diploma / GED", "Associate Degree", "Bachelors Degree", "Masters Degree", "Doctorate Degree"]}
                value={education} onChange={setEducation} />
            </div>
          </div>

          {/* Need for Cognition 18 */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15, display: "block", marginBottom: 8 }}>
              Need for Cognition Scale <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <p style={{ color: "#718096", fontSize: 13, marginBottom: 16 }}>
              For each statement below, please indicate how characteristic it is of you.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {NFC_ITEMS.map((item, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: 14, color: "#2d3748", marginBottom: 6 }}>
                    {idx + 1}. {item}
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {NFC_SCALE.map((label, li) => (
                      <label key={li} style={{
                        flex: 1, textAlign: "center", padding: "6px 2px",
                        borderRadius: 4,
                        background: nfcAnswers[idx] === li ? "#e8f4fb" : "#f7f8fa",
                        border: nfcAnswers[idx] === li ? "1px solid #2a8fc1" : "1px solid #e2e8f0",
                        cursor: "pointer", fontSize: 11, lineHeight: 1.2,
                        color: nfcAnswers[idx] === li ? "#2a8fc1" : "#4a5568",
                        fontWeight: nfcAnswers[idx] === li ? 600 : 400,
                        transition: "all .15s",
                      }}>
                        <input type="radio" name={`nfc_${idx}`} value={li}
                          checked={nfcAnswers[idx] === li}
                          onChange={() => {
                            const copy = [...nfcAnswers];
                            copy[idx] = li;
                            setNfcAnswers(copy);
                          }}
                          style={{ display: "none" }} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Nav onNext={submitToGoogle}
            nextLabel={submitting ? "Submitting..." : "Submit"}
            nextDisabled={!canProceed || submitting} />
          {submitError && (
            <p style={{ color: "#e53e3e", fontSize: 14, marginTop: 8, textAlign: "right" }}>{submitError}</p>
          )}
        </div>
      </Page>
    );
  }

  // ── STEP 15: Thank You ──
  return (
    <Page>
      <div style={{ textAlign: "center", paddingTop: 60, maxWidth: 540, margin: "0 auto" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: "#e8f8ee",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38a169" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a202c", margin: "0 0 12px" }}>
          Thank you for your participation!
        </h1>
        <p style={{ color: "#718096", fontSize: 16, lineHeight: 1.6 }}>
          Your responses have been recorded successfully. Please click the button below to return to Prolific and complete your submission.
        </p>
        <a href="https://app.prolific.com/submissions/complete?cc=PLACEHOLDER" style={{ textDecoration: "none" }}>
          <button style={{
            marginTop: 28, padding: "14px 36px", borderRadius: 8, border: "none",
            background: "#2a8fc1", color: "#fff", fontSize: 17, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 2px 8px rgba(42,143,193,.3)",
          }}>Return to Prolific</button>
        </a>
        <p style={{ color: "#a0aec0", fontSize: 13, lineHeight: 1.6, marginTop: 20 }}>
          If the button does not work, please copy and paste this completion code into Prolific: <strong style={{ color: "#2d3748" }}>PLACEHOLDER</strong>
        </p>
        <div style={{
          marginTop: 24, padding: "14px 24px", background: "#f7f8fa",
          borderRadius: 8, display: "inline-block", color: "#4a5568", fontSize: 14,
        }}>
          Prolific ID: <strong>{prolificId}</strong>
        </div>
      </div>
    </Page>
  );
}
