"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

const TIME_SLOTS = [
  "07:00 AM",
  "07:45 AM",
  "08:25 AM",
  "08:30 AM",
  "09:10 AM",
  "09:50 AM",
  "11:20 AM",
  "12:00 PM",
];

interface Teacher {
  id: string;
  name: string;
  subject: string;
  grade?: string;
}

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  teacherName: string;
}

const TimetableManager: React.FC = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const [newEntry, setNewEntry] = useState<Partial<TimetableEntry>>({
    grade: "Grade 8",
    subject: "",
    date: "",
    time: "",
    duration: 40,
    teacherName: "",
  });

  // 🔹 Fetch teachers dynamically
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "teachers"), (snap) => {
      const fetched = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Teacher, "id">),
      }));
      setTeachers(fetched);
      setSubjects([...new Set(fetched.map((t) => t.subject))]);
    });
    return () => unsub();
  }, []);

  // 🔹 Fetch timetable dynamically
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "timetable"), (snap) => {
      setEntries(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimetableEntry) }))
      );
    });
    return () => unsub();
  }, []);

  // 🔄 Auto-select teacher when subject changes
  useEffect(() => {
    if (newEntry.subject) {
      const match = teachers.find((t) => t.subject === newEntry.subject);
      if (match) {
        setNewEntry((p) => ({ ...p, teacherName: match.name }));
      }
    }
  }, [newEntry.subject, teachers]);

  // ➕ Add entry
  const addEntry = async () => {
    if (
      !newEntry.grade ||
      !newEntry.subject ||
      !newEntry.date ||
      !newEntry.time ||
      !newEntry.teacherName
    )
      return;
    await addDoc(collection(db, "timetable"), newEntry as TimetableEntry);
    setNewEntry({
      grade: "Grade 8",
      subject: "",
      date: "",
      time: "",
      duration: 40,
      teacherName: "",
    });
    setIsOpen(false);
  };

  const removeEntry = async (id: string) => {
    await deleteDoc(doc(db, "timetable", id));
  };

  return (
    <Card className="bg-white shadow mt-6">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>📅 Timetable Manager</CardTitle>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm"
        >
          {isOpen ? "− Close Form" : "➕ Add New Entry"}
        </Button>
      </CardHeader>

      <CardContent>
        {/* Collapsible Form */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 mt-3">
                {/* Grade */}
                <select
                  value={newEntry.grade}
                  onChange={(e) =>
                    setNewEntry((p) => ({ ...p, grade: e.target.value }))
                  }
                  className="border p-2 rounded"
                >
                  {[
                   
                    "Grade 8",
                    "Grade 9",
                   
                  ].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>

                {/* Subject */}
                <select
                  value={newEntry.subject}
                  onChange={(e) =>
                    setNewEntry((p) => ({ ...p, subject: e.target.value }))
                  }
                  className="border p-2 rounded"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                {/* Teacher */}
                <select
                  value={newEntry.teacherName}
                  onChange={(e) =>
                    setNewEntry((p) => ({ ...p, teacherName: e.target.value }))
                  }
                  className="border p-2 rounded"
                >
                  <option value="">Select Teacher</option>
                  {teachers
                    .filter(
                      (t) =>
                        !newEntry.subject || t.subject === newEntry.subject
                    )
                    .map((t) => (
                      <option key={t.id}>{t.name}</option>
                    ))}
                </select>

                {/* Date */}
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) =>
                    setNewEntry((p) => ({ ...p, date: e.target.value }))
                  }
                  className="border p-2 rounded"
                />

                {/* Time */}
                <select
                  value={newEntry.time}
                  onChange={(e) =>
                    setNewEntry((p) => ({ ...p, time: e.target.value }))
                  }
                  className="border p-2 rounded"
                >
                  <option value="">Select Time</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                {/* Duration */}
                <input
                  type="number"
                  placeholder="Duration (min)"
                  value={newEntry.duration}
                  onChange={(e) =>
                    setNewEntry((p) => ({
                      ...p,
                      duration: parseInt(e.target.value) || 60,
                    }))
                  }
                  className="border p-2 rounded"
                />
              </div>

              <Button
                onClick={addEntry}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Entry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timetable List */}
        <div className="mt-4 space-y-2">
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
