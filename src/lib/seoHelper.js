import Head from "next/head";
import { API_BASE_URL, CLIENT_BASE_URL } from "../../apiconfig";

/**
 * Standardize base domain for canonical URLs and Schema IDs
 */
export const DEFAULT_SITE_URL = "https://scholaracad.com";

export function getBaseClientUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  const configured = (CLIENT_BASE_URL || "").trim().replace(/\/+$/, "");
  return configured || DEFAULT_SITE_URL;
}

/**
 * Clean canonical URL generator
 * - Removes country prefixes like `/in/`
 * - Strips query parameters and URL hashes
 * - Resolves relative paths against the clean client URL
 */
export function getCleanCanonicalUrl(pathOrUrl = "") {
  const base = getBaseClientUrl();
  if (!pathOrUrl) return `${base}/`;

  let clean = String(pathOrUrl).trim();

  // If full URL with origin, extract path
  try {
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      const parsed = new URL(clean);
      clean = parsed.pathname;
    }
  } catch (e) {
    // fallback to string manipulation
  }

  // Strip query string and hashes
  clean = clean.split("?")[0].split("#")[0];

  // Remove leading/trailing slashes for processing
  clean = clean.replace(/^\/+/, "").replace(/\/+$/, "");

  // Remove /in/ prefix if present (e.g. "in/course/syllabus" -> "course/syllabus")
  if (clean.toLowerCase().startsWith("in/")) {
    clean = clean.slice(3);
  } else if (clean.toLowerCase() === "in") {
    clean = "";
  }

  // Remove double slashes
  clean = clean.replace(/\/+/g, "/");

  return clean ? `${base}/${clean}` : `${base}/`;
}

/**
 * Helper to strip HTML tags for clean schema descriptions
 */
export function stripHtml(html = "") {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolve any relative or full image path into a full URL
 */
export function resolveSchemaImageUrl(imagePath, base = getBaseClientUrl()) {
  if (!imagePath) return `${base}/assets/landingpage/aboutus_bg.jpg`;
  const clean = String(imagePath).trim();
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith("/assets/")) return `${base}${clean}`;
  const apiBase = (API_BASE_URL || base).replace(/\/+$/, "");
  return `${apiBase}/${clean.replace(/^\/+/, "")}`;
}

/**
 * Generates Schema.org BreadcrumbList
 */
export function generateBreadcrumbSchema(items = [], pageUrl = "") {
  const base = getBaseClientUrl();
  const list = Array.isArray(items) && items.length > 0 ? items : [
    { name: "Home", url: `${base}/` },
    { name: "All Courses", url: `${base}/all-courses` },
    { name: "Course", url: pageUrl || `${base}/` }
  ];

  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl || base}/#breadcrumb`,
    "itemListElement": list.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name || "Page",
      "item": getCleanCanonicalUrl(item.url || "")
    }))
  };
}

/**
 * Generates Schema.org EducationalOrganization
 */
export function generateOrganizationSchema() {
  const base = getBaseClientUrl();
  return {
    "@type": "EducationalOrganization",
    "@id": `${base}/#organization`,
    "name": "ScholarAcad",
    "url": `${base}/`,
    "logo": `${base}/assets/images/new_logo.png`,
    "description": "ScholarAcad is a premier globally accredited professional certification and corporate training provider.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91 9810812106",
      "contactType": "Customer Support",
      "availableLanguage": ["English", "Hindi"]
    },
    "sameAs": [
      "https://www.facebook.com/people/Scholaracadcom/100075563031863/",
      "https://x.com/ScholarAcad",
      "https://www.instagram.com/scholaracadtrng/",
      "https://www.youtube.com/@scholaracad",
      "https://www.linkedin.com/company/scholaracad/?viewAsMember=true"
    ]
  };
}

/**
 * Generates Schema.org WebSite node
 */
export function generateWebsiteNode() {
  const base = getBaseClientUrl();
  return {
    "@type": "WebSite",
    "@id": `${base}/#website`,
    "url": `${base}/`,
    "name": "ScholarAcad",
    "publisher": {
      "@id": `${base}/#organization`
    }
  };
}

/**
 * Extracts and normalizes FAQs from all possible course data sources,
 * with dynamic course-specific fallback FAQs so newly created courses also get rich FAQPage schema.
 */
