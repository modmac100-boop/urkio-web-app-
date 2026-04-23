export const UrkioMockData = {
  // Use this to unlock the Healing Courses feature
  validHealingCodes: ["HEAL2026", "URKIO_JOURNEY_99", "PEACE_NOW"],
  
  // Professional data for the Expert Verification Form
  expertOnboarding: {
    fullName: "Dr. Samer Al-Halaki",
    licenseNumber: "SW-987654321",
    specialty: "Psychotherapist & Social Developer",
    bio: "Focused on building digital bridges for mental health and social growth.",
    documentUrl: "https://firebase.storage.googleapis.com/mock/license_v1.pdf"
  },

  // Content for the Homii Self-Reflection tool
  homiiEntry: {
    text: "Today I focused on the 'Journey Within'. I feel more connected to my goals as a developer and social worker.",
    status: "shared" // Change to 'private' to test the 'Keep' logic
  },

  // Social Feed Post
  socialPost: {
    content: "Excited to share that Urkio is expanding its specialist network! #SelfDevelopment #Healing",
    visibility: "public"
  },

  // Mock Events for testing
  events: [
    {
      title: "Mindfulness for Tech Founders",
      description: "A deep dive into maintaining mental clarity while building the next big thing. Learn from experts in both tech and mindfulness.",
      type: "course",
      date: "2026-03-25T14:00:00Z",
      price: 49.99,
      rating: 4.8,
      ratingCount: 12
    },
    {
      title: "Healing Circles: Open Session",
      description: "A safe space for community members to share their healing journeys and support one another in a guided live session.",
      type: "session",
      date: "2026-03-15T18:00:00Z",
      price: 0,
      rating: 5.0,
      ratingCount: 8
    },
    {
      title: "Social Development Workshop",
      description: "Learn strategies for building inclusive and supportive social ecosystems. Required for expert certification level 2.",
      type: "course",
      date: "2026-04-01T10:00:00Z",
      price: 25.00,
      rating: 4.5,
      ratingCount: 5
    },
    {
      title: "سيكولوجيا التخلف الاجتماعي: الآثار والأسباب",
      description: "جلسة عميقة حول سيكولوجيا التخلف الاجتماعي وكيفية التغلب على آثاره في المجتمعات الحديثة.",
      type: "session",
      date: "2026-04-20T19:00:00Z",
      creatorName: "URKIO",
      price: 0,
      rating: 5.0,
      ratingCount: 0
    }
  ]
};
