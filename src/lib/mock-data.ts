export const LOCATIONS = {
  Warangal: ["Hanamkonda", "Kazipet", "Inavole"],
  Hyderabad: ["Ameerpet", "Banjara Hills", "Kukatpally"],
  Rangareddy: ["Gachibowli", "Madhapur", "Kondapur"]
};

export type NewsPost = {
  id: string;
  title: string;
  content: string;
  image_url: string;
  location: {
    mandal: string;
    district: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  author_id: string;
  timestamp: string;
  engagement: {
    likes: number;
    comments: number;
  };
};

export const MOCK_NEWS: NewsPost[] = [
  {
    id: "1",
    title: "New Smart Park Inaugurated in Hanamkonda",
    content: "The local administration has officially opened the new green smart park in the heart of Hanamkonda. The park features solar lighting and automated irrigation systems, providing a modern recreational space for residents of all ages.",
    image_url: "https://picsum.photos/seed/hanamkonda/800/600",
    location: { mandal: "Hanamkonda", district: "Warangal" },
    status: "approved",
    author_id: "reporter1",
    timestamp: new Date().toISOString(),
    engagement: { likes: 120, comments: 45 }
  },
  {
    id: "2",
    title: "Kazipet Junction Modernization Project Starts",
    content: "Upgradation works for the Kazipet railway junction have commenced this morning. The project aims to improve passenger amenities and expand the platform capacity to handle more high-speed trains effectively over the next two years.",
    image_url: "https://picsum.photos/seed/kazipet/800/600",
    location: { mandal: "Kazipet", district: "Warangal" },
    status: "approved",
    author_id: "reporter1",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    engagement: { likes: 85, comments: 12 }
  },
  {
    id: "3",
    title: "Local Market Prices Stabilize in Ameerpet",
    content: "After weeks of fluctuation, essential commodity prices have finally stabilized in the Ameerpet wholesale markets. This brings much-needed relief to local consumers and small-scale retailers ahead of the festive season.",
    image_url: "https://picsum.photos/seed/market/800/600",
    location: { mandal: "Ameerpet", district: "Hyderabad" },
    status: "approved",
    author_id: "reporter2",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    engagement: { likes: 230, comments: 67 }
  }
];
