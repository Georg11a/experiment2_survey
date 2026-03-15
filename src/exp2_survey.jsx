import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════
// EXPERIMENT 2 — Visualization Deception Study (Updated)
// ═══════════════════════════════════════════════════════════

const TECHNIQUES = ["bar", "line", "pie", "bubble"];
const STYLE_LEVELS = [1, 3, 5, 7];
const NUM_TRIALS = 4;

// Q1 claims (updated with "Based on the chart")
const Q1_CLAIMS = {
  bar: "Based on the chart, the value in 2022 is nearly double the value in 2021.",
  line: "Based on the chart, Japan's GDP per capita stayed about the same from 2010 to 2024.",
  pie: "Based on the chart, Transport is the largest sector.",
  bubble: "Based on the chart, Bruno Mars has more than twice the monthly listeners of Ed Sheeran.",
};

// Q2 magnitude questions — 6-point Likert (1=A Little, 6=A Lot)
const Q2_LIKERT_LABELS = ["1 — A Little", "2", "3", "4", "5", "6 — A Lot"];
const Q2_CONFIG = {
  bar: {
    question: "How much did the value increase from 2021 to 2022?",
  },
  line: {
    question: "How much did Japan’s GDP per capita increase from 2010 to 2024?",
  },
  pie: {
    question: "How much larger or smaller is Transport’s share compared to Energy?",
  },
  bubble: {
    question: "How much larger is Bruno Mars’s monthly audience than Ed Sheeran’s?",
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
  "I like tasks that require little thought once I’ve learned them.",
  "The idea of relying on thought to make my way to the top appeals to me.",
  "I really enjoy a task that involves coming up with new solutions to problems.",
  "Learning new ways to think doesn’t excite me very much.",
  "I prefer my life to be filled with puzzles that I must solve.",
  "The notion of thinking abstractly is appealing to me.",
  "I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.",
  "I feel relief rather than satisfaction after completing a task that required a lot of mental effort.",
  "It’s enough for me that something gets the job done; I don’t care how or why it works.",
  "I usually end up deliberating about issues even when they do not affect me personally.",
];
const NFC_SCALE = [
  "Extremely Uncharacteristic",
  "Somewhat Uncharacteristic",
  "Uncertain",
  "Somewhat Characteristic",
  "Extremely Characteristic",
];

// Mini-VLAT 12 items (from Pandey & Ottley, Version 2, April 2025)
const VLAT_ITEMS = [
  {
    id: 1, image: "vlat-4.png", type: "treemap",
    question: "eBay is nested in the Software category.",
    options: ["True", "False"],
    correct: "False",
  },
  {
    id: 2, image: "vlat-5.png", type: "100% stacked bar",
    question: "Which country has the lowest proportion of Gold medals?",
    options: ["USA", "Great Britain", "Japan", "Australia"],
    correct: "Great Britain",
  },
  {
    id: 3, image: "vlat-6.png", type: "histogram",
    question: "What distance have customers traveled the most?",
    options: ["60–70 km", "30–40 km", "20–30 km", "50–60 km"],
    correct: "30–40 km",
  },
  {
    id: 4, image: "vlat-8.png", type: "choropleth",
    question: "In 2020, the unemployment rate for Washington (WA) was higher than that of Wisconsin (WI).",
    options: ["True", "False"],
    correct: "True",
  },
  {
    id: 5, image: "vlat-11.png", type: "pie",
    question: "What is the approximate global smartphone market share of Samsung?",
    options: ["17.6%", "25.3%", "10.9%", "35.2%"],
    correct: "17.6%",
  },
  {
    id: 6, image: "vlat-3.png", type: "bubble",
    question: "Which has the largest number of metro stations?",
    options: ["Beijing", "Shanghai", "London", "Seoul"],
    correct: "Shanghai",
  },
  {
    id: 7, image: "vlat-2.png", type: "stacked bar",
    question: "What is the cost of peanuts in Seoul?",
    options: ["$5.2", "$6.1", "$7.5", "$4.5"],
    correct: "$6.1",
  },
  {
    id: 8, image: "vlat-12.png", type: "line",
    question: "What was the price of a barrel of oil in February 2020?",
    options: ["$50.54", "$47.02", "$42.34", "$43.48"],
    correct: "$50.54",
  },
  {
    id: 9, image: "vlat-9.png", type: "bar",
    question: "What is the average internet speed in Japan?",
    options: ["42.30 Mbps", "40.51 Mbps", "35.25 Mbps", "16.16 Mbps"],
    correct: "40.51 Mbps",
  },
  {
    id: 10, image: "vlat-10.png", type: "area",
    question: "What was the average price of a pound of coffee in October 2019?",
    options: ["$0.71", "$0.90", "$0.80", "$0.63"],
    correct: "$0.71",
  },
  {
    id: 11, image: "vlat-7.png", type: "stacked area",
    question: 'What was the ratio of girls named "Isla" to girls named "Amelia" in 2012 in the UK?',
    options: ["1 to 1", "1 to 2", "1 to 3", "1 to 4"],
    correct: "1 to 2",
  },
  {
    id: 12, image: "vlat-1.png", type: "scatterplot",
    question: "There is a negative relationship between the height and weight of the 85 males.",
    options: ["True", "False"],
    correct: "False",
  },
];

// 6 integrity patterns
const INTEGRITY_PATTERNS = [
  ["bar", "line"],
  ["bar", "pie"],
  ["bar", "bubble"],
  ["line", "pie"],
  ["line", "bubble"],
  ["pie", "bubble"],
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Reusable Components ──

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
      <div style={{ fontSize: 14, color: "#2d3748", fontWeight: 600, marginBottom: 8 }}>{statement}</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {LIKERT_LABELS.map((label, li) => (
          <label key={li} style={{
            flex: "1 1 0", minWidth: 80, textAlign: "center",
            padding: "8px 4px", borderRadius: 6,
            background: value === li ? "#e8f4fb" : "#f7f8fa",
            border: value === li ? "1px solid #2a8fc1" : "1px solid #e2e8f0",
            cursor: "pointer", fontSize: 12, lineHeight: 1.3,
            color: value === li ? "#2a8fc1" : "#4a5568",
            fontWeight: value === li ? 600 : 400, transition: "all .15s",
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
      }}>Round {trialIdx + 1} — {pageLabel}</span>
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
      <img src={imagePath} alt="Data visualization" onClick={onEnlarge}
        style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 6, cursor: "pointer" }} />
      <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 8 }}>Click the image to enlarge</div>
    </div>
  );
}

