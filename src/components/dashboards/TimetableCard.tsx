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
  day: string;
  time: string;
  duration: number;
  teacherName: string;
  googleClassroomLink: string;
}

interface Props {
  grade?: string;   // student’s grade OR parent’s child grade
  subject?: string; // teacher’s subject filter
}

const TimetableCard: React.FC<Props> = ({ grade, subject }) => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    // don’t run without filters
    if (!grade && !subject) return;

    const timetableRef = collection(db, "timetable");

    let q;

    if (subject && grade === "all") {
      // ✅ teacher view → filter by subject only (all grades)
      q = query(
        timetableRef,
        where("subject", "==", subject),
        orderBy("day"),
        orderBy("time")
      );
    } else if (subject && grade) {
      // ✅ (optional) filter by both grade + subject
      q = query(
        timetableRef,
        where("grade", "==", grade),
        where("subject", "==", subject),
        orderBy("day"),
        orderBy("time")
      );
    } else {
      // ✅ student/parent view → filter by grade only
      q = query(
        timetableRef,
        where("grade", "==", grade!),
        orderBy("day"),
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
          {grade && grade !== "all" ? `— Grade ${grade}` : ""}
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
                  {e.day} • {e.time} ({e.duration}m) <br />
                  Teacher: {e.teacherName} | Grade {e.grade}
                </p>
                {e.googleClassroomLink && (
                  <a
                    href={e.googleClassroomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm underline mt-1"
                  >
                    Join Classroom
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableCard;
