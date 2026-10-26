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
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaCheckSquare,
  FaBook,
  FaHome,
  FaDownload,
  FaGraduationCap,
  FaRegClock,
  FaStar,
  FaAward,
  FaMinus,
  FaPlus,
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { IoLogoFacebook, IoCheckmarkCircleSharp } from 'react-icons/io5';
import { FaSquareInstagram } from 'react-icons/fa6';
import { IoIosArrowForward } from 'react-icons/io';
import { MdOutlineSchool, MdOutlineMenuBook, MdVerified } from 'react-icons/md';
import { HiMiniArrowLongRight } from 'react-icons/hi2';
import { BsCheck2Circle } from 'react-icons/bs';

const replaceBrandColors = (rawHtml) => {
  if (!rawHtml) return '';
  return rawHtml
    .replace(
      /linear-gradient\(135deg,\s*#1e3a8a\s*0%,\s*#2563eb\s*100%\)/gi,
      'linear-gradient(135deg, #882CFB 0%, #4347CA 100%)'
    )
    .replace(
      /linear-gradient\([^)]*?(?:#1e3a8a|#2563eb|#1d4ed8|#2e318d)[^)]*?\)/gi,
      'linear-gradient(135deg, #882CFB 0%, #4347CA 100%)'
    )
    .replace(
      /(background(?:-color)?\s*:\s*)(?:#2563eb|#1d4ed8|#1e40af|#1e3a8a|#2e318d|#3b82f6|rgb\(\s*37\s*,\s*99\s*,\s*235\s*\)|rgb\(\s*29\s*,\s*78\s*,\s*216\s*\)|rgb\(\s*30\s*,\s*58\s*,\s*138\s*\)|rgb\(\s*46\s*,\s*49\s*,\s*141\s*\))/gi,
      '$1#882CFB'
    )
    .replace(/\bbg-blue-(?:500|600|700|800|900)\b/gi, 'bg-[#882CFB]')
    .replace(/\btext-blue-(?:500|600|700|800)\b/gi, 'text-[#882CFB]')
    .replace(/\bborder-blue-(?:500|600|700|800)\b/gi, 'border-[#882CFB]');
};

const safeHtml = (html) => {
  if (!html) return '';
  const transformed = replaceBrandColors(html);
  if (typeof window === 'undefined') return transformed;
  try {
    const DOMPurify = require('dompurify');
    return DOMPurify.sanitize(transformed);
  } catch (e) {
    return transformed;
  }
};

const safeJsonParse = (val, fallback = {}) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
};

const CHEVRON_STYLES = [
  { icon: <BsCheck2Circle />, iconBg: "bg-sky-400", contentBg: "bg-sky-100" },
  { icon: <BsCheck2Circle />, iconBg: "bg-emerald-400", contentBg: "bg-emerald-100" },
  { icon: <BsCheck2Circle />, iconBg: "bg-purple-400", contentBg: "bg-purple-100" },
  { icon: <BsCheck2Circle />, iconBg: "bg-blue-400", contentBg: "bg-blue-100" },
];

function ChevronItem({ text, index }) {
  const style = CHEVRON_STYLES[index % CHEVRON_STYLES.length];
  return (
    <div className="flex items-stretch overflow-hidden rounded-md shadow-xs transition hover:shadow-sm">
      <div className={`${style.iconBg} w-16 sm:w-20 shrink-0 flex items-center justify-center text-white text-xl`}>
        {style.icon}
      </div>
      <div className={`${style.contentBg} flex items-center px-4 py-3 text-gray-800 font-medium text-xs sm:text-sm w-full clip-chevron-right`}>
        {text}
      </div>
    </div>
  );
}

export default function DedicatedSyllabusPage({
  courseData,
  loading = false,
  active_country,
  url_title,
  pageType = "syllabus",
}) {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Parse Eligibility Pointers
  let certificatelist = [];
  try {
    const rawElig = courseData?.certificateEligibility?.eligibility_pointers || "[]";
    certificatelist = typeof rawElig === "string" ? JSON.parse(rawElig) : rawElig;
    if (!Array.isArray(certificatelist)) certificatelist = [];
  } catch (e) {
    certificatelist = [];
  }

  const hasEligibility = Boolean(
    certificatelist.length > 0 ||
    courseData?.courseDescription?.eligibility ||
    courseData?.allHeadline?.eligibility
  );

  // Parse Roadmap
  const parseRoadmapPoint = (val) => {
    try {
      const obj = typeof val === "string" ? JSON.parse(val) : val;
      const heading = obj?.heading?.trim();
      return heading && heading !== "NA" && heading !== "Na" && heading.toLowerCase() !== "no details available" ? obj : null;
    } catch (e) {
      return null;
    }
  };

  const roadmapPoints = [
    {
      data: parseRoadmapPoint(courseData?.certificationPath?.pointer_one),
      bg: "#FFD9D9",
      badge: "W1",
      badgeColor: "#FFB3B3",
      icon: "/assets/landingpage/msp_three_weekicon/studying_exam.svg",
    },
    {
      data: parseRoadmapPoint(courseData?.certificationPath?.pointer_two),
      bg: "#FFD9D9",
      badge: "W1",
      badgeColor: "#FFB3B3",
      icon: "/assets/landingpage/msp_three_weekicon/write.svg",
    },
    {
      data: parseRoadmapPoint(courseData?.certificationPath?.pointer_three),
      bg: "#FDF2CD",
      badge: "W2",
      badgeColor: "#F9DF8D",
      icon: "/assets/landingpage/msp_three_weekicon/plan.svg",
    },
    {
      data: parseRoadmapPoint(courseData?.certificationPath?.pointer_four),
      bg: "#FDF2CD",
      badge: "W2",
      badgeColor: "#F9DF8D",
      icon: "/assets/landingpage/msp_three_weekicon/practise_exam.svg",
    },
    {
      data: parseRoadmapPoint(courseData?.certificationPath?.pointer_five),
      bg: "#E2F0CC",
      badge: "W3",
      badgeColor: "#9DC75C",
      icon: "/assets/landingpage/msp_three_weekicon/bulb.svg",
    },
    {
      data: parseRoadmapPoint(courseData?.certificationPath?.pointer_six),
      bg: "#E2F0CC",
      badge: "W3",
      badgeColor: "#9DC75C",
      icon: "/assets/landingpage/msp_three_weekicon/test_exam.svg",
    },
    {
      data: parseRoadmapPoint(courseData?.certificationPath?.pointer_seven),
      bg: "#E2F0CC",
      badge: "W3",
      badgeColor: "#9DC75C",
      icon: "/assets/landingpage/msp_three_weekicon/teacher.svg",
    },
  ].filter((p) => p.data && p.data.heading);

  const hasRoadmap = Boolean(roadmapPoints.length > 0);

  // Parse Learning Objectives
  const parseLearningObjective = (val) => {
    try {
      const obj = typeof val === "string" ? JSON.parse(val) : val;
      const heading = obj?.heading?.trim();
      if (!heading || heading === "NA" || heading === "Na" || heading.toLowerCase() === "no details available") {
        return null;
      }
      return {
        heading: heading,
        description: obj?.description && obj.description !== "NA" && obj.description !== "Na" ? obj.description : ""
      };
    } catch (e) {
      return null;
    }
  };

  const learningObjectivesList = [
    { data: parseLearningObjective(courseData?.courseLearningObjectives?.record_one), num: "01", color: "#F87C56" },
    { data: parseLearningObjective(courseData?.courseLearningObjectives?.record_two), num: "02", color: "#FECF65" },
    { data: parseLearningObjective(courseData?.courseLearningObjectives?.record_three), num: "03", color: "#FF9A9A" },
    { data: parseLearningObjective(courseData?.courseLearningObjectives?.record_four), num: "04", color: "#7FB77E" },
    { data: parseLearningObjective(courseData?.courseLearningObjectives?.record_five), num: "05", color: "#A4B7F1" },
    { data: parseLearningObjective(courseData?.courseLearningObjectives?.record_six), num: "06", color: "#F7A9F2" },
  ].filter((item) => Boolean(item.data));

  // Calendar State & Handlers
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
  const [selectedCalendarTime, setSelectedCalendarTime] = useState("12:00 AM");
  const [calendarTimeSlots, setCalendarTimeSlots] = useState([]);

  useEffect(() => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const period = h < 12 ? "AM" : "PM";
        const minuteStr = String(m).padStart(2, "0");
        slots.push(`${hour12}:${minuteStr} ${period}`);
      }
    }
    setCalendarTimeSlots(slots);
  }, []);

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const calToday = new Date();
  calToday.setHours(0, 0, 0, 0);

  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const handlePrevCalMonth = () => {
    setCalendarDate(new Date(calYear, calMonth - 1, 1));
  };
  const handleNextCalMonth = () => {
    setCalendarDate(new Date(calYear, calMonth + 1, 1));
  };
  const handleCalDateSelect = (day) => {
    const d = new Date(calYear, calMonth, day);
    d.setHours(0, 0, 0, 0);
    setSelectedCalendarDate(d);
  };

  const [calFormData, setCalFormData] = useState({
    full_name: "",
    contact_number: "",
    email: "",
    country: (typeof active_country !== "undefined" && active_country) ? active_country : "India",
    course: "",
    enquiry_for: "Individual",
    training_mode: "",
    preferred_contact: "Both",
    message: "",
    terms: true,
  });

  const handleCalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCalFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCalSubmit = async (e) => {
    e.preventDefault();
    if (!calFormData.full_name || !calFormData.email) {
      alert("Please enter your name and email.");
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/api/contact-store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...calFormData,
          selected_date: selectedCalendarDate.toISOString(),
          selected_time: selectedCalendarTime,
        }),
      });
      alert("Thank you! Your request has been received. Our learning advisor will contact you shortly.");
    } catch (err) {
      alert("Thank you! Your request has been received. Our learning advisor will contact you shortly.");
    }
  };

  const hasCertificate = Boolean(
    courseData?.certificationText?.description ||
    courseData?.certificationImage?.image_path ||
    courseData?.courseImage?.banner_image_path ||
    courseData?.allHeadline?.certifications
  );
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("highlights");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const pageLabel = useMemo(() => {
    if (!pageType) return "Syllabus";
    return pageType
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [pageType]);

  const courseTitle = useMemo(
    () =>
      courseData?.support_page?.title ||
      courseData?.course?.course_title ||
      courseData?.course?.name ||
      courseData?.course_title ||
      courseData?.courseHeading?.title ||
      courseData?.dynamicCourseHeading?.heading ||
      (url_title ? url_title.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : `Course ${pageLabel}`),
    [courseData, url_title, pageLabel]
  );

  const heroHeadline = useMemo(() => {
    return (
      courseData?.dynamicCourseHeading?.page_title ||
      courseData?.dynamicCourseHeading?.meta_title ||
      courseData?.courseHeading?.title ||
      `Master ${courseTitle} through Live Online Training for Learners Based in India`
    );
  }, [courseData, courseTitle]);

  const heroSubtitle = useMemo(() => {
    return (
      courseData?.bulletPoints?.course_description ||
      courseData?.courseDescription?.description ||
      courseData?.course?.short_description ||
      courseData?.seo?.description ||
      `Master core and advanced ${courseTitle} to crack top-tier technical interviews and build scalable systems.`
    );
  }, [courseData, courseTitle]);

  const heroBulletPoints = useMemo(() => {
    try {
      const raw = courseData?.bulletPoints?.course_highlights_in_pointers;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      "Improved customer satisfaction: Better service and support for clients.",
      "Increased profitability: Stronger financial performance.",
      "Improved organizational culture: A more positive and supportive work environment.",
      "Enhanced risk management: More effective identification and mitigation of risks."
    ];
  }, [courseData]);

  // Overview Section (Screenshot 2)
  const overviewHeading = useMemo(() => {
    return (
      courseData?.allHeadline?.program_overview ||
      `Overview of ${courseTitle} Certification Training Programs in the India`
    );
  }, [courseData, courseTitle]);

  const overviewHtml = useMemo(() => {
    return (
      courseData?.courseOverview?.course_overview ||
      courseData?.course?.overview ||
      courseData?.overview ||
      `<p>Professionals can gain a thorough grasp of fundamental and advanced computational principles by enrolling in ScholarAcad's ${courseTitle} Certification Training in the India. Skilled practitioners are in high demand to guarantee maximum value delivery as firms throughout the India implement modern techniques.</p><p>The duties, such as developing the product vision, monitoring and improving efficiency, working with stakeholders, and guaranteeing alignment between business objectives and development teams, are highlighted in this training program. Participants acquire useful skills to provide customer-focused solutions and make well-informed product selections.</p><p>The training, which is taught by seasoned certified instructors, provides practical insights into the difficulties that professionals have in hectic workplaces.</p><p>Professionals can improve their skills in a variety of areas, including IT, finance, healthcare, e-commerce, consulting, manufacturing, and startups, by obtaining this certification through ScholarAcad. The curriculum gives students the self-assurance they need to carry out their role successfully and promote ongoing value delivery.</p><p>Interactive conversations, team-building activities, and real-world scenarios that mirror the difficulties experienced by India-based firms are also beneficial to participants. Professionals may manage learning and work obligations using flexible learning options, such as corporate training and live online courses.</p>`
    );
  }, [courseData, courseTitle]);

  // Key Features Section (Screenshot 3)
  const keyFeaturesHeading = useMemo(() => {
    return (
      courseData?.allHeadline?.training_highlights ||
      `${courseTitle} Training: Key Features & Benefits`
    );
  }, [courseData, courseTitle]);

  const keyFeaturesList = useMemo(() => {
    const kf = courseData?.keyfeatures || {};
    return [
      {
        icon: "/assets/landingpage/keyfeature/keyfeature_icon1.svg",
        fallbackIcon: "⏰",
        text: kf.record_one || "16 hours of instructor led Training",
      },
      {
        icon: "/assets/landingpage/keyfeature/keyfeature_icon2.svg",
        fallbackIcon: "🔄",
        text: kf.record_two || "Innovative, tailor-made solutions for your Project requirements",
      },
      {
        icon: "/assets/landingpage/keyfeature/keyfeature_icon3.svg",
        fallbackIcon: "💡",
        text: kf.record_three || "Our Flexi Pass offers you the flexibility to repeat the training in one year",
      },
      {
        icon: "/assets/landingpage/keyfeature/keyfeature_icon4.svg",
        fallbackIcon: "🎁",
        text: kf.record_four || "100+ Question with Rational to practice",
      },
      {
        icon: "/assets/landingpage/keyfeature/keyfeature_icon5.svg",
        fallbackIcon: "📝",
        text: kf.record_five || "Get Exam Voucher within Training Cost",
      },
      {
        icon: "/assets/landingpage/keyfeature/keyfeature_icon6.svg",
        fallbackIcon: "🎧",
        text: kf.record_six || "After Training support for exam prepration",
      },
    ];
  }, [courseData]);

  // Why ScholarAcad Section (Screenshot 4)
  const whyScholarAcadHeading = useMemo(() => {
    return (
      courseData?.allHeadline?.advantage ||
      `Why ScholarAcad Is the Right Choice for ${courseTitle} Training in India`
    );
  }, [courseData, courseTitle]);

  const whyScholarAcadItems = useMemo(() => {
    const adv = courseData?.courseWhyScholarAcad || {};
    const c1 = safeJsonParse(adv.record_one, {
      heading: "Increased Motivation",
      description: "Stay motivated and driven to achieve your goals."
    });
    const c2 = safeJsonParse(adv.record_two, {
      heading: "Improved Networking Skills",
      description: "Develop strong relationships with professionals in your field."
    });
    const c3 = safeJsonParse(adv.record_three, {
      heading: "Increased Job Satisfaction",
      description: "Find more fulfillment and satisfaction in your work"
    });
    const c4 = safeJsonParse(adv.record_four, {
      heading: "Improved Employee Engagement",
      description: "Foster a positive and engaging work environment."
    });
    return [
      { num: "01", badgeBg: "bg-[#F07F39]", ...c1 },
      { num: "02", badgeBg: "bg-[#ED7070]", ...c2 },
      { num: "03", badgeBg: "bg-[#FFB340]", ...c3 },
      { num: "04", badgeBg: "bg-[#5FA33E]", ...c4 },
    ];
  }, [courseData]);

  // What You'll Learn Section (Screenshot 5)
  const whatYouLearnHeading = useMemo(() => {
    return (
      courseData?.allHeadline?.new_learning_objectives ||
      `What You'll Learn from the ${courseTitle} Certification Course in India`
    );
  }, [courseData, courseTitle]);

  const whatYouLearnDesc = useMemo(() => {
    return (
      courseData?.whatyoulearn?.description ||
      `You can become a successful practitioner in a high-demand industry by completing the ${courseTitle} Certification course in India. You will learn how to prioritize and manage requirements, work with stakeholders, convert business needs into useful product features, and promote product success by providing customers and organizations with the most value possible.`
    );
  }, [courseData, courseTitle]);

  const whatYouLearnPointers = useMemo(() => {
    try {
      const raw = courseData?.whatyoulearn?.pointers;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      "Recognize the fundamental ideas and ideals of the Scrum and Agile frameworks.",
      "Discover the duties and obligations of a Scrum Product Owner.",
      "Learn how to create, prioritize, and refine product backlogs.",
      "Learn how to create, prioritize, and refine product backlogs.",
      "Discover how to make well-informed decisions to optimize product value and ROI.",
      "Boost cooperation and comm stakeholders",
      "Use case studies and real-world examples to implement Scrum practices."
    ];
  }, [courseData]);

  const curriculumHtml = useMemo(
    () =>
      courseData?.support_page?.content ||
      courseData?.courseDescription?.curriculum ||
      courseData?.curriculum ||
      '',
    [courseData]
  );

  const breadcrumb = useMemo(() => {
    return Array.isArray(courseData?.breadcrumb) && courseData.breadcrumb.length > 0
      ? courseData.breadcrumb
      : null;
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
    return getCourseImageUrl(raw, '/assets/landingpage/courses/course1.jpg');
  }, [courseData]);

  const faqs = useMemo(() => {
    if (Array.isArray(courseData?.CourseFaqs) && courseData.CourseFaqs.length > 0) return courseData.CourseFaqs;
    if (Array.isArray(courseData?.faqs) && courseData.faqs.length > 0) return courseData.faqs;
    return [
      {
        question: `What are the prerequisites for the ${courseTitle} course?`,
        answer: "There are no formal prerequisites. Basic understanding of computing concepts and problem-solving is helpful."
      },
      {
        question: `How will I access the training material and sessions?`,
        answer: "Upon enrollment, you receive lifetime access to the ScholarAcad LMS platform including live session recordings, lecture notes, and quizzes."
      },
      {
        question: `What is the ScholarAcad Flexi Pass?`,
        answer: "The Flexi Pass allows you to attend multiple batches with different instructors for up to 365 days from your registration date without any extra charge."
      },
      {
        question: `Do you provide certification and placement assistance?`,
        answer: "Yes, upon completing the course assessments you receive an accredited certification and direct resume guidance with placement support."
      }
    ];
  }, [courseData, courseTitle]);

  const navTabs = useMemo(() => {
    const tabs = [
      { id: "highlights", label: "Course Highlights", show: true },
      { id: "overview", label: "Course Overview", show: Boolean(overviewHtml) },
      { id: "keyfeatures", label: "Key Features", show: keyFeaturesList && keyFeaturesList.length > 0 },
      { id: "whychooseus", label: "Why Choose Us", show: whyScholarAcadItems && whyScholarAcadItems.length > 0 },
      { id: "whatyoulearn", label: "What You'll Learn", show: (whatYouLearnPointers && whatYouLearnPointers.length > 0) || Boolean(whatYouLearnDesc) },
      { id: "curriculum", label: "Curriculum", show: Boolean(curriculumHtml) },
      { id: "trainingoptions", label: "Training Options", show: true },
      { id: "contact", label: "Contact", show: true },
      { id: "roadmap", label: "Roadmap", show: hasRoadmap },
      { id: "faqs", label: "FAQs", show: faqs && faqs.length > 0 },
    ];
    return tabs.filter((t) => t.show);
  }, [courseData, overviewHtml, keyFeaturesList, whyScholarAcadItems, whatYouLearnPointers, whatYouLearnDesc, curriculumHtml, hasRoadmap, faqs]);

  const courseSlug = url_title || '';
  const mainCourseUrl = `/${courseSlug}`;
  const canonicalPath = `/${courseSlug}/${pageType}`;

  const scrollToSection = (id) => {
    setActiveTab(id);
    const targetId = id === "contact" ? (document.getElementById("contact") ? "contact" : "learning-calender") : id;
    const element = document.getElementById(targetId);
    if (element) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const headerOffset = isMobile ? 120 : 138;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const sectionIds = [
      "highlights",
      "overview",
      "keyfeatures",
      "whychooseus",
      "whatyoulearn",
      "curriculum",
      "trainingoptions",
      "contact",
      "learning-calender",
      "roadmap",
      "certificate",
      "faqs",
    ];

    const handleScroll = () => {
      const isMobile = window.innerWidth < 768;
      const headerOffset = isMobile ? 130 : 150;
      const scrollPosition = window.scrollY + headerOffset;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            const mappedTab = (id === "learning-calender" || id === "contact") ? "contact" : id;
            setActiveTab(mappedTab);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const seoTitle = courseData?.seo?.title || `${courseTitle} Course & Syllabus | ScholarAcad`;
  const seoDesc = courseData?.seo?.description || `Comprehensive training and syllabus for ${courseTitle} at ScholarAcad.`;

  const schemaBreadcrumbs = useMemo(() => {
    if (breadcrumb && breadcrumb.length > 0) {
      return breadcrumb.map((b) => ({
        name: b.name,
        url: b.url?.startsWith("http") ? b.url.replace(/\/in\//g, "/") : b.url ? b.url.replace(/^\/in\//, "/") : mainCourseUrl
      }));
    }
    return [
      { name: "Home", url: "/" },
      { name: "Courses", url: "/all-courses" },
      { name: courseTitle, url: mainCourseUrl }
    ];
  }, [breadcrumb, courseTitle, mainCourseUrl]);

  const schemaData = useMemo(() => {
    return generateSupportPageSchema({
      title: seoTitle,
      description: seoDesc,
      pageUrl: canonicalPath,
      breadcrumbs: schemaBreadcrumbs,
      faqs: faqs
    });
  }, [seoTitle, seoDesc, canonicalPath, schemaBreadcrumbs, faqs]);

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
        canonicalUrl={canonicalPath}
        keywords={courseData?.seo?.keywords || `${courseTitle}, training, certification`}
        ogTitle={seoTitle}
        ogDescription={seoDesc}
        ogUrl={canonicalPath}
        schemaData={schemaData}
        robots="index, follow"
      />

      <Navbar />

      <main className="bg-white min-h-screen text-slate-800">
        {/* Top Sticky Navigation Tabs (Matching Screenshot 1 & 5) */}
        <div className="sticky top-[64px] md:top-[72px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-6 overflow-x-auto whitespace-nowrap text-xs sm:text-sm font-medium py-3 scrollbar-none">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`pb-1 transition-all border-b-2 cursor-pointer ${
                    activeTab === tab.id
                      ? "border-[#882CFB] text-[#882CFB] font-bold"
                      : "border-transparent text-gray-700 hover:text-[#882CFB]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Breadcrumb Header (Matching Screenshot 1) */}
        <div className="bg-[#FAF8FE] border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
              <Link href="/" className="flex items-center hover:text-[#882CFB] transition">
                <FaHome className="mr-1 text-sm text-[#2E318D]" /> Home
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs shrink-0" />
              <Link href="/all-courses" className="hover:text-[#882CFB] transition">
                Courses
              </Link>
              <IoIosArrowForward className="text-gray-400 text-xs shrink-0" />
              <span className="text-[#2E318D] font-bold truncate max-w-[280px]">
                {courseTitle}
              </span>
            </nav>
          </div>
        </div>

        {/* Hero Section (Matching Screenshot 1) */}
        <section id="highlights" className="bg-white py-8 lg:py-12 border-b border-gray-100 scroll-mt-36">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Course Image Card */}
              <div className="lg:col-span-5 flex justify-center lg:justify-start">
                <div className="relative w-full max-w-[480px] rounded-2xl border border-gray-200/90 bg-white p-3 shadow-md hover:shadow-lg transition-all flex items-center justify-center min-h-[260px] group">
                  <img
                    src={courseImage}
                    alt={courseTitle}
                    onError={(e) => {
                      e.currentTarget.src = '/assets/landingpage/courses/course1.jpg';
                    }}
                    className="w-full h-auto max-h-[340px] object-cover rounded-xl group-hover:scale-102 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Right Column: Title, Ratings, Checkmark Bullets, CTA */}
              <div className="lg:col-span-7 space-y-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                  {heroHeadline}
                </h1>

                <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
                  {heroSubtitle}
                </p>

                {/* Ratings Row (Matching Screenshot 1) */}
                <div className="flex items-center flex-wrap gap-4 pt-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-base sm:text-lg">
                      <FcGoogle />
                      <span className="text-black font-bold text-sm">
                        {courseData?.ratings?.googleRating || courseData?.dynamicCourseHeading?.googleRating || "5.0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-base sm:text-lg text-[#1877F2]">
                      <IoLogoFacebook />
                      <span className="text-black font-bold text-sm">
                        {courseData?.ratings?.facebook || courseData?.dynamicCourseHeading?.facebook || "5.0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-base sm:text-lg text-[#E1306C]">
                      <FaSquareInstagram />
                      <span className="text-black font-bold text-sm">
                        {courseData?.ratings?.installgram || courseData?.dynamicCourseHeading?.installgram || "5.0"}
                      </span>
                    </div>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">
                    {courseData?.ratings?.enrolled || courseData?.dynamicCourseHeading?.enrolled || "6000+"} Enrolled
                  </span>
                </div>

                {/* 4 Checkmark Bullet Points (Matching Screenshot 1) */}
                <div className="space-y-2.5 pt-2">
                  {heroBulletPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <FaCheckSquare className="text-[#2E318D] text-base shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex flex-wrap items-center gap-3.5">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#882CFB] hover:bg-[#7221D8] text-white font-semibold text-sm shadow-md hover:shadow-purple-500/20 transition transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>Contact Advisor</span>
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
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Body Layout (Matching Screenshots 2, 3, 4, 5) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Persistent Sidebar (Peach Card + Mint Card + Summary) */}
            <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
              {/* Corporate Training Card (Peach background matching Screenshot 2) */}
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#882CFB] hover:bg-[#7221D8] text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  <span>Contact For Training</span>
                  <HiMiniArrowLongRight />
                </button>
              </div>

              {/* Trending Courses Card (Mint background matching Screenshot 2) */}
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

              {/* Course Summary Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 uppercase tracking-wider">
                  Course Summary
                </h3>
                <ul className="space-y-3 text-xs sm:text-sm">
                  <li className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <FaRegClock className="text-[#882CFB]" /> Mode
                    </span>
                    <span className="font-semibold text-gray-800">Live Online Classroom</span>
                  </li>
                  <li className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <MdOutlineMenuBook className="text-[#882CFB]" /> Access
                    </span>
                    <span className="font-semibold text-gray-800">Lifetime LMS Access</span>
                  </li>
                  <li className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <FaAward className="text-[#882CFB]" /> Certificate
                    </span>
                    <span className="font-semibold text-gray-800">Official Accredited</span>
                  </li>
                  <li className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-2">
                      <MdVerified className="text-[#882CFB]" /> Passing Rate
                    </span>
                    <span className="font-semibold text-green-600">99.2%</span>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#882CFB] hover:bg-[#7221D8] text-white text-xs font-semibold text-center shadow-xs transition cursor-pointer"
                  >
                    Enquire for Next Batch
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Main Content Sections */}
            <div className="lg:col-span-8 space-y-10">
              {/* Section 1: Course Overview (Matching Screenshot 2) */}
              <div id="overview" className="bg-[#EDE3FF] rounded-2xl border border-purple-200/80 p-6 sm:p-8 shadow-xs scroll-mt-36">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4 leading-snug">
                  {overviewHeading}
                </h2>
                <div
                  className="prose max-w-none text-gray-700 text-sm sm:text-base leading-relaxed space-y-3.5 prose-p:mb-3"
                  dangerouslySetInnerHTML={{
                    __html: safeHtml(overviewHtml),
                  }}
                />
              </div>

              {/* Section 2: Key Features & Benefits (Matching Screenshot 3) */}
              <div id="keyfeatures" className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs scroll-mt-36">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6 text-center">
                  {keyFeaturesHeading}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  {keyFeaturesList.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-start p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition group"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3">
                        <img
                          src={feature.icon}
                          alt="Feature Icon"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = 'block';
                            }
                          }}
                          className="w-10 h-10 object-contain"
                        />
                        <span className="hidden text-2xl">{feature.fallbackIcon}</span>
                      </div>
                      <p className="font-semibold text-gray-700 text-xs sm:text-sm leading-snug">
                        {feature.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Why ScholarAcad Is the Right Choice (Matching Screenshot 4) */}
              <div id="whychooseus" className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs scroll-mt-36">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-8 text-center leading-snug">
                  {whyScholarAcadHeading}
                </h2>

                <div className="relative py-4">
                  {/* Vertical Navy Line */}
                  <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#2E318D] -translate-x-1/2 z-0"></div>

                  <div className="space-y-6 sm:space-y-8 relative z-10">
                    {whyScholarAcadItems.map((item, idx) => {
                      const isEven = idx % 2 === 1; // 01 left, 02 right, 03 left, 04 right
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col sm:flex-row items-center ${
                            isEven ? "sm:flex-row-reverse" : ""
                          } gap-4 sm:gap-8`}
                        >
                          {/* Card Half */}
                          <div className="w-full sm:w-1/2">
                            <div className="relative bg-[#F7F3FF] border border-purple-100 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs">
                              <div
                                className={`${item.badgeBg} text-white shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold text-lg shadow-sm`}
                              >
                                <span>{item.num}</span>
                                <img
                                  src="/assets/landingpage/courses/check.svg"
                                  alt="Check"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  className="h-3.5 w-auto mt-0.5 object-contain"
                                />
                              </div>
                              <div className="text-left">
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                                  {item.heading}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Center Node on Timeline (Desktop) */}
                          <div className="hidden sm:flex shrink-0 w-5 h-5 rounded-full bg-[#2E318D] border-2 border-white shadow-md z-20 items-center justify-center"></div>

                          {/* Spacer Half */}
                          <div className="hidden sm:block sm:w-1/2"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 4: What You'll Learn (Matching Screenshot 5) */}
              <div id="whatyoulearn" className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-xs scroll-mt-36">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3 text-center leading-snug">
                  {whatYouLearnHeading}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 text-center max-w-3xl mx-auto mb-6 leading-relaxed">
                  {whatYouLearnDesc}
                </p>

                {/* 2-Column Chevrons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {whatYouLearnPointers.map((text, idx) => (
                    <ChevronItem key={idx} text={text} index={idx} />
                  ))}
                </div>
              </div>

              {/* Section 5: Curriculum Breakdown & Detailed Modules */}
              <div id="curriculum" className="bg-[#FAF8FE] border border-purple-100 rounded-2xl p-6 sm:p-8 shadow-xs scroll-mt-36">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-3 border-b border-purple-100/70">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <FaBook className="text-[#882CFB]" />
                      Detailed Course Modules & Curriculum
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Step-by-step module breakdown prepared by certified instructors
                    </p>
                  </div>
                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#882CFB] hover:text-[#4347ca] flex items-center gap-1.5"
                    >
                      <FaDownload /> Download PDF
                    </a>
                  )}
                </div>

                {curriculumHtml ? (
                  <div
                    className="prose max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: safeHtml(curriculumHtml),
                    }}
                  />
                ) : (
                  <div className="space-y-3.5">
                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        Module 1: Time & Space Complexity Analysis
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Big-O, Big-Omega, Big-Theta, recursion trees, and master theorem.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        Module 2: Linear Data Structures & Pointer Patterns
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Arrays, Linked Lists, Stacks, Queues, and Hash Tables with LRU cache.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        Module 3: Non-Linear Trees, Heaps & Graphs
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        BST, AVL rotations, Heaps, Graph traversals (BFS, DFS), and Dijkstra algorithm.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Training Options (Dynamic from backend coursePlan) */}
              {Array.isArray(courseData?.coursePlan) && courseData.coursePlan.length > 0 && (
                <div id="trainingoptions" className="py-4 scroll-mt-36">
                  <div className="flex justify-center items-center flex-col mb-6">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center">
                      {courseData?.allHeadline?.training_options || "Training Options"}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    {courseData.coursePlan.map((plan, index) => {
                      const bgColors = ["bg-[#FFBCBD]", "bg-[#C1E1C1]", "bg-[#CFE2FF]"];
                      const bgClass = bgColors[index % bgColors.length];
                      return (
                        <div className="ribbon_card" key={index}>
                          <div className={`ribbon_label ${bgClass}`}>
                            <h2 className="font-bold text-[#2E318D] text-lg sm:text-xl">
                              {plan?.plan_name}
                            </h2>
                          </div>
                          <div className="ribbon_card__container">
                            <div className="ribbon_card__body">
                              <div className="min-h-[200px] max-h-[260px] overflow-y-auto">
                                <ul className="mt-2 space-y-2 text-xs sm:text-sm text-gray-700">
                                  {plan?.features?.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start gap-1.5">
                                      <span className="font-bold text-[#2E318D]">{featureIndex + 1}.</span>
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsModalOpen(true)}
                                  className="flex-1 bg-[#882CFB] hover:bg-[#7221D8] text-white py-2 px-4 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer"
                                >
                                  Contact Advisor
                                </button>
                                <button
                                  type="button"
                                  onClick={() => scrollToSection("contact")}
                                  className="flex-1 border border-[#2E318D] text-[#2E318D] hover:bg-[#2E318D] hover:text-white py-2 px-4 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer"
                                >
                                  Contact For Bulk Discount
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section: Corporate Training Banner (Peach card) */}
              <div id="corporate-training" className="py-2">
                <div className="corporate_trainning_bg p-5 text-[#2E318D] rounded-2xl border border-gray-300">
                  <div className="grid md:grid-cols-3 grid-cols-1 md:max-w-[95%] w-full m-auto items-center">
                    <div>
                      <h2 className="font-bold text-2xl text-[#2E318D]">
                        Corporate Training
                      </h2>
                      <ul className="list-disc pl-5 text-gray-700 mt-3 space-y-1 text-sm sm:text-base">
                        <li>Impactful Instructor Led Training</li>
                        <li>Wide range of Training dates.</li>
                      </ul>
                    </div>

                    <div className="mt-4 md:mt-0 flex justify-center">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#882CFB] hover:bg-[#7221D8] text-white font-semibold px-6 py-2.5 rounded-full transition shadow-sm cursor-pointer text-sm sm:text-base flex items-center gap-2"
                      >
                        Contact Advisor &rarr;
                      </button>
                    </div>

                    <div className="flex justify-center md:justify-end">
                      <img
                        src="/assets/landingpage/girlwith-laptop.png"
                        alt="Corporate Training"
                        className="object-contain max-h-[160px] md:max-h-[190px] transform scale-105"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Eligibility & Prerequisites (Purple gradient with checkmarks) */}
              {hasEligibility && (
                <div id="eligibility" className="py-2">
                  <div className="relative rounded-2xl overflow-hidden shadow-sm">
                    <div
                      className="absolute inset-0 bg-cover bg-center object-contain"
                      style={{
                        backgroundImage: "url('/assets/landingpage/certificate_bg.png')",
                      }}
                    ></div>
                    <div className="relative grid grid-cols-1 md:grid-cols-[70%_30%] p-6 sm:p-8">
                      <div className="text-left text-white">
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                          {courseData?.allHeadline?.eligibility || "Eligibility & Prerequisites"}
                        </h2>
                        {courseData?.courseDescription?.eligibility && (
                          <div
                            className="summernote-content2 prose max-w-none mb-4 text-white/90 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: safeHtml(courseData.courseDescription.eligibility),
                            }}
                          ></div>
                        )}

                        <div className="space-y-3">
                          {certificatelist.map((point, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <IoCheckmarkCircleSharp className="text-white text-lg shrink-0 mt-0.5" />
                              <p className="text-white text-sm sm:text-[15px] leading-relaxed">
                                {point}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="hidden md:block"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Company Logos Row */}
              <div className="py-2 overflow-hidden">
                <div className="relative flex w-max animate-scroll">
                  {[
                    "/assets/landingpage/institutelogo/daimler_logo.svg",
                    "/assets/landingpage/institutelogo/adidas_logo.png",
                    "/assets/landingpage/institutelogo/bajaj_logo.svg",
                    "/assets/landingpage/institutelogo/rrtech_logo.svg",
                    "/assets/landingpage/institutelogo/rhf_logo.png",
                    "/assets/landingpage/institutelogo/hcl_logo.svg",
                    "/assets/landingpage/institutelogo/rec_logo.svg",
                    "/assets/landingpage/institutelogo/ey_logo.png",
                    "/assets/landingpage/institutelogo/dxc_logo.svg",
                    "/assets/landingpage/institutelogo/daimler_logo.svg",
                    "/assets/landingpage/institutelogo/adidas_logo.png",
                    "/assets/landingpage/institutelogo/bajaj_logo.svg",
                    "/assets/landingpage/institutelogo/rrtech_logo.svg",
                    "/assets/landingpage/institutelogo/rhf_logo.png",
                  ].map((src, idx) => (
                    <div
                      key={idx}
                      className="bg-white flex items-center justify-center p-2 border border-[#C1C2F9] hover:shadow-md rounded mx-3"
                    >
                      <div className="h-[70px] w-[130px] flex items-center justify-center">
                        <img
                          src={src}
                          alt="Hiring Partner"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Stats Banner (Sky-blue brush 400k+ / 200+ / 100+) */}
              <div className="py-2">
                <div className="bg-[#2E318D] counter_bg p-4 text-[#2E318D] rounded-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x max-sm:divide-y divide-[#2E318D] gap-2 my-4">
                    <div className="flex justify-center items-center">
                      <div className="flex flex-col md:items-start items-center gap-2 py-2">
                        <h2 className="md:text-4xl text-2xl font-bold">400k+</h2>
                        <p className="text-sm sm:text-md text-left font-semibold">
                          Career Transformations
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-center items-center">
                      <div className="flex flex-col md:items-start items-center gap-2 py-2">
                        <h2 className="md:text-4xl text-2xl font-bold">200+</h2>
                        <p className="text-sm sm:text-md text-left font-semibold">
                          Workshops every month
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-center items-center">
                      <div className="flex flex-col md:items-start items-center gap-2 py-2">
                        <h2 className="md:text-4xl text-2xl font-bold">100+</h2>
                        <p className="text-sm sm:text-md text-left font-semibold">
                          Countries and Counting
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Set Your Learning Calendar & Contact Form */}
              <div id="contact" className="py-4 scroll-mt-36">
                <div id="learning-calender" className="grid grid-cols-1 md:grid-cols-[42%_58%] gap-5">
                  {/* Left Calendar Card */}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3 text-start">
                      Set Your Learning Calendar
                    </h2>

                    <div className="bg-white border border-gray-300 p-5 rounded-2xl shadow-xs">
                      {/* Month Header */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={handlePrevCalMonth}
                          className="text-gray-500 hover:text-black font-bold p-1 cursor-pointer"
                        >
                          &larr;
                        </button>
                        <h3 className="font-semibold text-base sm:text-lg text-gray-800">
                          {calendarDate.toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                        <button
                          type="button"
                          onClick={handleNextCalMonth}
                          className="text-gray-500 hover:text-black font-bold p-1 cursor-pointer"
                        >
                          &rarr;
                        </button>
                      </div>

                      {/* Day Names */}
                      <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-2">
                        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                          <div key={d}>{d}</div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {[...Array(calFirstDay)].map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {[...Array(calDaysInMonth)].map((_, i) => {
                          const day = i + 1;
                          const d = new Date(calYear, calMonth, day);
                          d.setHours(0, 0, 0, 0);
                          const isPast = d < calToday;
                          const isSelected =
                            selectedCalendarDate &&
                            selectedCalendarDate.getTime() === d.getTime();
                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={isPast}
                              onClick={() => handleCalDateSelect(day)}
                              className={`py-1.5 text-xs sm:text-sm rounded-lg transition cursor-pointer ${
                                isPast
                                  ? "text-gray-300 cursor-not-allowed"
                                  : "hover:bg-purple-50 text-gray-700"
                              } ${isSelected ? "bg-[#4347CA] text-white font-bold" : ""}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      {/* Select Time */}
                      <div className="mt-5">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                          Select Time
                        </label>
                        <select
                          value={selectedCalendarTime}
                          onChange={(e) => setSelectedCalendarTime(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#882CFB] cursor-pointer"
                        >
                          {calendarTimeSlots.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className="text-xs text-gray-500 mt-2 font-medium">
                        Selected: {selectedCalendarDate.toDateString()} at {selectedCalendarTime}
                      </p>

                      {/* 30-min Duration Card */}
                      <div className="mt-5 p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl space-y-1">
                        <h4 className="text-xs font-bold text-gray-800">
                          ScholarAcad Learning
                        </h4>
                        <hr className="border-purple-100 my-1" />
                        <p className="text-xs font-semibold text-[#2E318D]">
                          Duration: 30 Minutes
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Learn everything about your certification &mdash; including fees, syllabus, benefits, courseware, corporate enquiries, and custom schedules.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Form Card (Dark styled matching screenshot 2 & 3) */}
                  <div className="bg-black text-white p-5 sm:p-6 rounded-2xl shadow-md">
                    <form onSubmit={handleCalSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-200 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          required
                          value={calFormData.full_name}
                          onChange={handleCalChange}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-200 mb-1">
                            Contact Number
                          </label>
                          <input
                            type="text"
                            name="contact_number"
                            value={calFormData.contact_number}
                            onChange={handleCalChange}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-200 mb-1">
                            Email ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={calFormData.email}
                            onChange={handleCalChange}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-200 mb-1">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="country"
                            value={calFormData.country}
                            onChange={handleCalChange}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
                          >
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="Singapore">Singapore</option>
                            <option value="United Arab Emirates">United Arab Emirates</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-200 mb-1">
                            Course <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="course"
                            value={calFormData.course}
                            onChange={handleCalChange}
                            className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
                          >
                            <option value={courseTitle}>{courseTitle}</option>
                          </select>
                        </div>
                      </div>

                      {/* Enquiry For Radio */}
                      <div>
                        <label className="block text-xs font-medium text-gray-200 mb-1">
                          Enquiry For <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-6 bg-white text-gray-900 px-3 py-2 rounded-lg text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="enquiry_for"
                              value="Individual"
                              checked={calFormData.enquiry_for === "Individual"}
                              onChange={handleCalChange}
                            />
                            Individual
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="enquiry_for"
                              value="Corporate"
                              checked={calFormData.enquiry_for === "Corporate"}
                              onChange={handleCalChange}
                            />
                            Corporate
                          </label>
                        </div>
                      </div>

                      {/* Training Delivery Mode */}
                      <div>
                        <label className="block text-xs font-medium text-gray-200 mb-1">
                          Training Delivery Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="training_mode"
                          value={calFormData.training_mode}
                          onChange={handleCalChange}
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
                        >
                          <option value="">Please Select</option>
                          <option value="Live Virtual Online">Live Virtual Online</option>
                          <option value="Corporate Classroom">Corporate Classroom</option>
                          <option value="Self Paced">Self Paced</option>
                        </select>
                      </div>

                      {/* Preferred Mode of Contact */}
                      <div>
                        <label className="block text-xs font-medium text-gray-200 mb-1">
                          Select Your Preferred Mode of Contact <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-6 bg-white text-gray-900 px-3 py-2 rounded-lg text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="preferred_contact"
                              value="Phone"
                              checked={calFormData.preferred_contact === "Phone"}
                              onChange={handleCalChange}
                            />
                            Phone
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="preferred_contact"
                              value="Email"
                              checked={calFormData.preferred_contact === "Email"}
                              onChange={handleCalChange}
                            />
                            Email
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="preferred_contact"
                              value="Both"
                              checked={calFormData.preferred_contact === "Both"}
                              onChange={handleCalChange}
                            />
                            Both
                          </label>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-medium text-gray-200 mb-1">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          name="message"
                          value={calFormData.message}
                          onChange={handleCalChange}
                          placeholder="Your questions or custom requirements..."
                          className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="calTerms"
                          name="terms"
                          checked={calFormData.terms}
                          onChange={handleCalChange}
                          className="cursor-pointer"
                        />
                        <label htmlFor="calTerms" className="text-xs text-gray-300 cursor-pointer">
                          I agree to the <span className="underline">Terms and Conditions</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#882CFB] hover:bg-[#7221D8] text-white font-bold py-2.5 rounded-full transition shadow-md cursor-pointer text-sm sm:text-base mt-2"
                      >
                        Submit &rarr;
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Section: Roadmap / Certification Path (Circuit path with W1, W2 badges) */}
              {hasRoadmap && (
                <div id="roadmap" className="py-4 scroll-mt-36">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6 text-center">
                    {courseData?.allHeadline?.path || "Roadmap to Certification"}
                  </h2>
                  <div className="roadmap">
                    {roadmapPoints.map((item, idx) => (
                      <div key={idx} className="point">
                        <div
                          className="relative w-full grid grid-cols-[12%_88%] gap-3 rounded-2xl shadow-sm py-6 px-5 items-center overflow-hidden"
                          style={{ backgroundColor: item.bg }}
                        >
                          <div>
                            <img
                              src={item.icon}
                              alt={item.data.heading}
                              className="h-10 w-auto object-contain"
                            />
                          </div>
                          <div className="pr-12">
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1.5">
                              {item.data.heading}
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                              {item.data.text || ""}
                            </p>
                          </div>
                          <div className="absolute bottom-5 -right-2 translate-y-1/2">
                            <div className="bg-white rounded-full w-[70px] h-[70px] flex items-center justify-center shadow-md">
                              <span
                                className="font-extrabold text-xl"
                                style={{ color: item.badgeColor }}
                              >
                                {item.badge}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section: Certificate Preview */}
              {hasCertificate && (
                <div id="certificate" className="py-4">
                  <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3">
                          {courseData?.allHeadline?.certifications || "Sample Certificate Preview"}
                        </h2>
                        <div
                          className="summernote-content prose max-w-none text-gray-600 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: safeHtml(
                              courseData?.certificationText?.description ||
                              "Earn an industry-recognized certificate from ScholarAcad upon successful completion of your training."
                            ),
                          }}
                        />
                      </div>
                      <div className="flex md:justify-end justify-center">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-w-[85%] w-full flex justify-center items-center shadow-xs">
                          <img
                            src={
                              courseData?.certificationImage?.image_path
                                ? (courseData.certificationImage.image_path.startsWith("http")
                                    ? courseData.certificationImage.image_path
                                    : `${API_BASE_URL}/master/secure-documents?path=${courseData.certificationImage.image_path}`)
                                : "/assets/images/new-dynamic-course/certificate.jpg"
                            }
                            alt="Certificate Preview"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/images/new-dynamic-course/certificate.jpg";
                            }}
                            className="object-contain w-full h-auto rounded-lg shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Trending Courses Banner (Peach card) */}
              <div className="py-2">
                <div className="trending_coursesbg p-5 text-[#2E318D] rounded-2xl border border-gray-300">
                  <div className="grid md:grid-cols-3 grid-cols-1 md:max-w-[95%] w-full m-auto items-center">
                    <div className="flex justify-center md:justify-start">
                      <img
                        src="/assets/landingpage/menwith_laptop.png"
                        alt="Trending Courses"
                        className="object-contain max-h-[160px] md:max-h-[190px] transform scale-105"
                      />
                    </div>
                    <div>
                      <h2 className="font-bold text-2xl text-[#2E318D]">
                        Trending Courses
                      </h2>
                      <ul className="list-disc pl-5 text-gray-700 mt-3 space-y-1 text-sm sm:text-base">
                        <li>Impactful Instructor Led Training</li>
                        <li>Wide range of Training dates.</li>
                      </ul>
                    </div>
                    <div className="mt-4 md:mt-0 flex justify-center md:justify-end">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#882CFB] hover:bg-[#7221D8] text-white font-semibold px-6 py-2.5 rounded-full transition shadow-sm cursor-pointer text-sm sm:text-base"
                      >
                        View Schedule &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Learning Objectives (01, 02 cards - DYNAMIC ONLY, no "NA" cards) */}
              {learningObjectivesList.length > 0 && (
                <div className="py-4">
                  <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 max-w-xl mx-auto">
                      {courseData?.allHeadline?.old_learning_objectives ||
                        "Learning Objective - Skills & knowledge you will get from this course"}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 md:gap-[50px] gap-6">
                    {learningObjectivesList.map((item, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className="text-white text-2xl font-bold w-full h-28 rounded-xl flex items-center pl-5 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.num}
                        </div>
                        <div className="absolute -top-[16px] left-0 right-0 ml-[60px] bg-white rounded-xl p-3 md:w-[92%] h-28 overflow-hidden border border-gray-200 shadow-xs">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                            {item.data.heading}
                          </h3>
                          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed line-clamp-2">
                            {item.data.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 6: FAQs Section */}
              <div id="faqs" className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200/90 scroll-mt-36">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl overflow-hidden transition"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left font-semibold text-gray-800 hover:bg-gray-50 transition text-sm cursor-pointer"
                      >
                        <span>{faq?.question || faq?.title}</span>
                        <div
                          className={`w-6 h-6 flex items-center justify-center rounded-md shrink-0 ml-2 transition-all ${
                            openFaqIndex === idx
                              ? "bg-[#882CFB] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {openFaqIndex === idx ? (
                            <FaMinus className="text-xs" />
                          ) : (
                            <FaPlus className="text-xs" />
                          )}
                        </div>
                      </button>
                      {openFaqIndex === idx && (
                        <div className="p-4 bg-slate-50 text-xs sm:text-sm text-gray-600 border-t border-gray-100 leading-relaxed">
                          {faq?.answer || faq?.description}
                        </div>
                      )}
                    </div>
                  ))}
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
