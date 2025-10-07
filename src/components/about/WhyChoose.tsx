"use client";

import React from "react";
import { Link } from "react-router-dom";

const WhyChoose: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-blue-700 text-center">
          Why Choose NextGen?
        </h1>
        <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto">
          Choosing the right school is about <strong>trust, innovation, and opportunity</strong>.  
          At NextGen Independent Online School, we provide world-class STEM education —  
          affordable, safe, and tailored to prepare your child for the future.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Affordability */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">💰 Affordable & Flexible</h2>
            <p className="text-gray-700">
              Education shouldn’t be limited by cost. Our <strong>PayFast online payment</strong> system 
              allows parents to choose <strong>monthly, quarterly, or yearly</strong> options with discounts. 
              Safe, transparent, and convenient.
            </p>
          </div>

          {/* Global Access */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">🌍 Global Accessibility</h2>
            <p className="text-gray-700">
              Whether you’re in Johannesburg or in a rural area, our online model gives learners 
              <strong>equal access to quality STEM education</strong>. All you need is a device 
              and stable internet connection.
            </p>
          </div>

          {/* STEM Uniqueness */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">🔬 Future-Focused STEM</h2>
            <p className="text-gray-700">
              Unlike general online schools, NextGen is <strong>exclusively STEM-driven</strong>. 
              Learners gain a solid foundation in <strong>Mathematics, Sciences, IT, Robotics, and AI</strong>, 
              preparing them for careers in engineering, medicine, and technology.
            </p>
          </div>

          {/* Safety */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">🔒 Safe & Monitored</h2>
            <p className="text-gray-700">
              Parents stay in control with <strong>integrated dashboards</strong>. Monitor 
              payments, attendance, and progress — ensuring learners study in a 
              <strong>secure, disruption-free environment</strong>.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-lg font-semibold text-blue-800">
            🚀 NextGen is more than a school — it’s a <strong>launchpad</strong> for innovators, 
            problem-solvers, and leaders of tomorrow.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Enrol Now
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

export default WhyChoose;
