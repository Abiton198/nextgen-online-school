import * as admin from "firebase-admin";

// 🔑 Path to the service account key you downloaded from Firebase Console
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function makeAdmin() {
  try {
    // 👉 Replace this with your Firebase Auth UID
    const uid = "pZfCr47EaIYqIkNy5M5YNM5ChMx2";

    await admin.auth().setCustomUserClaims(uid, { role: "admin" });
    console.log(`✅ User ${uid} is now an admin!`);

    // Verify
    const user = await admin.auth().getUser(uid);
    console.log("Custom claims now:", user.customClaims);
  } catch (err) {
    console.error("Error setting admin role:", err);
  }
}

makeAdmin();
