import Footer from "@/Components/Footer";
import Navbar from "@/Components/Navbar";
import { useEffect, useMemo, useState } from "react";
import { AiOutlineBook } from "react-icons/ai";
import { FaStar } from "react-icons/fa";
import { FaSquareInstagram } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { GoArrowUpRight } from "react-icons/go";
import { IoIosStar } from "react-icons/io";
import { IoLogoFacebook } from "react-icons/io5";
import { RiGraduationCapFill } from "react-icons/ri";
import { API_BASE_URL, APIENDPOINTS } from "../../../apiconfig";
import { getCourseImageUrl, getLiveDocumentUrl, DEFAULT_COURSE_FALLBACK } from "@/utils/imageHelper";
import { useAuth } from "@/context/AuthContext";
import { DynamicSEO, getCleanCanonicalUrl, generateCourseListingSchema } from "@/lib/seoHelper";
import { useRouter } from "next/router";
import Pagination from "@/Components/Pagination";
import { decryptId } from "@/utils/encryption";
import Link from "next/link";
import Loader from "@/Components/loader";
import toast from "react-hot-toast";
import FormModal from "@/Components/FormModal";
import ScheduleAppointment from "@/Components/schedule_appointment_form";
import { FaUserGraduate, FaPercent, FaMousePointer } from "react-icons/fa";

const iconConfig = [
  {
    icon: <FaUserGraduate />,
    iconBg: "bg-sky-300",
    contentBg: "bg-sky-100",
  },
  {
    icon: <FaPercent />,
    iconBg: "bg-green-300",
    contentBg: "bg-green-100",
  },
  {
    icon: <FaMousePointer />,
    iconBg: "bg-purple-300",
    contentBg: "bg-purple-100",
  },
  {
    icon: <FaMousePointer />,
    iconBg: "bg-blue-300",
    contentBg: "bg-blue-100",
  },
];

function ChevronItem({ item }) {
  return (
    <div data-aos="flip-up" className="flex items-stretch overflow-hidden">
      <div
        className={`${item.iconBg} w-24 flex items-center justify-center text-white text-xl`}
      >
        {item.icon}
      </div>

      <div
        className={`${item.contentBg} flex items-center px-6 py-4 text-gray-700 font-medium w-full clip-chevron-right`}
      >
        {item.text}
      </div>
    </div>
  );
}

