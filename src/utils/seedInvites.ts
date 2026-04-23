/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * URKIO BETA INVITE SEEDER (EDITION ONE)
 */

import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const BETA_CODES = [
  'URK-7B9X2L', 'URK-1M4Z8Q', 'URK-5R2P9W', 'URK-3K7J1V', 'URK-9H4N6T',
  'URK-2D5S7M', 'URK-8L1C3G', 'URK-6F9W2H', 'URK-4N7Y8K', 'URK-0J2V5P',
  'URK-A3S8D1', 'URK-E9F2G7', 'URK-Q1W6R4', 'URK-T8Y3U0', 'URK-I5O7P2',
  'URK-S4D9F6', 'URK-G2H1J3', 'URK-K0L8M5', 'URK-X7C2V9', 'URK-B4N6Q8'
];

export async function seedBetaInvites() {
  console.log('🗝️ INITIALIZING BETA INVITE SEEDING...');
  
  const promises = BETA_CODES.map(code => {
    const inviteRef = doc(db, 'beta_invites', code);
    return setDoc(inviteRef, {
      code,
      isUsed: false,
      role: 'expert',
      maxPatients: 10,
      assignedTo: null,
      createdAt: serverTimestamp(),
      platformVersion: 'Edition_One'
    }, { merge: true });
  });

  try {
    await Promise.all(promises);
    console.log('✅ SUCCESS: 20 Secure Beta Codes are now live in the vault.');
    return true;
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error);
    return false;
  }
}
