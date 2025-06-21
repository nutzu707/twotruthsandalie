"use client";

import React, { useEffect, useState, useRef } from "react";

// --- Types ---
type SentenceSet = {
  statements: string[];
  lie_index: number;
};

type SentencesData = {
  [category: string]: {
    [setName: string]: SentenceSet;
  };
};

// --- Constants ---
const CATEGORY_TIME_LIMIT = 60;
const NEXT_SET_DELAY = 1500;
const WRONG_ANSWER_PENALTY_MS = 3000;
const MIN_CORRECT_TO_PASS = 7;
const SETS_PER_CATEGORY = 10;

// --- Utility ---
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Styled Components ---
const colors = {
  primary: "#2D6A4F",
  secondary: "#40916C",
  accent: "#F9C74F",
  background: "#F8F9FA",
  card: "#FFFFFF",
  correct: "#43AA8B",
  incorrect: "#F94144",
  disabled: "#CED4DA",
  border: "#DEE2E6",
  text: "#212529",
  timer: "#F3722C",
};

function Card({ children, style = {}, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="ttal-card-anim"
      style={{
        background: colors.card,
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(44,62,80,0.08)",
        padding: 32,
        margin: "0 auto",
        maxWidth: 520,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function Button({
  children,
  color = colors.primary,
  disabled,
  style = {},
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { color?: string }) {
  return (
    <button
      className="ttal-btn-anim"
      disabled={disabled}
      style={{
        background: disabled ? colors.disabled : color,
        color: disabled ? "#888" : "#fff",
        border: "none",
        borderRadius: 8,
        padding: "12px 28px",
        fontSize: 18,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 2px 8px rgba(44,62,80,0.07)",
        transition: "background 0.15s, color 0.15s, transform 0.15s",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function StatementButton({
  children,
  selected,
  correct,
  incorrect,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  correct?: boolean;
  incorrect?: boolean;
}) {
  let bg = colors.card;
  let border = colors.border;
  let color = colors.text;
  let animClass = "";
  if (selected && correct) {
    bg = colors.correct;
    color = "#fff";
    border = colors.correct;
    animClass = "ttal-bounce";
  } else if (selected && incorrect) {
    bg = colors.incorrect;
    color = "#fff";
    border = colors.incorrect;
    animClass = "ttal-shake";
  } else if (selected) {
    bg = colors.accent;
    border = colors.accent;
    animClass = "ttal-pulse";
  }
  return (
    <button
      className={`ttal-statement-anim ${animClass}`}
      disabled={disabled}
      style={{
        width: "100%",
        textAlign: "left",
        marginBottom: 14,
        padding: "18px 20px",
        background: bg,
        color,
        border: `2px solid ${border}`,
        borderRadius: 10,
        fontSize: 18,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: selected
          ? "0 2px 12px rgba(67,170,139,0.10)"
          : "0 1px 4px rgba(44,62,80,0.04)",
        transition: "background 0.15s, color 0.15s, border 0.15s, transform 0.18s",
        outline: selected ? `2px solid ${colors.accent}` : "none",
        opacity: disabled && !selected ? 0.7 : 1,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  children,
  style = {},
}: {
  open: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  if (!open) return null;
  return (
    <div
      className="ttal-modal-fade"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(44,62,80,0.18)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <div
        className="ttal-modal-content-anim"
        style={{
          background: colors.card,
          borderRadius: 18,
          padding: 40,
          minWidth: 340,
          maxWidth: "90vw",
          boxShadow: "0 4px 32px rgba(44,62,80,0.18)",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// --- Animation CSS ---
if (typeof window !== "undefined" && !document.getElementById("ttal-animations")) {
  const style = document.createElement("style");
  style.id = "ttal-animations";
  style.innerHTML = `
    @keyframes ttalFadeIn {
      from { opacity: 0; transform: translateY(30px);}
      to { opacity: 1; transform: translateY(0);}
    }
    @keyframes ttalBounce {
      0% { transform: scale(1);}
      30% { transform: scale(1.12);}
      50% { transform: scale(0.96);}
      70% { transform: scale(1.04);}
      100% { transform: scale(1);}
    }
    @keyframes ttalShake {
      0% { transform: translateX(0);}
      20% { transform: translateX(-8px);}
      40% { transform: translateX(8px);}
      60% { transform: translateX(-6px);}
      80% { transform: translateX(6px);}
      100% { transform: translateX(0);}
    }
    @keyframes ttalPulse {
      0% { box-shadow: 0 0 0 0 rgba(249,199,79,0.5);}
      70% { box-shadow: 0 0 0 10px rgba(249,199,79,0);}
      100% { box-shadow: 0 0 0 0 rgba(249,199,79,0);}
    }
    @keyframes ttalModalFadeIn {
      from { opacity: 0; transform: scale(0.92);}
      to { opacity: 1; transform: scale(1);}
    }
    .ttal-card-anim {
      animation: ttalFadeIn 0.5s cubic-bezier(.23,1.01,.32,1) both;
    }
    .ttal-btn-anim {
      transition: transform 0.13s;
    }
    .ttal-btn-anim:active:not(:disabled) {
      transform: scale(0.96);
    }
    .ttal-statement-anim {
      animation: ttalFadeIn 0.5s cubic-bezier(.23,1.01,.32,1) both;
    }
    .ttal-bounce {
      animation: ttalBounce 0.45s cubic-bezier(.23,1.01,.32,1);
    }
    .ttal-shake {
      animation: ttalShake 0.38s cubic-bezier(.36,.07,.19,.97);
    }
    .ttal-pulse {
      animation: ttalPulse 0.7s;
    }
    .ttal-modal-fade {
      animation: ttalFadeIn 0.35s cubic-bezier(.23,1.01,.32,1) both;
    }
    .ttal-modal-content-anim {
      animation: ttalModalFadeIn 0.38s cubic-bezier(.23,1.01,.32,1) both;
    }
    .ttal-timer-anim {
      transition: color 0.18s;
      will-change: color;
    }
    .ttal-timer-blink {
      animation: ttalTimerBlink 1s infinite;
    }
    @keyframes ttalTimerBlink {
      0%, 100% { color: ${colors.timer}; }
      50% { color: #fff; }
    }
    .ttal-result-anim {
      animation: ttalFadeIn 0.5s cubic-bezier(.23,1.01,.32,1) both;
    }
    /* Penalty animation */
    @keyframes ttalPenaltyAnim {
      0% {
        opacity: 0;
        transform: translateY(0) scale(1);
      }
      10% {
        opacity: 1;
        transform: translateY(-8px) scale(1.1);
      }
      60% {
        opacity: 1;
        transform: translateY(-18px) scale(1.1);
      }
      100% {
        opacity: 0;
        transform: translateY(-32px) scale(0.9);
      }
    }
    .ttal-penalty-anim {
      animation: ttalPenaltyAnim 1s cubic-bezier(.23,1.01,.32,1);
      pointer-events: none;
      user-select: none;
    }
  `;
  document.head.appendChild(style);
}

// --- Main Component ---
export default function TwoTruthsAndALie() {
  // --- State ---
  const [sentences, setSentences] = useState<SentencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [completedCategories, setCompletedCategories] = useState<string[]>([]);
  const [categorySetKeys, setCategorySetKeys] = useState<string[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<SentenceSet | null>(null);
  const [shuffledStatements, setShuffledStatements] = useState<string[]>([]);
  const [shuffledLieIndex, setShuffledLieIndex] = useState<number | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | "timeout" | null>(null);

  const [categoryCorrectCount, setCategoryCorrectCount] = useState<number>(0);
  const [categoryIncorrectCount, setCategoryIncorrectCount] = useState<number>(0);
  const [categoryFailed, setCategoryFailed] = useState<boolean>(false);
  const [categoryPassed, setCategoryPassed] = useState<boolean>(false);

  const [timerMs, setTimerMs] = useState<number>(CATEGORY_TIME_LIMIT * 1000);
  const [timerActive, setTimerActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [completedSets, setCompletedSets] = useState<{ [category: string]: Set<string> }>({});

  // Penalty animation state
  const [showPenalty, setShowPenalty] = useState(false);
  const penaltyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextSetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Effects ---
  // Load digital-7 font
  useEffect(() => {
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href = "/digital-7.ttf";
    font.type = "font/ttf";
    font.crossOrigin = "anonymous";
    document.head.appendChild(font);

    const style = document.createElement("style");
    style.innerHTML = `
      @font-face {
        font-family: 'Digital-7';
        src: url('/digital-7.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(font);
      document.head.removeChild(style);
    };
  }, []);

  // Fetch sentences.json
  useEffect(() => {
    fetch("/sentences.json")
      .then((res) => res.json())
      .then((data) => {
        setSentences(data);
        setLoading(false);
      });
  }, []);

  // Timer effect
  useEffect(() => {
    if (timerActive && timerMs > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerMs((t) => {
          if (t <= 10) return 0;
          return t - 10;
        });
      }, 10);
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    } else if (timerMs === 0 && timerActive) {
      setResult("timeout");
      setTimerActive(false);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive, timerMs]);

  // When a category is selected, prepare its set keys and start with the first set
  useEffect(() => {
    if (selectedCategory && sentences) {
      const setKeys = Object.keys(sentences[selectedCategory]);
      setCategorySetKeys(setKeys);
      setCurrentSetIndex(0);
      setCompletedSets((prev) => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory] || new Set(),
      }));
      setTimerMs(CATEGORY_TIME_LIMIT * 1000);
      setTimerActive(true);
      setCategoryCorrectCount(0);
      setCategoryIncorrectCount(0);
      setCategoryFailed(false);
      setCategoryPassed(false);
    }
  }, [selectedCategory, sentences]);

  // When currentSetIndex changes, load the corresponding set
  useEffect(() => {
    if (
      selectedCategory &&
      sentences &&
      categorySetKeys.length > 0 &&
      currentSetIndex < categorySetKeys.length
    ) {
      const setKey = categorySetKeys[currentSetIndex];
      const setObj = sentences[selectedCategory][setKey];

      const shuffled = shuffleArray(setObj.statements);
      const lieStatement = setObj.statements[setObj.lie_index];
      const newLieIndex = shuffled.findIndex((s) => s === lieStatement);
      setCurrentSet(setObj);
      setShuffledStatements(shuffled);
      setShuffledLieIndex(newLieIndex);

      setSelectedStatement(null);
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSetIndex, categorySetKeys, selectedCategory, sentences]);

  // Auto-advance to next set after answer (with delay)
  useEffect(() => {
    if (result === "timeout") return;

    if (
      (result === "correct" || result === "incorrect") &&
      selectedCategory &&
      categorySetKeys.length > 0 &&
      currentSetIndex < categorySetKeys.length
    ) {
      if (currentSetIndex + 1 >= categorySetKeys.length) {
        nextSetTimeoutRef.current = setTimeout(() => {
          setCompletedSets((prev) => {
            const prevSet = prev[selectedCategory] || new Set();
            const newSet = new Set(prevSet);
            newSet.add(categorySetKeys[currentSetIndex]);
            return { ...prev, [selectedCategory]: newSet };
          });

          if (categoryCorrectCount >= MIN_CORRECT_TO_PASS) {
            setCompletedCategories((prev) =>
              prev.includes(selectedCategory) ? prev : [...prev, selectedCategory]
            );
            setCategoryPassed(true);
            setCategoryFailed(false);
          } else {
            setCategoryFailed(true);
            setCategoryPassed(false);
          }

          setSelectedCategory(null);
          setCurrentSetIndex(0);
          setCategorySetKeys([]);
          setCurrentSet(null);
          setShuffledStatements([]);
          setShuffledLieIndex(null);
          setSelectedStatement(null);
          setResult(null);
          setTimerMs(CATEGORY_TIME_LIMIT * 1000);
          setTimerActive(false);
        }, NEXT_SET_DELAY);
      } else {
        nextSetTimeoutRef.current = setTimeout(() => {
          setCompletedSets((prev) => {
            const prevSet = prev[selectedCategory] || new Set();
            const newSet = new Set(prevSet);
            newSet.add(categorySetKeys[currentSetIndex]);
            return { ...prev, [selectedCategory]: newSet };
          });
          setCurrentSetIndex((idx) => idx + 1);
          setResult(null);
          setSelectedStatement(null);
          setTimerActive(true);
        }, NEXT_SET_DELAY);
      }
    }
    return () => {
      if (nextSetTimeoutRef.current) clearTimeout(nextSetTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // --- Handlers ---
  function handleStatementClick(idx: number) {
    if (result || !timerActive) return;
    setSelectedStatement(idx);
    if (idx === shuffledLieIndex) {
      setResult("correct");
      setCategoryCorrectCount((prev) => prev + 1);
    } else {
      setTimerMs((prev) => {
        const newTime = prev - WRONG_ANSWER_PENALTY_MS;
        if (newTime <= 0) {
          setResult("timeout");
          setTimerActive(false);
          return 0;
        }
        return newTime;
      });
      setResult("incorrect");
      setCategoryIncorrectCount((prev) => prev + 1);

      // Show penalty animation
      setShowPenalty(true);
      if (penaltyTimeoutRef.current) clearTimeout(penaltyTimeoutRef.current);
      penaltyTimeoutRef.current = setTimeout(() => setShowPenalty(false), 1000);
    }
  }

  function handleCategoryClick(category: string) {
    setSelectedCategory(category);
    setResult(null);
    setSelectedStatement(null);
    setTimerMs(CATEGORY_TIME_LIMIT * 1000);
    setTimerActive(true);
    setCategoryCorrectCount(0);
    setCategoryIncorrectCount(0);
    setCategoryFailed(false);
    setCategoryPassed(false);
  }

  function handleBackToCategories() {
    setSelectedCategory(null);
    setCurrentSetIndex(0);
    setCategorySetKeys([]);
    setCurrentSet(null);
    setShuffledStatements([]);
    setShuffledLieIndex(null);
    setSelectedStatement(null);
    setResult(null);
    setTimerMs(CATEGORY_TIME_LIMIT * 1000);
    setTimerActive(false);
    setCategoryCorrectCount(0);
    setCategoryIncorrectCount(0);
    setCategoryFailed(false);
    setCategoryPassed(false);
  }

  function handleTryAgain() {
    if (selectedCategory && sentences) {
      const setKeys = Object.keys(sentences[selectedCategory]);
      setCategorySetKeys(setKeys);
      setCurrentSetIndex(0);
      setCurrentSet(null);
      setShuffledStatements([]);
      setShuffledLieIndex(null);
      setSelectedStatement(null);
      setResult(null);
      setTimerMs(CATEGORY_TIME_LIMIT * 1000);
      setTimerActive(true);
      setCategoryCorrectCount(0);
      setCategoryIncorrectCount(0);
      setCategoryFailed(false);
      setCategoryPassed(false);
    }
  }

  function handleRetryCategory(category: string) {
    setSelectedCategory(category);
    setResult(null);
    setSelectedStatement(null);
    setTimerMs(CATEGORY_TIME_LIMIT * 1000);
    setTimerActive(true);
    setCategoryCorrectCount(0);
    setCategoryIncorrectCount(0);
    setCategoryFailed(false);
    setCategoryPassed(false);
  }

  // --- UI Helpers ---
  function formatTimer(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    // Animate timer color when < 10s left
    const timerClass =
      ms < 10000
        ? "ttal-timer-anim ttal-timer-blink"
        : "ttal-timer-anim";
    return (
      <span
        className={timerClass}
        style={{
          fontFamily: "'Digital-7', monospace",
          fontSize: 38,
          color: colors.timer,
        }}
      >
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}.
        <span style={{ fontSize: 24 }}>{String(centiseconds).padStart(2, "0")}</span>
      </span>
    );
  }

  // --- Modals ---
  function TimeoutModal() {
    return (
      <Modal open={result === "timeout"}>
        <div
          className="ttal-result-anim"
          style={{
            color: colors.incorrect,
            fontWeight: 700,
            fontSize: 26,
            marginBottom: 10,
          }}
        >
          ⏰ Time&apos;s up!
        </div>
        <div className="ttal-result-anim" style={{ marginBottom: 18, fontSize: 18 }}>
          You got <b>{categoryCorrectCount}</b> out of <b>{categorySetKeys.length || SETS_PER_CATEGORY}</b> correct.<br />
          <span style={{ color: "#888" }}>
            You need at least <b>{MIN_CORRECT_TO_PASS}</b> correct to pass.
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <Button onClick={handleTryAgain} color={colors.secondary}>
            Try Again
          </Button>
          <Button onClick={handleBackToCategories} color={colors.disabled} style={{ color: colors.text }}>
            Back to Categories
          </Button>
        </div>
      </Modal>
    );
  }

  function CategoryResultModal() {
    if (!categoryFailed && !categoryPassed) return null;
    const lastCategory =
      selectedCategory === null && categorySetKeys.length === 0
        ? Object.keys(sentences || {}).find(
            (cat) =>
              !completedCategories.includes(cat) &&
              (categoryFailed || categoryPassed)
          )
        : selectedCategory;

    return (
      <Modal open={categoryFailed || categoryPassed}>
        {categoryPassed ? (
          <>
            <div
              className="ttal-result-anim"
              style={{
                color: colors.correct,
                fontWeight: 700,
                fontSize: 26,
                marginBottom: 10,
              }}
            >
              🎉 Category Passed!
            </div>
            <div className="ttal-result-anim" style={{ marginBottom: 18, fontSize: 18 }}>
              You got <b>{categoryCorrectCount}</b> out of <b>{categorySetKeys.length || SETS_PER_CATEGORY}</b> correct.
            </div>
            <Button onClick={handleBackToCategories} color={colors.correct}>
              Back to Categories
            </Button>
          </>
        ) : (
          <>
            <div
              className="ttal-result-anim"
              style={{
                color: colors.incorrect,
                fontWeight: 700,
                fontSize: 26,
                marginBottom: 10,
              }}
            >
              ❌ Category Failed
            </div>
            <div className="ttal-result-anim" style={{ marginBottom: 18, fontSize: 18 }}>
              You got <b>{categoryCorrectCount}</b> out of <b>{categorySetKeys.length || SETS_PER_CATEGORY}</b> correct.<br />
              <span style={{ color: "#888" }}>
                You need at least <b>{MIN_CORRECT_TO_PASS}</b> correct to pass.
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <Button
                onClick={() => handleRetryCategory(lastCategory!)}
                color={colors.secondary}
              >
                Try Again
              </Button>
              <Button
                onClick={handleBackToCategories}
                color={colors.disabled}
                style={{ color: colors.text }}
              >
                Back to Categories
              </Button>
            </div>
          </>
        )}
      </Modal>
    );
  }

  // --- Main Render ---
  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: colors.primary,
        }}
      >
        <span className="ttal-result-anim">Loading...</span>
      </div>
    );
  }

  if (!sentences) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color: colors.incorrect,
        }}
      >
        <span className="ttal-result-anim">Error loading questions.</span>
      </div>
    );
  }

  const allCategories = Object.keys(sentences);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.background,
        padding: "0 0 64px 0",
      }}
    >
      <div style={{ maxWidth: 700,  margin: "0 auto", padding: "40px 16px 0 16px" }}>
        <h1
          className="ttal-result-anim"
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: colors.primary,
            letterSpacing: "-1px",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Two Truths and a Lie
        </h1>
        <div
          className="ttal-result-anim"
          style={{
            textAlign: "center",
            color: colors.secondary,
            fontSize: 20,
            marginBottom: 32,
            fontWeight: 500,
          }}
        >
          Spot the lie in each set. Can you pass every category?
        </div>
        <CategoryResultModal />
        <TimeoutModal />

        {/* Category Selector */}
        {!selectedCategory && !categoryFailed && !categoryPassed && (
          <Card style={{ marginBottom: 32 }}>
            <div className="ttal-result-anim" style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, color: colors.primary }}>
              Select a Category
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                justifyContent: "center",
              }}
            >
              {allCategories.map((cat, i) => (
                <Button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  disabled={completedCategories.includes(cat) || selectedCategory !== null}
                  color={
                    completedCategories.includes(cat)
                      ? colors.correct
                      : colors.secondary
                  }
                  style={{
                    opacity: completedCategories.includes(cat) ? 0.6 : 1,
                    minWidth: 140,
                    marginBottom: 8,
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: "0.5px",
                    animationDelay: `${i * 0.06 + 0.1}s`,
                    animationName: "ttalFadeIn",
                    animationDuration: "0.5s",
                    animationFillMode: "both",
                  }}
                >
                  {cat}
                  {completedCategories.includes(cat) ? " ✔️" : ""}
                </Button>
              ))}
            </div>
            {completedCategories.length === allCategories.length && (
              <div
                className="ttal-result-anim"
                style={{
                  marginTop: 24,
                  fontWeight: 700,
                  color: colors.correct,
                  fontSize: 20,
                  textAlign: "center",
                }}
              >
                🎊 Congratulations! You have completed all categories!
              </div>
            )}
          </Card>
        )}

        {/* Game Card */}
        {selectedCategory && currentSet && (
          <Card>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div
                className="ttal-result-anim"
                style={{
                  fontWeight: 700,
                  fontSize: 22,
                  color: colors.primary,
                  letterSpacing: "0.5px",
                }}
              >
                {selectedCategory}
              </div>
              <div
                className="ttal-result-anim"
                style={{
                  fontWeight: 500,
                  fontSize: 16,
                  color: colors.secondary,
                  background: "#e9f5ee",
                  borderRadius: 8,
                  padding: "4px 14px",
                }}
              >
                Set {currentSetIndex + 1} / {categorySetKeys.length}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div className="ttal-result-anim" style={{ fontWeight: 600, color: colors.text }}>
                <span style={{ color: colors.secondary }}>Score:</span>{" "}
                <span style={{ color: colors.primary }}>
                  {categoryCorrectCount} correct
                </span>
                <span style={{ color: colors.incorrect, marginLeft: 8 }}>
                  {categoryIncorrectCount} incorrect
                </span>
              </div>
              <div
                className="ttal-result-anim"
                style={{
                  color: "#888",
                  fontSize: 14,
                  fontWeight: 500,
                  marginLeft: 8,
                }}
              >
                (Need {MIN_CORRECT_TO_PASS} correct to pass)
              </div>
            </div>
            <div
              className="ttal-result-anim"
              style={{
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 10,
                position: "relative",
                minHeight: 48, // to avoid layout shift when animating
              }}
            >
              <span style={{ fontWeight: 600, color: colors.text }}>Time left:</span>
              <span style={{ position: "relative", display: "inline-block" }}>
                {formatTimer(timerMs)}
                {showPenalty && (
                  <span
                    className="ttal-penalty-anim"
                    style={{
                      position: "absolute",
                      left: "110px",
                      right: "0 ",
                      top: "50%",
                      marginLeft: 8,
                      transform: "translateY(-50%)",
                      color: colors.incorrect,
                      fontWeight: 700,
                      fontSize: 22,
                      pointerEvents: "none",
                      userSelect: "none",
                      textShadow: "0 2px 8px #fff, 0 1px 0 #fff",
                    }}
                  >
                    -3s
                  </span>
                )}
              </span>
            </div>
            {result !== "timeout" && (
              <>
                <div style={{ marginBottom: 10 }}>
                  {shuffledStatements.map((statement, idx) => (
                    <StatementButton
                      key={idx}
                      onClick={() => handleStatementClick(idx)}
                      disabled={!!result || !timerActive}
                      selected={selectedStatement === idx}
                      correct={selectedStatement === idx && idx === shuffledLieIndex && !!result}
                      incorrect={selectedStatement === idx && idx !== shuffledLieIndex && !!result}
                    >
                      {statement}
                    </StatementButton>
                  ))}
                </div>
                {result && (
                  <div className="ttal-result-anim" style={{ marginTop: 18, textAlign: "center" }}>
                    {result === "correct" ? (
                      <span
                        style={{
                          color: colors.correct,
                          fontWeight: 700,
                          fontSize: 20,
                          letterSpacing: "0.5px",
                        }}
                      >
                        ✅ Correct! You found the lie.
                      </span>
                    ) : (
                      <span
                        style={{
                          color: colors.incorrect,
                          fontWeight: 700,
                          fontSize: 20,
                          letterSpacing: "0.5px",
                        }}
                      >
                        ❌ Incorrect. The lie was:{" "}
                        <span style={{ textDecoration: "underline", color: colors.primary }}>
                          {shuffledStatements[shuffledLieIndex!]}
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
            <div style={{ marginTop: 28, textAlign: "center" }}>
              <Button
                onClick={handleBackToCategories}
                color={colors.disabled}
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: 600,
                  padding: "8px 20px",
                  borderRadius: 6,
                  marginTop: 4,
                }}
              >
                ← Back to Categories
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}