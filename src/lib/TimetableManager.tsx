"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const SUBJECTS = [
  "English Language",
  "Mathematics",
  "Natural Sciences",
  "Digital Technology",
  "Life Orientation",
  "Coding & Programming",
];

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  day: string;
  time: string;
  duration: number;
  teacherName: string;
  googleClassroomLink: string;
}

const TimetableManager: React.FC = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Partial<TimetableEntry>>({
    grade: "Grade 8",
    subject: SUBJECTS[0],
    day: "",
    time: "",
    duration: 60,
    teacherName: "",
    googleClassroomLink: "",
  });

  // 🔎 fetch timetable live
  useEffect(() => {
    const q = collection(db, "timetable");
    const unsub = onSnapshot(q, (snap) =>
      setEntries(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimetableEntry) })))
    );
    return () => unsub();
  }, []);

  // ➕ add entry and update all students of that grade with classroom link
  const addEntry = async () => {
    if (!newEntry.grade || !newEntry.subject || !newEntry.googleClassroomLink) return;

    const docRef = await addDoc(collection(db, "timetable"), newEntry as any);

    // push link into all students of this grade
    const q = query(collection(db, "students"), where("grade", "==", newEntry.grade));
    const snap = await getDocs(q);
    for (const s of snap.docs) {
      const studentId = s.id;
      await setDoc(
        doc(db, "students", studentId, "classrooms", newEntry.subject!),
        { subject: newEntry.subject, link: newEntry.googleClassroomLink },
        { merge: true }
      );
    }

    setNewEntry({
      grade: "Grade 8",
      subject: SUBJECTS[0],
      day: "",
      time: "",
      duration: 60,
      teacherName: "",
      googleClassroomLink: "",
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
          <select
            value={newEntry.grade}
            onChange={(e) => setNewEntry((prev) => ({ ...prev, grade: e.target.value }))}
            className="border p-2 rounded"
          >
            {["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <select
            value={newEntry.subject}
            onChange={(e) => setNewEntry((prev) => ({ ...prev, subject: e.target.value }))}
            className="border p-2 rounded"
          >
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Input placeholder="Day" value={newEntry.day} onChange={(e) => setNewEntry(p => ({...p, day:e.target.value}))}/>
          <Input placeholder="Time (HH:MM)" value={newEntry.time} onChange={(e) => setNewEntry(p => ({...p, time:e.target.value}))}/>
          <Input type="number" placeholder="Duration (min)" value={newEntry.duration} onChange={(e)=>setNewEntry(p=>({...p,duration:parseInt(e.target.value)||60}))}/>
          <Input placeholder="Teacher" value={newEntry.teacherName} onChange={(e) => setNewEntry(p=>({...p,teacherName:e.target.value}))}/>
          <Input placeholder="Google Classroom Link" value={newEntry.googleClassroomLink} onChange={(e) => setNewEntry(p=>({...p,googleClassroomLink:e.target.value}))}/>
        </div>

        <Button onClick={addEntry} className="bg-blue-600 text-white hover:bg-blue-700">
          Add Entry
        </Button>

        <div className="mt-6 space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">{e.subject} — {e.grade}</p>
                <p className="text-sm text-gray-600">{e.day} {e.time} ({e.duration}m) — {e.teacherName}</p>
              </div>
              <div className="flex gap-2">
                <a href={e.googleClassroomLink} target="_blank" className="text-blue-600 underline text-sm">Link</a>
                <Button variant="destructive" size="sm" onClick={() => removeEntry(e.id)}>✕</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimetableManager;