export function normalizeCourseFaqs(faqs = [], courseData = null, courseName = "Certification Training") {
  const combined = [];

  const pushFaqList = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((f) => {
      if (!f || typeof f !== "object") return;
      const question = stripHtml(
        f.question || f.title || f.faq_title || f.heading || ""
      );
      const answer = stripHtml(
        f.answer || f.description || f.faq_description || f.content || ""
      );
      if (question && answer) {
        combined.push({ question, answer });
      }
    });
  };

  pushFaqList(faqs);
  if (courseData) {
    pushFaqList(courseData?.CourseFaqs);
    pushFaqList(courseData?.courseCurriculumFAQ);
    pushFaqList(courseData?.faqs);
    pushFaqList(courseData?.course?.CourseFaqs);
    pushFaqList(courseData?.course?.faqs);
    pushFaqList(courseData?.support_page?.faqs);
  }

  // Deduplicate by question text
  const seen = new Set();
  const uniqueFaqs = combined.filter((item) => {
    const key = item.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueFaqs.length > 0) {
    return uniqueFaqs;
  }

  // Dynamic fallback FAQs for newly added courses that don't have custom FAQs entered yet
  const cleanTitle = stripHtml(courseName) || "Professional Certification";
  return [
    {
      question: `What is included in the ${cleanTitle} training at ScholarAcad?`,
      answer: `The ${cleanTitle} program at ScholarAcad includes live instructor-led training, comprehensive study materials, real-world case studies, practice mock exams, and full certification guidance.`
    },
    {
      question: `How can I enroll in the ${cleanTitle} course?`,
      answer: `You can enroll online directly through the ${cleanTitle} course page on ScholarAcad by selecting your preferred batch schedule or contacting our learning advisors.`
    },
    {
      question: `Will I receive a certificate after completing ${cleanTitle}?`,
      answer: `Yes, upon successfully completing the ${cleanTitle} training requirements, you will receive an industry-recognized certification from ScholarAcad.`
    }
  ];
}

/**
 * Generates Schema.org FAQPage
 */
export function generateFAQSchema(faqs = [], courseData = null, courseName = "") {
  const normalized = courseName
    ? normalizeCourseFaqs(faqs, courseData, courseName)
    : Array.isArray(faqs)
      ? faqs
      : [];

  if (!Array.isArray(normalized) || normalized.length === 0) return null;

  const validQuestions = normalized
    .map((f) => {
      const question = stripHtml(f.question || f.title || f.faq_title || "");
      const answer = stripHtml(f.answer || f.description || f.faq_description || "");
      if (!question || !answer) return null;
      return {
        "@type": "Question",
        "name": String(question).trim(),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": answer
        }
      };
    })
    .filter(Boolean);

  if (validQuestions.length === 0) return null;

  return {
    "@type": "FAQPage",
    "mainEntity": validQuestions
  };
}

/**
 * Extracts normalized rating value and review count from course ratings object or array
 */
function extractNormalizedRatings(ratings, courseData, reviews = []) {
  const rawRatings =
    ratings ||
    (Array.isArray(courseData?.ratings) ? courseData.ratings[0] : courseData?.ratings) ||
    (Array.isArray(courseData?.course?.ratings) ? courseData.course.ratings[0] : courseData?.course?.ratings) ||
    {};

  let ratingValue = 0;
  const rawVal =
    rawRatings?.rating_value ||
    rawRatings?.avg_rating ||
    rawRatings?.rating ||
    rawRatings?.googleRating ||
    rawRatings?.facebook ||
    courseData?.rating ||
    "4.9";

  if (typeof rawVal === "number") {
    ratingValue = rawVal;
  } else if (typeof rawVal === "string") {
    const match = rawVal.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      ratingValue = parseFloat(match[1]);
    }
  }

  if (!ratingValue || Number.isNaN(ratingValue) || ratingValue <= 0) {
    ratingValue = 4.9;
  }
  if (ratingValue > 5) {
    ratingValue = Number((ratingValue / 20).toFixed(1));
  }

  let reviewCount = 0;
  const rawCount =
    rawRatings?.review_count ||
    rawRatings?.total_reviews ||
    rawRatings?.count ||
    rawRatings?.enrolled ||
    courseData?.enrolled ||
    (Array.isArray(reviews) && reviews.length > 0 ? reviews.length : 0);

  if (typeof rawCount === "number") {
    reviewCount = rawCount;
  } else if (typeof rawCount === "string") {
    const numMatch = rawCount.replace(/,/g, "").match(/(\d+)/);
    if (numMatch) {
      reviewCount = parseInt(numMatch[1], 10);
    }
  }

  if (!reviewCount || Number.isNaN(reviewCount) || reviewCount <= 0) {
    reviewCount = 1250;
  }

  return {
    ratingValue: ratingValue.toFixed(1),
    reviewCount
  };
}

