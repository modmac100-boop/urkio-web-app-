const SELF_HARM_KEYWORDS = [
  'kill', 'suicide', 'die', 'end it', 'hurt myself', 'harm myself', 
  'don\'t want to live', 'cut myself', 'punish myself'
];

export const containsSelfHarmKeywords = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return SELF_HARM_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

export const getEmergencyContacts = () => [
  { country: 'Saudi Arabia', code: 'SA', numbers: ['997 (Ambulance)', '998 (Fire)', '999 (Police)'] },
  { country: 'Syria', code: 'SY', numbers: ['110 (Ambulance)', '112 (Police)', '113 (Fire)'] },
];

export const generateSafetyResponse = (): string => {
  return "I'm detecting that you might be in distress. Your safety is incredibly important. Please consider reaching out to an emergency crisis line immediately.";
};
