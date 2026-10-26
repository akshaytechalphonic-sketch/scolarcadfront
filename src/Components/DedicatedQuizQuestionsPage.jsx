import React, { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import Loader from "@/Components/loader";
import { API_BASE_URL } from "../../apiconfig";
import { useAuth } from "@/context/AuthContext";
import { DynamicSEO, getCleanCanonicalUrl } from "@/lib/seoHelper";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaRegCircle,
  FaFlag,
  FaRegFlag,
  FaClock,
  FaRedo,
  FaTrophy,
  FaCheck,
  FaTimes,
  FaChartPie,
  FaListOl,
  FaSearchPlus,
  FaHighlighter,
  FaEraser,
  FaStrikethrough,
  FaBookOpen,
  FaChevronDown,
  FaChevronUp,
  FaLightbulb,
  FaExchangeAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import {
  MdQuiz,
  MdFormatListNumbered,
  MdOutlineSend,
  MdOutlineAssignmentTurnedIn,
  MdOutlineTimer,
} from "react-icons/md";

export default function DedicatedQuizQuestionsPage({
  courseSlug: initialCourseSlug,
  quizSlug: initialQuizSlug,
  initialData = null,
  active_country = "in",
  url_title,
}) {
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  // Attempt metadata
  const attemptId = router?.query?.attempt_id || null;
  const attemptMode = router?.query?.mode || "exam";

  // Simulator flow state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);

  // Interactive Tools State
  // 1. Strike-Off options: { [questionId]: { [optionId]: boolean } }
  const [struckOptions, setStruckOptions] = useState({});
  // 2. Highlighting text: { [questionId]: string[] }
  const [highlightedSnippets, setHighlightedSnippets] = useState({});
  // 3. Image Lightbox Zoom modal
  const [zoomImage, setZoomImage] = useState(null);
  // 4. Case Study Collapse/Expand toggle
  const [isCaseStudyOpen, setIsCaseStudyOpen] = useState(true);
  // 5. Matching Question Answers: { [questionId]: { [pairId]: targetValue } }
  const [matchingAnswers, setMatchingAnswers] = useState({});

  const courseSlug = useMemo(() => {
    return (
      initialCourseSlug ||
      url_title ||
      data?.course?.slug ||
      ""
    );
  }, [initialCourseSlug, url_title, data]);

  const quizSlug = useMemo(() => {
    return initialQuizSlug || data?.quiz?.slug || "";
  }, [initialQuizSlug, data]);

  // Client-side fetch questions API
  useEffect(() => {
    if (!courseSlug || !quizSlug) return;
    if (initialData && initialData.questions) {
      setData(initialData);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchQuestions() {
      setLoading(true);
      setError(null);
      try {
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const qs = attemptMode ? `?mode=${encodeURIComponent(attemptMode)}` : "";
        const endpoint = `${API_BASE_URL}/api/courses/${courseSlug}/quizzes/${quizSlug}/questions${qs}`;
        const res = await fetch(endpoint, {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          if (isMounted) {
            setData(null);
            setError(
              res.status === 404
                ? "Quiz questions not found or not published for this course."
                : res.status === 401 || res.status === 403
                ? "Authentication required. Please log in to view exam questions."
                : "Failed to fetch questions. Please try again later."
            );
          }
          if (isMounted) setLoading(false);
          return;
        }

        const json = await res.json();
        if (isMounted) {
          if (json?.status && json?.data && Array.isArray(json?.data?.questions) && json.data.questions.length > 0) {
            setData(json.data);
            setError(null);
          } else {
            setData(null);
            setError("Quiz questions not found or not published for this course.");
          }
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
        if (isMounted) {
          setData(null);
          setError("Network error while loading questions. Please check your connection.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [courseSlug, quizSlug, token, initialData, attemptMode]);

  const course = data?.course || {};
  const quiz = data?.quiz || {};
  const questions = useMemo(() => {
    return Array.isArray(data?.questions) ? data.questions : [];
  }, [data]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || null;

  // Initialize timer and attempt storage
  const storageKey = `scholaracad_quiz_attempt_${quizSlug}`;
  useEffect(() => {
    if (!quiz?.duration_minutes && quiz?.duration_minutes !== 0) return;
    
    // Check for saved attempt in localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedAnswers) setSelectedAnswers(parsed.selectedAnswers);
        if (parsed.flaggedQuestions) setFlaggedQuestions(parsed.flaggedQuestions);
        if (parsed.struckOptions) setStruckOptions(parsed.struckOptions);
        if (parsed.highlightedSnippets) setHighlightedSnippets(parsed.highlightedSnippets);
        if (parsed.matchingAnswers) setMatchingAnswers(parsed.matchingAnswers);
        if (parsed.currentIndex !== undefined) setCurrentIndex(parsed.currentIndex);
        if (parsed.timeRemaining !== undefined && parsed.timeRemaining > 0) {
          setTimeRemaining(parsed.timeRemaining);
        } else {
          setTimeRemaining((quiz.duration_minutes || 60) * 60);
        }
        if (parsed.timeSpentSeconds !== undefined) {
          setTimeSpentSeconds(parsed.timeSpentSeconds);
        }
        return;
      }
    } catch (e) {
      console.warn("Storage error", e);
    }

    // Default timer initialization
    const initialSeconds = (Number(quiz.duration_minutes) || 60) * 60;
    setTimeRemaining(initialSeconds);
  }, [quiz?.duration_minutes, storageKey]);

  // Timer interval countdown
  useEffect(() => {
    if (isSubmitted || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeRemaining]);

  // Save attempt to localStorage on change
  useEffect(() => {
    if (isSubmitted || totalQuestions === 0) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedAnswers,
          flaggedQuestions,
          struckOptions,
          highlightedSnippets,
          matchingAnswers,
          currentIndex,
          timeRemaining,
          timeSpentSeconds,
        })
      );
    } catch (e) {
      // ignore quota errors
    }
  }, [selectedAnswers, flaggedQuestions, struckOptions, highlightedSnippets, matchingAnswers, currentIndex, timeRemaining, timeSpentSeconds, isSubmitted, storageKey, totalQuestions]);

  const courseDisplayName = useMemo(() => {
    if (course?.name) return course.name;
    if (courseSlug) {
      return courseSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return "Course";
  }, [course, courseSlug]);

  // Answer selection handler
  const handleSelectOption = (questionId, optionId) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Flag toggle handler
  const handleToggleFlag = (questionId) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Strike-off toggle handler (Eliminate options)
  const handleToggleStrike = (questionId, optionId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setStruckOptions((prev) => {
      const qStruck = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...qStruck,
          [optionId]: !qStruck[optionId],
        },
      };
    });
  };

  // Text Highlighting Tool Handlers
  const handleHighlightSelection = (questionId) => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : "";
    if (!text || text.length < 2) return;

    setHighlightedSnippets((prev) => {
      const list = prev[questionId] || [];
      if (list.includes(text)) return prev;
      return {
        ...prev,
        [questionId]: [...list, text],
      };
    });

    if (selection) {
      try {
        selection.removeAllRanges();
      } catch (err) {
        // ignore
      }
    }
  };

  const handleClearHighlights = (questionId) => {
    setHighlightedSnippets((prev) => ({
      ...prev,
      [questionId]: [],
    }));
  };

  // Helper to render text with highlights applied
  const renderHighlightedText = (text, questionId) => {
    if (!text) return "";
    const snippets = highlightedSnippets[questionId] || [];
    if (!snippets || snippets.length === 0) return text;

    const escaped = snippets
      .filter(Boolean)
      .map((s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
      .join("|");
    if (!escaped) return text;

    try {
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = text.split(regex);

      return parts.map((part, i) => {
        const isMatch = snippets.some(
          (s) => s.toLowerCase() === part.toLowerCase()
        );
        if (isMatch) {
          return (
            <mark
              key={i}
              className="bg-amber-200 text-amber-950 font-bold px-1.5 py-0.5 rounded shadow-2xs"
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    } catch (err) {
      return text;
    }
  };

  // Matching Question Handler
  const handleMatchingSelect = (questionId, itemKey, matchValue) => {
    if (isSubmitted) return;
    setMatchingAnswers((prev) => {
      const qMatches = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...qMatches,
          [itemKey]: matchValue,
        },
      };
    });
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = () => {
    setIsSubmitted(true);
    setShowSubmitModal(false);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      // ignore
    }
  };

  // Retake Exam Handler
  const handleRetake = () => {
    setSelectedAnswers({});
    setFlaggedQuestions({});
    setStruckOptions({});
    setHighlightedSnippets({});
    setMatchingAnswers({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setShowSubmitModal(false);
    setTimeSpentSeconds(0);
    setTimeRemaining((Number(quiz.duration_minutes) || 60) * 60);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      // ignore
    }
  };

  // Timer formatting (HH:MM:SS or MM:SS)
  const formatTimer = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Real-time Score Stats Calculation (Kitne Sahi, Kitne Galat, Baaki)
  const scoreStats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;

    questions.forEach((q) => {
      const selectedId = selectedAnswers[q.id];
      if (selectedId !== undefined && selectedId !== null) {
        const correctOpt = q.options?.find(
          (o) => o.is_correct || o.id === q.correct_option_id
        );
        const selectedOpt = q.options?.find((o) => o.id === selectedId);

        if (
          selectedOpt?.is_correct ||
          (correctOpt && selectedId === correctOpt.id)
        ) {
          correct += 1;
        } else {
          incorrect += 1;
        }
      }
    });

    const answered = Object.keys(selectedAnswers).length;
    const unanswered = Math.max(0, questions.length - answered);

    return {
      correct,
      incorrect,
      answered,
      unanswered,
      total: questions.length,
    };
  }, [questions, selectedAnswers]);

  const progressPercentage =
    totalQuestions > 0
      ? Math.round(((currentIndex + 1) / totalQuestions) * 100)
      : 0;

  const answeredCount = scoreStats.answered;
  const unansweredCount = scoreStats.unanswered;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;

  const passingScore = Number(quiz?.passing_score) || 70;
  const finalPercentage =
    totalQuestions > 0
      ? Math.round((scoreStats.correct / totalQuestions) * 100)
      : 0;
  const isPassed = finalPercentage >= passingScore;

  // Case study content check for current question or quiz
  const caseStudyContent = useMemo(() => {
    if (!currentQuestion) return null;
    return (
      currentQuestion.case_study ||
      currentQuestion.scenario ||
      quiz?.description ||
      "Case Study Scenario: TechNova Global is executing a multi-phase digital transformation initiative under the PRINCE2 governance framework. As the Lead Project Manager, review the stage boundary plans, risk tolerances, and business justification to evaluate the questions below."
    );
  }, [currentQuestion, quiz]);

  // Matching check for current question
  const isMatchingType = useMemo(() => {
    if (!currentQuestion) return false;
    const typeStr = (currentQuestion.type || "").toLowerCase();
    return (
      typeStr === "matching" ||
      typeStr === "matching_set" ||
      typeStr.includes("match")
    );
  }, [currentQuestion]);

  // Dropdown selection check for current question
  const isDropdownType = useMemo(() => {
    if (!currentQuestion) return false;
    const typeStr = (currentQuestion.type || "").toLowerCase();
    return (
      typeStr === "dropdown" ||
      typeStr === "dropdown_selection" ||
      typeStr === "dropdown_choice" ||
      typeStr === "select" ||
      typeStr.includes("dropdown")
    );
  }, [currentQuestion]);

  return (
    <>
      <DynamicSEO
        title={`${quiz?.title || "Exam Simulator"} — ${isSubmitted ? "Result Summary" : "Questions"} | ScholarAcad`}
        description={`Interactive exam simulator for ${quiz?.title || "Quiz"} - ${courseDisplayName}`}
        canonicalUrl={getCleanCanonicalUrl(`/${courseSlug}/quizzes/${quizSlug}/questions`)}
        robots="noindex, nofollow"
      />

      <Navbar />

      <main className="min-h-screen bg-[#f1f3f9] pb-20">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 text-gray-900 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/${courseSlug}/quizzes/${quizSlug}`}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#882CFB] border border-purple-200 transition text-xs font-semibold flex items-center gap-1.5 shrink-0"
                title="Back to Quiz Details"
              >
                <FaArrowLeft className="text-xs" />
                <span className="hidden sm:inline">Details</span>
              </Link>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black text-gray-900 truncate tracking-wide">
                  {quiz?.title || "Exam Simulator"}
                </h1>
                <p className="text-[11px] text-gray-500 truncate font-medium">
                  {courseDisplayName}
                </p>
              </div>
            </div>

            {/* Timer & Submit Bar */}
            {!isSubmitted && totalQuestions > 0 && (
              <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                {/* Live Countdown Timer */}
                <div
                  className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl border text-xs sm:text-sm font-black font-mono shadow-xs transition ${
                    timeRemaining !== null && timeRemaining < 300
                      ? "bg-red-50 border-red-300 text-red-600 animate-pulse"
                      : "bg-purple-50 border-purple-200 text-[#882CFB]"
                  }`}
                  title="Time Remaining"
                >
                  <MdOutlineTimer className="text-base text-[#882CFB]" />
                  <span>{formatTimer(timeRemaining)}</span>
                </div>

                {/* Submit Exam Button */}
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#882CFB] hover:bg-[#7221D8] text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <MdOutlineSend className="text-sm" />
                  <span>Submit Exam</span>
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {!isSubmitted && totalQuestions > 0 && (
            <div className="w-full bg-gray-100 h-1.5">
              <div
                className="bg-[#882CFB] h-1.5 transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </header>

        {/* Live Status Sub-Header: Correct, Incorrect, Remaining, Flagged */}
        {!isSubmitted && totalQuestions > 0 && (
          <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs py-2.5 px-4 sticky top-[53px] z-20">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Score Badges */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Correct Badge */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold shadow-2xs"
                  title="Questions answered correctly"
                >
                  <FaCheckCircle className="text-emerald-600 text-sm" />
                  <span>Correct:</span>
                  <span className="text-emerald-950 font-black text-sm">
                    {scoreStats.correct}
                  </span>
                </div>

                {/* Incorrect Badge */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 font-extrabold shadow-2xs"
                  title="Questions answered incorrectly"
                >
                  <FaTimesCircle className="text-rose-600 text-sm" />
                  <span>Incorrect:</span>
                  <span className="text-rose-950 font-black text-sm">
                    {scoreStats.incorrect}
                  </span>
                </div>

                {/* Remaining Badge */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 font-extrabold shadow-2xs"
                  title="Questions remaining to answer"
                >
                  <MdOutlineAssignmentTurnedIn className="text-slate-500 text-sm" />
                  <span>Remaining:</span>
                  <span className="text-slate-900 font-black text-sm">
                    {scoreStats.unanswered}
                  </span>
                </div>

                {/* Flagged Badge */}
                {flaggedCount > 0 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-extrabold shadow-2xs"
                    title="Marked for review"
                  >
                    <FaFlag className="text-amber-500 text-xs" />
                    <span>Flagged:</span>
                    <span className="text-amber-950 font-black text-sm">
                      {flaggedCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Summary Counter */}
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-2">
                <span>
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[#882CFB] font-black">
                  {progressPercentage}% Completed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content Section - Expanded Width for Prominent Question Box */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-3xl p-16 shadow-sm border border-slate-200 flex flex-col items-center justify-center space-y-4 my-8">
              <Loader />
              <p className="text-slate-500 text-sm font-medium animate-pulse">
                Loading exam questions from question bank...
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-white rounded-3xl p-12 text-center border border-red-200 shadow-sm max-w-lg mx-auto my-8">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4">
                <FaExclamationTriangle />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Unable to Load Questions
              </h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <Link
                href={`/${active_country || "in"}/${courseSlug}/quizzes/${quizSlug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#882CFB] text-white rounded-xl text-xs font-bold hover:bg-[#701cdb] transition shadow-sm"
              >
                <FaArrowLeft className="text-xs" />
                <span>Return to Quiz Details</span>
              </Link>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && totalQuestions === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-8">
              <div className="w-16 h-16 bg-[#F4EFFF] text-[#882CFB] rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4">
                <MdQuiz />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                No Questions Available
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                This quiz currently does not have any published questions. Please check back soon.
              </p>
              <Link
                href={`/${courseSlug}/quizzes/${quizSlug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#882CFB] text-white rounded-xl text-xs font-bold hover:bg-[#701cdb] transition shadow-sm"
              >
                <FaArrowLeft className="text-xs" />
                <span>Return to Quiz Details</span>
              </Link>
            </div>
          )}

          {/* RESULT / SUBMITTED SUMMARY VIEW */}
          {!loading && !error && isSubmitted && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-12 text-center space-y-6">
                {/* Result Status Icon */}
                <div
                  className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto text-5xl shadow-inner ${
                    isPassed
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-rose-50 text-rose-600 border border-rose-200"
                  }`}
                >
                  <FaTrophy />
                </div>

                <div className="space-y-2">
                  <span
                    className={`inline-block px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      isPassed
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-rose-100 text-rose-900 border border-rose-300"
                    }`}
                  >
                    {isPassed ? "Exam Successfully Passed 🎉" : "Exam Attempt Completed"}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
                    {quiz?.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Your answers have been evaluated. Here is your final score breakdown and response metrics.
                  </p>
                </div>

                {/* Score & Completion Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4">
                  {/* Correct Answers */}
                  <div className="bg-emerald-50/80 rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider block mb-1">
                      Correct Answers
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-900">
                      {scoreStats.correct} / {totalQuestions}
                    </span>
                  </div>

                  {/* Incorrect Answers */}
                  <div className="bg-rose-50/80 rounded-2xl p-4 sm:p-5 border border-rose-200 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider block mb-1">
                      Incorrect Answers
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-rose-900">
                      {scoreStats.incorrect}
                    </span>
                  </div>

                  {/* Final Score % */}
                  <div className="bg-purple-50/80 rounded-2xl p-4 sm:p-5 border border-purple-200 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-[#882CFB] uppercase tracking-wider block mb-1">
                      Your Score %
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-[#2E318D]">
                      {finalPercentage}%
                    </span>
                  </div>

                  {/* Passing Target */}
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                      Passing Target
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-slate-800">
                      {passingScore}%
                    </span>
                  </div>
                </div>

                {/* Action Buttons on Result Screen */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex-1 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-[#882CFB] hover:bg-[#701cdb] text-white shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FaRedo className="text-xs" />
                    <span>Retake Exam</span>
                  </button>

                  <Link
                    href={`/${courseSlug}/quizzes`}
                    className="flex-1 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>All Quizzes</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE QUESTIONS SCREEN (BIG QUESTION BOX & MODERN TOOLS) */}
          {!loading && !error && !isSubmitted && currentQuestion && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* MAIN ENLARGED QUESTION CARD */}
              <div className="flex-1 min-w-0 w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden transition-all duration-300">
                {/* Question Card Top Bar (Question #, Type, Marks, Toolbar) */}
                <div className="bg-slate-50/95 border-b border-slate-200/80 px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-[#882CFB] text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-xl shadow-xs">
                      Question #{currentQuestion?.order_no || currentIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                      {isDropdownType
                        ? "DROPDOWN SELECTION"
                        : isMatchingType
                        ? "MATCHING PAIRS"
                        : currentQuestion?.type
                        ? currentQuestion.type.replace(/_/g, " ")
                        : "MULTIPLE CHOICE"}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-xl">
                      {currentQuestion?.marks || 1} Mark{currentQuestion?.marks > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Interactive Toolbar: Highlight Tool & Flag Question */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Case Study Toggle Button in Toolbar */}
                    <button
                      type="button"
                      onClick={() => setIsCaseStudyOpen((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isCaseStudyOpen
                          ? "bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold"
                          : "bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200"
                      }`}
                      title="Toggle Case Study / Scenario Passage"
                    >
                      <FaBookOpen className="text-indigo-600 text-xs" />
                      <span>{isCaseStudyOpen ? "Case Study (Open)" : "View Case Study"}</span>
                    </button>

                    {/* Highlighter Button */}
                    <button
                      type="button"
                      onClick={() => handleHighlightSelection(currentQuestion.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Select text with your cursor and click to highlight key phrases"
                    >
                      <FaHighlighter className="text-amber-600 text-xs" />
                      <span>Highlight Text</span>
                    </button>

                    {/* Clear Highlights if any exist for this question */}
                    {highlightedSnippets[currentQuestion.id]?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearHighlights(currentQuestion.id)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                        title="Clear highlights for this question"
                      >
                        <FaEraser className="text-xs" />
                        <span className="hidden sm:inline">Clear</span>
                      </button>
                    )}

                    {/* Flag / Review Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleFlag(currentQuestion.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs ${
                        flaggedQuestions[currentQuestion.id]
                          ? "bg-amber-400 text-slate-900 border border-amber-500 font-black"
                          : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                      title="Flag this question for review"
                    >
                      {flaggedQuestions[currentQuestion.id] ? (
                        <>
                          <FaFlag className="text-slate-900 text-xs" />
                          <span>Flagged</span>
                        </>
                      ) : (
                        <>
                          <FaRegFlag className="text-slate-400 text-xs" />
                          <span>Flag</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-6 sm:p-10 lg:p-12 space-y-6">
                  {/* CASE STUDY / SCENARIO PANEL (if question or quiz has case study) */}
                  {caseStudyContent && (
                    <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 overflow-hidden shadow-2xs">
                      <div
                        onClick={() => setIsCaseStudyOpen((prev) => !prev)}
                        className="px-5 sm:px-6 py-3.5 bg-indigo-100/60 hover:bg-indigo-100/90 border-b border-indigo-200 flex items-center justify-between cursor-pointer transition select-none"
                      >
                        <div className="flex items-center gap-2.5">
                          <FaBookOpen className="text-indigo-700 text-base" />
                          <span className="font-black text-xs sm:text-sm text-indigo-950 uppercase tracking-wider">
                            Case Study / Background Scenario
                          </span>
                          <span className="text-[10px] font-extrabold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">
                            Passage
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-indigo-800 text-xs font-bold flex items-center gap-1"
                        >
                          <span>{isCaseStudyOpen ? "Hide Scenario" : "Show Scenario"}</span>
                          {isCaseStudyOpen ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </div>

                      {isCaseStudyOpen && (
                        <div className="p-5 sm:p-6 text-sm sm:text-base text-slate-800 leading-relaxed font-normal whitespace-pre-line border-t border-indigo-100 max-h-80 overflow-y-auto">
                          {renderHighlightedText(caseStudyContent, currentQuestion.id)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* BIG QUESTION TEXT (Enhanced Font & Prominence) */}
                  <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-snug sm:leading-relaxed tracking-tight">
                    {renderHighlightedText(currentQuestion?.question_text, currentQuestion.id)}
                  </div>

                  {/* QUESTION IMAGE (with Click-to-Zoom Lightbox Modal) */}
                  {currentQuestion?.image_url && (
                    <div className="relative group rounded-3xl overflow-hidden border-2 border-slate-200 bg-slate-50 max-w-2xl my-4 shadow-sm">
                      <img
                        src={currentQuestion.image_url}
                        alt={`Question ${currentIndex + 1} Visual`}
                        className="w-full h-auto max-h-96 object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setZoomImage(currentQuestion.image_url)}
                        className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer backdrop-blur-xs"
                        title="Click to Zoom Image"
                      >
                        <FaSearchPlus className="text-xs" />
                        <span>Click to Zoom</span>
                      </button>
                    </div>
                  )}

                  {/* MATCHING QUESTION INTERACTIVE UI (if type is matching) */}
                  {isMatchingType && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#F4EFFF]/60 border border-[#E4D3FF] space-y-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#2E318D] uppercase tracking-wider">
                        <FaExchangeAlt />
                        <span>Interactive Matching Pair Exercise</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Match each item on the left with its corresponding concept on the right:
                      </p>

                      {/* Matching Matrix */}
                      <div className="space-y-3 pt-2">
                        {Array.isArray(currentQuestion?.options) &&
                          currentQuestion.options.map((option, optIdx) => {
                            const pairKey = `item_${option.id || optIdx}`;
                            const selectedMatch =
                              matchingAnswers[currentQuestion.id]?.[pairKey] || "";

                            const parts = (option.option_text || "").split(/\s*(?:->|::|\|)\s*/);
                            const itemConcept = parts[0] || option.option_text;

                            return (
                              <div
                                key={option.id || optIdx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-purple-100 shadow-2xs hover:border-purple-300 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-xl bg-[#882CFB] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                    {option.option_label || String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                                    {itemConcept}
                                  </span>
                                </div>

                                <div className="sm:w-80">
                                  <select
                                    value={selectedMatch}
                                    onChange={(e) =>
                                      handleMatchingSelect(
                                        currentQuestion.id,
                                        pairKey,
                                        e.target.value
                                      )
                                    }
                                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#882CFB] shadow-2xs cursor-pointer"
                                  >
                                    <option value="">-- Select Matching Concept --</option>
                                    {currentQuestion.options.map((targetOpt, tIdx) => {
                                      const tParts = (targetOpt.option_text || "").split(/\s*(?:->|::|\|)\s*/);
                                      const targetDef = tParts.length > 1 ? tParts[1] : tParts[0];
                                      return (
                                        <option
                                          key={targetOpt.id || tIdx}
                                          value={targetOpt.id}
                                        >
                                          {tIdx + 1}. {targetDef}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* DROPDOWN DATA SELECTION INTERACTIVE UI (for dropdown questions) */}
                  {isDropdownType && (
                    <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white border-2 border-indigo-200 shadow-md space-y-4 animate-in fade-in duration-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black text-indigo-950 uppercase tracking-wider">
                          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-xs">
                            <FaChevronDown />
                          </span>
                          <span>Dropdown Data & Solution Selection</span>
                        </div>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full border border-indigo-300">
                          Select from Menu
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 font-medium">
                        Choose your solution / option from the dropdown menu below:
                      </p>

                      <div className="space-y-3 pt-1">
                        <div className="relative">
                          <select
                            id={`dropdown-select-${currentQuestion.id}`}
                            value={selectedAnswers[currentQuestion.id] || ""}
                            onChange={(e) => {
                              const val = e.target.value ? Number(e.target.value) || e.target.value : undefined;
                              if (val !== undefined) {
                                handleSelectOption(currentQuestion.id, val);
                              }
                            }}
                            className={`w-full text-xs sm:text-sm font-bold py-3.5 pl-4 pr-11 rounded-2xl border-2 transition-all cursor-pointer appearance-none bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-[#882CFB] ${
                              selectedAnswers[currentQuestion.id]
                                ? "border-indigo-500 text-indigo-950 ring-2 ring-indigo-200 bg-indigo-50/30"
                                : "border-slate-300 text-slate-700 hover:border-indigo-400"
                            }`}
                          >
                            <option value="">-- Click here to select the correct option from dropdown --</option>
                            {Array.isArray(currentQuestion?.options) &&
                              currentQuestion.options.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  Option {opt.option_label}: {opt.option_text}
                                </option>
                              ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 text-sm">
                            <FaChevronDown />
                          </div>
                        </div>

                        {selectedAnswers[currentQuestion.id] && (() => {
                          const selOpt = currentQuestion.options?.find(
                            (o) => o.id === selectedAnswers[currentQuestion.id]
                          );
                          return (
                            <div className="flex items-center gap-2.5 text-xs font-bold text-indigo-950 bg-white p-3.5 rounded-2xl border border-indigo-200 shadow-2xs">
                              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                                {selOpt?.option_label || "✓"}
                              </span>
                              <span className="text-slate-500">Selected Solution:</span>
                              <span className="text-slate-900 truncate font-semibold">
                                {selOpt?.option_text}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* STANDARD OPTIONS LIST WITH STRIKE-OFF FEATURE */}
                  <div className="space-y-3.5 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5">
                      <span className="text-sm sm:text-base font-bold text-slate-700">
                        {isDropdownType
                          ? "All Available Options (Click card or choose from dropdown above):"
                          : "Select the best answer from the options below:"}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-500">
                        Tip: Use Strike-Off (S̶) to cross out incorrect options
                      </span>
                    </div>

                    {Array.isArray(currentQuestion?.options) &&
                      currentQuestion.options.map((option) => {
                        const isSelected =
                          selectedAnswers[currentQuestion.id] === option.id;
                        const hasAnswered =
                          selectedAnswers[currentQuestion.id] !== undefined;
                        const isCorrectOption = Boolean(option.is_correct);
                        const isStruck = Boolean(
                          struckOptions[currentQuestion.id]?.[option.id]
                        );

                        // Card Styling Based on Selection & Strike-off
                        let cardStyle =
                          "border-slate-200 hover:border-purple-300 bg-white hover:bg-slate-50/80 shadow-2xs";
                        let badgeStyle =
                          "bg-slate-100 text-slate-700 border border-slate-200";
                        let iconEl = <FaRegCircle className="text-slate-300" />;

                        // If candidate has answered this question, show instant visual feedback
                        if (hasAnswered) {
                          if (isCorrectOption) {
                            cardStyle =
                              "border-emerald-500 bg-emerald-50/90 text-emerald-950 font-semibold ring-2 ring-emerald-500 shadow-sm";
                            badgeStyle = "bg-emerald-600 text-white";
                            iconEl = <FaCheck className="text-emerald-600 font-bold" />;
                          } else if (isSelected && !isCorrectOption) {
                            cardStyle =
                              "border-rose-500 bg-rose-50/90 text-rose-950 font-semibold ring-2 ring-rose-500 shadow-sm";
                            badgeStyle = "bg-rose-600 text-white";
                            iconEl = <FaTimes className="text-rose-600 font-bold" />;
                          } else {
                            cardStyle =
                              "border-slate-200 bg-white opacity-40 text-slate-400";
                            badgeStyle =
                              "bg-slate-100 text-slate-400 border border-slate-200";
                          }
                        } else if (isSelected) {
                          cardStyle =
                            "border-[#882CFB] bg-purple-50/70 shadow-sm ring-2 ring-[#882CFB]";
                          badgeStyle = "bg-[#882CFB] text-white";
                          iconEl = <FaCheckCircle className="text-[#882CFB]" />;
                        }

                        // Strikethrough style overrides
                        if (isStruck) {
                          cardStyle += " opacity-50 bg-slate-50";
                        }

                        return (
                          <div
                            key={option.id}
                            onClick={() =>
                              handleSelectOption(currentQuestion.id, option.id)
                            }
                            className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-start justify-between gap-3 sm:gap-4 cursor-pointer relative group ${cardStyle}`}
                          >
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              {/* Option Label Badge (A, B, C, D) */}
                              <span
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center shrink-0 transition-colors shadow-2xs ${badgeStyle}`}
                              >
                                {option.option_label || ""}
                              </span>

                              {/* Option Text */}
                              <div className="flex-1 pt-1 min-w-0">
                                <div
                                  className={`text-sm sm:text-base font-semibold leading-relaxed ${
                                    isStruck
                                      ? "line-through decoration-rose-500 decoration-2 text-slate-400"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {option.option_text}
                                </div>

                                {/* Strike-off Indicator Bar: ----------- (Option Eliminated) */}
                                {isStruck && (
                                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 w-fit">
                                    <span>-----------</span>
                                    <span>(Option Eliminated)</span>
                                  </div>
                                )}

                                {/* Option Image (with click-to-zoom) */}
                                {option.image_url && (
                                  <div className="mt-2.5 relative group rounded-xl overflow-hidden border border-slate-200 max-w-xs bg-slate-50">
                                    <img
                                      src={option.image_url}
                                      alt={`Option ${option.option_label}`}
                                      className="w-full h-auto max-h-40 object-contain p-1"
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomImage(option.image_url);
                                      }}
                                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg text-xs transition"
                                      title="Zoom Option Image"
                                    >
                                      <FaSearchPlus />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Side: Select Button + Strike-Off Toggle + Selection Icon */}
                            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pt-1 flex-wrap justify-end">
                              {/* Explicit Select Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectOption(currentQuestion.id, option.id);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                  isSelected
                                    ? "bg-[#882CFB] text-white ring-2 ring-purple-300 shadow-purple-200"
                                    : "bg-purple-50 hover:bg-[#882CFB] text-[#882CFB] hover:text-white border border-purple-200"
                                }`}
                                title="Click to select this answer option"
                              >
                                <FaCheckCircle className="text-xs" />
                                <span>{isSelected ? "Selected" : "Select"}</span>
                              </button>

                              {/* Strike-Off Toggle Button */}
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleToggleStrike(currentQuestion.id, option.id, e)
                                }
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                  isStruck
                                    ? "bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 font-extrabold"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200"
                                }`}
                                title={
                                  isStruck
                                    ? "Restore this option"
                                    : "Strike off / Eliminate this option"
                                }
                              >
                                <FaStrikethrough className="text-xs" />
                                <span className="text-[10px] hidden sm:inline">
                                  {isStruck ? "Undo Strike" : "Strike Off"}
                                </span>
                              </button>

                              {/* Check / Status Icon */}
                              <div className="text-xl">{iconEl}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* HIGH-VISIBILITY EXPLANATION CARD (INSTANT FEEDBACK IN PROFESSIONAL ENGLISH) */}
                  {selectedAnswers[currentQuestion.id] && (() => {
                    const selectedOptionId = selectedAnswers[currentQuestion.id];
                    const selectedOpt = currentQuestion?.options?.find(
                      (o) => o.id === selectedOptionId
                    );
                    const correctOpt = currentQuestion?.options?.find(
                      (o) => o.is_correct || o.id === currentQuestion.correct_option_id
                    );
                    const isCorrectChoice =
                      selectedOpt?.is_correct ||
                      (correctOpt && selectedOptionId === correctOpt.id);

                    if (!isCorrectChoice) {
                      // WRONG ANSWER FEEDBACK (IN PROFESSIONAL ENGLISH)
                      return (
                        <div className="mt-6 p-5 sm:p-7 rounded-3xl bg-rose-50/95 border-2 border-rose-300 shadow-md space-y-4 animate-in fade-in duration-200">
                          {/* Banner Header */}
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md shadow-rose-200">
                              <FaTimesCircle />
                            </div>
                            <div>
                              <h4 className="text-base sm:text-lg font-black text-rose-950">
                                ❌ Incorrect Answer
                              </h4>
                              <p className="text-xs sm:text-sm font-semibold text-rose-700">
                                You selected Option {selectedOpt?.option_label}, which is incorrect.
                              </p>
                            </div>
                          </div>

                          {/* Selected Option Summary */}
                          <div className="p-3.5 bg-rose-100/70 rounded-xl border border-rose-200 text-xs font-semibold text-rose-900">
                            <span className="font-bold">Your Selected Option: </span>
                            Option {selectedOpt?.option_label}: &ldquo;{selectedOpt?.option_text}&rdquo;
                          </div>

                          {/* Why Incorrect - Backend Description Box */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-200 space-y-2 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs font-black text-rose-900 uppercase tracking-wider">
                              <FaLightbulb className="text-amber-500 text-base" />
                              <span>Why is this answer incorrect? (Explanation & Concept)</span>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line pt-1">
                              {currentQuestion.explanation ||
                                "This option is incorrect based on the syllabus standards. Please review the correct rationale and concept below."}
                            </div>
                          </div>

                          {/* Correct Answer Highlight */}
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start gap-3 shadow-2xs">
                            <FaCheckCircle className="text-emerald-600 text-xl shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider block">
                                Correct Answer: Option{" "}
                                {correctOpt?.option_label || currentQuestion.correct_option_label}
                              </span>
                              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                                {correctOpt?.option_text || "Please refer to the option labeled above."}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // CORRECT ANSWER CELEBRATION FEEDBACK (IN PROFESSIONAL ENGLISH)
                      return (
                        <div className="mt-6 p-5 sm:p-7 rounded-3xl bg-emerald-50/95 border-2 border-emerald-300 shadow-md space-y-4 animate-in fade-in duration-200">
                          {/* Banner Header */}
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-md shadow-emerald-200">
                              <FaCheckCircle />
                            </div>
                            <div>
                              <h4 className="text-base sm:text-lg font-black text-emerald-950">
                                🎉 Correct Answer!
                              </h4>
                              <p className="text-xs sm:text-sm font-semibold text-emerald-700">
                                You selected Option {selectedOpt?.option_label}, which is correct.
                              </p>
                            </div>
                          </div>

                          {/* Explanation Box */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200 space-y-2 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs font-black text-emerald-900 uppercase tracking-wider">
                              <FaLightbulb className="text-amber-500 text-base" />
                              <span>Detailed Explanation & Rationale</span>
                            </div>
                            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-line pt-1">
                              {currentQuestion.explanation ||
                                "Well done! Your selected option matches the official criteria."}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Bottom Navigation Bar */}
                <div className="bg-slate-50 border-t border-slate-200/90 px-6 sm:px-10 py-5 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                      currentIndex === 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm cursor-pointer"
                    }`}
                  >
                    <FaArrowLeft className="text-xs" />
                    <span>Previous</span>
                  </button>

                  <div className="text-xs sm:text-sm font-black text-slate-600 hidden sm:block">
                    Question {currentIndex + 1} of {totalQuestions}
                  </div>

                  {currentIndex < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 bg-[#882CFB] hover:bg-[#701cdb] text-white shadow-lg shadow-purple-200 transition cursor-pointer"
                    >
                      <span>Next Question</span>
                      <FaArrowRight className="text-xs" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(true)}
                      className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 bg-[#F7B439] hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-200 transition cursor-pointer"
                    >
                      <MdOutlineSend className="text-sm" />
                      <span>Finish & Submit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* QUESTION PALETTE / COLOR-CODED QUICK JUMP GRID (SIDEBAR) */}
              {totalQuestions > 1 && (
                <div className="w-full lg:w-80 xl:w-[350px] shrink-0 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm lg:sticky lg:top-24">
                  <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-slate-100">
                    <span className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                      <MdFormatListNumbered className="text-base text-[#882CFB]" />
                      <span>Question Navigation Palette ({totalQuestions} Total)</span>
                    </span>

                    {/* Color-Coded Palette Legend in English */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#882CFB] shrink-0"></span>
                        Current
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                        Correct ({scoreStats.correct})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                        Incorrect ({scoreStats.incorrect})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
                        Flagged ({flaggedCount})
                      </span>
                      <span className="flex items-center gap-1.5 col-span-2">
                        <span className="w-3 h-3 rounded-full bg-slate-200 shrink-0"></span>
                        Remaining ({scoreStats.unanswered})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 max-h-[calc(100vh-280px)] overflow-y-auto p-1">
                    {questions.map((q, idx) => {
                      const isCurrent = idx === currentIndex;
                      const selectedId = selectedAnswers[q.id];
                      const isAnswered =
                        selectedId !== undefined && selectedId !== null;
                      const isFlagged = Boolean(flaggedQuestions[q.id]);

                      // Calculate if this question was answered correctly
                      let isAnswerCorrect = false;
                      if (isAnswered) {
                        const correctOpt = q.options?.find(
                          (o) => o.is_correct || o.id === q.correct_option_id
                        );
                        const selOpt = q.options?.find((o) => o.id === selectedId);
                        isAnswerCorrect =
                          selOpt?.is_correct ||
                          (correctOpt && selectedId === correctOpt.id);
                      }

                      let btnStyle =
                        "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200";

                      if (isCurrent) {
                        btnStyle =
                          "bg-[#882CFB] text-white ring-2 ring-[#882CFB] ring-offset-2 font-black shadow-md";
                      } else if (isFlagged) {
                        btnStyle =
                          "bg-amber-100 text-amber-950 border border-amber-400 font-extrabold";
                      } else if (isAnswered) {
                        if (isAnswerCorrect) {
                          btnStyle =
                            "bg-emerald-100 text-emerald-950 border border-emerald-400 font-black";
                        } else {
                          btnStyle =
                            "bg-rose-100 text-rose-950 border border-rose-400 font-black";
                        }
                      }

                      return (
                        <button
                          key={q.id || idx}
                          type="button"
                          onClick={() => handleJumpToQuestion(idx)}
                          className={`relative w-10 h-10 rounded-xl text-xs font-black flex items-center justify-center transition cursor-pointer mx-auto ${btnStyle}`}
                        >
                          {idx + 1}
                          {isFlagged && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* LIGHTBOX IMAGE ZOOM MODAL */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900/60 p-4 sm:p-6 rounded-3xl border border-white/20 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-white border-b border-white/10 mb-3">
              <span className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                <FaSearchPlus className="text-amber-400 text-sm" />
                <span>Visual Diagram / Image Preview</span>
              </span>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="text-white hover:text-red-400 text-2xl transition p-1 cursor-pointer"
                title="Close Lightbox"
              >
                <IoCloseOutline />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center">
              <img
                src={zoomImage}
                alt="Enlarged Exam Visual"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                Confirm Exam Submission
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl cursor-pointer"
              >
                <IoCloseOutline />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              Are you sure you want to finish and submit your exam? Here is your real-time score and answer status:
            </p>

            {/* Modal Live Stats Overview in English */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Questions:</span>
                <span className="font-black text-slate-800">{totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Correct Answers:</span>
                <span className="font-black text-emerald-600">{scoreStats.correct}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Incorrect Answers:</span>
                <span className="font-black text-rose-600">{scoreStats.incorrect}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Remaining:</span>
                <span className="font-black text-slate-700">{scoreStats.unanswered}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Continue Test
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-3 rounded-2xl text-xs sm:text-sm font-black bg-[#882CFB] hover:bg-[#701cdb] text-white shadow-lg shadow-purple-200 transition cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
