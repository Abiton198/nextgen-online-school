"use client";

import React from "react";
import { Link } from "react-router-dom";

const FeesStructure: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-green-200 px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-green-700 text-center">
          Fees Structure
        </h1>

        <p className="text-lg text-gray-700 text-center">
          Affordable, secure, and convenient — powered by PayFast.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="p-6 rounded-xl shadow-lg bg-white text-center">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">Monthly</h2>
            <p className="text-gray-600">R1,500 / month</p>
            <p className="text-sm text-gray-500 mt-2">Flexible PayFast subscription</p>
          </div>

          <div className="p-6 rounded-xl shadow-lg bg-white text-center border-4 border-yellow-400">
            <h2 className="text-xl font-semibold text-yellow-600 mb-2">Quarterly</h2>
            <p className="text-gray-600">R4,000 / quarter</p>
            <p className="text-sm text-gray-500 mt-2">Save 10% with upfront payment</p>
          </div>

          <div className="p-6 rounded-xl shadow-lg bg-white text-center border-4 border-green-500">
            <h2 className="text-xl font-semibold text-green-600 mb-2">Yearly</h2>
            <p className="text-gray-600">R15,000 / year</p>
            <p className="text-sm text-gray-500 mt-2">Save 20% with upfront payment</p>
          </div>
        </div>

        <div className="text-center mt-8">
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

export default FeesStructure;
