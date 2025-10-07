"use client";

import React from "react";
import { Link } from "react-router-dom";

const SubjectsOffered: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-green-200 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-green-700 text-center">
          Subjects Offered
        </h1>
        <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto">
          At <strong>NextGen Independent Online School</strong>, our subjects are more than 
          classes — they are <strong>gateways to future careers</strong>. Each subject is 
          carefully designed to prepare learners for the real world, 
          with a strong STEM focus.
        </p>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Language */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-green-600 mb-2">📚 English Language</h2>
            <p className="text-gray-700">
              Master communication — the foundation for <strong>law, media, business, 
              and global collaboration</strong>. Learners develop confidence in writing, 
              speaking, and critical thinking.
            </p>
          </div>

          {/* Mathematics (Pure) */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-green-600 mb-2">➗ Mathematics (Pure)</h2>
            <p className="text-gray-700">
              The language of science and technology. Mathematics builds 
              <strong>problem-solvers, engineers, and innovators</strong> — equipping 
              learners with logical reasoning and analytical skills.
            </p>
          </div>

          {/* Natural Sciences */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-green-600 mb-2">🔬 Natural Sciences</h2>
            <p className="text-gray-700">
              Unlock the mysteries of the physical and biological world.  
              A stepping stone to <strong>medicine, environmental science, 
              and biotechnology</strong>.
            </p>
          </div>

          {/* Digital Technology */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-green-600 mb-2">💻 Digital Technology</h2>
            <p className="text-gray-700">
              Prepares learners for the <strong>4th Industrial Revolution</strong>.  
              From cloud computing to IT infrastructure, this subject 
              creates future-ready digital citizens.
            </p>
          </div>

          {/* Life Orientation */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-green-600 mb-2">🌱 Life Orientation</h2>
            <p className="text-gray-700">
              Building balanced, resilient learners. Focused on 
              <strong>ethics, emotional intelligence, health, and leadership</strong> — 
              essential skills for thriving in life and work.
            </p>
          </div>

          {/* Coding & Programming */}
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-green-600 mb-2">⚙️ Coding & Programming</h2>
            <p className="text-gray-700">
              The skill of the future. Learners gain hands-on experience in 
              <strong>software development, robotics, and AI</strong> — creating 
              career pathways in technology, automation, and innovation.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-xl font-bold text-green-800">
            Each subject is a <span className="text-green-600">pathway</span> to new opportunities.  
            With NextGen, learners don’t just study — they prepare to <strong>lead the future</strong>.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition"
          >
            Enrol Now & Choose Your Future
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

export default SubjectsOffered;
