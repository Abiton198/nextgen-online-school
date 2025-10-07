"use client";

import React from "react";
import { Link } from "react-router-dom";

const Enrolment: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Flickering Banner */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-yellow-600 animate-pulse">
            ✨ ENROLMENT 2026 OPEN — Grade 8 & 9 Only ✨
          </h2>
          <p className="mt-2 text-gray-700 text-lg max-w-3xl mx-auto">
            At <strong>NextGen Independent Online School</strong>, we believe in shaping 
            learners from an <strong>early age</strong>. Enrolment is strictly at 
            <span className="text-yellow-700 font-bold"> Grade 8 & 9</span> so we can 
            model students into their <strong>early career paths</strong> and 
            streamline them toward definite futures in STEM, medicine, and innovation.
          </p>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-yellow-700 text-center">
          Enrolment Made Simple
        </h1>
        <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto">
          Enrolling your child is designed to be 
          <strong> fast, secure, and stress-free</strong>. In just a few clicks, 
          your child can begin their journey into a world of STEM learning and 
          future opportunities.
        </p>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-yellow-600 mb-2">📝 Step 1: Sign Up</h2>
            <p className="text-gray-700 text-sm">
              Parents create a secure account online and register their child’s details.  
              This gives instant access to the <strong>Parent Dashboard</strong>.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-yellow-600 mb-2">💳 Step 2: Payment</h2>
            <p className="text-gray-700 text-sm">
              Pay via <strong>PayFast</strong>, South Africa’s trusted gateway.  
              Choose between <strong>monthly, quarterly, or yearly</strong> options — 
              all safe and transparent.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-yellow-600 mb-2">🎓 Step 3: Start Learning</h2>
            <p className="text-gray-700 text-sm">
              Once payment is confirmed, learners are <strong>instantly onboarded</strong> 
              into Google Classroom with access to subjects, timetables, and teachers.
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="p-6 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl shadow-lg text-white space-y-4">
          <h2 className="text-2xl font-semibold">Why Parents Love Enrolling With Us</h2>
          <ul className="list-disc list-inside space-y-2 text-lg">
            <li><strong>Focused:</strong> Strict enrolment at Grade 8 & 9 ensures early career modeling.</li>
            <li><strong>Fast:</strong> Entire process takes less than 10 minutes.</li>
            <li><strong>Safe:</strong> All transactions handled by PayFast with bank-level security.</li>
            <li><strong>Transparent:</strong> Parents track payments and progress in their dashboard.</li>
            <li><strong>Seamless:</strong> No paperwork, no queues — 100% online.</li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-xl font-bold text-yellow-800">
            Enrol now for <span className="text-yellow-600">2026 Grade 8 & 9 intake</span> — 
            and give your child the <strong>early head start</strong> they deserve.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow hover:bg-yellow-700 transition animate-bounce"
          >
            🚀 Start Enrolment 2026
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

export default Enrolment;