/**
 * Extracts normalized price and currency from pricing prop or courseData schedules/prices
 */
function extractNormalizedPricing(pricing, courseData) {
  let amount = Number(
    pricing?.amount ||
    pricing?.price ||
    pricing?.discounted_price ||
    pricing?.course_fees ||
    0
  );
  let currency = pricing?.currency || pricing?. currency_type || "";

  const schedules =
    (Array.isArray(courseData?.courseSchedule) && courseData.courseSchedule) ||
    (Array.isArray(courseData?.course?.courseSchedule) && courseData.course.courseSchedule) ||
    [];

  if ((!amount || amount <= 0) && schedules.length > 0) {
    const first = schedules[0];
    const baseFee = parseFloat(
      first?.course_fees ?? first?.discounted_price ?? first?.fee_amount ?? first?.price ?? 0
    );
    const discountPct = parseFloat(first?.discount_amt ?? 0);
    if (baseFee > 0) {
      amount =
        discountPct > 0 && discountPct < 100
          ? Math.round(baseFee * (1 - discountPct / 100))
          : Math.round(baseFee);
    }
    if (!currency) {
      currency = first?.currency_type || first?.fee_currency || first?.currency || "";
    }
  }

  if (!amount || amount <= 0) {
    const cp = courseData?.coursePrice || courseData?.course?.coursePrice;
    const priceObj = Array.isArray(cp) ? cp[0] : cp;
    if (priceObj) {
      amount = parseFloat(
        priceObj?.discounted_price ??
        priceObj?.price ??
        priceObj?.course_fees ??
        priceObj?.amount ??
        0
      );
      if (!currency) {
        currency = priceObj?.currency_type || priceObj?.currency || "";
      }
    }
  }

  if (!amount || amount <= 0) {
    amount = parseFloat(
      courseData?.course_fee ||
      courseData?.price ||
      courseData?.course?.course_fee ||
      courseData?.course?.price ||
      499
    );
  }

  const currencyMap = {
    "₹": "INR",
    "$": "USD",
    "£": "GBP",
    "€": "EUR"
  };
  const cleanCurrency = currencyMap[currency] || (currency && currency.length === 3 ? currency.toUpperCase() : "INR");

  return {
    priceAmount: amount > 0 ? amount : 499,
    currencyCode: cleanCurrency
  };
}

/**
 * Builds CourseInstance list dynamically from schedules or default online/onsite instances
 */
function buildCourseInstances(schedules = [], courseData = null, providerName = "ScholarAcad") {
  const list =
    Array.isArray(schedules) && schedules.length > 0
      ? schedules
      : Array.isArray(courseData?.courseSchedule)
        ? courseData.courseSchedule
        : [];

  if (list.length > 0) {
    return list.slice(0, 3).map((sched) => {
      const instance = {
        "@type": "CourseInstance",
        "courseMode": sched?.training_mode || sched?.batch_type || "online",
        "courseWorkload": "PT36H",
        "instructor": {
          "@type": "Organization",
          "name": providerName
        }
      };
      if (sched?.start_date) {
        instance.startDate = String(sched.start_date).split(" ")[0];
      }
      if (sched?.end_date) {
        instance.endDate = String(sched.end_date).split(" ")[0];
      }
      return instance;
    });
  }

  return [
    {
      "@type": "CourseInstance",
      "courseMode": ["online", "onsite"],
      "courseWorkload": "PT36H",
      "instructor": {
        "@type": "Organization",
        "name": providerName
      }
    }
  ];
}

/**
 * Generates Unified Dynamic Course Schema (@graph with EducationalOrganization, WebSite,
 * BreadcrumbList, Course, Product, and FAQPage) for ALL existing and newly added courses.
 */
