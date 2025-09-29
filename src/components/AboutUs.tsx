"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const AboutUs: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll into view when expanded
  useEffect(() => {
    if (expanded && expandedRef.current) {
      expandedRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [expanded]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Page Heading */}
        <h1 className="text-4xl font-bold text-center text-blue-700">
          About Us
        </h1>

        {/* 🔹 Navigation buttons (TOP) */}
        <div className="flex justify-center gap-4 mt-4">
          <Link
            to="/"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow hover:bg-gray-300 transition"
          >
            ← Return Home
          </Link>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Enrol Now
          </Link>
        </div>

        {/* Intro */}
        <section className="space-y-4 text-lg leading-relaxed">
          <p>
            <strong>NextGen Independent Online School</strong>, based in{" "}
            <strong>Gqeberha, Eastern Cape</strong>, is a proudly{" "}
            <em>indigenous Black South African women–led initiative</em> created in
            collaboration with experienced science educators and software innovators.
          </p>
          <p>
            As a <strong>CAPS-registered independent STEM high school</strong>, we
            empower learners with career-focused pathways in{" "}
            <strong>engineering, medicine, mathematics, robotics, and technology
            innovation</strong>.
          </p>
        </section>

        {/* Two Featured Sections */}
        <section>
          <h2 className="text-2xl font-semibold text-blue-600 mb-2">
            Why Choose NextGen?
          </h2>
          <p>
            We offer a <strong>globally accessible</strong> STEM education with
            integrated dashboards for parents, teachers, and students. Learners
            benefit from <strong>secure tuition payments</strong>, immersive
            science labs, and a focus on career-readiness through Pure Mathematics
            and advanced science modules.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blue-600 mb-2">
            Our Learning Platform
          </h2>
          <p>
            Powered by <strong>Google Classroom</strong> and enhanced with{" "}
            <strong>custom dashboards</strong>, our platform creates a
            transparent, collaborative environment. It supports{" "}
            <strong>virtual science labs</strong>, AI, robotics, and programming
            as complementary programs to CAPS subjects.
          </p>
        </section>

        {/* Read More Toggle */}
        {!expanded && (
          <div className="text-center pt-6">
            <button
              onClick={() => setExpanded(true)}
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Read More
            </button>
          </div>
        )}

        {/* Animated Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="expanded-content"
              ref={expandedRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="overflow-hidden space-y-8 relative"
            >
              <section>
                <h2 className="text-2xl font-semibold text-blue-600 mb-2">Our Niche</h2>
                <p>
                  Unlike general online schools, <strong>NextGen Online School</strong> is dedicated
                  exclusively to <strong>STEM education</strong>. We go beyond textbooks with
                  real-world applications, industry exposure, and innovation-driven programs.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-blue-600 mb-2">Future Partnerships</h2>
                <p>
                  We are building partnerships with leading South African universities such as{" "}
                  <strong>Nelson Mandela University</strong>, with the goal of creating{" "}
                  <strong>feeder pathways</strong> for our learners into science and technology degrees.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-blue-600 mb-2">Subjects Offered</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>5 CAPS Compulsory Subjects (including Pure Mathematics and Physical Sciences).</li>
                  <li>Complementary Programs: Artificial Intelligence, Robotics, and Programming.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-blue-600 mb-2">Enrolment</h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Parents sign up online via our secure portal.</li>
                  <li>They register their child’s details in the Parent Dashboard.</li>
                  <li>Payments are made via PayFast (monthly or annually).</li>
                  <li>Learners are onboarded into Google Classroom to begin their STEM journey.</li>
                </ol>
              </section>

              <section className="text-center pt-6 border-t">
                <h2 className="text-2xl font-semibold text-blue-700 mb-2">Our Vision</h2>
                <p>
                  To be South Africa’s leading online CAPS STEM high school — preparing{" "}
                  <strong>innovators, problem-solvers, and leaders</strong> who will shape the
                  future in engineering, science, medicine, and technology.
                </p>
              </section>

              <div className="text-center mt-10">
                <p className="font-bold text-blue-800 text-lg">
                  🔥 NextGen Independent Online School — “Future-Ready. Globally Connected. Rooted in African Innovation.”
                </p>
              </div>

              {/* 🔹 Navigation buttons (BOTTOM) */}
              <div className="flex justify-center gap-4 mt-8">
                <Link
                  to="/"
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow hover:bg-gray-300 transition"
                >
                  ← Return Home
                </Link>
                <Link
                  to="/"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                >
                  Enrol Now
                </Link>
              </div>

              {/* Sticky Collapse Button */}
              <div className="sticky bottom-4 flex justify-center pt-6 bg-gradient-to-t from-gray-50">
                <button
                  onClick={() => setExpanded(false)}
                  className="inline-block bg-gray-200 text-gray-700 px-6 py-2 rounded-lg shadow hover:bg-gray-300 transition"
                >
                  Show Less
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AboutUs;
