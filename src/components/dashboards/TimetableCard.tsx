"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  date: string;       // now using date instead of "day"
  time: string;
  duration: number;
  teacherName: string;
}

interface Props {
  grade?: string;   // student’s grade OR parent’s child grade
  subject?: string; // teacher’s subject filter
}

const TimetableCard: React.FC<Props> = ({ grade, subject }) => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    if (!grade && !subject) return;

    const timetableRef = collection(db, "timetable");
    let q;

    if (subject && grade === "all") {
      // Teacher view → filter by subject only (all grades)
      q = query(
        timetableRef,
        where("subject", "==", subject),
        orderBy("date"),
        orderBy("time")
      );
    } else if (subject && grade) {
      // Filter by both grade + subject
      q = query(
        timetableRef,
        where("grade", "==", grade),
        where("subject", "==", subject),
        orderBy("date"),
        orderBy("time")
      );
    } else {
      // Student/parent view → filter by grade only
      q = query(
        timetableRef,
        where("grade", "==", grade!),
        orderBy("date"),
        orderBy("time")
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as TimetableEntry) }))
      );
    });

    return () => unsub();
  }, [grade, subject]);

  return (
    <Card className="bg-white shadow mt-6">
      <CardHeader>
        <CardTitle>
          📅 Timetable{" "}
          {grade && grade !== "all" ? `— ${grade}` : ""}
          {subject ? ` — ${subject}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-gray-500 text-sm">No timetable entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => (
              <div
                key={e.id}
                className="p-3 border rounded-md bg-gray-50 flex flex-col"
              >
                <p className="font-semibold">{e.subject}</p>
                <p className="text-sm text-gray-600">
                  {e.date} • {e.time} ({e.duration}m) <br />
                  Teacher: {e.teacherName} | {e.grade}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableCard;
