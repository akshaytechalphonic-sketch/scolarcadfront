import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import Loader from "@/Components/loader";
import { API_BASE_URL } from "../../apiconfig";
import { useAuth } from "@/context/AuthContext";
import { DynamicSEO, getCleanCanonicalUrl, generateSupportPageSchema } from "@/lib/seoHelper";
import {
  FaClock,
  FaQuestionCircle,
  FaRocket,
  FaCheckCircle,
  FaAward,
  FaPlay,
  FaExclamationTriangle,
  FaArrowRight,
  FaSearch,
  FaBookOpen,
  FaHistory,
  FaSave,
  FaTrashAlt,
} from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { IoHomeOutline } from "react-icons/io5";
import { MdQuiz, MdTimer, MdOutlineLayers, MdChecklist } from "react-icons/md";
import { BsCheckCircleFill, BsLightningChargeFill } from "react-icons/bs";

export default function DedicatedQuizzesPage({
  courseSlug: initialCourseSlug,
  initialQuizzes = null,
  courseData = null,
  active_country = "in",
  url_title,
}) {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState(initialQuizzes || []);
  const [courseInfo, setCourseInfo] = useState(courseData || null);
  const [loading, setLoading] = useState(!initialQuizzes);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSavedAttempt, setHasSavedAttempt] = useState(false);

  const targetCourseSlug = useMemo(() => {
    return (
      initialCourseSlug ||
      url_title ||
      courseData?.course?.slug ||
      courseData?.slug ||
      ""
    );
  }, [initialCourseSlug, url_title, courseData]);

  // Check saved attempt in localStorage
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const hasQuizAttempt = keys.some((k) => k.startsWith("scholaracad_quiz_attempt_"));
      setHasSavedAttempt(hasQuizAttempt);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleClearSaved = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((k) => {
        if (k.startsWith("scholaracad_quiz_attempt_")) {
          localStorage.removeItem(k);
        }
      });
      setHasSavedAttempt(false);
      alert("Saved attempt cleared successfully.");
    } catch (e) {
      // ignore
    }
  };

  // Client-side fetch if quizzes were not loaded via SSR
  useEffect(() => {
    if (!targetCourseSlug) return;
    if (initialQuizzes && initialQuizzes.length > 0) {
      setQuizzes(initialQuizzes);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchQuizzes() {
      setLoading(true);
      setError(null);
      try {
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const endpoint = `${API_BASE_URL}/api/courses/${targetCourseSlug}/quizzes`;
        const res = await fetch(endpoint, {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          if (isMounted) {
            setQuizzes([]);
            setError(
              res.status === 404
                ? "No published quizzes or mock exams available for this course."
                : "Failed to fetch quizzes. Please try again later."
            );
          }
          if (isMounted) setLoading(false);
          return;
        }

        const data = await res.json();
        if (isMounted) {
          if (data?.status && Array.isArray(data?.data) && data.data.length > 0) {
            setQuizzes(data.data);
            if (data.course) {
              setCourseInfo(data.course);
            }
            setError(null);
          } else {
            setQuizzes([]);
            setError("No published quizzes or mock exams available for this course.");
          }
        }
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        if (isMounted) {
          setQuizzes([]);
          setError("Network error while loading quizzes. Please check your connection.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchQuizzes();

    return () => {
      isMounted = false;
    };
  }, [targetCourseSlug, token, initialQuizzes]);

  // Display course title
  const courseDisplayName = useMemo(() => {
    if (courseInfo?.name) return courseInfo.name;
    if (courseInfo?.title) return courseInfo.title;
    if (courseData?.course?.name) return courseData.course.name;
    if (targetCourseSlug) {
      return targetCourseSlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    return "Exam Simulator";
  }, [courseInfo, courseData, targetCourseSlug]);

  // Total questions count calculation
  const totalQuestionsSum = useMemo(() => {
    if (!Array.isArray(quizzes) || quizzes.length === 0) return 180;
    return quizzes.reduce((sum, q) => sum + (Number(q?.total_questions) || 0), 0);
  }, [quizzes]);

  // Primary mock quiz and practice quiz from list
  const primaryMockQuiz = useMemo(() => {
    return quizzes.find((q) => (q?.type || "").toLowerCase().includes("mock")) || quizzes[0];
  }, [quizzes]);

  const primaryPracticeQuiz = useMemo(() => {
    return quizzes.find((q) => (q?.type || "").toLowerCase().includes("practice")) || quizzes[1] || quizzes[0];
  }, [quizzes]);

  // Filter quizzes by type and search query
  const filteredQuizzes = useMemo(() => {
    if (!Array.isArray(quizzes)) return [];
    return quizzes.filter((quiz) => {
      const matchesFilter =
        selectedFilter === "all" ||
        quiz?.type?.toLowerCase() === selectedFilter.toLowerCase() ||
        (selectedFilter === "mock" && quiz?.type?.toLowerCase().includes("mock")) ||
        (selectedFilter === "practice" && quiz?.type?.toLowerCase().includes("practice"));

      const matchesSearch =
        !searchQuery ||
        quiz?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz?.type?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [quizzes, selectedFilter, searchQuery]);

  // Helper for human-readable duration
  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "180 Minutes";
    const mins = Number(minutes);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m (${mins} mins)` : `${hrs} hrs (${mins} mins)`;
    }
    return `${mins} Minutes`;
  };

  const quizzesPageSchema = useMemo(() => {
    return generateSupportPageSchema({
      pageTitle: `${courseDisplayName} Quizzes & Exam Simulator`,
      pageDescription: `Standalone offline/online practice and exam simulator for ${courseDisplayName}. Practice mode, timed exam mode, instant scoring, and verified question bank.`,
      pageUrl: `/${targetCourseSlug}/quizzes`,
      courseName: courseDisplayName,
      courseData: courseInfo || courseData,
      breadcrumbs: [
        { name: "Home", url: "/" },
        { name: courseDisplayName, url: `/${targetCourseSlug}` },
        { name: "Quizzes", url: `/${targetCourseSlug}/quizzes` },
      ],
    });
  }, [courseDisplayName, targetCourseSlug, courseInfo, courseData]);

  if (loading) {
    return (
      <>
        <DynamicSEO
          title={`Loading Quizzes — ${courseDisplayName} | ScholarAcad`}
          description="Loading course quizzes and exam simulator."
          robots="noindex, nofollow"
        />
        <Navbar />
        <main className="min-h-[70vh] bg-[#f8fafc] flex flex-col items-center justify-center p-8 space-y-4">
          <Loader />
          <p className="text-slate-500 text-sm font-medium animate-pulse">
            Loading course quizzes and exam simulator...
          </p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !quizzes || quizzes.length === 0) {
    return (
      <>
        <DynamicSEO
          title={`404 - Exam Simulator Not Available | ScholarAcad`}
          description="The requested quizzes or exam simulator are not available or not published for this course."
          robots="noindex, nofollow"
        />
        <Navbar />
        <main className="min-h-[70vh] bg-[#f8fafc] flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 text-center shadow-sm border border-slate-200/80 space-y-6">
            <div className="w-20 h-20 bg-purple-50 text-[#882CFB] rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-inner">
              <MdQuiz />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-black tracking-widest text-[#882CFB] uppercase bg-purple-100/60 px-3.5 py-1 rounded-full">
                404 Not Found
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Exam Simulator Not Available
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {error ||
                  `There are no published quizzes or mock exams available for "${courseDisplayName}". This module is either not active or requires special course permissions.`}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href={targetCourseSlug ? `/${targetCourseSlug}` : "/all-courses"}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#882CFB] hover:bg-[#701cdb] text-white shadow-md transition"
              >
                View Course Overview
              </Link>
              <Link
                href="/all-courses"
                className="py-3 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Browse All Courses
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <DynamicSEO
        title={`${courseDisplayName} — Quizzes & Exam Simulator | ScholarAcad`}
        description={`Standalone practice and exam simulator for ${courseDisplayName}. Practice mode, timed exam mode, instant scoring, and verified question bank.`}
        canonicalUrl={getCleanCanonicalUrl(`/${targetCourseSlug}/quizzes`)}
        keywords={`${courseDisplayName} mock exam, ${courseDisplayName} practice test, quizzes`}
        ogTitle={`${courseDisplayName} — Quizzes & Exam Simulator | ScholarAcad`}
        ogDescription={`Standalone practice and exam simulator for ${courseDisplayName}.`}
        ogUrl={getCleanCanonicalUrl(`/${targetCourseSlug}/quizzes`)}
        schemaData={quizzesPageSchema}
        robots="index, follow"
      />

      <Navbar />

      <main className="min-h-screen bg-[#f3f4f8]">
        {/* Top Header Banner matching ScholarAcad Clean Light Pattern */}
        <header className="bg-white border-b border-gray-200 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-center shadow-xs">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Breadcrumb */}
            <nav className="flex items-center justify-center flex-wrap gap-2 text-xs text-gray-500 mb-2">
              <Link
                href="/"
                className="hover:text-[#882CFB] flex items-center gap-1.5 transition-colors"
              >
                <IoHomeOutline className="text-sm text-[#2E318D]" />
                <span>Home</span>
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs" />
              <Link
                href="/all-courses"
                className="hover:text-[#882CFB] transition-colors"
              >
                Courses
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs" />
              <Link
                href={`/${targetCourseSlug}`}
                className="hover:text-[#882CFB] line-clamp-1 max-w-[200px] sm:max-w-none transition-colors"
              >
                {courseDisplayName}
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs" />
              <span className="text-[#882CFB] font-semibold">Exam Simulator</span>
            </nav>

            {/* Title with Simulator Icon */}
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                {courseDisplayName} — Exam Simulator
              </h1>
            </div>

            {/* Subtitle description */}
            <p className="text-xs sm:text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Standalone practice and exam simulator generated from the official question bank. Practice mode shows explanations immediately, while Exam mode simulates real exam timing and scoring.
            </p>

            {/* Feature Capsule Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-[#882CFB] border border-purple-200 transition">
                Practice Mode
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-[#882CFB] border border-purple-200 transition">
                Exam Mode with Timer
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-[#882CFB] border border-purple-200 transition">
                Review Wrong / Flagged / Unanswered
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-[#882CFB] border border-purple-200 transition">
                Highlight + Strike Through
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-[#882CFB] border border-purple-200 transition">
                Source Explanations Embedded
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
          {/* Card 1: Choose How You Want To Study (Matches 3 Study Modes) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Choose how you want to study
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your preferred learning mode or continue where you left off.
              </p>
            </div>

            {/* 3 Main Study Mode Cards (Screenshot design) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Box 1: Practice Mode */}
              <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-pink-600 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    <span>Practice Mode</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    One question at a time. After choosing an answer, the correct option and explanation appear immediately.
                  </p>
                </div>

                <Link
                  href={
                    primaryPracticeQuiz
                      ? `/${active_country || "in"}/${targetCourseSlug}/quizzes/${primaryPracticeQuiz.slug || primaryPracticeQuiz.id}`
                      : `/${active_country || "in"}/${targetCourseSlug}/quizzes`
                  }
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#2E318D] hover:bg-[#1f236a] text-white text-center shadow-sm transition block cursor-pointer"
                >
                  Start Practice
                </Link>
              </div>

              {/* Box 2: Exam Mode with Timer */}
              <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[#882CFB] font-bold text-sm">
                    <MdTimer className="text-base text-[#882CFB]" />
                    <span>Exam Mode</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    One question at a time with a full exam timer. Explanations and correct answers are hidden until you submit.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                    <span className="font-semibold text-slate-500">Timer minutes:</span>
                    <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-md font-bold text-slate-800">
                      {primaryMockQuiz?.duration_minutes || 180}
                    </span>
                  </div>
                </div>

                <Link
                  href={
                    primaryMockQuiz
                      ? `/${active_country || "in"}/${targetCourseSlug}/quizzes/${primaryMockQuiz.slug || primaryMockQuiz.id}`
                      : `/${active_country || "in"}/${targetCourseSlug}/quizzes`
                  }
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#882CFB] hover:bg-[#701cdb] text-white text-center shadow-sm transition block cursor-pointer"
                >
                  Start Exam
                </Link>
              </div>

              {/* Box 3: Resume Saved Attempt */}
              <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-[#882CFB] font-bold text-sm">
                    <FaSave className="text-sm text-[#882CFB]" />
                    <span>Resume</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Continue your saved attempt from this browser. Saved progress stays inside this HTML/browser only.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={
                      primaryMockQuiz
                        ? `/${active_country || "in"}/${targetCourseSlug}/quizzes/${primaryMockQuiz.slug || primaryMockQuiz.id}/questions`
                        : `/${active_country || "in"}/${targetCourseSlug}/quizzes`
                    }
                    className="flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-center shadow-sm transition block truncate cursor-pointer"
                  >
                    Resume Saved Attempt
                  </Link>

                  <button
                    type="button"
                    onClick={handleClearSaved}
                    className="py-2 px-2.5 rounded-xl text-[11px] font-bold bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition cursor-pointer"
                    title="Clear saved progress"
                  >
                    Clear Saved
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-Section: Available Question Sets in Bank */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MdOutlineLayers className="text-[#882CFB]" />
                  <span>Available Question Bank Sets ({quizzes.length})</span>
                </h3>

                {/* Filter Pills */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFilter("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedFilter === "all"
                        ? "bg-[#882CFB] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedFilter("mock")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedFilter === "mock"
                        ? "bg-[#882CFB] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Mock
                  </button>
                  <button
                    onClick={() => setSelectedFilter("practice")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedFilter === "practice"
                        ? "bg-[#882CFB] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Practice
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="py-10 flex flex-col items-center justify-center space-y-3">
                  <Loader />
                  <p className="text-slate-500 text-xs font-medium animate-pulse">
                    Loading quizzes from question bank...
                  </p>
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center max-w-md mx-auto my-4">
                  <FaExclamationTriangle className="text-red-500 text-xl mx-auto mb-1.5" />
                  <h4 className="text-xs font-bold text-red-900 mb-1">
                    Unable to load quizzes
                  </h4>
                  <p className="text-xs text-red-700 mb-3">{error}</p>
                </div>
              )}

              {/* Question Sets Grid */}
              {!loading && !error && filteredQuizzes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQuizzes.map((quiz, index) => {
                    const isMock = (quiz?.type || "").toLowerCase().includes("mock");

                    return (
                      <div
                        key={quiz?.id || quiz?.slug || index}
                        className="bg-white border border-slate-200/90 hover:border-[#882CFB]/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300 group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isMock
                                  ? "bg-[#F4EFFF] text-[#882CFB] border border-[#E4D3FF]"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isMock ? "bg-[#882CFB] animate-pulse" : "bg-emerald-600"
                                }`}
                              ></span>
                              {isMock ? "Mock Exam" : "Practice Quiz"}
                            </span>

                            <span className="text-[11px] text-slate-400 font-semibold">
                              #{index + 1}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#882CFB] transition-colors line-clamp-1 mb-1.5">
                            {quiz?.title || "Exam Set"}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                            {quiz?.description ||
                              "Comprehensive questions designed to match real exam conditions with detailed answer explanations."}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 py-2 px-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
                                Questions
                              </span>
                              <span className="font-bold text-slate-800">
                                {quiz?.total_questions || 0} Items
                              </span>
                            </div>
                            <div className="border-l border-slate-200 pl-2">
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
                                Duration
                              </span>
                              <span className="font-bold text-slate-800">
                                {formatDuration(quiz?.duration_minutes)}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/${targetCourseSlug}/quizzes/${quiz?.slug || quiz?.id}`}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isMock
                                ? "bg-[#882CFB] hover:bg-[#701cdb] text-white shadow-sm"
                                : "bg-[#2E318D] hover:bg-[#1f236a] text-white shadow-sm"
                            }`}
                          >
                            <FaPlay className="text-[9px]" />
                            <span>{isMock ? "Start Exam" : "Start Practice"}</span>
                            <FaArrowRight className="text-[10px] ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Quiz Overview (Matches bottom section of screenshot) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-6">
              Quiz Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Stat 1: Total Items */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#2E318D] mb-1">
                  {loading ? "..." : totalQuestionsSum}
                </div>
                <div className="text-xs font-bold text-slate-800 mb-1">
                  Total Items
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Includes duplicate source numbering exactly as present in source.
                </p>
              </div>

              {/* Stat 2: 1x1 Display */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#2E318D] mb-1">
                  1×1
                </div>
                <div className="text-xs font-bold text-slate-800 mb-1">
                  Question display
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  One question at a time for focused practice and test conditions.
                </p>
              </div>

              {/* Stat 3: CSV Export */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#2E318D] mb-1">
                  CSV
                </div>
                <div className="text-xs font-bold text-slate-800 mb-1">
                  Result export
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Download detailed results and review question breakdowns.
                </p>
              </div>

              {/* Stat 4: Offline / Standalone */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#2E318D] mb-1">
                  Offline
                </div>
                <div className="text-xs font-bold text-slate-800 mb-1">
                  Standalone
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Open directly in a browser with instant response and fast loading.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Subtext (Matches bottom text in screenshot) */}
          <div className="text-center text-[11px] text-slate-400 py-2">
            Enhanced {courseDisplayName} Simulator. Questions, answer keys, explanations, highlights, strike-through choices, flags, and progress are embedded in this standalone browser experience.
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
