"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ============================================================
   🔹 Type Definitions
   ============================================================ */
interface TimetableEntry {
  id: string;
  grade: string;
  subject: string;
  date: string;       // formatted as YYYY-MM-DD
  time: string;       // e.g. "08:00 AM"
  duration: number;
  teacherName: string;
}

interface TeacherLink {
  teacherName: string;
  googleClassroomLink?: string;
  zoomLink?: string;
}

interface Props {
  grade?: string;     // student’s grade OR parent's child grade
  subject?: string;   // teacher’s subject filter
}

/* ============================================================
   🔹 TimetableCard Component
   ============================================================ */
const TimetableCard: React.FC<Props> = ({ grade, subject }) => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [teacherLinks, setTeacherLinks] = useState<Record<string, TeacherLink>>({});

  /* ============================================================
     🔹 Listen to Timetable Changes (Realtime)
     ============================================================ */
  useEffect(() => {
    if (!grade && !subject) return;

    const timetableRef = collection(db, "timetable");

    let q;

    if (subject && grade === "all") {
      // 🧑‍🏫 Teacher view → show all grades for this subject
      q = query(
        timetableRef,
        where("subject", "==", subject),
        orderBy("date"),
        orderBy("time")
      );
    } else if (subject && grade) {
      // 👩‍🏫 Specific grade + subject (e.g., Grade 8 Science)
      q = query(
        timetableRef,
        where("grade", "==", grade),
        where("subject", "==", subject),
        orderBy("date"),
        orderBy("time")
      );
    } else {
      // 👨‍🎓 Student view → all subjects in their grade
      q = query(
        timetableRef,
        where("grade", "==", grade!),
        orderBy("date"),
        orderBy("time")
      );
    }

    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as TimetableEntry),
      }));

      // Sort chronologically
      const sorted = data.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setEntries(sorted);

      // Fetch teacher links (googleClassroomLink + zoomLink)
      const teacherNames = Array.from(
        new Set(sorted.map((e) => e.teacherName))
      );
      if (teacherNames.length > 0) {
        const links: Record<string, TeacherLink> = {};
        const teachersRef = collection(db, "teachers");

        for (const name of teacherNames) {
          // Match by full teacher name
          const [first, last] = name.split(" ");
          const q = query(
            teachersRef,
            where("firstName", "==", first),
            where("lastName", "==", last)
          );
          const res = await getDocs(q);
          if (!res.empty) {
            const t = res.docs[0].data();
            links[name] = {
              teacherName: name,
              googleClassroomLink: t.googleClassroomLink,
              zoomLink: t.zoomLink,
            };
          }
        }
        setTeacherLinks(links);
      }
    });

    return () => unsub();
  }, [grade, subject]);

  /* ============================================================
     🧠 Utility - Format Date for Readability
     ============================================================ */
  const formatDate = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoDate;
    }
  };

  /* ============================================================
     🖼️ Render UI
     ============================================================ */
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
            {entries.map((e) => {
              const linkInfo = teacherLinks[e.teacherName];
              return (
                <div
                  key={e.id}
                  className="p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition"
                >
                  <p className="font-semibold text-blue-700">{e.subject}</p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Grade:</span> {e.grade}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(e.date)} •{" "}
                    <span className="font-medium">Time:</span> {e.time} (
                    {e.duration}m)
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Teacher:</span>{" "}
                    {e.teacherName}
                  </p>

                  {/* 🔗 Action Buttons */}
                  <div className="flex gap-3 mt-2">
                    {linkInfo?.googleClassroomLink && (
                      <a
                        href={linkInfo.googleClassroomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-green-600 hover:bg-green-700 text-white text-xs">
                          Google Classroom
                        </Button>
                      </a>
                    )}
                    {linkInfo?.zoomLink && (
                      <a
                        href={linkInfo.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                          Zoom
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimetableCard;
