"use client";

import Image from "next/image";
import { NewsPost } from "@/lib/mock-data";
import { Heart, MessageCircle, Share2, MapPin, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  news: NewsPost;
}

export function NewsCard({ news }: NewsCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(news.engagement.likes);

  const toggleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  return (
    <div className="news-card-snap w-full max-w-md mx-auto bg-white shadow-xl relative overflow-hidden flex flex-col">
      <div className="relative h-2/5 w-full">
        <Image
          src={news.image_url}
          alt={news.title}
          fill
          className="object-cover"
          data-ai-hint="news coverage"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-lg">
            <MapPin className="w-3 h-3" />
            {news.location.mandal}, {news.location.district}
          </div>
          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-[10px] font-mono flex items-center gap-1 shadow-lg w-fit">
            <Hash className="w-3 h-3" />
            ID: {news.unique_code}
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <User className="w-3 h-3" />
            రిపోర్టర్: {news.author_name} ({news.author_id})
          </div>
          <h2 className="text-2xl font-bold font-headline leading-tight text-foreground">
            {news.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg line-clamp-[6]">
            {news.content}
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-muted">
          <div className="flex items-center gap-6">
            <button
              onClick={toggleLike}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <Heart 
                className={cn(
                  "w-6 h-6 transition-colors", 
                  liked ? "fill-destructive text-destructive" : "text-muted-foreground"
                )} 
              />
              <span className="text-xs font-medium text-muted-foreground">{likesCount}</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <MessageCircle className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{news.engagement.comments}</span>
            </button>
          </div>
          <button className="flex flex-col items-center gap-1">
            <Share2 className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