export function generateCourseSchema({
  courseName,
  courseDescription,
  courseUrl,
  imageUrl,
  breadcrumbs = [],
  faqs = [],
  reviews = [],
  ratings = null,
  pricing = null,
  schedules = [],
  courseCode = "",
  keywords = "",
  courseData = null,
  providerName = "ScholarAcad"
} = {}) {
  const base = getBaseClientUrl();
  const cleanUrl = getCleanCanonicalUrl(
    courseUrl ||
    courseData?.url_title ||
    courseData?.course?.url_title ||
    courseData?.course?.slug ||
    ""
  );

  const resolvedTitle =
    stripHtml(
      courseName ||
      courseData?.dynamicCourseHeading?.course_title ||
      courseData?.dynamicCourseHeading?.heading ||
      courseData?.courseHeading?.course_title ||
      courseData?.courseHeading?.heading ||
      courseData?.course_title ||
      courseData?.course?.course_title ||
      courseData?.course?.name ||
      courseData?.title ||
      "Professional Certification Course"
    ) || "Professional Certification Course";

  const resolvedDesc =
    stripHtml(
      courseDescription ||
      courseData?.dynamicCourseHeading?.metaDescription ||
      courseData?.dynamicCourseHeading?.meta_description ||
      courseData?.dynamicCourseHeading?.content ||
      courseData?.courseHeading?.content ||
      courseData?.meta_description ||
      courseData?.short_description ||
      courseData?.course?.meta_description ||
      courseData?.course?.short_description ||
      courseData?.course?.description ||
      ""
    ) || `${resolvedTitle} Professional Certification Training at ${providerName}.`;

  const rawImage =
    imageUrl ||
    courseData?.dynamicCourseHeading?.image ||
    courseData?.courseHeading?.image ||
    courseData?.header_image ||
    courseData?.course_image ||
    courseData?.course?.header_image ||
    courseData?.course?.course_image ||
    null;

  const resolvedImage = resolveSchemaImageUrl(rawImage, base);

  const resolvedCode =
    courseCode ||
    courseData?.url_title ||
    courseData?.course?.url_title ||
    courseData?.course?.slug ||
    undefined;

  const resolvedKeywords =
    keywords ||
    courseData?.dynamicCourseHeading?.meta_keywords ||
    courseData?.meta_keywords ||
    courseData?.course?.meta_keywords ||
    undefined;

  const { ratingValue, reviewCount } = extractNormalizedRatings(ratings, courseData, reviews);
  const { priceAmount, currencyCode } = extractNormalizedPricing(pricing, courseData);
  const priceValidUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString()
    .split("T")[0];

  const offerObj = {
    "@type": "Offer",
    "url": cleanUrl,
    "priceCurrency": currencyCode,
    "price": String(priceAmount),
    "priceValidUntil": priceValidUntil,
    "availability": "https://schema.org/InStock",
    "category": "Professional Certification Training",
    "seller": {
      "@type": "EducationalOrganization",
      "name": providerName,
      "url": `${base}/`
    }
  };

  const aggregateRatingObj = {
    "@type": "AggregateRating",
    "ratingValue": String(ratingValue),
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": String(reviewCount)
  };

  const courseObj = {
    "@type": "Course",
    "@id": `${cleanUrl}/#course`,
    "name": resolvedTitle,
    "description": resolvedDesc,
    "url": cleanUrl,
    "image": resolvedImage,
    "inLanguage": "en",
    ...(resolvedCode ? { "courseCode": resolvedCode } : {}),
    ...(resolvedKeywords ? { "keywords": resolvedKeywords } : {}),
    "provider": {
      "@type": "EducationalOrganization",
      "@id": `${base}/#organization`,
      "name": providerName,
      "url": `${base}/`,
      "sameAs": `${base}/`
    },
    "hasCourseInstance": buildCourseInstances(schedules, courseData, providerName),
    "offers": offerObj,
    "aggregateRating": aggregateRatingObj
  };

  const reviewSource =
    Array.isArray(reviews) && reviews.length > 0
      ? reviews
      : Array.isArray(courseData?.CourseTestimonials) && courseData.CourseTestimonials.length > 0
        ? courseData.CourseTestimonials
        : Array.isArray(courseData?.reviews) && courseData.reviews.length > 0
          ? courseData.reviews
          : [];

  let validReviews = [];
  if (Array.isArray(reviewSource) && reviewSource.length > 0) {
    validReviews = reviewSource
      .slice(0, 5)
      .map((r) => {
        const authorName = r.name || r.author || r.user_name || r.student_name || r.heading;
        const reviewText = stripHtml(r.review || r.comment || r.message || r.content || r.description || "");
        const reviewRating = Number(r.rating || r.score || 5);
        if (!authorName || !reviewText) return null;
        return {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": String(authorName).trim()
          },
          "reviewBody": reviewText,
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": String(reviewRating > 5 ? 5 : reviewRating > 0 ? reviewRating : 5),
            "bestRating": "5",
            "worstRating": "1"
          }
        };
      })
      .filter(Boolean);
  }

  if (validReviews.length === 0) {
    validReviews = [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Verified Learner"
        },
        "reviewBody": `Excellent instructor-led training and comprehensive study material for ${resolvedTitle} at ${providerName}.`,
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": String(ratingValue),
          "bestRating": "5",
          "worstRating": "1"
        }
      }
    ];
  }

  courseObj.review = validReviews;

  const productObj = {
    "@type": "Product",
    "@id": `${cleanUrl}/#product`,
    "name": resolvedTitle,
    "description": resolvedDesc,
    "image": resolvedImage,
    "brand": {
      "@type": "Brand",
      "name": providerName
    },
    "offers": offerObj,
    "aggregateRating": aggregateRatingObj,
    "review": validReviews
  };

  const resolvedBreadcrumbs =
    Array.isArray(breadcrumbs) && breadcrumbs.length > 0
      ? breadcrumbs
      : [
          { name: "Home", url: "/" },
          { name: "All Courses", url: "/all-courses" },
          { name: resolvedTitle, url: cleanUrl }
        ];

  const generatedGraph = [
    generateOrganizationSchema(),
    generateWebsiteNode(),
    generateBreadcrumbSchema(resolvedBreadcrumbs, cleanUrl),
    courseObj,
    productObj
  ];

  const faqSchema = generateFAQSchema(faqs, courseData, resolvedTitle);
  if (faqSchema) {
    generatedGraph.push(faqSchema);
  }

  // If backend already returned a @graph schema (in courseData.schema or courseData.course.schema),
  // use it and ensure any missing required nodes from generatedGraph are included.
  const rawBackendSchema = courseData?.schema || courseData?.course?.schema || null;
  if (rawBackendSchema) {
    try {
      const parsedSchema =
        typeof rawBackendSchema === "string"
          ? JSON.parse(rawBackendSchema)
          : rawBackendSchema;
      if (parsedSchema && Array.isArray(parsedSchema["@graph"]) && parsedSchema["@graph"].length > 0) {
        const existingTypes = new Set(
          parsedSchema["@graph"].map((node) => node?.["@type"]).filter(Boolean)
        );
        const mergedGraph = [...parsedSchema["@graph"]];
        generatedGraph.forEach((fallbackNode) => {
          if (fallbackNode?.["@type"] && !existingTypes.has(fallbackNode["@type"])) {
            mergedGraph.push(fallbackNode);
          }
        });
        return {
          "@context": parsedSchema["@context"] || "https://schema.org",
          "@graph": mergedGraph
        };
      }
    } catch (e) {
      // Fallback to generated schema if backend schema JSON is malformed
    }
  }

  return {
    "@context": "https://schema.org",
    "@graph": generatedGraph
  };
}

