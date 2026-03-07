"use client";

import { Navbar } from "@/components/layout/Navbar";
import { NewsCard } from "@/components/news/NewsCard";
import { MOCK_NEWS } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";

export default function Home() {
  const [news, setNews] = useState(MOCK_NEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching news based on user location
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Newspaper className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-primary font-medium">Loading local news...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-16 md:pt-16 md:pb-0">
      <Navbar />
      
      <div className="news-scroll-container">
        {news.length > 0 ? (
          news.map((item) => (
            <section key={item.id} className="news-card-snap flex items-center justify-center px-4">
              <NewsCard news={item} />
            </section>
          ))
        ) : (
          <div className="flex items-center justify-center h-screen px-6 text-center">
            <div>
              <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-foreground mb-2">No News Found</h3>
              <p className="text-muted-foreground">Stay tuned! Reporters are working hard to bring news from your mandal.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
