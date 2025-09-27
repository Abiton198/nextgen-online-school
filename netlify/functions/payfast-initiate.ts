import type { Handler } from "@netlify/functions";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}")),
  });
}
const db = getFirestore();

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    console.log("🔔 Raw ITN body:", event.body);

    // PayFast sends urlencoded form-data
    const params = new URLSearchParams(event.body || "");
    const regId = params.get("m_payment_id");
    const paymentStatus = params.get("payment_status"); // "COMPLETE" etc.

    if (!regId) {
      return { statusCode: 400, body: "Missing m_payment_id" };
    }

    const regRef = db.collection("registrations").doc(regId);
    const regSnap = await regRef.get();

    if (!regSnap.exists) {
      return { statusCode: 404, body: "Registration not found" };
    }

    const registration = regSnap.data();
    console.log("📄 Registration before update:", registration);

    // Default update object
    let update: Record<string, any> = {
      lastPaymentStatus: paymentStatus,
      lastPaymentAt: new Date(),
    };

    if (paymentStatus === "COMPLETE") {
      if (registration?.purpose === "registration") {
        // ✅ Registration fee paid → enroll student
        update.status = "registered_pending_approval";
        update.paymentReceived = true;

        // Check if student already exists
        if (!registration?.studentId) {
          // Create new student doc
          const studentRef = db.collection("students").doc();
          await studentRef.set({
            parentId: registration.parentId,
            firstName: registration.student?.firstName || "Student",
            lastName: registration.student?.lastName || "",
            grade: registration.student?.grade || "",
            createdAt: new Date(),
            lessonsCompleted: 0,
            targetLessons: 0,
            points: 0,
            status: "active",
          });

          update.studentId = studentRef.id;
          console.log("🎓 Student created:", studentRef.id);
        }
      } else if (registration?.purpose === "fees") {
        update.status = "up_to_date"; // tuition fees
        update.paymentReceived = true;
      } else {
        update.status = "paid"; // donation, event, etc.
        update.paymentReceived = true;
      }
    } else {
      update.status = "payment_failed";
      update.paymentReceived = false;
    }

    await regRef.update(update);
    console.log("✅ Updated registration:", regId, update);

    return { statusCode: 200, body: "ITN processed" };
  } catch (err) {
    console.error("❌ payfast-notify error:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
