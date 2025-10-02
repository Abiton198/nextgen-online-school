// src/components/dashboard/StudentDashboard.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

interface StudentProfile {
  name: string;
  grade: string;
  classSection: string;
  points?: number;
  attendance?: number;
  currentClasses?: any[];
  assignments?: any[];
  upcomingExams?: any[];
}

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      try {
        const studentRef = doc(db, "students", user.uid);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          console.error("No student record found.");
          setStudentData(null);
          return;
        }

        const studentInfo = studentSnap.data() as StudentProfile;

        // 🔎 Fetch related collections
        const classesQ = query(
          collection(db, "classes"),
          where("grade", "==", studentInfo.grade),
          where("classSection", "==", studentInfo.classSection)
        );
        const classesSnap = await getDocs(classesQ);

        const assignmentsQ = query(
          collection(db, "assignments"),
          where("grade", "==", studentInfo.grade),
          where("classSection", "==", studentInfo.classSection)
        );
        const assignmentsSnap = await getDocs(assignmentsQ);

        const examsQ = query(
          collection(db, "exams"),
          where("grade", "==", studentInfo.grade),
          where("classSection", "==", studentInfo.classSection)
        );
        const examsSnap = await getDocs(examsQ);

        setStudentData({
          ...studentInfo,
          currentClasses: classesSnap.docs.map((d) => d.data()),
          assignments: assignmentsSnap.docs.map((d) => d.data()),
          upcomingExams: examsSnap.docs.map((d) => d.data()),
        });
      } catch (err) {
        console.error("Error fetching student dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  // ---------------- Guards ----------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading your dashboard...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        You must be signed in to view the dashboard.
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        No student data found. Contact your teacher or admin.
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back, {studentData.name}!</p>
              <p className="text-sm text-gray-500">
                {studentData.grade} - {studentData.classSection}
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Points</h3>
            <p className="text-3xl font-bold">{studentData.points || 0}</p>
          </div>
          <div className="bg-green-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Attendance</h3>
            <p className="text-3xl font-bold">{studentData.attendance || 0}%</p>
          </div>
          <div className="bg-orange-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Assignments</h3>
            <p className="text-3xl font-bold">{studentData.assignments?.length || 0}</p>
          </div>
          <div className="bg-purple-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Grade</h3>
            <p className="text-3xl font-bold">
              {studentData.grade?.replace("Grade ", "")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Classes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Today's Classes</h2>
            {studentData.currentClasses?.length ? (
              <div className="space-y-4">
                {studentData.currentClasses.map((cls, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{cls.subject}</h3>
                      <p className="text-sm text-gray-600">
                        {cls.time} - {cls.teacher}
                      </p>
                    </div>
                    <a
                      href={cls.meetLink || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Join Class
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No classes scheduled today.</p>
            )}
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Assignments</h2>
            {studentData.assignments?.length ? (
              <div className="space-y-4">
                {studentData.assignments.map((assignment, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">
                        {assignment.subject} - Due: {assignment.due}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        assignment.status === "submitted"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No assignments found.</p>
            )}
          </div>
        </div>

        {/* Exams */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">Upcoming Exams</h2>
          {studentData.upcomingExams?.length ? (
            <div className="space-y-4">
              {studentData.upcomingExams.map((exam, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exam.subject}</h3>
                    <p className="text-sm text-gray-600">{exam.type}</p>
                  </div>
                  <p className="text-sm font-medium text-purple-600">{exam.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming exams scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
