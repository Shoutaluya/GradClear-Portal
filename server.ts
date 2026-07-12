import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

process.env.GOOGLE_CLOUD_PROJECT = "gen-lang-client-0095822000";
const DATABASE_ID = "ai-studio-9e6a0cc4-0bdd-4fac-bd30-6400af76e98c";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Firebase Admin
if (!getApps().length) {
  // We use Application Default Credentials which are available in Google Cloud
  // For local development, this requires GOOGLE_APPLICATION_CREDENTIALS
  // AI Studio provides default credentials.
  initializeApp({
    credential: applicationDefault(),
    projectId: "gen-lang-client-0095822000"
  });
}

const db = getFirestore(getApps()[0], DATABASE_ID);

// 1. Cloud Function Equivalent: Automatically advance currentStage when a department updates their approval boolean.
// We use a snapshot listener to replicate the "Cloud Function" trigger behavior.
db.collection('clearance_pipelines').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(async (change) => {
    if (change.type === 'modified') {
      const data = change.doc.data();
      const docRef = change.doc.ref;
      
      const stages = ['Faculty', 'Bursary', 'Library', 'Clinic', 'DSC'];
      
      if (data.isFullyCleared) return;
      if (data.stageStatus === 'halted') return;

      const currentStageIndex = stages.indexOf(data.currentStage);
      if (currentStageIndex === -1) return;
      
      const stageKey = data.currentStage.toLowerCase();
      
      // If the current stage is approved, advance to the next
      if (data.approvals && data.approvals[stageKey] === true) {
        if (currentStageIndex < stages.length - 1) {
          const nextStage = stages[currentStageIndex + 1];
          await docRef.update({
            currentStage: nextStage,
            stageStatus: 'pending', // Reset status for the new stage
            resolvingDocumentUrl: null, // Clear old document
            haltReason: null // Clear old reasons
          });
          console.log(`Advanced student ${data.studentId} to ${nextStage}`);
        } else {
          // If it was the last stage
          await docRef.update({
            isFullyCleared: true,
            stageStatus: 'completed',
            resolvingDocumentUrl: null,
            haltReason: null
          });
          console.log(`Student ${data.studentId} is fully cleared`);
        }
      }
    }
  });
});

// API Routes

// Set custom claims for RBAC testing
app.post('/api/set-role', async (req, res) => {
  const { uid, role, matric } = req.body;
  try {
    const userData: any = { role };
    if (matric) {
      userData.matric = matric;
    }
    await db.collection("users").doc(uid).set(userData, { merge: true });
    res.json({ success: true, message: `Role ${role} assigned to ${uid} in users collection` });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Create initial pipeline document for a student
app.post('/api/create-pipeline', async (req, res) => {
  const { studentId } = req.body;
  try {
    const docRef = db.collection('clearance_pipelines').doc(studentId);
    await docRef.set({
      studentId: studentId,
      currentStage: "Faculty",
      stageStatus: "pending",
      haltReason: null,
      resolvingDocumentUrl: null,
      approvals: {
        faculty: false,
        bursary: false,
        library: false,
        clinic: false,
        dsc: false
      },
      isFullyCleared: false
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
