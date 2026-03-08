export const STATES = ["Telangana", "Andhra Pradesh"];

export const LOCATIONS_BY_STATE: Record<string, Record<string, string[]>> = {
  "Telangana": {
    "Warangal": ["Hanamkonda", "Kazipet", "Inavole", "Wardhannapet", "Dharmasagar"],
    "Hyderabad": ["Ameerpet", "Banjara Hills", "Kukatpally", "Secunderabad", "Mehdipatnam"],
    "Rangareddy": ["Gachibowli", "Madhapur", "Kondapur", "Serilingampally", "Rajendranagar"],
    "Karimnagar": ["Karimnagar", "Thimmapur", "Ganneruvaram", "Choppadandi", "Manakondur"]
  },
  "Andhra Pradesh": {
    "Visakhapatnam": ["Gajuwaka", "Madhurawada", "Seethammadhara", "Pendurthi"],
    "Vijayawada": ["Patamata", "Governorpet", "Bhavanipuram", "Gunadala"],
    "Guntur": ["Amaravati", "Tenali", "Narasaraopet", "Bapatla"]
  }
};

// For backward compatibility with existing components
export const LOCATIONS = {
  ...LOCATIONS_BY_STATE["Telangana"],
  ...LOCATIONS_BY_STATE["Andhra Pradesh"]
};

export type Comment = {
  id: string;
  userName: string;
  text: string;
  timestamp: string;
};

export type NewsPost = {
  id: string;
  unique_code: string;
  title: string;
  content: string;
  image_url: string;
  location: {
    state: string;
    district: string;
    mandal: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  author_id: string;
  author_name: string;
  timestamp: string;
  engagement: {
    likes: number;
    comments: number;
    commentList: Comment[];
  };
};

export const MOCK_NEWS: NewsPost[] = [
  {
    id: "1",
    unique_code: "54231",
    title: "హన్మకొండలో నూతన స్మార్ట్ పార్క్ ప్రారంభం",
    content: "హన్మకొండ నడిబొడ్డున స్థానిక యంత్రాంగం నూతన గ్రీన్ స్మార్ట్ పార్క్‌ను అధికారికంగా ప్రారంభించింది. ఈ పార్కులో సోలార్ లైటింగ్ మరియు ఆటోమేటెడ్ ఇరిగేషన్ సిస్టమ్స్ ఉన్నాయి, ఇది అన్ని వయసుల నివాసితులకు ఆధునిక వినోద స్థలాన్ని అందిస్తుంది.",
    image_url: "https://picsum.photos/seed/hanamkonda/800/600",
    location: { state: "Telangana", district: "Warangal", mandal: "Hanamkonda" },
    status: "approved",
    author_id: "REP001",
    author_name: "రాహుల్ కుమార్",
    timestamp: new Date().toISOString(),
    engagement: { 
      likes: 125, 
      comments: 2,
      commentList: [
        { id: "c1", userName: "Srinivas", text: "చాలా మంచి వార్త!", timestamp: "10 mins ago" }
      ]
    }
  },
  {
    id: "2",
    unique_code: "88293",
    title: "కాజీపేట జంక్షన్ ఆధునీకరణ పనులు ప్రారంభం",
    content: "కాజీపేట రైల్వే జంక్షన్ ఆధునీకరణ పనులు ఈ ఉదయం ప్రారంభమయ్యాయి. ఈ ప్రాజెక్ట్ ప్రయాణీకుల సౌకర్యాలను మెరుగుపరచడం మరియు రాబోయే రెండేళ్లలో సామర్థ్యాన్ని విస్తరించడం లక్ష్యంగా పెట్టుకుంది.",
    image_url: "https://picsum.photos/seed/kazipet/800/600",
    location: { state: "Telangana", district: "Warangal", mandal: "Kazipet" },
    status: "pending",
    author_id: "REP001",
    author_name: "రాహుల్ కుమార్",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    engagement: { likes: 0, comments: 0, commentList: [] }
  }
];
