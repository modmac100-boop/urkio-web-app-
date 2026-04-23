import { useApp } from '../contexts/AppContext';

type UserRole = 
  | 'Guest' 
  | 'StandardUser' 
  | 'PremiumUser' 
  | 'AccreditedPractitioner_Applicant'
  | 'AccreditedPractitioner_Active'
  | 'VisionaryLeader_Cohort_2024'
  | 'PlatformAdmin'
  | 'founder'
  | 'specialist'
  | 'expert'; // Including legacy roles

export const useAccessControl = () => {
  const { user, userData } = useApp() as any;

  const currentRole = (userData?.role || 'Guest') as UserRole;

  // Check if user has premium access (Growth Tier +)
  const isPremium = [
    'PremiumUser',
    'AccreditedPractitioner_Active',
    'VisionaryLeader_Cohort_2024',
    'PlatformAdmin',
    'founder',
    'expert',
    'specialist'
  ].includes(currentRole);

  // Check if user has practitioner access
  const isPractitioner = [
    'AccreditedPractitioner_Active',
    'PlatformAdmin',
    'founder',
    'expert',
    'specialist'
  ].includes(currentRole);

  // Check if user is a visionary leader
  const isLeader = [
    'VisionaryLeader_Cohort_2024',
    'PlatformAdmin',
    'founder'
  ].includes(currentRole);

  // Can access clinical tools
  const canAccessClinicalTools = isPractitioner || currentRole === 'PremiumUser';

  return {
    isPremium,
    isPractitioner,
    isLeader,
    canAccessClinicalTools,
    currentRole
  };
};
