
'use client';

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { NewsCard } from "@/components/news/NewsCard";
import { AdCard } from "@/components/news/AdCard";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, limit, where, orderBy } from "firebase/firestore";
import { NewsPost, AdPost } from "@/lib/mock-data";

export function NewsFeedContent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  
  const categoryParam = searchParams.get('category') || 'Home';

  const allApprovedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const baseRef = collection(firestore, 'approved_news_posts');
    if (categoryParam === 'All' || categoryParam === 'Home') {
      return query(baseRef, orderBy('timestamp', 'desc'), limit(150));
    }
    return query(baseRef, where('category', '==', categoryParam), orderBy('timestamp', 'desc'), limit(150));
  }, [firestore, categoryParam]);

  const adsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'ads'), where('status', '==', 'active'), limit(20));
  }, [firestore]);

  const { data: allNews, isLoading: isNewsLoading } = useCollection<NewsPost>(allApprovedQuery);
  const { data: allAds, isLoading: isAdsLoading } = useCollection<AdPost>(adsQuery);

  const feedToDisplay = useMemo(() => {
    const news = (allNews as any[])?.map(item => ({ ...item, feedType: 'news' })) || [];
    const ads = (allAds as any[])?.map(item => ({ ...item, feedType: 'ad' })) || [];
    
    // Sort combined feed by timestamp descending
    return [...news, ...ads].sort((a, b) => {
      const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [allNews, allAds]);

  if (isNewsLoading || isAdsLoading) {
    return <div className="p-10 text-center text-xs font-bold text-muted-foreground animate-pulse">వార్తలు లోడ్ అవుతున్నాయి...</div>;
  }

  return (
    <div className="news-scroll-container">
      {feedToDisplay.map((item: any) => (
        <section key={item.id} className="news-card-snap">
          {item.feedType === 'ad' ? <AdCard ad={item} /> : <NewsCard news={item} />}
        </section>
      ))}
    </div>
  );
}
