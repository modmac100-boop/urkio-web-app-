import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface SpecialistHubInstance {
  expertId: string;
  hubName: string;
  specialty: string;
  hourlyRate: number;
  branding: {
    accentColor: string;
    bannerUrl: string | null;
    logoUrl: string | null;
  };
  settings: {
    vaultPin: string;
    isOnline: boolean;
    autoAcceptBookings: boolean;
  };
  createdAt: any;
  updatedAt: any;
}

const EXPERT_ROLES = ['specialist', 'expert', 'case_manager', 'admin', 'management', 'manager', 'verifiedexpert', 'practitioner'];

export async function provisionSpecialistHub(userId: string, userData: any) {
  const role = userData?.role?.toLowerCase() || '';
  const isExpertUser = EXPERT_ROLES.includes(role) || userData?.isExpert === true || userData?.email === 'banason150@gmail.com';

  if (!isExpertUser) return null;

  const hubRef = doc(db, 'specialist_hubs', userId);
  const hubSnap = await getDoc(hubRef);

  if (hubSnap.exists()) {
    return hubSnap.data() as SpecialistHubInstance;
  }

  // Create new hub instance
  const newHub: SpecialistHubInstance = {
    expertId: userId,
    hubName: `${userData.displayName || 'Expert'}'s Clinical Hub`,
    specialty: userData.specialty || userData.primaryRole || 'General Practitioner',
    hourlyRate: userData.hourlyRate || 85,
    branding: {
      accentColor: '#004e99', // Default Urkio Clinical Blue
      bannerUrl: null,
      logoUrl: null,
    },
    settings: {
      vaultPin: '1111', // Default PIN
      isOnline: true,
      autoAcceptBookings: false,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(hubRef, newHub);

  // Sync back to user document to ensure they are marked as expert
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    isExpert: true,
    hasSpecialistHub: true,
    specialistHubId: userId,
    updatedAt: serverTimestamp()
  });

  return newHub;
}