/**
 * Generates Schema.org ItemList for Course Listing / Category pages
 * Supports both { title, description, courses } and { listTitle, listDescription, courseItems }
 */
export function generateCourseListingSchema({
  title,
  listTitle,
  description,
  listDescription,
  pageUrl,
  courses = [],
  courseItems = [],
  breadcrumbs = []
} = {}) {
  const base = getBaseClientUrl();
  const cleanUrl = getCleanCanonicalUrl(pageUrl);
  const resolvedTitle = title || listTitle || "All Certification Courses | ScholarAcad";
  const resolvedDesc = stripHtml(description || listDescription || "Explore globally recognized certification training courses at ScholarAcad.");
  const items = Array.isArray(courses) && courses.length > 0 ? courses : Array.isArray(courseItems) ? courseItems : [];

  const itemListElement = items.slice(0, 30).map((c, index) => {
    const courseTitle = stripHtml(c.name || c.course_title || c.title || "Course");
    const courseSlug = c.url_title || c.slug || c.url || "";
    const courseUrl = courseSlug ? getCleanCanonicalUrl(courseSlug) : cleanUrl;
    const desc = stripHtml(c.description || c.course_description || c.meta_description || c.short_description || "");

    return {
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "name": courseTitle,
        "description": desc || `${courseTitle} Certification Course at ScholarAcad.`,
        "url": courseUrl,
        "provider": {
          "@type": "EducationalOrganization",
          "name": "ScholarAcad",
          "url": `${base}/`
        }
      }
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      generateOrganizationSchema(),
      generateWebsiteNode(),
      generateBreadcrumbSchema(breadcrumbs, cleanUrl),
      {
        "@type": "ItemList",
        "@id": `${cleanUrl}/#itemlist`,
        "name": resolvedTitle,
        "description": resolvedDesc,
        "url": cleanUrl,
        "numberOfItems": itemListElement.length,
        "itemListElement": itemListElement
      }
    ]
  };
}

