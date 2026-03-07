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
    title: "హన్మకొండలో నూతన స్మార్ట్ పార్క్ ప్రారంభం",
    content: "హన్మకొండ నడిబొడ్డున స్థానిక యంత్రాంగం నూతన గ్రీన్ స్మార్ట్ పార్క్‌ను అధికారికంగా ప్రారంభించింది. ఈ పార్కులో సోలార్ లైటింగ్ మరియు ఆటోమేటెడ్ ఇరిగేషన్ సిస్టమ్స్ ఉన్నాయి, ఇది అన్ని వయసుల నివాసితులకు ఆధునిక వినోద స్థలాన్ని అందిస్తుంది.",
    image_url: "https://picsum.photos/seed/hanamkonda/800/600",
    location: { mandal: "Hanamkonda", district: "Warangal" },
    status: "approved",
    author_id: "reporter1",
    timestamp: new Date().toISOString(),
    engagement: { likes: 120, comments: 45 }
  },
  {
    id: "2",
    title: "కాజీపేట జంక్షన్ ఆధునీకరణ పనులు ప్రారంభం",
    content: "కాజీపేట రైల్వే జంక్షన్ ఆధునీకరణ పనులు ఈ ఉదయం ప్రారంభమయ్యాయి. ఈ ప్రాజెక్ట్ ప్రయాణీకుల సౌకర్యాలను మెరుగుపరచడం మరియు రాబోయే రెండేళ్లలో మరిన్ని హై-స్పీడ్ రైళ్లను సమర్థవంతంగా నిర్వహించడానికి ప్లాట్‌ఫారమ్ సామర్థ్యాన్ని విస్తరించడం లక్ష్యంగా పెట్టుకుంది.",
    image_url: "https://picsum.photos/seed/kazipet/800/600",
    location: { mandal: "Kazipet", district: "Warangal" },
    status: "approved",
    author_id: "reporter1",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    engagement: { likes: 85, comments: 12 }
  },
  {
    id: "3",
    title: "అమీర్‌పేటలో నిత్యావసర వస్తువుల ధరలు స్థిరం",
    content: "వారాల తరబడి హెచ్చుతగ్గుల తర్వాత, అమీర్‌పేట హోల్‌సేల్ మార్కెట్లలో నిత్యావసర వస్తువుల ధరలు చివరకు స్థిరపడ్డాయి. ఇది పండుగ సీజన్‌కు ముందు స్థానిక వినియోగదారులకు మరియు చిన్న తరహా రిటైలర్లకు ఎంతో ఊరటనిస్తుంది.",
    image_url: "https://picsum.photos/seed/market/800/600",
    location: { mandal: "Ameerpet", district: "Hyderabad" },
    status: "approved",
    author_id: "reporter2",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    engagement: { likes: 230, comments: 67 }
  }
];
