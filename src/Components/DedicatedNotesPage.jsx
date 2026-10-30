import React, { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '@/Components/Navbar';
import Footer from '@/Components/Footer';
import Loader from '@/Components/loader';
import FormModal from '@/Components/FormModal';
import { DynamicSEO, generateSupportPageSchema } from "@/lib/seoHelper";
import { API_BASE_URL } from '../../apiconfig';
import { getCourseImageUrl } from '@/utils/imageHelper';
import {
  FaFileAlt,
  FaDownload,
  FaHome,
  FaRegClock,
  FaStar,
  FaBookmark,
  FaCheckCircle,
  FaCheckSquare,
  FaLightbulb,
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { IoLogoFacebook } from 'react-icons/io5';
import { FaSquareInstagram } from 'react-icons/fa6';
import { IoIosArrowForward } from 'react-icons/io';
import { MdOutlineNotes, MdVerified, MdMenuBook } from 'react-icons/md';
import { HiMiniArrowLongRight } from 'react-icons/hi2';

const safeHtml = (html) => {
  if (typeof window === 'undefined') return html || '';
  try {
    const DOMPurify = require('dompurify');
    let sanitized = DOMPurify.sanitize(html || '');
    sanitized = sanitized
      .replace(
        /linear-gradient\(135deg,\s*#1e3a8a\s*0%,\s*#2563eb\s*100%\)/gi,
        'linear-gradient(135deg, #882CFB 0%, #6366F1 100%)'
      )
      .replace(
        /linear-gradient\([^)]*?(?:#1e3a8a|#2563eb|#1d4ed8|#2e318d)[^)]*?\)/gi,
        'linear-gradient(135deg, #882CFB 0%, #6366F1 100%)'
      )
      .replace(
        /(background(?:-color)?\s*:\s*)(?:#2563eb|#1d4ed8|#1e40af|#1e3a8a|#2e318d|#3b82f6|rgb\(\s*37\s*,\s*99\s*,\s*235\s*\)|rgb\(\s*29\s*,\s*78\s*,\s*216\s*\)|rgb\(\s*30\s*,\s*58\s*,\s*138\s*\)|rgb\(\s*46\s*,\s*49\s*,\s*141\s*\))/gi,
        '$1#882CFB'
      )
      .replace(/\bbg-blue-(?:500|600|700|800|900)\b/gi, 'bg-[#882CFB]')
      .replace(/\btext-blue-(?:500|600|700|800)\b/gi, 'text-[#882CFB]')
      .replace(/\bborder-blue-(?:500|600|700|800)\b/gi, 'border-[#882CFB]');
    return sanitized;
  } catch (e) {
    return html || '';
  }
};

export default function DedicatedNotesPage({
  courseData,
  loading = false,
  active_country,
  url_title,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const courseTitle = useMemo(
    () =>
      courseData?.support_page?.title ||
      courseData?.course?.course_title ||
      courseData?.course?.name ||
      courseData?.course_title ||
      courseData?.courseHeading?.title ||
      courseData?.dynamicCourseHeading?.heading ||
      (url_title ? url_title.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Course Study Notes'),
    [courseData, url_title]
  );

  const courseDescription = useMemo(
    () =>
      courseData?.seo?.description ||
      courseData?.course?.short_description ||
      courseData?.courseDescription?.description ||
      courseData?.dynamicCourseHeading?.description ||
      '',
    [courseData]
  );

  const notesHtml = useMemo(() => {
    if (courseData?.support_page?.content) {
      return courseData.support_page.content;
    }
    if (Array.isArray(courseData?.aboutGeography) && courseData.aboutGeography.length > 0) {
      return courseData.aboutGeography.map((g) => g.description || '').join('<br/>');
    }
    return '';
  }, [courseData]);

  const keyfeatures = useMemo(() => {
    try {
      if (courseData?.keyfeatures) {
        return typeof courseData.keyfeatures === 'string'
          ? JSON.parse(courseData.keyfeatures)
          : courseData.keyfeatures;
      }
      return [];
    } catch (e) {
      return [];
    }
  }, [courseData]);

  const pdfUrl = useMemo(() => {
    if (courseData?.coursePDF?.curriculum_pdf_name) {
      return `${API_BASE_URL}/assets/courseCurriculum/${courseData.coursePDF.curriculum_pdf_name}`;
    }
    return null;
  }, [courseData]);

  const courseImage = useMemo(() => {
    const raw =
      courseData?.header_image ||
      courseData?.course?.header_image ||
      courseData?.support_page?.image ||
      courseData?.courseImage?.banner_image_path ||
      courseData?.certificationImage?.image_path ||
      courseData?.dynamicCourseHeading?.header_image;
    const defaultCourse =
      url_title && url_title.toLowerCase().includes('prince2')
        ? '/assets/img/prince2.jpg'
        : '/assets/landingpage/courses/course1.jpg';
    return getCourseImageUrl(raw, defaultCourse);
  }, [courseData, url_title]);

  const courseSlug = url_title || '';
  const mainCourseUrl = `/${courseSlug}`;

  const canonicalPath = `/${courseSlug}/notes`;
  const seoTitle = `${courseTitle} - Complete Study Notes & Revision Guide | ScholarAcad`;
  const seoDesc = `Download curated study notes, quick formula sheets, revision summaries, and key concepts for ${courseTitle}.`;

  const schemaBreadcrumbs = [
    { name: "Home", url: "/" },
    { name: courseTitle, url: mainCourseUrl },
    { name: "Notes & Revision Guide", url: canonicalPath }
  ];

  const schemaData = useMemo(() => {
    return generateSupportPageSchema({
      title: seoTitle,
      description: seoDesc,
      pageUrl: canonicalPath,
      courseName: courseTitle,
      courseData,
      imageUrl: courseImage,
      breadcrumbs: schemaBreadcrumbs
    });
  }, [seoTitle, seoDesc, canonicalPath, courseTitle, courseData, courseImage, schemaBreadcrumbs]);

  if (loading && !courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title={seoTitle}
        description={seoDesc}
        keywords={`${courseTitle}, study notes, revision guide, formula sheet, pdf`}
        canonicalUrl={canonicalPath}
        ogType="article"
        ogImage={courseImage}
        schemaData={schemaData}
      />

      <Navbar />

      <main className="min-h-screen bg-white text-gray-800 font-nunito">
        {/* Top Tab Bar (Image 3 & 5 style) */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-6 overflow-x-auto py-3 scrollbar-none text-xs sm:text-sm font-semibold text-gray-600">
              <span className="whitespace-nowrap pb-1 border-b-2 border-[#882CFB] text-[#882CFB] font-bold">
                Study Notes & Revision
              </span>
              <Link
                href={mainCourseUrl}
                className="whitespace-nowrap pb-1 border-b-2 border-transparent hover:text-[#882CFB] transition"
              >
                Course Overview
              </Link>
              <Link
                href={`/${courseSlug}/syllabus`}
                className="whitespace-nowrap pb-1 border-b-2 border-transparent hover:text-[#882CFB] transition"
              >
                Curriculum Syllabus
              </Link>
            </div>
          </div>
        </div>

        {/* Breadcrumb Header */}
        <div className="bg-[#FAF8FE] border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
              <Link
                href="/"
                className="flex items-center hover:text-[#882CFB] transition"
              >
                <FaHome className="mr-1 text-sm text-[#2E318D]" /> Home
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs shrink-0" />
              <Link
                href="/all-courses"
                className="hover:text-[#882CFB] transition"
              >
                Courses
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs shrink-0" />
              <Link
                href={mainCourseUrl}
                className="hover:text-[#882CFB] transition capitalize truncate max-w-[200px]"
              >
                {courseTitle}
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs shrink-0" />
              <span className="text-[#882CFB] font-semibold">Notes & Revision Guide</span>
            </nav>
          </div>
        </div>

        {/* Clean Light Hero Section (Pattern matching Image 3) */}
        <section className="bg-white py-8 lg:py-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Course Image Card (Clean white card matching Image 3) */}
              <div className="lg:col-span-5 flex justify-center lg:justify-start">
                <div className="relative w-full max-w-[480px] rounded-2xl border border-gray-200/90 bg-white p-3 shadow-md hover:shadow-lg transition-all flex items-center justify-center min-h-[240px] group">
                  <img
                    src={courseImage}
                    alt={courseTitle}
                    onError={(e) => {
                      e.currentTarget.src =
                        url_title && url_title.toLowerCase().includes('prince2')
                          ? '/assets/img/prince2.jpg'
                          : '/assets/landingpage/courses/course1.jpg';
                    }}
                    className="w-full h-auto max-h-[320px] object-contain rounded-xl group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Right Column: Title, Ratings, Highlights, CTA */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#882CFB] border border-purple-200 text-xs font-bold uppercase tracking-wider">
                  <MdOutlineNotes className="text-sm" />
                  Study Notes & Revision
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                  {courseTitle} Study Notes & Revision Guide
                </h1>

                {courseDescription && (
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {courseDescription}
                  </p>
                )}

                {/* Ratings row (matching Image 3) */}
                <div className="flex items-center flex-wrap gap-4 pt-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-base sm:text-lg">
                      <FcGoogle />
                      <FaStar className="text-yellow-400 text-sm" />
                      <span className="text-black font-semibold text-sm">5.0</span>
                    </div>
                    <div className="flex items-center gap-1 text-base sm:text-lg text-[#1877F2]">
                      <IoLogoFacebook />
                      <FaStar className="text-yellow-400 text-sm" />
                      <span className="text-black font-semibold text-sm">5.0</span>
                    </div>
                    <div className="flex items-center gap-1 text-base sm:text-lg text-[#E1306C]">
                      <FaSquareInstagram />
                      <FaStar className="text-yellow-400 text-sm" />
                      <span className="text-black font-semibold text-sm">5.0</span>
                    </div>
                  </div>
                  <div className="h-5 w-px bg-gray-300"></div>
                  <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
                    6000+ Enrolled
                  </span>
                </div>

                {/* Highlight Checkmark Points */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2.5">
                    <FaCheckSquare className="text-[#882CFB] text-base shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                      High-yield revision summaries & key framework cheatsheets
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FaCheckSquare className="text-[#882CFB] text-base shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                      Exam day strategies, formula sheets, and common pitfall analyses
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FaCheckSquare className="text-[#882CFB] text-base shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                      Instructor verified material updated for the current exam pattern
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex flex-wrap items-center gap-3.5">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#882CFB] hover:bg-[#7221D8] text-white font-semibold text-sm shadow-md hover:shadow-purple-500/20 transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Request Study Pack</span>
                    <HiMiniArrowLongRight className="text-lg" />
                  </button>

                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-sm transition shadow-xs"
                    >
                      <FaDownload className="text-amber-600" />
                      <span>Download PDF</span>
                    </a>
                  )}

                  <Link
                    href={mainCourseUrl}
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition"
                  >
                    Course Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Body Section (Pattern matching Image 4 & 5) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar (Image 4 pattern: Corporate Training & Trending Courses) */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-16">
              {/* Corporate Training Card (Peach background matching Image 4) */}
              <div className="relative rounded-2xl bg-[#F5DFD0] border border-orange-200/80 p-5 shadow-xs overflow-hidden group">
                <h3 className="text-base font-bold text-gray-900 tracking-wider uppercase mb-2">
                  CORPORATE TRAINING
                </h3>
                <ul className="text-sm text-gray-800 space-y-1.5 mb-4">
                  <li className="list-disc ml-4">Wide range of Training dates</li>
                  <li className="list-disc ml-4">Impactful Instructor-Led training</li>
                </ul>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#882CFB] hover:bg-[#7221D8] text-white text-xs font-semibold shadow-sm transition"
                >
                  <span>Contact For Training</span>
                  <HiMiniArrowLongRight />
                </button>
              </div>

              {/* Trending Courses Card (Mint background matching Image 4) */}
              <div className="relative rounded-2xl bg-[#E1F3F0] border border-cyan-200/80 p-5 shadow-xs overflow-hidden group">
                <h3 className="text-base font-bold text-gray-900 tracking-wider uppercase mb-2">
                  TRENDING COURSES
                </h3>
                <ul className="text-sm text-gray-800 space-y-1.5 mb-4">
                  <li className="list-disc ml-4">Wide range of Training courses</li>
                  <li className="list-disc ml-4">Impactful Instructor-Led training</li>
                </ul>
                <Link
                  href="/all-courses"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#882CFB] hover:bg-[#7221D8] text-white text-xs font-semibold shadow-sm transition"
                >
                  <span>View Courses</span>
                  <HiMiniArrowLongRight />
                </Link>
              </div>

              {/* Notes Features Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 uppercase tracking-wider">
                  Notes Summary
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm">
                  <li className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <FaFileAlt className="text-[#882CFB]" /> Format
                    </span>
                    <span className="font-semibold text-gray-800">PDF & Printable</span>
                  </li>
                  <li className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <FaRegClock className="text-[#882CFB]" /> Revision Time
                    </span>
                    <span className="font-semibold text-gray-800">~3 Hours Rapid</span>
                  </li>
                  <li className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <MdVerified className="text-[#882CFB]" /> Syllabus Match
                    </span>
                    <span className="font-semibold text-green-600">100% Aligned</span>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#882CFB] hover:bg-[#7221D8] text-white text-xs font-semibold text-center shadow-xs transition"
                  >
                    Get Free Sample Notes
                  </button>
                </div>
              </div>
            </div>

            {/* Right Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Dynamic Notes Content (if available) */}
              {notesHtml && (
                <div className="bg-[#FAF8FE] border border-purple-100 rounded-2xl p-6 sm:p-8 shadow-xs">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MdMenuBook className="text-[#882CFB]" />
                    Curated Revision Notes & Guide
                  </h2>
                  <div
                    className="prose max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: isMounted ? safeHtml(notesHtml) : notesHtml,
                    }}
                  />
                </div>
              )}

              {/* Key Features & High-Yield Summary - only if data exists */}
              {keyfeatures && keyfeatures.length > 0 && (
                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200/90">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <FaLightbulb className="text-amber-500" />
                    Key Focus Areas & Core Takeaways
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {keyfeatures.map((kf, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 hover:border-[#882CFB]/40 transition"
                      >
                        <h4 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
                          <FaCheckCircle className="text-[#882CFB] text-sm shrink-0" />
                          {typeof kf === 'string' ? kf : kf?.title || `Topic ${idx + 1}`}
                        </h4>
                        {kf?.description && (
                          <p className="text-xs text-gray-600 ml-5">
                            {kf.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured Revision Chapters */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200/90">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MdMenuBook className="text-[#882CFB]" />
                  Structured Revision Chapters
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-5">
                  Compact revision blocks summarizing core definitions, models, exam formulas, and high-frequency questions.
                </p>

                <div className="space-y-3.5">
                  <div className="border border-gray-200 rounded-xl p-4 hover:border-purple-200 transition bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2E318D] bg-purple-100 px-2.5 py-0.5 rounded-full">
                        Chapter 1
                      </span>
                      <span className="text-xs text-gray-500">Core Concepts</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mt-2">
                      Key Terminology, Frameworks & Definitions
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Quick overview of fundamental terminology, official acronyms, and standard exam definitions.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 hover:border-purple-200 transition bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2E318D] bg-purple-100 px-2.5 py-0.5 rounded-full">
                        Chapter 2
                      </span>
                      <span className="text-xs text-gray-500">Process & Execution</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mt-2">
                      Execution Flowcharts & Process Life Cycles
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Visual cheatsheets, input/output process mapping, and RACI governance matrices.
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-4 hover:border-purple-200 transition bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2E318D] bg-purple-100 px-2.5 py-0.5 rounded-full">
                        Chapter 3
                      </span>
                      <span className="text-xs text-gray-500">Exam Strategy</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mt-2">
                      Exam Tips, Common Pitfalls & High-Scoring Tactics
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Proven time management guidelines, elimination techniques for MCQs, and sample practice scenarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {isModalOpen && (
        <FormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          courseTitle={courseTitle}
        />
      )}
    </>
  );
}
