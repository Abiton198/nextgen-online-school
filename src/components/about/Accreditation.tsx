"use client";

import React from "react";
import { Link } from "react-router-dom";

// Placeholder logo URLs (replace with local assets or CDN links)
const logos = {
  nmu: "https://upload.wikimedia.org/wikipedia/en/4/4e/Nelson_Mandela_University_logo.png",
  coursera: "https://upload.wikimedia.org/wikipedia/commons/7/75/Coursera_logo.svg",
  google: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  amazon: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  ibm: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
};

const Accreditation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-gray-100 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-teal-700 text-center">
          Accreditation & University Pathways
        </h1>
        <p className="text-center text-lg text-gray-700 max-w-3xl mx-auto">
          At <strong>NextGen Independent Online School</strong>, we ensure 
          credibility and recognition at every step — from daily classes 
          to university entry.
        </p>

        {/* Key Accreditation Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-teal-600 mb-2">📚 Certified Teachers</h2>
            <p className="text-gray-700">
              Our staff are accredited with <strong>BEd</strong> and <strong>CETA</strong>, 
              ensuring every subject is taught by qualified professionals.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-teal-600 mb-2">📝 Exam Credibility</h2>
            <p className="text-gray-700">
              Learners complete their <strong>Grade 12 National Senior Certificate (NSC)</strong> 
              exams at a registered centre nearest to them. All other exams are administered 
              <strong> online</strong> through secure proctoring and monitoring systems.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-teal-600 mb-2">🤝 University Partnerships</h2>
            <p className="text-gray-700">
              We are building collaborations with top South African universities — starting 
              with <strong>NMU Science Department</strong> — to ensure smooth transitions 
              into STEM and other fields.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-teal-600 mb-2">🎓 Pre-Entry Accreditation</h2>
            <p className="text-gray-700">
              Every learner will complete a <strong>pre-university accredited course</strong> 
              (Coursera, IBM, Amazon, or Google) to strengthen their university applications 
              and career readiness.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-teal-700 text-center mb-8">
            📍 The NextGen Learner Journey
          </h2>
          <div className="space-y-8 relative border-l-4 border-teal-400 pl-6">
            <div>
              <h3 className="text-lg font-semibold text-teal-600">Step 1: Online Classes</h3>
              <p className="text-gray-700">
                Interactive online lessons taught by certified teachers with continuous 
                assessment and feedback.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-teal-600">Step 2: Online Exams</h3>
              <p className="text-gray-700">
                All grades (except G12) write secure online exams with proctoring to ensure 
                credibility and fairness.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-teal-600">Step 3: Grade 12 NSC Exams</h3>
              <p className="text-gray-700">
                Learners register at their nearest exam centre to write the official 
                <strong> National Senior Certificate</strong> (Matric) exams.
              </p>
              <div className="mt-2">
                <img src={logos.nmu} alt="NMU logo" className="h-10" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-teal-600">Step 4: University Pathways</h3>
              <p className="text-gray-700">
                With NSC results plus an extra pre-entry accredited course, learners 
                transition seamlessly into top universities in South Africa and beyond.
              </p>
              <div className="flex flex-wrap gap-4 mt-2 items-center">
                <img src={logos.coursera} alt="Coursera" className="h-8" />
                <img src={logos.google} alt="Google" className="h-6" />
                <img src={logos.amazon} alt="Amazon" className="h-6" />
                <img src={logos.ibm} alt="IBM" className="h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-xl font-bold text-teal-800">
            NextGen makes sure your child is <strong>exam-ready, accredited, and 
            university-prepared</strong> every step of the way.
          </p>
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

export default Accreditation;
