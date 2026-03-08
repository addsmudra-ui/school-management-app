"use client";

import Image from "next/image";
import { NewsPost, Comment } from "@/lib/mock-data";
import { Heart, MessageCircle, Share2, MapPin, User, Hash, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { NewsService } from "@/lib/storage";

interface NewsCardProps {
  news: NewsPost;
}

export function NewsCard({ news }: NewsCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(news.engagement.likes);
  const [comments, setComments] = useState<Comment[]>(news.engagement.commentList);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const likedIds = NewsService.getLikedPostIds();
    setLiked(likedIds.includes(news.id));
  }, [news.id]);

  const toggleLike = () => {
    const isNowLiked = NewsService.toggleLike(news.id);
    setLiked(isNowLiked);
    setLikesCount(prev => isNowLiked ? prev + 1 : prev - 1);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userName: localStorage.getItem('mandalPulse_userName') || "You",
      text: newComment,
      timestamp: "Just now"
    };

    setComments(prev => [comment, ...prev]);
    setNewComment("");
    toast({
      title: "కామెంట్ జోడించబడింది",
      description: "మీ అభిప్రాయం విజయవంతంగా పోస్ట్ చేయబడింది.",
    });
  };

  const handleShare = async () => {
    const shareTitle = news.title;
    const shareText = `${news.title}\n\nవార్త వివరాల కోసం MandalPulse చూడండి.\n\n`;
    const shareUrl = window.location.origin;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
        toast({
          title: "లింక్ కాపీ చేయబడింది",
          description: "వార్త లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "షేర్ చేయడం వీలుపడలేదు",
        description: "దయచేసి మళ్ళీ ప్రయత్నించండి.",
      });
    }
  };

  return (
    <div className="w-full h-full max-w-md mx-auto bg-white relative flex flex-col md:h-[90vh] md:rounded-3xl md:my-8 md:shadow-2xl overflow-hidden pt-14 pb-16 md:py-0">
      {/* Image Section */}
      <div className="relative h-[45%] w-full overflow-hidden bg-muted flex-shrink-0">
        <Image
          src={news.image_url}
          alt={news.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 450px"
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <div className="bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-lg backdrop-blur-sm">
            <MapPin className="w-3 h-3" />
            {news.location.mandal}, {news.location.district}
          </div>
          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-[10px] font-mono flex items-center gap-1 shadow-lg w-fit backdrop-blur-sm">
            <Hash className="w-3 h-3" />
            ID: {news.unique_code}
          </div>
        </div>
      </div>

      {/* Content Section - Internal Scrolling for Mobile */}
      <div className="p-6 flex-1 flex flex-col overflow-y-auto">
        <div className="space-y-4 pb-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              <User className="w-3 h-3" />
              {news.author_name} ({news.author_id})
              {news.author_role && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded text-primary font-bold">
                  {news.author_role}
                </span>
              )}
            </div>
            {news.author_stars && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: news.author_stars }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold font-headline leading-tight text-foreground">
            {news.title}
          </h2>
          
          <p className="text-muted-foreground leading-relaxed text-lg">
            {news.content}
          </p>
        </div>

        {/* Floating Action Bar inside the card area to stay visible */}
        <div className="flex items-center justify-between py-4 px-6 bg-white/95 backdrop-blur-sm absolute bottom-0 left-0 right-0 border-t border-muted z-20">
          <div className="flex items-center gap-8">
            <button
              onClick={toggleLike}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <Heart 
                className={cn(
                  "w-7 h-7 transition-colors", 
                  liked ? "fill-destructive text-destructive" : "text-muted-foreground"
                )} 
              />
              <span className="text-xs font-bold text-muted-foreground">{likesCount}</span>
            </button>
            
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center gap-1">
                  <MessageCircle className="w-7 h-7 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground">{comments.length}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-0 z-[60]">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="text-xl font-bold">కామెంట్స్ ({comments.length})</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/30 p-4 rounded-2xl">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-primary">{comment.userName}</span>
                            <span className="text-[10px] text-muted-foreground">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-foreground">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 opacity-20 mb-2" />
                        <p className="italic">ఇంకా కామెంట్స్ ఏవీ లేవు.</p>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2 items-center pb-8 md:pb-4">
                    <Input 
                      placeholder="కామెంట్ జోడించండి..." 
                      value={newComment}
                      className="rounded-full h-12"
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="icon" className="rounded-full h-12 w-12" onClick={handleAddComment}>
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <button 
            onClick={handleShare}
            className="flex flex-col items-center gap-1 transition-transform active:scale-95"
          >
            <Share2 className="w-7 h-7 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}