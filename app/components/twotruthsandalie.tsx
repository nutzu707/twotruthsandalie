"use client";

import React, { useEffect, useState, useRef } from "react";

type SentenceSet = {
  statements: string[];
  lie_index: number;
};

type SentencesData = {
  [category: string]: {
    [setName: string]: SentenceSet;
  };
};

const CATEGORY_TIME_LIMIT = 60;
const NEXT_SET_DELAY = 1500;
const WRONG_ANSWER_PENALTY_MS = 3000;
const MIN_CORRECT_TO_PASS = 7;
const SETS_PER_CATEGORY = 10;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const colors = {
  primary: "#2D6A4F",
  secondary: "#40916C",
  accent: "#F9C74F",
  background: "linear-gradient(135deg, #e0ffe7 0%, #f9fbe7 50%, #fffbe7 100%)",
  card: "#FFFFFF",
  correct: "#43AA8B",
  incorrect: "#F94144",
  disabled: "#CED4DA",
  border: "#DEE2E6",
  text: "#212529",
  timer: "#F3722C",
  shadow: "0 8px 32px 0 rgba(44,62,80,0.13)",
  glass: "rgba(255,255,255,0.75)",
};

function Card({ children, style = {}, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="ttal-card-anim"
      style={{
        background: colors.glass,
        borderRadius: 24,
        boxShadow: colors.shadow,
        padding: 60,
        margin: "0 auto",
        minHeight: 600,
        fontSize: "115%",
        backdropFilter: "blur(8px)",
        border: `1.5px solid ${colors.border}`,
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
        borderRadius: 12,
        padding: "16px 36px",
        fontSize: 22,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 4px 16px rgba(44,62,80,0.10)",
        transition: "background 0.18s, color 0.18s, transform 0.15s, box-shadow 0.18s",
        letterSpacing: "0.7px",
        outline: "none",
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
  let boxShadow = "0 2px 12px rgba(44,62,80,0.04)";
  if (selected && correct) {
    bg = colors.correct;
    color = "#fff";
    border = colors.correct;
    animClass = "ttal-bounce";
    boxShadow = "0 4px 24px rgba(67,170,139,0.18)";
  } else if (selected && incorrect) {
    bg = colors.incorrect;
    color = "#fff";
    border = colors.incorrect;
    animClass = "ttal-shake";
    boxShadow = "0 4px 24px rgba(249,65,68,0.13)";
  } else if (selected) {
    bg = colors.accent;
    border = colors.accent;
    animClass = "ttal-pulse";
    boxShadow = "0 2px 12px rgba(249,199,79,0.13)";
  }
  return (
    <button
      className={`ttal-statement-anim ${animClass}`}
      disabled={disabled}
      style={{
        width: "100%",
        textAlign: "left",
        marginBottom: 18,
        padding: "24px 28px",
        background: bg,
        color,
        border: `2.5px solid ${border}`,
        borderRadius: 16,
        fontSize: 22,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow,
        transition: "background 0.18s, color 0.18s, border 0.18s, transform 0.18s, box-shadow 0.18s",
        outline: selected ? `2.5px solid ${colors.accent}` : "none",
        opacity: disabled && !selected ? 0.6 : 1,
        position: "relative",
        overflow: "hidden",
      }}
      {...props}
    >
      <span style={{ position: "relative", zIndex: 2 }}>{children}</span>
      {selected && (
        <span
          style={{
            position: "absolute",
            right: 18,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 28,
            fontWeight: 700,
            opacity: 0.85,
            zIndex: 3,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {correct ? "✔️" : incorrect ? "❌" : "⭐"}
        </span>
      )}
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
        background: "rgba(44,62,80,0.22)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2.5px)",
        ...style,
      }}
    >
      <div
        className="ttal-modal-content-anim"
        style={{
          background: colors.glass,
          borderRadius: 28,
          padding: 56,
          minWidth: 410,
          maxWidth: "92vw",
          boxShadow: "0 8px 40px rgba(44,62,80,0.22)",
          textAlign: "center",
          fontSize: "120%",
          border: `2px solid ${colors.border}`,
          backdropFilter: "blur(8px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
      30% { transform: scale(1.14);}
      50% { transform: scale(0.95);}
      70% { transform: scale(1.06);}
      100% { transform: scale(1);}
    }
    @keyframes ttalShake {
      0% { transform: translateX(0);}
      20% { transform: translateX(-10px);}
      40% { transform: translateX(10px);}
      60% { transform: translateX(-7px);}
      80% { transform: translateX(7px);}
      100% { transform: translateX(0);}
    }
    @keyframes ttalPulse {
      0% { box-shadow: 0 0 0 0 rgba(249,199,79,0.6);}
      70% { box-shadow: 0 0 0 16px rgba(249,199,79,0);}
      100% { box-shadow: 0 0 0 0 rgba(249,199,79,0);}
    }
    @keyframes ttalModalFadeIn {
      from { opacity: 0; transform: scale(0.92);}
      to { opacity: 1; transform: scale(1);}
    }
    .ttal-card-anim {
      animation: ttalFadeIn 0.6s cubic-bezier(.23,1.01,.32,1) both;
    }
    .ttal-btn-anim {
      transition: transform 0.15s;
    }
    .ttal-btn-anim:active:not(:disabled) {
      transform: scale(0.97);
    }
    .ttal-statement-anim {
      animation: ttalFadeIn 0.6s cubic-bezier(.23,1.01,.32,1) both;
    }
    .ttal-bounce {
      animation: ttalBounce 0.5s cubic-bezier(.23,1.01,.32,1);
    }
    .ttal-shake {
      animation: ttalShake 0.42s cubic-bezier(.36,.07,.19,.97);
    }
    .ttal-pulse {
      animation: ttalPulse 0.8s;
    }
    .ttal-modal-fade {
      animation: ttalFadeIn 0.4s cubic-bezier(.23,1.01,.32,1) both;
    }
    .ttal-modal-content-anim {
      animation: ttalModalFadeIn 0.44s cubic-bezier(.23,1.01,.32,1) both;
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
      animation: ttalFadeIn 0.6s cubic-bezier(.23,1.01,.32,1) both;
    }
    @keyframes ttalPenaltyAnim {
      0% {
        opacity: 0;
        transform: translateY(0) scale(1);
      }
      10% {
        opacity: 1;
        transform: translateY(-10px) scale(1.13);
      }
      60% {
        opacity: 1;
        transform: translateY(-22px) scale(1.13);
      }
      100% {
        opacity: 0;
        transform: translateY(-38px) scale(0.9);
      }
    }
    .ttal-penalty-anim {
      animation: ttalPenaltyAnim 1s cubic-bezier(.23,1.01,.32,1);
      pointer-events: none;
      user-select: none;
    }
    /* Custom scrollbar for category list */
    .ttal-category-scroll::-webkit-scrollbar {
      height: 10px;
    }
    .ttal-category-scroll::-webkit-scrollbar-thumb {
      background: #e0ffe7;
      border-radius: 8px;
    }
    /* --- Connected Design Additions --- */
    .ttal-connector-bar {
      width: 4px;
      min-height: 40px;
      background: linear-gradient(180deg, #43AA8B 0%, #F9C74F 100%);
      margin: 0 auto;
      border-radius: 2px;
      box-shadow: 0 2px 8px #e0ffe7;
      opacity: 0.7;
      margin-bottom: 24px;
      margin-top: 24px;
    }
    .ttal-connector-dot {
      width: 18px;
      height: 18px;
      background: #F9C74F;
      border: 3px solid #43AA8B;
      border-radius: 50%;
      margin: 0 auto;
      margin-bottom: 8px;
      box-shadow: 0 2px 8px #e0ffe7;
    }
    .ttal-connector-dot.completed {
      background: #43AA8B;
      border-color: #F9C74F;
    }
    .ttal-category-connector-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-bottom: 32px;
      margin-top: 12px;
    }
    .ttal-category-connector-label {
      font-size: 15px;
      color: #40916C;
      font-weight: 700;
      text-align: center;
      margin-top: 2px;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 4px #fff;
      min-width: 80px;
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
  document.head.appendChild(style);
}

export default function TwoTruthsAndALie() {
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

  const [showPenalty, setShowPenalty] = useState(false);
  const penaltyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextSetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    fetch("/sentences.json")
      .then((res) => res.json())
      .then((data) => {
        setSentences(data);
        setLoading(false);
      });
  }, []);

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

  function formatTimer(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    const timerClass =
      ms < 10000
        ? "ttal-timer-anim ttal-timer-blink"
        : "ttal-timer-anim";
    return (
      <span
        className={timerClass}
        style={{
          fontFamily: "'Digital-7', monospace",
          fontSize: 48,
          color: colors.timer,
          background: "rgba(255,255,255,0.7)",
          borderRadius: 10,
          padding: "2px 16px",
          boxShadow: "0 2px 8px rgba(44,62,80,0.08)",
          marginLeft: 6,
          letterSpacing: "1.5px",
        }}
      >
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}.
        <span style={{ fontSize: 30 }}>{String(centiseconds).padStart(2, "0")}</span>
      </span>
    );
  }


  function TimeoutModal() {
    return (
      <Modal open={result === "timeout"}>
        <div
          className="ttal-result-anim"
          style={{
            color: colors.incorrect,
            fontWeight: 800,
            fontSize: 34,
            marginBottom: 16,
            letterSpacing: "0.7px",
            textShadow: "0 2px 8px #fff, 0 1px 0 #fff",
          }}
        >
          ⏰ Time&apos;s up!
        </div>
        <div className="ttal-result-anim" style={{ marginBottom: 24, fontSize: 22 }}>
          You got <b>{categoryCorrectCount}</b> out of <b>{categorySetKeys.length || SETS_PER_CATEGORY}</b> correct.<br />
          <span style={{ color: "#888" }}>
            You need at least <b>{MIN_CORRECT_TO_PASS}</b> correct to pass.
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 22 }}>
          <Button onClick={handleTryAgain} color={colors.secondary}>
            🔄 Try Again
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
                fontWeight: 800,
                fontSize: 34,
                marginBottom: 16,
                letterSpacing: "0.7px",
                textShadow: "0 2px 8px #fff, 0 1px 0 #fff",
              }}
            >
              🎉 Category Passed!
            </div>
            <div className="ttal-result-anim" style={{ marginBottom: 24, fontSize: 22 }}>
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
                fontWeight: 800,
                fontSize: 34,
                marginBottom: 16,
                letterSpacing: "0.7px",
                textShadow: "0 2px 8px #fff, 0 1px 0 #fff",
              }}
            >
              ❌ Category Failed
            </div>
            <div className="ttal-result-anim" style={{ marginBottom: 24, fontSize: 22 }}>
              You got <b>{categoryCorrectCount}</b> out of <b>{categorySetKeys.length || SETS_PER_CATEGORY}</b> correct.<br />
              <span style={{ color: "#888" }}>
                You need at least <b>{MIN_CORRECT_TO_PASS}</b> correct to pass.
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 22 }}>
              <Button
                onClick={() => handleRetryCategory(lastCategory!)}
                color={colors.secondary}
              >
                🔄 Try Again
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

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          color: colors.primary,
          background: colors.background,
        }}
      >
        <span className="ttal-result-anim" style={{ fontWeight: 700, letterSpacing: "0.7px" }}>
          <span style={{ fontSize: 38, marginRight: 10 }}>⏳</span> Loading...
        </span>
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
          fontSize: 28,
          color: colors.incorrect,
          background: colors.background,
        }}
      >
        <span className="ttal-result-anim" style={{ fontWeight: 700, letterSpacing: "0.7px" }}>
          <span style={{ fontSize: 38, marginRight: 10 }}>⚠️</span> Error loading questions.
        </span>
      </div>
    );
  }

  const allCategories = Object.keys(sentences);

  const gradientBackground = {
    minHeight: "100vh",
    background: colors.background,
    padding: "0 0 80px 0",
    fontSize: "115%",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    backgroundAttachment: "fixed",
  };

  return (
    <div style={gradientBackground}>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "56px 24px 0 24px",
        }}
      >
        <h1
          className="ttal-result-anim"
          style={{
            fontSize: 54,
            fontWeight: 900,
            color: colors.primary,
            letterSpacing: "-1.5px",
            marginBottom: 12,
            textAlign: "center",
            textShadow: "0 2px 8px #fff, 0 1px 0 #fff",
            lineHeight: 1.1,
          }}
        >
          <span style={{ color: colors.accent, fontSize: 44, marginRight: 10 }}>🎭</span>
          Two Truths and a Lie
        </h1>
        <div
          className="ttal-result-anim"
          style={{
            textAlign: "center",
            color: colors.secondary,
            fontSize: 26,
            marginBottom: 44,
            fontWeight: 600,
            letterSpacing: "0.5px",
            textShadow: "0 1px 4px #fff",
          }}
        >
          Spot the <span style={{ color: colors.accent, fontWeight: 800 }}>lie</span> in each set.<br />
          Can you pass every category?
        </div>


        

        <CategoryResultModal />
        <TimeoutModal />

        {!selectedCategory && !categoryFailed && !categoryPassed && (
          <Card style={{ marginBottom: 44, background: "rgba(255,255,255,0.92)", boxShadow: "0 8px 32px 0 rgba(44,62,80,0.13)" }}>
            <div className="ttal-result-anim" style={{ fontWeight: 800, fontSize: 28, marginBottom: 24, color: colors.primary, letterSpacing: "0.7px" }}>
              <span style={{ fontSize: 28, marginRight: 8 }}>📚</span>
              Select a Category
            </div>
            <div
              className="ttal-category-scroll"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 20,
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
                    opacity: completedCategories.includes(cat) ? 0.5 : 1,
                    width: 200,
                    fontWeight: 800,
                    fontSize: 22,
                    letterSpacing: "0.7px",
                    animationDelay: `${i * 0.066 + 0.11}s`,
                    animationName: "ttalFadeIn",
                    animationDuration: "0.6s",
                    animationFillMode: "both",
                    border: completedCategories.includes(cat)
                      ? `2.5px solid ${colors.correct}`
                      : `2.5px solid ${colors.secondary}`,
                    background: completedCategories.includes(cat)
                      ? "linear-gradient(90deg, #e0ffe7 0%, #b7f7d8 100%)"
                      : "linear-gradient(90deg, #f9fbe7 0%, #e9f5ee 100%)",
                    color: completedCategories.includes(cat)
                      ? colors.primary
                      : colors.secondary,
                    boxShadow: completedCategories.includes(cat)
                      ? "0 2px 12px rgba(67,170,139,0.10)"
                      : "0 2px 12px rgba(44,62,80,0.04)",
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{cat}</span>
                  {completedCategories.includes(cat) ? " ✔️" : ""}
                </Button>
              ))}
            </div>
            {completedCategories.length === allCategories.length && (
              <div
                className="ttal-result-anim"
                style={{
                  marginTop: 32,
                  fontWeight: 800,
                  color: colors.correct,
                  fontSize: 26,
                  textAlign: "center",
                  letterSpacing: "0.7px",
                  textShadow: "0 1px 4px #fff",
                }}
              >
                🎊 Congratulations! You have completed all categories!
              </div>
            )}
          </Card>
        )}

        {selectedCategory && currentSet && (
          <Card>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
                {categorySetKeys.map((setKey, idx) => (
                  <React.Fragment key={setKey}>
                    <div
                      className="ttal-connector-dot"
                      style={{
                        background:
                          idx < currentSetIndex
                            ? colors.correct
                            : idx === currentSetIndex
                            ? colors.accent
                            : "#fff",
                        borderColor:
                          idx < currentSetIndex
                            ? colors.accent
                            : colors.correct,
                        opacity: idx === currentSetIndex ? 1 : 0.7,
                        transition: "background 0.2s, border 0.2s, opacity 0.2s",
                        width: 16,
                        height: 16,
                        marginBottom: 0,
                      }}
                      title={`Set ${idx + 1}`}
                    />
                    {idx < categorySetKeys.length - 1 && (
                      <div
                        className="ttal-connector-bar"
                        style={{
                          width: 24,
                          minHeight: 4,
                          background:
                            idx < currentSetIndex
                              ? `linear-gradient(90deg, ${colors.correct} 0%, ${colors.accent} 100%)`
                              : `linear-gradient(90deg, #e0ffe7 0%, #f9fbe7 100%)`,
                          margin: "0 2px",
                          borderRadius: 2,
                          boxShadow: "0 1px 4px #e0ffe7",
                          opacity: 0.7,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div style={{ textAlign: "center", color: colors.secondary, fontWeight: 700, fontSize: 15, marginTop: 4 }}>
                Set {currentSetIndex + 1} / {categorySetKeys.length}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div
                className="ttal-result-anim"
                style={{
                  fontWeight: 800,
                  fontSize: 28,
                  color: colors.primary,
                  letterSpacing: "0.7px",
                  textShadow: "0 1px 4px #fff",
                }}
              >
                <span style={{ color: colors.accent, fontSize: 24, marginRight: 8 }}>📂</span>
                {selectedCategory}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div className="ttal-result-anim" style={{ fontWeight: 700, color: colors.text, fontSize: 20 }}>
                <span style={{ color: colors.secondary }}>Score:</span>{" "}
                <span style={{ color: colors.primary }}>
                  {categoryCorrectCount} correct
                </span>
                <span style={{ color: colors.incorrect, marginLeft: 12 }}>
                  {categoryIncorrectCount} incorrect
                </span>
              </div>
              <div
                className="ttal-result-anim"
                style={{
                  color: "#888",
                  fontSize: 17,
                  fontWeight: 600,
                  marginLeft: 12,
                  letterSpacing: "0.3px",
                }}
              >
                (Need {MIN_CORRECT_TO_PASS} correct to pass)
              </div>
            </div>
            <div
              className="ttal-result-anim"
              style={{
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 16,
                position: "relative",
                minHeight: 60,
              }}
            >
              <span style={{ fontWeight: 700, color: colors.text, fontSize: 20 }}>Time left:</span>
              <span style={{ position: "relative", display: "inline-block" }}>
                {formatTimer(timerMs)}
                {showPenalty && (
                  <span
                    className="ttal-penalty-anim"
                    style={{
                      position: "absolute",
                      left: "180px",
                      right: "0",
                      top: "50%",
                      marginLeft: 12,
                      transform: "translateY(-50%)",
                      color: colors.incorrect,
                      fontWeight: 800,
                      fontSize: 28,
                      pointerEvents: "none",
                      userSelect: "none",
                      textShadow: "0 2.2px 8.8px #fff, 0 1.1px 0 #fff",
                    }}
                  >
                    -3s
                  </span>
                )}
              </span>
            </div>

            {result !== "timeout" && (
              <>
                <div style={{ marginBottom: 16 }}>
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
                  <div className="ttal-result-anim" style={{ marginTop: 24, textAlign: "center" }}>
                    {result === "correct" ? (
                      <span
                        style={{
                          color: colors.correct,
                          fontWeight: 800,
                          fontSize: 26,
                          letterSpacing: "0.7px",
                          textShadow: "0 1px 4px #fff",
                        }}
                      >
                        ✅ Correct! You found the lie.
                      </span>
                    ) : (
                      <span
                        style={{
                          color: colors.incorrect,
                          fontWeight: 800,
                          fontSize: 26,
                          letterSpacing: "0.7px",
                          textShadow: "0 1px 4px #fff",
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
            <div style={{ marginTop: 38, textAlign: "center" }}>
              <Button
                onClick={handleBackToCategories}
                color={colors.disabled}
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: 700,
                  padding: "12px 28px",
                  borderRadius: 10,
                  marginTop: 8,
                  background: "#f8f9fa",
                  border: `1.5px solid ${colors.border}`,
                  boxShadow: "0 1px 4px #e0ffe7",
                  letterSpacing: "0.5px",
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