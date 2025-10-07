"use client";

import React from "react";
import { Link } from "react-router-dom";

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-12 relative">
      {/* Navigation Controls */}
      <div className="absolute top-4 left-4">
        <Link
          to="/"
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition"
        >
          <span className="text-xl">⬅️</span>
          <span className="font-medium">Home</span>
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <Link
          to="/"
          className="text-gray-600 hover:text-red-600 text-2xl font-bold transition"
        >
          ✖
        </Link>
      </div>

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-gray-800 text-center">
          Discover NextGen Independent Online School
        </h1>
        <p className="text-center text-lg text-gray-600 max-w-3xl mx-auto">
          We’re not just another school. We’re building{" "}
          <strong>future-ready innovators</strong> across South Africa and beyond.
        </p>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Why Choose */}
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-indigo-500 mb-2">🌟 Why Choose Us?</h2>
            <p className="text-gray-700 mb-4">
              Affordable, accessible, and globally connected. See why parents trust
              us to unlock their child’s full potential.
            </p>
            <Link
              to="/about/why-choose"
              className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-600 transition"
            >
              Read More →
            </Link>
          </div>

          {/* Learning Platform */}
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-blue-500 mb-2">💻 Learning Platform</h2>
            <p className="text-gray-700 mb-4">
              Our classrooms live inside Google Classroom, with dashboards that
              connect parents, students, and teachers seamlessly.
            </p>
            <Link
              to="/about/learning-platform"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
            >
              Read More →
            </Link>
          </div>

          {/* Subjects Offered */}
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-green-500 mb-2">📘 Subjects Offered</h2>
            <p className="text-gray-700 mb-4">
              From coding to natural sciences, every subject is a pathway to
              tomorrow’s careers. Which future will your child choose?
            </p>
            <Link
              to="/about/subjects"
              className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition"
            >
              Read More →
            </Link>
          </div>

          {/* Enrolment */}
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-yellow-500 mb-2">📝 Enrolment</h2>
            <p className="text-gray-700 mb-4">
              Fast, safe, and 100% online. Get started in less than 10 minutes
              with PayFast-powered enrolment.
            </p>
            <Link
              to="/about/enrolment"
              className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-600 transition"
            >
              Read More →
            </Link>
          </div>

          {/* Vision */}
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-purple-500 mb-2">🚀 Our Vision</h2>
            <p className="text-gray-700 mb-4">
              We’re not just teaching lessons — we’re shaping Africa’s future
              leaders in STEM, medicine, and innovation.
            </p>
            <Link
              to="/about/vision"
              className="inline-block bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600 transition"
            >
              Read More →
            </Link>
          </div>

          {/* Fees Structure */}
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-red-500 mb-2">💳 Fees Structure</h2>
            <p className="text-gray-700 mb-4">
              Quality education doesn’t have to break the bank. Explore our
              flexible, parent-friendly plans with built-in discounts.
            </p>
            <Link
              to="/about/fees"
              className="inline-block bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition"
            >
              Read More →
            </Link>
          </div>

          {/* Teaching Staff */}
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-pink-500 mb-2">👩‍🏫 Our Teaching Staff</h2>
            <p className="text-gray-700 mb-4">
              We empower women, uplift marginalized communities, and unite teachers of 
              all races to pass knowledge on to the next generation.
            </p>
            <Link
              to="/about/teaching-staff"
              className="inline-block bg-pink-500 text-white px-4 py-2 rounded-lg shadow hover:bg-pink-600 transition"
            >
              Read More →
            </Link>
          </div>

          {/* Accreditation */}
          <div className="p-6 bg-white rounded-xl shadow hover:shadow-md transition">
            <h2 className="text-2xl font-semibold text-teal-500 mb-2">🎓 Accreditation</h2>
            <p className="text-gray-700 mb-4">
              Accredited with BEd and CETA, building partnerships with NMU and 
              South Africa’s top universities to ensure smooth pathways into 
              higher education.
            </p>
            <Link
              to="/about/accreditation"
              className="inline-block bg-teal-500 text-white px-4 py-2 rounded-lg shadow hover:bg-teal-600 transition"
            >
              Read More →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
