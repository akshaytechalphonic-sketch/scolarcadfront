import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
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
  FaArrowLeft,
  FaBookOpen,
  FaGraduationCap,
  FaShieldAlt,
  FaInfoCircle,
  FaSpinner,
} from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { IoHomeOutline } from "react-icons/io5";
import { MdTimer, MdQuiz, MdPercent, MdOutlineAssignmentTurnedIn } from "react-icons/md";
import { BsLightningChargeFill } from "react-icons/bs";

export default function DedicatedQuizDetailPage({
  courseSlug: initialCourseSlug,
  quizSlug: initialQuizSlug,
  initialQuizData = null,
  active_country = "in",
  url_title,
}) {
  const router = useRouter();
  const { token } = useAuth();
  const [data, setData] = useState(initialQuizData || null);
  const [loading, setLoading] = useState(!initialQuizData);
  const [error, setError] = useState(null);

  // Attempt creation state
  const [startingMode, setStartingMode] = useState(null);
  const [attemptError, setAttemptError] = useState(null);

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

  // Client-side fetch if data not loaded via SSR
  useEffect(() => {
    if (!courseSlug || !quizSlug) return;
    if (initialQuizData && initialQuizData.quiz) {
      setData(initialQuizData);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchQuizDetail() {
      setLoading(true);
      setError(null);
      try {
        const headers = {
          Accept: "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const endpoint = `${API_BASE_URL}/api/courses/${courseSlug}/quizzes/${quizSlug}`;
        const res = await fetch(endpoint, {
          method: "GET",
          headers,
        });

        if (!res.ok) {
          if (res.status === 404) {
            if (isMounted) setError("Quiz not found for this course.");
          } else {
            if (isMounted) setError("Failed to fetch quiz details. Please try again later.");
          }
          if (isMounted) setLoading(false);
          return;
        }

        const json = await res.json();
        if (isMounted) {
          if (json?.status && json?.data) {
            setData(json.data);
            setError(null);
          } else {
            setError("Invalid quiz data received.");
          }
        }
      } catch (err) {
        console.error("Error fetching quiz detail:", err);
        if (isMounted) {
          setError("Network error while loading quiz details. Please check your connection.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchQuizDetail();

    return () => {
      isMounted = false;
    };
  }, [courseSlug, quizSlug, token, initialQuizData]);

  const course = data?.course || {};
  const quiz = data?.quiz || {};

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

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "Untimed";
    const mins = Number(minutes);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `${hrs}h ${rem}m (${mins} mins)` : `${hrs} hrs (${mins} mins)`;
    }
    return `${mins} Minutes`;
  };

  const isMock = (quiz?.type || "").toLowerCase().includes("mock");

  const handleStartAttempt = async (mode = "exam") => {
    if (startingMode) return; // Prevent duplicate clicks
    if (!courseSlug || !quizSlug) return;

    setStartingMode(mode);
    setAttemptError(null);

    try {
      if (!token) {
        setAttemptError("Login required to start or resume this exam simulation. Please log in to your account.");
        setStartingMode(null);
        return;
      }

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Call Start Attempt API (POST /api/courses/{courseSlug}/quizzes/{quizSlug}/start)
      const res = await fetch(
        `${API_BASE_URL}/api/courses/${courseSlug}/quizzes/${quizSlug}/start`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ mode }),
        }
      );

      if (res.status === 404) {
        setAttemptError("This quiz or exam simulator is currently not published or not available.");
        setStartingMode(null);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        setAttemptError("Login session expired or access denied. Please log in with an enrolled account.");
        setStartingMode(null);
        return;
      }

      const json = await res.json();

      if (res.ok && json?.status) {
        const attemptId = json?.data?.attempt_id || json?.attempt_id;
        
        // Save active attempt details in sessionStorage
        try {
          if (attemptId) {
            sessionStorage.setItem(
              "scholaracad_active_attempt",
              JSON.stringify({
                attempt_id: attemptId,
                mode,
                courseSlug,
                quizSlug,
                started_at: new Date().toISOString(),
              })
            );
          }
        } catch (e) {
          console.warn("Session storage error", e);
        }

        // Navigate dynamically to the questions screen with attempt_id and mode
        const query = { mode };
        if (attemptId) query.attempt_id = attemptId;

        router.push({
          pathname: `/${courseSlug}/quizzes/${quizSlug}/questions`,
          query,
        });
      } else {
        setAttemptError(
          json?.message || "Failed to start quiz attempt. Please try again."
        );
      }
    } catch (err) {
      console.error("Error starting attempt:", err);
      setAttemptError("Network error while starting attempt. Please check your connection.");
    } finally {
      setStartingMode(null);
    }
  };

  const quizDetailSchema = useMemo(() => {
    return generateSupportPageSchema({
      pageTitle: `${quiz?.title || "Quiz Details"} - ${courseDisplayName}`,
      pageDescription:
        quiz?.description ||
        `Practice ${quiz?.title || "interactive quiz"} for ${courseDisplayName} at ScholarAcad.`,
      pageUrl: `/${courseSlug}/quizzes/${quizSlug}`,
      courseName: courseDisplayName,
      courseData: data,
      breadcrumbs: [
        { name: "Home", url: "/" },
        { name: "Courses", url: "/all-courses" },
        { name: courseDisplayName, url: `/${courseSlug}` },
        { name: "Quizzes", url: `/${courseSlug}/quizzes` },
        { name: quiz?.title || "Quiz Details", url: `/${courseSlug}/quizzes/${quizSlug}` },
      ],
    });
  }, [quiz, courseDisplayName, courseSlug, quizSlug, data]);

  return (
    <>
      <DynamicSEO
        title={`${quiz?.title || "Quiz Details"} — ${courseDisplayName} | ScholarAcad`}
        description={
          quiz?.description ||
          `Practice ${quiz?.title || "interactive quiz"} for ${courseDisplayName} at ScholarAcad.`
        }
        canonicalUrl={getCleanCanonicalUrl(`/${courseSlug}/quizzes/${quizSlug}`)}
        keywords={`${quiz?.title || "quiz"}, ${courseDisplayName}, mock exam, practice exam`}
        ogTitle={`${quiz?.title || "Quiz Details"} — ${courseDisplayName} | ScholarAcad`}
        ogDescription={
          quiz?.description ||
          `Practice ${quiz?.title || "interactive quiz"} for ${courseDisplayName} at ScholarAcad.`
        }
        ogUrl={getCleanCanonicalUrl(`/${courseSlug}/quizzes/${quizSlug}`)}
        schemaData={quizDetailSchema}
        robots="index, follow"
      />

      <Navbar />

      <main className="min-h-screen bg-[#f3f4f8]">
        {/* Header Banner matching ScholarAcad Clean Light Pattern */}
        <header className="bg-white border-b border-gray-200 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-center shadow-xs">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Breadcrumb Navigation */}
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
                href={`/${courseSlug}`}
                className="hover:text-[#882CFB] line-clamp-1 max-w-[180px] sm:max-w-none transition-colors"
              >
                {courseDisplayName}
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs" />
              <Link
                href={`/${courseSlug}/quizzes`}
                className="hover:text-[#882CFB] transition-colors"
              >
                Quizzes
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs" />
              <span className="text-[#882CFB] font-semibold line-clamp-1 max-w-[200px]">
                {quiz?.title || "Details"}
              </span>
            </nav>

            {/* Title */}
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                {quiz?.title || "Quiz Details"}
              </h1>
            </div>

            {/* Course Name Subtitle */}
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Course: <span className="text-[#882CFB] font-semibold">{courseDisplayName}</span>
            </p>

            {/* Feature Capsule Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#882CFB] border border-purple-200">
                {isMock ? "Full Mock Exam Simulator" : "Topic Practice Quiz"}
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#882CFB] border border-purple-200">
                Verified Questions
              </span>
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-[#882CFB] border border-purple-200">
                Detailed Explanations
              </span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
          {/* Back button */}
          <div>
            <Link
              href={`/${courseSlug}/quizzes`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#882CFB] hover:text-[#2E318D] bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow"
            >
              <FaArrowLeft className="text-xs" />
              <span>Back to All Quizzes</span>
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-3xl p-16 shadow-sm border border-slate-200 flex flex-col items-center justify-center space-y-4">
              <Loader />
              <p className="text-slate-500 text-sm font-medium animate-pulse">
                Loading quiz details from server...
              </p>
            </div>
          )}

          {/* Error / 404 State */}
          {!loading && error && (
            <div className="bg-white rounded-3xl p-12 text-center border border-red-200 shadow-sm max-w-lg mx-auto my-6">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4">
                <FaExclamationTriangle />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Quiz Not Available
              </h2>
              <p className="text-sm text-slate-500 mb-6">{error}</p>
              <Link
                href={`/${active_country || "in"}/${courseSlug}/quizzes`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#882CFB] text-white rounded-xl text-xs font-bold hover:bg-[#701cdb] transition shadow-sm"
              >
                <FaArrowLeft className="text-xs" />
                <span>Return to Quizzes Listing</span>
              </Link>
            </div>
          )}

          {/* Quiz Details Main Card */}
          {!loading && !error && data && quiz && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-8">
                {/* Header Info */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold ${
                        isMock
                          ? "bg-[#F4EFFF] text-[#882CFB] border border-[#E4D3FF]"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isMock ? "bg-[#882CFB] animate-pulse" : "bg-emerald-600"
                        }`}
                      ></span>
                      {isMock ? "Mock Exam" : "Practice Quiz"}
                    </span>

                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      Status: {quiz?.status ? quiz.status.toUpperCase() : "PUBLISHED"}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {quiz?.title}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
                    {quiz?.description ||
                      "Full-length exam simulator designed to prepare you for actual exam conditions with instant feedback and comprehensive performance evaluation."}
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Questions */}
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F4EFFF] text-[#882CFB] flex items-center justify-center text-xl shrink-0">
                      <FaQuestionCircle />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Total Questions
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {quiz?.total_questions || 0} Items
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#F7B439] flex items-center justify-center text-xl shrink-0">
                      <FaClock />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Duration / Timer
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {formatDuration(quiz?.duration_minutes)}
                      </span>
                    </div>
                  </div>

                  {/* Passing Score */}
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                      <MdPercent />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Passing Score
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {quiz?.passing_score ? `${quiz.passing_score}%` : "Not Specified"}
                      </span>
                    </div>
                  </div>

                  {/* Quiz Type */}
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F4EFFF] text-[#882CFB] flex items-center justify-center text-xl shrink-0">
                      <MdQuiz />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Quiz Type
                      </span>
                      <span className="text-lg font-black text-slate-900 capitalize">
                        {quiz?.type ? quiz.type.replace(/_/g, " ") : "Quiz"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instructions & Guidelines Box */}
                <div className="bg-[#F4EFFF]/60 border border-[#E4D3FF] rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#2E318D]">
                    <FaInfoCircle className="text-base text-[#882CFB]" />
                    <span>Important Exam Instructions</span>
                  </div>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
                    <li>
                      <strong>Practice Mode:</strong> Provides instant answer feedback and detailed rationales after every question.
                    </li>
                    <li>
                      <strong>Exam Mode:</strong> Simulates strict timed testing without hints. Results are calculated upon final submission.
                    </li>
                    <li>
                      Progress is automatically tracked in your browser session.
                    </li>
                  </ul>
                </div>

                {/* Attempt Error Message */}
                {attemptError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2.5">
                    <FaExclamationTriangle className="text-red-500 shrink-0 text-base" />
                    <span>{attemptError}</span>
                  </div>
                )}

                {/* Action Buttons (Start Exam & Start Practice with API Integration) */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    disabled={Boolean(startingMode)}
                    onClick={() => handleStartAttempt("exam")}
                    className={`flex-1 py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-md shadow-purple-200 ${
                      startingMode === "exam"
                        ? "bg-[#701cdb] text-white opacity-90 cursor-wait"
                        : Boolean(startingMode)
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-[#882CFB] hover:bg-[#701cdb] text-white cursor-pointer"
                    }`}
                  >
                    {startingMode === "exam" ? (
                      <>
                        <FaSpinner className="text-xs animate-spin" />
                        <span>Starting Exam...</span>
                      </>
                    ) : (
                      <>
                        <FaPlay className="text-xs" />
                        <span>Start Exam</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(startingMode)}
                    onClick={() => handleStartAttempt("practice")}
                    className={`flex-1 py-3.5 px-6 rounded-xl text-sm font-bold border-2 flex items-center justify-center gap-2.5 transition-all ${
                      startingMode === "practice"
                        ? "border-[#701cdb] bg-purple-50 text-[#701cdb] cursor-wait"
                        : Boolean(startingMode)
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "border-[#882CFB] bg-white hover:bg-[#F4EFFF] text-[#882CFB] cursor-pointer"
                    }`}
                  >
                    {startingMode === "practice" ? (
                      <>
                        <FaSpinner className="text-xs animate-spin" />
                        <span>Starting Practice...</span>
                      </>
                    ) : (
                      <>
                        <FaBookOpen className="text-xs" />
                        <span>Start Practice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Subtext */}
          <div className="text-center text-[11px] text-slate-400 py-2">
            Enhanced {courseDisplayName} Simulator. Questions, answer keys, explanations, highlights, strike-through choices, flags, and progress are embedded in this standalone browser experience.
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