function Course() {
  const router = useRouter();
  // const { id } = router.query;
  const { token } = useAuth();
  const { categories } = useAuth();
  const [loadings, setLoadings] = useState(true);
  const [categorycourselist, setcategorycourselist] = useState(null);
  // console.log("categorycourselist",categorycourselist)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(9);
  const [realId, setRealId] = useState(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const { title } = router.query;
    setTitle(title);
  }, [router.asPath]);

  const slugify = (text) => {
    return text
      ?.toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");
  };
  const [userLocation, setUserLocation] = useState(null);
  useEffect(() => {
    const saved = sessionStorage.getItem("userLocation");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserLocation(parsed);
      } catch (e) {
        console.error(" Failed to parse userLocation JSON", e);
      }
    }
  }, []);

  const active_country = useMemo(() => {
    return userLocation?.raw?.country.toLowerCase() || "in";
  }, [userLocation]);
  // console.log("active_country", active_country);

  const active_state = useMemo(() => {
    return userLocation?.state || "Delhi";
  }, [userLocation]);

  // Decode id when router query changes
  // useEffect(() => {
  //   if (id) {
  //     const decodedId = decryptId(id);
  //     setRealId(decodedId);
  //   }
  // }, [id]);

  useEffect(() => {
    if (!title || !token) return;
    const fetchcategorycourses = async () => {
      setLoadings(true);
      try {
        const matchedCategory = categories?.find(
          (c) =>
            String(c.id) === String(title) ||
            c.category_slug === title ||
            slugify(c.category_name) === slugify(title)
        );
        const resolvedCategoryId = matchedCategory?.id || title;

        const res = await fetch(
          `${API_BASE_URL}${APIENDPOINTS.CATEGORIES_COURSES_LIST}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              category_id: resolvedCategoryId,
              country_id: (active_country || "in").toUpperCase(),
              page: currentPage,
              per_page: perPage,
            }),
          },
        );
        if (!res.ok) {
          setcategorycourselist(null);
          return;
        }
        const data = await res?.json();
        setcategorycourselist(data?.data || null);
        setCurrentPage(data?.data?.pagination?.current_page || 1);
        setTotalPages(data?.data?.pagination?.last_page || 1);
        setPerPage(data?.data?.pagination?.per_page);
      } catch (error) {
        setcategorycourselist(null);
      } finally {
        setLoadings(false);
      }
    };
    fetchcategorycourses();
  }, [title, token, currentPage, perPage]);

  const [categorydetails, setcategorydetails] = useState([]);
  // console.log("categorydetails", categorydetails);
  useEffect(() => {
    if (!title || !token) return;
    const fetchcategorycourses = async () => {
      setLoadings(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}${APIENDPOINTS.CATEGORY_DETAILS}/${title}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!res.ok) {
          setcategorydetails(null);
          return;
        }
        const data = await res?.json();
        setcategorydetails(data?.data);
      } catch (error) {
        setcategorydetails(null);
      } finally {
        setLoadings(false);
      }
    };
    fetchcategorycourses();
  }, [title, token]);

  const items = [
    categorydetails?.Option1,
    categorydetails?.Option2,
    categorydetails?.Option3,
    categorydetails?.Option4,
    categorydetails?.Option5,
    categorydetails?.Option6,
    categorydetails?.Option7,
    categorydetails?.Option8,
  ]
    .filter(Boolean)
    .map((text, index) => ({
      text,
      ...iconConfig[index % iconConfig.length],
    }));

  const mid = Math.ceil(items.length / 2);
  const firstColumn = items.slice(0, mid);
  const secondColumn = items.slice(mid);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [testimonialList, setTestimonialList] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch testimonials
  useEffect(() => {
    if (!token) return;
    const fetchTestimonials = async () => {
      try {
        setLoadingBlogs(true);
        const res = await fetch(
          `${API_BASE_URL}${APIENDPOINTS.TESTIMONIALS_LIST}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              course_id: null,
              top: 10,
              country_id: active_country,
              state_id: active_state || null,
            }),
          },
        );

        if (!res.ok) {
          console.warn("HTTP error! Status:", res?.status);
          setTestimonialList([]);
          return;
        }
        const data = await res.json();
        // console.log("Testimonials list:", data?.data);
        setTestimonialList(data?.data || []);
      } catch (err) {
      } finally {
        setLoadingBlogs(false);
      }
    };
    fetchTestimonials();
  }, [token]);

  // --- Auto-slide(only for first 5 testimonials) ---
  useEffect(() => {
    if (!testimonialList || testimonialList.length === 0) return;
    const visibleTestimonials = testimonialList.slice(0, 5);
    const interval = setInterval(() => {
      setActiveIndex((prev) =>
        prev === visibleTestimonials.length - 1 ? 0 : prev + 1,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonialList]);
  const handleClick = (index) => {
    setActiveIndex(index);
  };
  const visibleTestimonials = testimonialList?.slice(0, 5) || [];
  const activeTestimonial =
    visibleTestimonials.length > 0 ? visibleTestimonials[activeIndex] : null;

 
  const categoryName = categorydetails?.category_name || (title ? String(title).split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Category Courses");
  const categoryDesc = categorydetails?.short_description || `Explore top certification courses in ${categoryName} at ScholarAcad.`;

  const categoryListingSchema = useMemo(() => {
    const items = (categorycourselist?.courses || categorycourselist?.data || []).map((c) => ({
      name: c.course_title,
      url: `/${c.course_url_title || slugify(c.course_title)}`,
      description: c.course_description || "",
      imageUrl: c.course_image ? `${API_BASE_URL}/${c.course_image}` : null,
    }));

    return generateCourseListingSchema({
      listTitle: `${categoryName} Certification Courses`,
      listDescription: categoryDesc,
      pageUrl: `/category-courses/${title || ""}`,
      courseItems: items,
      breadcrumbs: [
        { name: "Home", url: "/" },
        { name: "Courses", url: "/all-courses" },
        { name: categoryName, url: `/category-courses/${title || ""}` },
      ],
    });
  }, [categorycourselist, categoryName, categoryDesc, title]);

  return (
    <>
      <DynamicSEO
        title={`${categoryName} Certification Training Courses | ScholarAcad`}
        description={categoryDesc}
        canonicalUrl={getCleanCanonicalUrl(`/category-courses/${title || ""}`)}
        keywords={`${categoryName}, ${categoryName} training, certification courses`}
        ogTitle={`${categoryName} Certification Training Courses | ScholarAcad`}
        ogDescription={categoryDesc}
        ogUrl={getCleanCanonicalUrl(`/category-courses/${title || ""}`)}
        schemaData={categoryListingSchema}
        robots="index, follow"
      />
      {/* Navbar */}
      <Navbar />
      <section className="font-nunito bg-white max-sm:p-3 ">
        {/* First Section */}
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="md:max-w-[550px] md:ml-[120px] md:min-h-[75vh]   mx-auto flex justify-center items-center">
              <div className=" p-5 bg-white rounded-md shadow-2xl shadow-[#d4c0ec]  ">
                {categorydetails?.category_name?.length > 0 && (
                  <>
                    <h1 className="heading">
                      {categorydetails?.category_name || "Untitled Course"}
                    </h1>
                    {/* <p className="mt-2 para">
                      {categorydetails?.short_description.length > 400
                        ? categorydetails?.short_description?.slice(0, 400) +
                          "..."
                        : categorydetails?.short_description}
                    </p> */}
                    <p className="mt-2 para">
                      {categorydetails?.short_description || "NA"}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="relative max-sm:mt-2">
              <img
                src="/assets/landingpage/course_page_righghtimg.jpg"
                alt="Image 1"
                className="w-full h-full object-cover bg-gray-100 "
              />
              {/* Left edge white gradient */}
              <div
                className="absolute top-0 left-0 h-full w-1/4 pointer-events-none"
                style={{
                  background: "linear-gradient(to right, white, transparent)",
                }}
              ></div>
              {/* Top edge white gradient */}
              <div
                className="absolute top-0 left-0 w-full h-1/3 pointer-events-none"
                style={{
                  background: "linear-gradient(to bottom, white, transparent)",
                }}
              ></div>
            </div>
          </div>
        </div>
        {/* Second Section */}
        <section className="">
          <div className="max-w-7xl mx-auto py-5 max-sm:p-3">
            <div className=" mt-2">
              <h2 className="heading">Explore Courses</h2>
              <div className=" mt-2">
                <p className="font-semibold text-md text-[#535353]  ">
                  Explore expert-led courses to upgrade your skills, earn
                  certifications, and achieve your career goals.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorycourselist?.courses?.map((course, index) => (
                  <Link
                    key={course?.id || index}
                    href={{
                      pathname: `/${slugify(
                        course?.url_title,
                      )}`,
                    }}
                    className="group flex flex-col justify-between bg-white border border-gray-200/80 hover:border-[#882CFB]/60 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Course Image */}
                    <div className="relative overflow-hidden rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center h-48 group-hover:bg-purple-50/40 transition-colors">
                      {course?.header_image ? (
                        <img
                          src={getCourseImageUrl(course?.header_image)}
                          alt={course?.course_title}
                          onError={(e) => {
                            if (!e.currentTarget.dataset.retried && course?.header_image) {
                              e.currentTarget.dataset.retried = "true";
                              e.currentTarget.src = getLiveDocumentUrl(course.header_image);
                            } else {
                              e.currentTarget.src = DEFAULT_COURSE_FALLBACK;
                            }
                          }}
                          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                          <span className="text-xs font-semibold text-purple-600">Accredited Course</span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-[#882CFB]/90 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                        {categorydetails?.category_name || "Certification"}
                      </span>
                    </div>

                    {/* Course Body */}
                    <div className="flex-1 flex flex-col justify-between mt-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
                          <AiOutlineBook className="text-[#882CFB] text-sm" />
                          <span>
                            {course?.ratings?.enrolled || "6,000+ Learners Enrolled"}
                          </span>
                        </div>

                        <h2
                          title={course?.course_title || "NA"}
                          className="text-base font-bold text-gray-900 group-hover:text-[#882CFB] transition-colors line-clamp-2 leading-snug"
                        >
                          {course?.course_title || "Course Details"}
                        </h2>
                      </div>

                      {/* Ratings and Explore Link */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-200/60">
                            <FaStar className="text-amber-400 text-xs" />
                            <span>{course?.ratings?.googleRating || "4.9"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                            <FcGoogle />
                            <IoLogoFacebook className="text-[#1877F2]" />
                            <FaSquareInstagram className="text-[#E1306C]" />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-[#882CFB] group-hover:translate-x-1 transition-transform">
                          <span>Explore</span>
                          <GoArrowUpRight className="text-sm font-bold" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {/* Pagination */}
              <div className="flex justify-end">
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                      if (page < 1 || page > totalPages) return;
                      setCurrentPage(page);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Third Section */}
        <div className="max-sm:p-3">
          <section
            data-aos="fade-up"
            className="relative  max-w-7xl mx-auto py-5 grid grid-cols-1 lg:grid-cols-[30%_70%] items-start"
          >
            <div className="mt-3">
              <h2 className=" heading">
                {categorydetails?.scholaracad_advantage ||
                  "Scholaracad Advantage"}
              </h2>
            </div>
            <div>
              {/* <img
                src="/assets/landingpage/get the_scholaracad_advantage_img.svg"
                alt=""
              /> */}
              <div className="md:max-w-7xl w-full m-auto grid grid-cols-1 md:grid-cols-2 max-sm:mt-4">
                <div className="md:p-10 space-y-1">
                  {firstColumn.map((item, index) => (
                    <ChevronItem key={index} item={item} />
                  ))}
                </div>

                <div className="md:p-10 space-y-1">
                  {secondColumn.map((item, index) => (
                    <ChevronItem key={index} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Fourth Section */}
        <div className="max-sm:p-3">
          <section className="relative  max-w-7xl mx-auto py-5 grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <img
                src="/assets/landingpage/Corporate_ enterprice_training.svg"
                alt=""
              />
            </div>
            <div className="mt-3">
              <h2 className=" heading">
                {categorydetails?.knowledge_partner ||
                  "Your Knowledge Partner for Professional Growth"}
              </h2>
              <p className=" para my-3">
                {categorydetails?.knowledge_description || "NA"}
              </p>
              <div className="mt-4 flex gap-4">
                <FormModal buttonText="Contact Advisor" modalType="register" />
              </div>
            </div>
          </section>
        </div>

        {/* Five Section */}
        <section className="bg-gradient-to-b from-[#FFFFFF] to-[#F4EFFF]">
          <div className="md:max-w-7xl mx-auto  mb-10 max-sm:p-3">
            <div className="w-full bg-gray-900 text-white md:p-6  shadow-lg  rounded-lg ">
              <div className=" mx-auto">
                <ScheduleAppointment />
              </div>
            </div>
          </div>
          <br />
        </section>

        <section className="relative max-w-7xl mx-auto py-7 grid lg:grid-cols-2 gap-10  max-sm:p-3">
          <div className="">
            <h2 className=" heading">
              Trusted by Leading Institutions & Companies
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-lg">
              Thousands of learners worldwide trust us to deliver high-quality
              professional education.
            </p>
            <p className=" text-lg text-gray-500 max-w-lg mt-3">
              Rated by learners
            </p>
            <div className="flex items-center gap-2 mt-2">
              <FaStar className="text-[#E4B308]" />
              <p className="font-bold text-xl">4.8/5</p>
              <p className="text-lg text-gray-500  pl-3">12,500+ Reviews</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "/assets/landingpage/institutelogo/hcl_logo.svg",
              "/assets/landingpage/institutelogo/rec_logo.svg",
              "/assets/landingpage/institutelogo/ey_logo.png",
              "/assets/landingpage/institutelogo/dxc_logo.svg",
              "/assets/landingpage/institutelogo/daimler_logo.svg",
              "/assets/landingpage/institutelogo/adidas_logo.png",
              "/assets/landingpage/institutelogo/bajaj_logo.svg",
              "/assets/landingpage/institutelogo/rrtech_logo.svg",
              "/assets/landingpage/institutelogo/rhf_logo.png",
            ]?.map((src, idx) => (
              <div
                key={idx}
                className="bg-white flex items-center justify-center p-2 border border-[#C1C2F9] hover:shadow-md rounded"
              >
                <div className="h-[80px] w-[80px] flex items-center justify-center">
                  <img
                    src={src}
                    alt={`Logo ${idx + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Testimonials */}
        <section className="testimonials_section ">
          <div className="relative max-w-7xl mx-auto py-5 max-sm:p-3">
            <div className="text-center">
              <div className="flex justify-center items-center flex-col mt-2">
                <div>
                  {/* <RiGraduationCapFill className="text-[#29A6DD] text-4xl rotate-350 ml-[-15px] mb-[-5px] " /> */}
                  <p className="font-bold text-xl text-[#2E318D] ">
                    Testimonials
                  </p>
                </div>
              </div>
              <h2 className=" heading">Customer Speak About Scholaracad</h2>

              <div className="text-center max-w-3xl mx-auto mt-10">
                <div className="flex justify-center items-center md:gap-10 gap-4 my-6 flex-wrap">
                  {visibleTestimonials?.map((item, index) => {
                    const initials = item?.name
                      ? item.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "NA";

                    const bgColors = [
                      "bg-red-300",
                      "bg-blue-300",
                      "bg-green-300",
                      "bg-purple-300",
                      "bg-pink-300",
                      "bg-yellow-300",
                    ];
                    const bgColor = bgColors[index % bgColors.length];
                    return item?.image ? (
                      <img
                        key={index}
                        src={item.image}
                        alt={item?.name}
                        onClick={() => handleClick(index)}
                        className={`cursor-pointer rounded-full object-cover transition-all duration-500 transform 
                          ${
                            index === activeIndex
                              ? "scale-110 border-2 border-[#2E318D]"
                              : "opacity-70"
                          } 
                          md:w-[70px] md:h-[70px] w-[50px] h-[50px]
                          hover:scale-110 hover:border-4 hover:border-[#2E318D]`}
                      />
                    ) : (
                      <div
                        key={index}
                        onClick={() => handleClick(index)}
                        className={`cursor-pointer flex items-center justify-center rounded-full text-white font-semibold transition-all duration-500 transform
                          ${bgColor}
                          ${
                            index === activeIndex
                              ? "scale-110 border-4 border-[#2E318D]"
                              : "opacity-70"
                          }
                          md:w-[70px] md:h-[70px] w-[50px] h-[50px]
                          hover:scale-110 hover:border-4 hover:border-[#2E318D]`}
                      >
                        {initials}
                      </div>
                    );
                  })}
                </div>
                {activeTestimonial && (
                  <div
                    key={activeIndex}
                    className="flex flex-col gap-2 justify-center items-center transition-all duration-700 ease-in-out animate-fadeIn"
                  >
                    <p className="text-[25px] font-bold text-[#2E318D]">
                      {activeTestimonial?.name}
                    </p>
                    <p>{activeTestimonial?.designation}</p>
                    <div className="flex gap-2">
                      {Array?.from({ length: 5 }).map((_, i) => (
                        <IoIosStar
                          key={i}
                          className={`text-2xl ${
                            i < (activeTestimonial?.rating || 5)
                              ? "text-[#E4B308]"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-lg text-gray-600 text-center px-4 md:px-0 max-w-2xl">
                      “{activeTestimonial?.comment}”
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Six Section */}
        <div className="bg-[#F7F3FF] max-sm:p-3">
          <section className="relative  max-w-7xl mx-auto py-5 grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <img
                src="/assets/landingpage/Corporate_ enterprice_training.svg"
                alt=""
              />
            </div>
            <div className="mt-3">
              <h2 className="heading">
                Corporate enterprice training delivered by Scholaracad
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="flex gap-2 items-center">
                  <span>
                    <img src="/assets/landingpage/check2.svg" alt="" />
                  </span>
                  <span>
                    <p className=" text-[20px] font-semibold my-2 italic">
                      Our Locations{" "}
                    </p>
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <span>
                    <img src="/assets/landingpage/check2.svg" alt="" />
                  </span>
                  <span>
                    <p className=" text-[20px] font-semibold my-2 italic">
                      training Delivered Globally{" "}
                    </p>
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <span>
                    <img src="/assets/landingpage/check2.svg" alt="" />
                  </span>
                  <span>
                    <p className=" text-[20px] font-semibold my-2 italic">
                      training Delivered Globally{" "}
                    </p>
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <span>
                    <img src="/assets/landingpage/check2.svg" alt="" />
                  </span>
                  <span>
                    <p className=" text-[20px] font-semibold my-2 italic">
                      training Delivered Globally{" "}
                    </p>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </>
  );
}

export default Course;
