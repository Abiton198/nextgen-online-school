"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("classroom");
  const [dateTime, setDateTime] = useState(new Date());

  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [attendance, setAttendance] = useState(0);

  // ⏱ live clock
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      // 🔎 Student profile
      const studentRef = doc(db, "students", user.uid);
      const snap = await getDoc(studentRef);
      if (!snap.exists()) return;

      const sData = snap.data();
      if (sData.status !== "enrolled") {
        setStudent({ status: sData.status });
        return;
      }

      setStudent(sData);

      // 🔎 Classes
      const cQ = query(
        collection(db, "classes"),
        where("grade", "==", sData.grade),
        where("classSection", "==", sData.classSection)
      );
      const cSnap = await getDocs(cQ);
      setClasses(cSnap.docs.map((d) => d.data()));

      // 🔎 Assignments
      const aQ = query(
        collection(db, "assignments"),
        where("grade", "==", sData.grade),
        where("classSection", "==", sData.classSection)
      );
      const aSnap = await getDocs(aQ);
      setAssignments(aSnap.docs.map((d) => d.data()));

      // 🔎 Marks
      const mQ = query(
        collection(db, "marks"),
        where("uid", "==", user.uid)
      );
      const mSnap = await getDocs(mQ);
      setMarks(mSnap.docs.map((d) => d.data()));

      // 🔎 Attendance (simple %)
      setAttendance(sData.attendance || 0);
    };

    fetchData();
  }, [user]);

  if (!student) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (student.status !== "enrolled") {
    return (
      <div className="min-h-screen flex items-center justify-center text-yellow-600">
        Your profile exists but is not yet <b>enrolled</b>. Wait for principal approval.
      </div>
    );
  }

  // 🔎 helper: check if class is active now
  const isClassActive = (cls: any) => {
    const now = new Date();
    const [h, m] = cls.time.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);

    const end = new Date(start.getTime() + (cls.duration || 60) * 60000);

    return now >= start && now <= end && 
           cls.day.toLowerCase() === now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {student.name}</h1>
            <p className="text-gray-600">Grade {student.grade} - {student.classSection}</p>
            <p className="text-sm text-gray-500">{dateTime.toLocaleDateString()} — {dateTime.toLocaleTimeString()}</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-6 border-t bg-gray-100 py-2">
          {["classroom", "assignments", "marks", "attendance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? "bg-blue-600 text-white" : "text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-6">
        {activeTab === "classroom" && (
          <div className="grid gap-4">
            {classes.map((cls, i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded-lg bg-white">
                <div>
                  <h3 className="font-bold">{cls.subject}</h3>
                  <p className="text-sm text-gray-600">{cls.day} at {cls.time}</p>
                </div>
                <a
                  href={isClassActive(cls) ? cls.meetLink : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded ${
                    isClassActive(cls)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isClassActive(cls) ? "Join Class" : "Not Active"}
                </a>
              </div>
            ))}
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="space-y-3">
            {assignments.map((a, i) => (
              <div key={i} className="p-4 border rounded bg-white">
                <h3 className="font-semibold">{a.title}</h3>
                <p className="text-sm">{a.subject} — Due {a.due}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "marks" && (
          <div className="space-y-3">
            {marks.map((m, i) => (
              <div key={i} className="p-4 border rounded bg-white flex justify-between">
                <span>{m.subject}</span>
                <span className="font-bold">{m.score}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="p-6 bg-white rounded shadow text-center">
            <h3 className="text-xl font-bold">Attendance</h3>
            <p className="text-3xl mt-2">{attendance}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
