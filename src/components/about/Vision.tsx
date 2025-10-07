"use client";

import React from "react";
import { Link } from "react-router-dom";

const Vision: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-indigo-200 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-indigo-700 text-center">
          Our Vision
        </h1>
        <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto">
          At <strong>NextGen Independent Online School</strong>, we believe education 
          must not only prepare learners for exams — it must prepare them to 
          <strong>shape the future</strong>.
        </p>

        {/* Vision Statement */}
        <div className="p-6 bg-white rounded-xl shadow-lg space-y-4">
          <h2 className="text-2xl font-semibold text-indigo-600">
            🚀 Building Future Innovators
          </h2>
          <p className="text-gray-700 text-lg">
            Our vision is to be South Africa’s leading online CAPS STEM high school — 
            a place where learners become <strong>innovators, problem-solvers, and leaders</strong>.  
            We cultivate talent in <strong>engineering, medicine, science, and technology</strong> 
            with a firm grounding in African innovation.
          </p>
        </div>

        {/* Manifesto-style Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-indigo-50 rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold text-indigo-700 mb-2">🌍 Global, Yet Local</h3>
            <p className="text-gray-700 text-sm">
              We blend world-class STEM learning with an African identity — producing 
              learners who can thrive anywhere while staying rooted in home values.
            </p>
          </div>

          <div className="p-6 bg-indigo-50 rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold text-indigo-700 mb-2">💡 Innovation at Core</h3>
            <p className="text-gray-700 text-sm">
              Every learner is empowered with future-ready skills in Robotics, AI, 
              and Programming — preparing them for careers that don’t even exist yet.
            </p>
          </div>

          <div className="p-6 bg-indigo-50 rounded-lg shadow hover:shadow-md transition">
            <h3 className="text-xl font-semibold text-indigo-700 mb-2">🤝 Inclusive & Accessible</h3>
            <p className="text-gray-700 text-sm">
              Our model breaks barriers of geography, cost, and inequality.  
              Education is for <strong>all learners with ambition</strong>, 
              no matter where they come from.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-xl font-bold text-indigo-800">
            NextGen isn’t just a school.  
            It’s a <span className="text-indigo-600">movement of future-shapers</span>.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition"
          >
            Enrol Now & Be Part of the Future
          </Link>
        </div>

        {/* Back Navigation */}
        <div className="text-center mt-6">
          <Link
            to="/about"
            className="inline-block bg-gray-200 text-gray-800 px-6 py-2 rounded-lg shadow hover:bg-gray-300 transition"
          >
            ← Back to About Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Vision;
