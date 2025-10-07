"use client";

import React from "react";
import { Link } from "react-router-dom";

const LearningPlatform: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-purple-200 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-purple-700 text-center">
          Our Learning Platform
        </h1>
        <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto">
          At <strong>NextGen Independent Online School</strong>, technology is the 
          bridge between our learners, teachers, and parents.  
          We combine the global power of <strong>Google Classroom</strong> with 
          <strong> custom-built dashboards</strong> to create an engaging, transparent, 
          and future-ready learning environment.
        </p>

        {/* Google Classroom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-white shadow-lg">
            <h2 className="text-2xl font-semibold text-purple-600 mb-3">
              How Google Classroom Works with Us
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>
                Learners log in daily to access <strong>assignments, study material, and virtual lessons</strong>.
              </li>
              <li>
                Teachers share lesson resources, mark assignments, and provide <strong>instant feedback</strong>.
              </li>
              <li>
                Classes are structured with <strong>CAPS-aligned content</strong> plus advanced STEM modules 
                like Robotics, AI, and Coding.
              </li>
              <li>
                Learners enjoy <strong>24/7 access</strong> to past lessons, resources, and recordings for revision.
              </li>
              <li>
                Parents can monitor their child’s progress and feedback directly through the portal.
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-tr from-purple-600 to-purple-400 text-white shadow-lg">
            <h2 className="text-2xl font-semibold mb-3">Why This Matters</h2>
            <p className="text-lg">
              Unlike ordinary online schools, our platform doesn’t just digitize 
              textbooks — it builds a <strong>living, interactive learning journey</strong>.  
              Learners don’t get lost in isolation; they are guided step by step with 
              structured schedules, reminders, and interactive sessions.
            </p>
          </div>
        </div>

        {/* Dashboard Section */}
        <div className="p-6 rounded-xl bg-white shadow-lg">
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
            Integrated Dashboards — Parents, Teachers, and Students
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Card */}
            <div className="p-4 bg-indigo-50 rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">🎓 Student Dashboard</h3>
              <p className="text-gray-700 text-sm">
                Students manage classes, access Google Classroom links, see 
                <strong>timetables</strong>, view <strong>leaderboards</strong>, 
                and track <strong>assignments & attendance</strong>.
              </p>
            </div>

            {/* Teacher Card */}
            <div className="p-4 bg-indigo-50 rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">👩‍🏫 Teacher Dashboard</h3>
              <p className="text-gray-700 text-sm">
                Teachers upload lesson material, manage <strong>timetables</strong>, 
                award or deduct points, and monitor student engagement — all 
                synced with Google Classroom.
              </p>
            </div>

            {/* Parent Card */}
            <div className="p-4 bg-indigo-50 rounded-lg shadow hover:shadow-md transition">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">👨‍👩‍👧 Parent Dashboard</h3>
              <p className="text-gray-700 text-sm">
                Parents can track <strong>payments</strong>, monitor 
                <strong>progress & attendance</strong>, receive instant 
                communications, and ensure their child is on the right path.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-10">
          <p className="text-lg font-semibold text-purple-800">
            🚀 With NextGen, every learner has a <strong>360° support system</strong> —
            the future of education is not only online, it’s connected.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 bg-purple-600 text-white px-6 py-3 rounded-lg shadow hover:bg-purple-700 transition"
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

export default LearningPlatform;
