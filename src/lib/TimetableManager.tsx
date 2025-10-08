"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const SUBJECTS_TEACHERS: Record<string, string> = {
  "English Language": "Mr. Smith",
  "Mathematics": "Mrs. Johnson",
  "Natural Sciences": "Dr. Brown",
  "Digital Technology": "Ms. Lee",
  "Life Orientation": "Mr. Adams",
  "Coding & Programming": "Ms. Davis",
};

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
];

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  date: string; // formatted yyyy-mm-dd
  time: string;
  duration: number;
  teacherName: string;
}

const TimetableManager: React.FC = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Partial<TimetableEntry>>({
    grade: "Grade 8",
    subject: "English Language",
    date: "",
    time: "",
    duration: 60,
    teacherName: SUBJECTS_TEACHERS["English Language"],
  });

  // 🔎 fetch timetable live
  useEffect(() => {
    const q = collection(db, "timetable");
    const unsub = onSnapshot(q, (snap) =>
      setEntries(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimetableEntry) }))
      )
    );
    return () => unsub();
  }, []);

  // ➕ add entry
  const addEntry = async () => {
    if (!newEntry.grade || !newEntry.subject || !newEntry.date || !newEntry.time) return;
    await addDoc(collection(db, "timetable"), newEntry as any);

    setNewEntry({
      grade: "Grade 8",
      subject: "English Language",
      date: "",
      time: "",
      duration: 60,
      teacherName: SUBJECTS_TEACHERS["English Language"],
    });
  };

  const removeEntry = async (id: string) => {
    await deleteDoc(doc(db, "timetable", id));
  };

  return (
    <Card className="bg-white shadow mt-6">
      <CardHeader>
        <CardTitle>📅 Timetable Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {/* Grade dropdown */}
          <select
            value={newEntry.grade}
            onChange={(e) =>
              setNewEntry((prev) => ({ ...prev, grade: e.target.value }))
            }
            className="border p-2 rounded"
          >
            {["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>

          {/* Subject dropdown */}
          <select
            value={newEntry.subject}
            onChange={(e) => {
              const subject = e.target.value;
              setNewEntry((prev) => ({
                ...prev,
                subject,
                teacherName: SUBJECTS_TEACHERS[subject],
              }));
            }}
            className="border p-2 rounded"
          >
            {Object.keys(SUBJECTS_TEACHERS).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          {/* Teacher dropdown (autofills based on subject) */}
          <select
            value={newEntry.teacherName}
            onChange={(e) => {
              const teacher = e.target.value;
              // Find subject that matches this teacher
              const subject = Object.entries(SUBJECTS_TEACHERS).find(
                ([subj, tch]) => tch === teacher
              )?.[0];
              setNewEntry((prev) => ({
                ...prev,
                teacherName: teacher,
                subject: subject || prev.subject!,
              }));
            }}
            className="border p-2 rounded"
          >
            {Object.values(SUBJECTS_TEACHERS).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={newEntry.date}
            onChange={(e) =>
              setNewEntry((prev) => ({ ...prev, date: e.target.value }))
            }
            className="border p-2 rounded"
          />

          {/* Time dropdown */}
          <select
            value={newEntry.time}
            onChange={(e) =>
              setNewEntry((prev) => ({ ...prev, time: e.target.value }))
            }
            className="border p-2 rounded"
          >
            <option value="">Select Time</option>
            {TIME_SLOTS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          {/* Duration input */}
          <input
            type="number"
            placeholder="Duration (min)"
            value={newEntry.duration}
            onChange={(e) =>
              setNewEntry((p) => ({ ...p, duration: parseInt(e.target.value) || 60 }))
            }
            className="border p-2 rounded"
          />
        </div>

        <Button
          onClick={addEntry}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Add Entry
        </Button>

        <div className="mt-6 space-y-2">
          {entries.map((e) => (
            <div
              key={e.id}
              className="p-3 border rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {e.subject} — {e.grade}
                </p>
                <p className="text-sm text-gray-600">
                  {e.date} {e.time} ({e.duration}m) — {e.teacherName}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeEntry(e.id)}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimetableManager;