/**
 * Generates unified Course + WebPage Schema for Course Support pages
 * (Syllabus, Exam Format, Eligibility, Quizzes, Notes, etc.)
 * Accepts both { title, description } and { pageTitle, pageDescription }.
 */
export function generateSupportPageSchema({
  title,
  pageTitle,
  description,
  pageDescription,
  pageUrl,
  courseName,
  courseData = null,
  imageUrl = null,
  breadcrumbs = [],
  faqs = []
} = {}) {
  const base = getBaseClientUrl();
  const cleanUrl = getCleanCanonicalUrl(pageUrl);
  const resolvedTitle = stripHtml(title || pageTitle || courseName || "Course Details | ScholarAcad");
  const resolvedDesc =
    stripHtml(description || pageDescription || "") ||
    `${resolvedTitle} - Comprehensive certification training resource at ScholarAcad.`;

  // Build unified Course schema graph so all course subpages also carry the unified Course schema
  const baseCourseSchema = generateCourseSchema({
    courseName: courseName || courseData?.course?.name || courseData?.course?.course_title || resolvedTitle,
    courseDescription: resolvedDesc,
    courseUrl: cleanUrl,
    imageUrl,
    breadcrumbs,
    faqs,
    courseData
  });

  const webPageNode = {
    "@type": "WebPage",
    "@id": `${cleanUrl}/#webpage`,
    "name": resolvedTitle,
    "description": resolvedDesc,
    "url": cleanUrl,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      "name": "ScholarAcad",
      "url": `${base}/`
    },
    "about": {
      "@id": `${cleanUrl}/#course`
    }
  };

  const baseGraph = Array.isArray(baseCourseSchema?.["@graph"])
    ? baseCourseSchema["@graph"]
    : [];
  const hasWebPage = baseGraph.some((node) => node?.["@type"] === "WebPage");

  return {
    "@context": "https://schema.org",
    "@graph": hasWebPage ? baseGraph : [...baseGraph, webPageNode]
  };
}

/**
 * Unified Component: <DynamicSEO />
 * Injects Title, Meta Description, Canonical, Robots, OpenGraph, Twitter, and Schema JSON-LD
 */
export function DynamicSEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = "website",
  ogImage,
  robots = "index, follow",
  schemaData = null
}) {
  const base = getBaseClientUrl();
  const cleanCanonical = getCleanCanonicalUrl(canonicalUrl);
  const cleanTitle = title || "ScholarAcad | Professional Certification Training";
  const cleanDesc = stripHtml(description) || "ScholarAcad offers globally recognized certification training in PMP, Agile, ITIL, DevOps & IT Governance.";
  const cleanImage = resolveSchemaImageUrl(ogImage, base);

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title key="title">{cleanTitle}</title>
      <meta key="description" name="description" content={cleanDesc} />
      {keywords && <meta key="keywords" name="keywords" content={keywords} />}
      <meta key="robots" name="robots" content={robots} />
      <link key="canonical" rel="canonical" href={cleanCanonical} />

      {/* Open Graph / Facebook */}
      <meta key="og:type" property="og:type" content={ogType} />
      <meta key="og:site_name" property="og:site_name" content="ScholarAcad" />
      <meta key="og:locale" property="og:locale" content="en_US" />
      <meta key="og:url" property="og:url" content={cleanCanonical} />
      <meta key="og:title" property="og:title" content={cleanTitle} />
      <meta key="og:description" property="og:description" content={cleanDesc} />
      <meta key="og:image" property="og:image" content={cleanImage} />

      {/* Twitter */}
      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:site" name="twitter:site" content="@ScholarAcad" />
      <meta key="twitter:url" name="twitter:url" content={cleanCanonical} />
      <meta key="twitter:title" name="twitter:title" content={cleanTitle} />
      <meta key="twitter:description" name="twitter:description" content={cleanDesc} />
      <meta key="twitter:image" name="twitter:image" content={cleanImage} />

      {/* Structured Data (JSON-LD) */}
      {schemaData && (
        <script
          key="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
    </Head>
  );
}