// ── Mini-VLAT Timer Component ──
function VlatQuestion({ item, index, total, onAnswer, onTimeout }) {
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(25);
  const [answered, setAnswered] = useState(false);
  const [modalSrc, setModalSrc] = useState(null);
  const timerRef = useRef(null);
  const imgBase = `${import.meta.env.BASE_URL}images/`;

  useEffect(() => {
    setSelected(null);
    setTimeLeft(25);
    setAnswered(false);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [item.id]);

  useEffect(() => {
    if (timeLeft === 0 && !answered) {
      setAnswered(true);
      onTimeout();
    }
  }, [timeLeft, answered]);

  const handleSelect = (val) => {
    if (answered) return;
    setSelected(val);
  };

  const handleSubmit = () => {
    if (!selected || answered) return;
    setAnswered(true);
    clearInterval(timerRef.current);
    onAnswer(selected);
  };

  const handleSkip = () => {
    if (answered) return;
    setAnswered(true);
    clearInterval(timerRef.current);
    onAnswer("skipped");
  };

  const pct = (timeLeft / 25) * 100;
  const timerColor = timeLeft <= 5 ? "#e53e3e" : timeLeft <= 10 ? "#dd6b20" : "#2a8fc1";

  return (
    <div>
      {/* Image modal */}
      <ImageModal src={modalSrc} onClose={() => setModalSrc(null)} />

      {/* Timer bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "#718096", fontWeight: 600 }}>
          Question {index + 1} of {total}
        </span>
        <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%", background: timerColor,
            borderRadius: 3, transition: "width 1s linear, background .3s",
          }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: timerColor, minWidth: 30, textAlign: "right" }}>
          {timeLeft}s
        </span>
      </div>

      {/* Chart image */}
      <div style={{
        textAlign: "center", background: "#fafbfc", borderRadius: 10,
        padding: 16, border: "1px solid #e2e8f0", marginBottom: 16,
      }}>
        <img src={`${imgBase}${item.image}`} alt={`VLAT ${item.type}`}
          onClick={() => setModalSrc(`${imgBase}${item.image}`)}
          style={{ maxWidth: "100%", maxHeight: 360, borderRadius: 6, cursor: "pointer" }} />
        <div style={{ fontSize: 12, color: "#a0aec0", marginTop: 6 }}>Click the image to enlarge</div>
      </div>

      {/* Question */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#2d3748", marginBottom: 10 }}>{item.question}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {item.options.map((opt) => (
            <label key={opt} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 8,
              background: selected === opt ? "#e8f4fb" : "#f7f8fa",
              border: selected === opt ? "1px solid #2a8fc1" : "1px solid transparent",
              cursor: answered ? "default" : "pointer",
              opacity: answered && selected !== opt ? 0.5 : 1,
              transition: "all .15s",
            }}>
              <input type="radio" name={`vlat_${item.id}`} value={opt}
                checked={selected === opt} onChange={() => handleSelect(opt)}
                disabled={answered}
                style={{ accentColor: "#2a8fc1", width: 16, height: 16 }} />
              <span style={{ color: "#374151", fontSize: 14 }}>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      {!answered && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <button onClick={handleSkip} style={{
            padding: "8px 20px", borderRadius: 6, border: "1px solid #cbd5e0",
            background: "#fff", color: "#718096", fontSize: 14, cursor: "pointer",
          }}>Skip</button>
          <button onClick={handleSubmit} disabled={!selected} style={{
            padding: "8px 24px", borderRadius: 6, border: "none",
            background: !selected ? "#a0aec0" : "#2a8fc1", color: "#fff",
            fontSize: 14, fontWeight: 600, cursor: !selected ? "not-allowed" : "pointer",
          }}>Confirm</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function Exp2Survey() {
  const [step, setStep] = useState(0);
  const [modalImage, setModalImage] = useState(null);

  const [prolificId, setProlificId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("PROLIFIC_PID") || "";
  });

  // Experimental conditions
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
    return INTEGRITY_PATTERNS[integrityPatternIdx].includes(technique) ? "misleading" : "honest";
  }, [integrityPatternIdx]);

  const getImagePath = useCallback((trialIdx) => {
    const technique = techniqueOrder[trialIdx];
    const integrity = getIntegrity(technique);
    return `${import.meta.env.BASE_URL}images/${integrity}-${technique}-${styleLevel}.png`;
  }, [techniqueOrder, getIntegrity, styleLevel]);

  // For Page 3: get both honest and deceptive image paths
  const getBothImagePaths = useCallback((trialIdx) => {
    const technique = techniqueOrder[trialIdx];
    const base = `${import.meta.env.BASE_URL}images/`;
    return {
      honest: `${base}honest-${technique}-${styleLevel}.png`,
      deceptive: `${base}misleading-${technique}-${styleLevel}.png`,
    };
  }, [techniqueOrder, styleLevel]);

  // Random left/right order for Page 3 pair display (fixed per trial)
  const pairOrder = useMemo(() =>
    [0, 1, 2, 3].map(() => Math.random() < 0.5), []
  ); // true = honest on left, false = deceptive on left

  // Trial responses
  const [q1Answers, setQ1Answers] = useState([null, null, null, null]);
  const [q2Answers, setQ2Answers] = useState([null, null, null, null]);
  const [trustInventory, setTrustInventory] = useState(() =>
    Array.from({ length: 4 }, () => [null, null, null, null])
  );
  const [q4Reflection, setQ4Reflection] = useState(["", "", "", ""]);
  const [q5Positive, setQ5Positive] = useState(["", "", "", ""]);
  const [q5Negative, setQ5Negative] = useState(["", "", "", ""]);

  // Timing
  const [pageStartTime, setPageStartTime] = useState(null);
  const [pageTimes, setPageTimes] = useState({});

  const startTimer = () => setPageStartTime(Date.now());
  const stopTimer = (trialIdx, pageName) => {
    if (pageStartTime) {
      const key = `trial_${trialIdx}_${pageName}`;
      setPageTimes((prev) => ({ ...prev, [key]: Math.round((Date.now() - pageStartTime) / 1000) }));
    }
  };

  // Demographics
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [education, setEducation] = useState("");
  const [colorVision, setColorVision] = useState("");
  const [nativeLang, setNativeLang] = useState("");
  const [otherLang, setOtherLang] = useState("");
  const [comments, setComments] = useState("");

  // NFC
  const [nfcAnswers, setNfcAnswers] = useState(new Array(18).fill(null));

  // Mini-VLAT
  const vlatOrder = useMemo(() => [...Array(12).keys()], []);
  const [vlatCurrentIdx, setVlatCurrentIdx] = useState(0);
  const [vlatAnswers, setVlatAnswers] = useState(new Array(12).fill(null));
  const [vlatDone, setVlatDone] = useState(false);
  const [vlatStarted, setVlatStarted] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4Af91FJ-sqs6iQS1lF6cqT_uef0XaPkdOqRJnT6msHHiadeABDiyyn84TlghCstkU/exec";

  const inputStyle = {
    display: "block", width: "100%", marginTop: 8,
    padding: "10px 14px", borderRadius: 6,
    border: "1px solid #cbd5e0", fontSize: 15,
    outline: "none", boxSizing: "border-box",
  };

  const next = () => { setStep((s) => s + 1); window.scrollTo(0, 0); };

  // Data collection
  const collectData = useCallback(() => {
    const trials = techniqueOrder.map((technique, i) => ({
      trial: i + 1, technique, integrity: getIntegrity(technique), styleLevel,
      imagePath: getImagePath(i),
      page3_honestLeft: pairOrder[i],
      q1_factCheck: q1Answers[i], q2_magnitude: q2Answers[i],
      trust_easy: trustInventory[i][0] !== null ? LIKERT_LABELS[trustInventory[i][0]] : "",
      trust_difficult: trustInventory[i][1] !== null ? LIKERT_LABELS[trustInventory[i][1]] : "",
      trust_skeptical: trustInventory[i][2] !== null ? LIKERT_LABELS[trustInventory[i][2]] : "",
      trust_data: trustInventory[i][3] !== null ? LIKERT_LABELS[trustInventory[i][3]] : "",
      q4_reflection: q4Reflection[i], q5_positive: q5Positive[i], q5_negative: q5Negative[i],
      time_q1: pageTimes[`trial_${i}_q1`] || 0,
      time_q2: pageTimes[`trial_${i}_q2`] || 0,
      time_q3: pageTimes[`trial_${i}_q3`] || 0,
    }));

    // VLAT scoring
    const vlatScored = vlatOrder.map((itemIdx, i) => {
      const item = VLAT_ITEMS[itemIdx];
      const answer = vlatAnswers[i];
      return {
        vlat_id: item.id, vlat_type: item.type,
        vlat_answer: answer || "timeout",
        vlat_correct: item.correct,
        vlat_score: answer === item.correct ? 1 : 0,
      };
    });
    const vlatTotal = vlatScored.reduce((sum, v) => sum + v.vlat_score, 0);

    return {
      prolificId, styleLevel,
      integrityPattern: integrityPatternIdx,
      integrityPatternLabel: INTEGRITY_PATTERNS[integrityPatternIdx].join("+") + " deceptive",
      techniqueOrder: techniqueOrder.join("-"),
      trials, age, gender, education,
      colorVision,
      nativeLang: nativeLang === "Other" ? otherLang : nativeLang,
      comments,
      nfcAnswers: nfcAnswers.map((v) => (v !== null ? NFC_SCALE[v] : "")),
      vlatResults: vlatScored, vlatTotal,
      submittedAt: new Date().toISOString(),
    };
  }, [prolificId, styleLevel, integrityPatternIdx, techniqueOrder, getIntegrity, getImagePath,
      q1Answers, q2Answers, trustInventory, q4Reflection, q5Positive, q5Negative,
      pageTimes, age, gender, education, nfcAnswers, vlatOrder, vlatAnswers]);

  const submitToGoogle = async () => {
    setSubmitting(true); setSubmitError(null);
    const data = collectData();
    console.log("Experiment 2 data:", JSON.stringify(data, null, 2));
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSubmitting(false); next();
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    console.log("Exp2 conditions:", {
      styleLevel, integrityPattern: integrityPatternIdx,
      integrityPatternLabel: INTEGRITY_PATTERNS[integrityPatternIdx].join("+") + " deceptive",
      techniqueOrder,
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  // STEP ROUTING
  // 0: Consent, 1: Instructions
  // 2-13: 4 trials x 3 pages
  // 14: NFC-18
  // 15: Mini-VLAT
  // 16: Demographics (About You)
  // 17: Thank you
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
            <p style={{ marginTop: 12 }}>By clicking <strong>“I Consent”</strong> below, you confirm that you have read and understood this information and agree to participate.</p>
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
            <p>In this study, you will be shown <strong>4 data visualizations</strong>, one at a time.</p>
            <p style={{ marginTop: 16 }}>Each visualization will be presented across <strong>3 pages</strong> (one round). The same chart image will appear on each page within a round, so you can refer back to it.</p>
          </div>
          <div style={{
            background: "#f8f9fb", borderRadius: 10, padding: "16px 20px",
            marginBottom: 24, borderLeft: "4px solid #2a8fc1",
          }}>
            <p style={{ color: "#2d3748", fontSize: 15, lineHeight: 1.7, margin: 0, fontWeight: 600 }}>
              For each chart (4 rounds total):
            </p>
            <p style={{ color: "#4a5568", fontSize: 15, lineHeight: 1.7, margin: "8px 0 0" }}>
              <strong>Page 1:</strong> Answer a factual yes/no question about the chart<br />
              <strong>Page 2:</strong> Estimate a magnitude or comparison shown in the chart<br />
              <strong>Page 3:</strong> Evaluate the visualization and share your thoughts
            </p>
          </div>
          <div style={{
            background: "#fffff0", borderRadius: 10, padding: "14px 20px",
            marginBottom: 24, borderLeft: "4px solid #d69e2e",
          }}>
            <p style={{ color: "#744210", fontSize: 14, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
              ⚠️ Important: There is <strong>no back button</strong>. Once you move to the next page, you cannot return. Please read each question carefully before answering.
            </p>
          </div>
          <div style={{ color: "#6b7a8d", fontSize: 15, lineHeight: 1.75 }}>
            <p>After completing all 4 rounds, you will answer a short visualization literacy quiz, then some questions about yourself. The entire study should take approximately <strong>15 minutes</strong>.</p>
          </div>
          <Nav showBack={false} onNext={() => { startTimer(); next(); }} nextLabel="Begin →" />
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
    const imagePath = getImagePath(trialIdx);

    // Q1
    if (pageIdx === 0) {
      const answer = q1Answers[trialIdx];
      return (
        <Page>
          <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
          <ProgressBar trialIdx={trialIdx} pageLabel="Page 1 of 3" />
          <ChartDisplay imagePath={imagePath} onEnlarge={() => setModalImage(imagePath)} />
          <div style={{
            background: "#fff", borderRadius: 12, padding: "28px 32px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e8ecf1", marginTop: 20,
          }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 16 }}>
              Does the chart support the following statement? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{
              background: "#f0f4f8", borderRadius: 8, padding: "14px 18px",
              margin: "12px 0 16px", borderLeft: "4px solid #2a8fc1",
            }}>
              <p style={{ fontSize: 15, color: "#2d3748", fontStyle: "italic", margin: 0 }}>
                “{Q1_CLAIMS[technique]}”
              </p>
            </div>
            <RadioGroup name={`q1_${trialIdx}`} options={["Yes", "No"]}
              value={answer === "yes" ? "Yes" : answer === "no" ? "No" : ""}
              onChange={(val) => {
                const copy = [...q1Answers]; copy[trialIdx] = val.toLowerCase(); setQ1Answers(copy);
              }} />
            <Nav onNext={() => { stopTimer(trialIdx, "q1"); startTimer(); next(); }}
              nextLabel="Next →" nextDisabled={!answer} />
          </div>
        </Page>
      );
    }

    // Q2 — 6-point Likert (paper style: A Little ← 1 2 3 4 5 6 → A Lot)
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
            boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e8ecf1", marginTop: 20,
          }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 16 }}>
              {config.question} <span style={{ color: "#e53e3e" }}>*</span>
            </label>

            {/* Anchor labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, marginBottom: 4, padding: "0 8px" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#4a5568" }}>A Little</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#4a5568" }}>A Lot</span>
            </div>

            {/* Number labels */}
            <div style={{ display: "flex", justifyContent: "space-around", padding: "0 8px", marginBottom: 6 }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <span key={n} style={{ fontSize: 14, fontWeight: 600, color: "#2d3748", width: 48, textAlign: "center" }}>{n}</span>
              ))}
            </div>

            {/* Radio circles */}
            <div style={{ display: "flex", justifyContent: "space-around", padding: "0 8px" }}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <label key={n} style={{ display: "flex", justifyContent: "center", width: 48, cursor: "pointer" }}>
                  <input type="radio" name={`q2_${trialIdx}`} value={String(n)}
                    checked={answer === String(n)}
                    onChange={() => {
                      const copy = [...q2Answers]; copy[trialIdx] = String(n); setQ2Answers(copy);
                    }}
                    style={{
                      width: 24, height: 24, accentColor: "#c53030",
                      cursor: "pointer",
                    }} />
                </label>
              ))}
            </div>

            <Nav onNext={() => { stopTimer(trialIdx, "q2"); startTimer(); next(); }}
              nextLabel="Next →" nextDisabled={!answer} />
          </div>
        </Page>
      );
    }

    // Q3 — shows same single image as Page 1 and Page 2
    if (pageIdx === 2) {
      const trustVals = trustInventory[trialIdx];
      const allTrustFilled = trustVals.every((v) => v !== null);
      const reflectionFilled = q4Reflection[trialIdx].trim().length > 0;
      const canProceed = allTrustFilled && reflectionFilled;

      return (
        <Page>
          <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
          <ProgressBar trialIdx={trialIdx} pageLabel="Page 3 of 3" />

          {/* Same chart as Page 1 and Page 2 */}
          <ChartDisplay imagePath={imagePath} onEnlarge={() => setModalImage(imagePath)} />

          <div style={{
            background: "#fff", borderRadius: 12, padding: "28px 32px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e8ecf1",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a202c", margin: "0 0 20px" }}>
              Evaluation and Reflection
            </h2>

            {/* Q3: Trust */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15, display: "block", marginBottom: 16 }}>
                Please rate how much you agree with each statement about the visualization you just saw. <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              {TRUST_STATEMENTS.map((stmt, si) => (
                <LikertRow key={si} statement={stmt} name={`trust_${trialIdx}_${si}`}
                  value={trustVals[si]}
                  onChange={(val) => {
                    const copy = trustInventory.map((arr) => [...arr]);
                    copy[trialIdx][si] = val; setTrustInventory(copy);
                  }} />
              ))}
            </div>

            {/* Q4 */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
                What made you trust or not trust this visualization? <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <textarea value={q4Reflection[trialIdx]}
                onChange={(e) => { const c = [...q4Reflection]; c[trialIdx] = e.target.value; setQ4Reflection(c); }}
                rows={3} placeholder="Please explain what influenced your level of trust..."
                style={{ ...inputStyle, marginTop: 8, resize: "vertical", fontFamily: "inherit" }}
                onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
              {!reflectionFilled && <p style={{ fontSize: 12, color: "#e53e3e", margin: "4px 0 0" }}>This field is required.</p>}
            </div>

            {/* Q5d */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
                Is there anything positive you would like to remark about the visualization?{" "}
                <span style={{ color: "#718096", fontWeight: 400 }}>(optional)</span>
              </label>
              <p style={{ color: "#718096", fontSize: 13, marginTop: 4, fontStyle: "italic" }}>
                e.g., visual clarity, presentation, message clarity
              </p>
              <textarea value={q5Positive[trialIdx]}
                onChange={(e) => { const c = [...q5Positive]; c[trialIdx] = e.target.value; setQ5Positive(c); }}
                rows={2} placeholder="Optional positive remarks..."
                style={{ ...inputStyle, marginTop: 8, resize: "vertical", fontFamily: "inherit" }}
                onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
            </div>

            {/* Q5e */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
                Is there anything negative you would like to remark about the visualization?{" "}
                <span style={{ color: "#718096", fontWeight: 400 }}>(optional)</span>
              </label>
              <p style={{ color: "#718096", fontSize: 13, marginTop: 4, fontStyle: "italic" }}>
                e.g., confusing/misleading aspects, unclear presentation
              </p>
              <textarea value={q5Negative[trialIdx]}
                onChange={(e) => { const c = [...q5Negative]; c[trialIdx] = e.target.value; setQ5Negative(c); }}
                rows={2} placeholder="Optional negative remarks..."
                style={{ ...inputStyle, marginTop: 8, resize: "vertical", fontFamily: "inherit" }}
                onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
            </div>

            <Nav onNext={() => { stopTimer(trialIdx, "q3"); if (trialIdx < 3) startTimer(); next(); }}
              nextLabel={trialIdx < 3 ? "Next Chart →" : "Continue →"} nextDisabled={!canProceed} />
          </div>
        </Page>
      );
    }
  }

  // ── STEP 14: NFC-18 (own page) ──
  if (step === 14) {
    const nfcAllFilled = nfcAnswers.every((v) => v !== null);

    return (
      <Page>
        <div style={{ maxWidth: 1050, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a202c", margin: "0 0 6px" }}>Need for Cognition Scale</h2>
          <p style={{ color: "#718096", fontSize: 15, margin: "0 0 32px" }}>
            For each statement below, please indicate how characteristic it is of you. <span style={{ color: "#e53e3e" }}>*</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {NFC_ITEMS.map((item, idx) => (
              <div key={idx}>
                <div style={{ fontSize: 15, color: "#2d3748", marginBottom: 8, fontWeight: 600 }}>{idx + 1}. {item}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {NFC_SCALE.map((label, li) => (
                    <label key={li} style={{
                      flex: 1, textAlign: "center", padding: "12px 6px", borderRadius: 6,
                      background: nfcAnswers[idx] === li ? "#e8f4fb" : "#f7f8fa",
                      border: nfcAnswers[idx] === li ? "1px solid #2a8fc1" : "1px solid #e2e8f0",
                      cursor: "pointer", fontSize: 13, lineHeight: 1.3,
                      color: nfcAnswers[idx] === li ? "#2a8fc1" : "#4a5568",
                      fontWeight: nfcAnswers[idx] === li ? 600 : 400, transition: "all .15s",
                    }}>
                      <input type="radio" name={`nfc_${idx}`} value={li}
                        checked={nfcAnswers[idx] === li}
                        onChange={() => { const c = [...nfcAnswers]; c[idx] = li; setNfcAnswers(c); }}
                        style={{ display: "none" }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Nav onNext={next} nextLabel="Continue →" nextDisabled={!nfcAllFilled} />
        </div>
      </Page>
    );
  }

  // ── STEP 15: Mini-VLAT ──
  if (step === 15) {
    // Show intro screen before starting VLAT
    if (!vlatStarted) {
      return (
        <Page>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a202c", margin: "0 0 12px" }}>
              Visualization Literacy Quiz
            </h2>
            <div style={{ color: "#4a5568", fontSize: 16, lineHeight: 1.75, marginBottom: 24 }}>
              <p>You will now complete a short quiz that measures your ability to read and interpret charts.</p>
            </div>
            <div style={{
              background: "#f8f9fb", borderRadius: 10, padding: "16px 20px",
              marginBottom: 24, borderLeft: "4px solid #2a8fc1",
            }}>
              <p style={{ color: "#2d3748", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
                <strong>Instructions:</strong><br />
                • There are <strong>12 questions</strong>, each with a 25-second time limit.<br />
                • You will get +1 point for every correct answer.<br />
                • There is <strong>no penalty</strong> for incorrect or skipped answers.<br />
                • If you are unsure of the answer, you may skip it.
              </p>
            </div>
            <Nav showBack={false} onNext={() => setVlatStarted(true)} nextLabel="Start Quiz →" />
          </div>
        </Page>
      );
    }

    if (vlatDone) {
      next();
      return null;
    }

    const currentItemIdx = vlatOrder[vlatCurrentIdx];
    const currentItem = VLAT_ITEMS[currentItemIdx];

    const handleVlatAnswer = (answer) => {
      const copy = [...vlatAnswers];
      copy[vlatCurrentIdx] = answer;
      setVlatAnswers(copy);
      setTimeout(() => {
        if (vlatCurrentIdx < 11) {
          setVlatCurrentIdx((prev) => prev + 1);
        } else {
          setVlatDone(true);
        }
      }, 400);
    };

    const handleVlatTimeout = () => {
      const copy = [...vlatAnswers];
      copy[vlatCurrentIdx] = "timeout";
      setVlatAnswers(copy);
      setTimeout(() => {
        if (vlatCurrentIdx < 11) {
          setVlatCurrentIdx((prev) => prev + 1);
        } else {
          setVlatDone(true);
        }
      }, 800);
    };

    return (
      <Page>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a202c", margin: "0 0 6px" }}>
              Visualization Literacy Quiz
            </h2>
            <p style={{ color: "#718096", fontSize: 14, margin: 0 }}>
              You have <strong>25 seconds</strong> per question. If unsure, skip it. There is no penalty for incorrect or skipped answers.
            </p>
          </div>

          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px 28px",
            boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #e8ecf1",
          }}>
            <VlatQuestion
              key={currentItem.id}
              item={currentItem}
              index={vlatCurrentIdx}
              total={12}
              onAnswer={handleVlatAnswer}
              onTimeout={handleVlatTimeout}
            />
          </div>
        </div>
      </Page>
    );
  }

  // ── STEP 16: Demographics (About You) ──
  if (step === 16) {
    const canProceed = age && gender && education && colorVision && nativeLang && (nativeLang !== "Other" || otherLang.trim());

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

          {/* Color Vision */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
              Do you have any difficulty distinguishing colors (e.g., red vs. green)? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <div style={{ marginTop: 8 }}>
              <RadioGroup name="colorVision" options={[
                "No, I do not have color vision problems",
                "Yes, I am color-blind (difficulty distinguishing some colors)",
                "Yes, I have other color vision deficiencies (e.g., color-weak)",
                "Prefer not to say",
              ]} value={colorVision} onChange={setColorVision} />
            </div>
          </div>

          {/* Native Language */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
              What is your native language? <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <select value={nativeLang} onChange={(e) => setNativeLang(e.target.value)} style={{ ...inputStyle, background: "#fff" }}>
              <option value="">Select...</option>
              <option value="English">English</option>
              <option value="Other">Other</option>
            </select>
            {nativeLang === "Other" && (
              <input type="text" placeholder="Please specify your native language"
                value={otherLang} onChange={(e) => setOtherLang(e.target.value)}
                style={{ ...inputStyle, marginTop: 10 }}
                onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
            )}
          </div>

          {/* Comments */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 600, color: "#2d3748", fontSize: 15 }}>
              Please include any additional comments below. (optional)
            </label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={4}
              style={{ ...inputStyle, marginTop: 10, resize: "vertical", fontFamily: "inherit" }}
              onFocus={(e) => (e.target.style.borderColor = "#2a8fc1")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e0")} />
          </div>

          <Nav onNext={submitToGoogle}
            nextLabel={submitting ? "Submitting..." : "Submit"}
            nextDisabled={!canProceed || submitting} />
          {submitError && <p style={{ color: "#e53e3e", fontSize: 14, marginTop: 8, textAlign: "right" }}>{submitError}</p>}
        </div>
      </Page>
    );
  }

  // ── STEP 17: Thank You ──
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
