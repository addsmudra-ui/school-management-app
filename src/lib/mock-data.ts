export const LOCATIONS = {
  Warangal: ["Hanamkonda", "Kazipet", "Inavole"],
  Hyderabad: ["Ameerpet", "Banjara Hills", "Kukatpally"],
  Rangareddy: ["Gachibowli", "Madhapur", "Kondapur"]
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
    mandal: string;
    district: string;
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
    location: { mandal: "Hanamkonda", district: "Warangal" },
    status: "approved",
    author_id: "REP001",
    author_name: "రాహుల్ కుమార్",
    timestamp: new Date().toISOString(),
    engagement: { 
      likes: 120, 
      comments: 2,
      commentList: [
        { id: "c1", userName: "Srinivas", text: "చాలా మంచి వార్త!", timestamp: "10 mins ago" },
        { id: "c2", userName: "Anitha", text: "మా పిల్లలు ఇక్కడ ఆడుకోవడానికి ఇష్టపడతారు.", timestamp: "5 mins ago" }
      ]
    }
  },
  {
    id: "2",
    unique_code: "88293",
    title: "కాజీపేట జంక్షన్ ఆధునీకరణ పనులు ప్రారంభం",
    content: "కాజీపేట రైల్వే జంక్షన్ ఆధునీకరణ పనులు ఈ ఉదయం ప్రారంభమయ్యాయి. ఈ ప్రాజెక్ట్ ప్రయాణీకుల సౌకర్యాలను మెరుగుపరచడం మరియు రాబోయే రెండేళ్లలో మరిన్ని హై-స్పీడ్ రైళ్లను సమర్థవంతంగా నిర్వహించడానికి ప్లాట్‌ఫారమ్ సామర్థ్యాన్ని విస్తరించడం లక్ష్యంగా పెట్టుకుంది.",
    image_url: "https://picsum.photos/seed/kazipet/800/600",
    location: { mandal: "Kazipet", district: "Warangal" },
    status: "approved",
    author_id: "REP001",
    author_name: "రాహుల్ కుమార్",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    engagement: { 
      likes: 85, 
      comments: 1,
      commentList: [
        { id: "c3", userName: "Raju", text: "అభివృద్ధి జరుగుతోంది!", timestamp: "1 hour ago" }
      ]
    }
  },
  {
    id: "3",
    unique_code: "12044",
    title: "అమీర్‌పేటలో నిత్యావసర వస్తువుల ధరలు స్థిరం",
    content: "వారాల తరబడి హెచ్చుతగ్గుల తర్వాత, అమీర్‌పేట హోల్‌సేల్ మార్కెట్లలో నిత్యావసర వస్తువుల ధరలు చివరకు స్థిరపడ్డాయి. ఇది పండుగ సీజన్‌కు ముందు స్థానిక వినియోగదారులకు మరియు చిన్న తరహా రిటైలర్లకు ఎంతో ఊరటనిస్తుంది.",
    image_url: "https://picsum.photos/seed/market/800/600",
    location: { mandal: "Ameerpet", district: "Hyderabad" },
    status: "approved",
    author_id: "REP002",
    author_name: "స్నేహ రెడ్డి",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    engagement: { 
      likes: 230, 
      comments: 0,
      commentList: []
    }
  }
];
