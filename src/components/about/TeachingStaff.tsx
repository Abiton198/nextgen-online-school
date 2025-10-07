"use client";

import React from "react";
import { Link } from "react-router-dom";

const TeachingStaff: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-pink-200 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-pink-700 text-center">
          Meet Our Teaching Staff
        </h1>
        <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto">
          At <strong>NextGen Independent Online School</strong>, our staff is more 
          than educators — they are <strong>mentors, leaders, and changemakers</strong>.  
          We take pride in empowering women first, uplifting marginalized girls and 
          women, and giving every qualified South African resident the chance to 
          shape the next generation.
        </p>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-pink-600 mb-2">🌸 Women Empowerment</h2>
            <p className="text-gray-700">
              We prioritize hiring and empowering women, especially those from 
              marginalized backgrounds, to step into leadership roles as 
              educators and role models for learners.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-pink-600 mb-2">🌍 Diversity & Unity</h2>
            <p className="text-gray-700">
              Our staff reflects South Africa’s rainbow nation — a true 
              mixture of all races, cultures, and communities, united with no 
              segregation or bias.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-pink-600 mb-2">📖 Equal Opportunity</h2>
            <p className="text-gray-700">
              We believe that every qualified South African resident deserves 
              the opportunity to pass their skills and wisdom on to learners, 
              creating a more inclusive future.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition">
            <h2 className="text-xl font-semibold text-pink-600 mb-2">🚀 Inspiring the Next Generation</h2>
            <p className="text-gray-700">
              Our teachers don’t just teach — they inspire learners to dream 
              bigger, reach higher, and step confidently into STEM careers 
              and leadership roles.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-xl font-bold text-pink-800">
            Together, we are rewriting the future of education in South Africa.  
            Join us — as a learner, a parent, or a teacher — in shaping the next generation.
          </p>
          <Link
            to="/teacher-application"
            className="inline-block mt-6 bg-pink-600 text-white px-6 py-3 rounded-lg shadow hover:bg-pink-700 transition"
          >
            Apply to Teach at NextGen
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

export default TeachingStaff;
