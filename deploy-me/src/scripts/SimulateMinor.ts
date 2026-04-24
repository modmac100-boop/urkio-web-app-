/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.resolve('/Users/sameralhalaki/Desktop/urkio-web-test/firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function injectMockMinor() {
  const minorUid = "minor_test_123";
  const minorEmail = "minor@test.com";

  console.log("Injecting Mock Minor profile...");
  
  // 1. Create Minor User Profile
  await setDoc(doc(db, 'users', minorUid), {
    uid: minorUid,
    email: minorEmail,
    displayName: "Test Minor",
    age: 12,
    role: 'user',
    userType: 'patient',
    isGuardianVerified: false,
    onboardingCompleted: true,
    createdAt: serverTimestamp()
  });

  // 2. Create Clinical Appointment for this Minor
  await addDoc(collection(db, 'appointments'), {
    clientName: "Test Minor",
    userId: minorUid,
    clientAge: 12,
    isGuardianVerified: false,
    status: 'pending',
    date: new Date().toISOString(),
    expertId: "expert_placeholder_uuid", // Update if you have your expert UID
    category: 'Healing',
    caseCode: 'UK-MINOR-01',
    createdAt: serverTimestamp()
  });

  console.log("Mock Minor Injected Successfully.");
  process.exit(0);
}

injectMockMinor().catch(err => {
  console.error("Injection failed:", err);
  process.exit(1);
});
