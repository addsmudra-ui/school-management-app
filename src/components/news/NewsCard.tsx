
'use client';

import Image from "next/image";
import { NewsPost } from "@/lib/mock-data";
import { Heart, MessageCircle, Share2, MapPin, Hash, Send, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { NewsService } from "@/lib/storage";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";

interface NewsCardProps {
  news: NewsPost;
}

export function NewsCard({ news }: NewsCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [newComment, setNewComment] = useState("");

  // Real-time comments
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !news.id) return null;
    return query(
      collection(firestore, 'approved_news_posts', news.id, 'comments'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }, [firestore, news.id]);

  const { data: comments } = useCollection(commentsQuery);

  // Real-time Liked state for current user
  const userLikesRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid, 'private', 'likes');
  }, [firestore, user?.uid]);

  const { data: userLikesDoc } = useDoc(userLikesRef);
  const isLiked = useMemo(() => {
    if (!userLikesDoc || !userLikesDoc.postIds) return false;
    return (userLikesDoc.postIds as string[]).includes(news.id);
  }, [userLikesDoc, news.id]);

  const toggleLike = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to like posts." });
      return;
    }
    NewsService.toggleLike(firestore, news.id, user.uid, isLiked);
  };

  const handleAddComment = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to comment." });
      return;
    }
    if (!newComment.trim()) return;

    NewsService.addComment(firestore, news.id, {
      userName: user.displayName || "Anonymous",
      text: newComment,
    });
    setNewComment("");
  };

  const handleShare = async () => {
    const shareTitle = news.title;
    const shareText = `${news.title}\n\nవార్త వివరాల కోసం MandalPulse చూడండి.\n\n`;
    const shareUrl = `${window.location.origin}/?postId=${news.id}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
      toast({ title: "లింక్ కాపీ చేయబడింది", description: "వార్త లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not share." });
    }
  };

  return (
    <div className="w-full h-full max-w-md mx-auto bg-white relative flex flex-col md:h-[90vh] md:rounded-3xl md:my-8 md:shadow-2xl overflow-hidden">
      {/* Media Section */}
      <div className="relative h-[45%] w-full overflow-hidden bg-muted flex-shrink-0">
        <Image
          src={news.image_url}
          alt={news.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 450px"
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute top-20 left-4 flex flex-col gap-2 z-10 md:top-4">
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

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-white to-slate-50/30">
        <div className="space-y-4 pb-32 md:pb-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[8px]">
                {news.author_name[0]}
              </div>
              {news.author_name}
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
          
          <p className="text-slate-600 leading-relaxed text-lg">
            {news.content}
          </p>

          {/* Swipe Hint for Mobile */}
          <div className="flex flex-col items-center justify-center py-8 opacity-20 md:hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Swipe for next</p>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Mobile optimized) */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6 z-30 md:static md:flex-row md:justify-between md:py-4 md:px-6 md:bg-white/95 md:backdrop-blur-sm md:border-t md:border-muted">
        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-8">
          {/* Like Button */}
          <button
            onClick={toggleLike}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md md:shadow-none md:w-auto md:h-auto",
              isLiked ? "bg-rose-500/10" : "bg-black/20 md:bg-transparent"
            )}>
              <Heart 
                className={cn(
                  "w-7 h-7 transition-all", 
                  isLiked ? "fill-destructive text-destructive scale-110" : "text-white md:text-muted-foreground group-hover:scale-110"
                )} 
              />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md md:text-muted-foreground md:text-xs">{news.likes || 0}</span>
          </button>
          
          {/* Comment Button */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center shadow-lg backdrop-blur-md transition-all group-hover:scale-110 md:shadow-none md:bg-transparent md:w-auto md:h-auto">
                  <MessageCircle className="w-7 h-7 text-white md:text-muted-foreground" />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md md:text-muted-foreground md:text-xs">{news.commentsCount || 0}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-[2.5rem] p-0 z-[100] border-none shadow-2xl">
              <SheetHeader className="p-6 border-b">
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  కామెంట్స్ ({news.commentsCount || 0})
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full bg-white">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
                  {comments && comments.length > 0 ? (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-primary flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[8px]">
                              {comment.userName[0]}
                            </div>
                            {comment.userName}
                          </span>
                          <span className="text-[10px] text-muted-foreground italic">
                            {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString() : "Just now"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="italic text-sm">ఇంకా కామెంట్స్ ఏవీ లేవు.</p>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2 items-center pb-8 md:pb-4 shadow-xl">
                  <Input 
                    placeholder="కామెంట్ జోడించండి..." 
                    value={newComment}
                    className="rounded-full h-12 bg-slate-50 border-none focus-visible:ring-primary/20"
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button size="icon" className="rounded-full h-12 w-12 shadow-lg shadow-primary/20" onClick={handleAddComment}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center shadow-lg backdrop-blur-md transition-all group-hover:scale-110 md:shadow-none md:bg-transparent md:w-auto md:h-auto">
            <Share2 className="w-7 h-7 text-white md:text-muted-foreground" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow-md uppercase tracking-tighter md:text-muted-foreground md:text-xs">Share</span>
        </button>
      </div>
    </div>
  );
}
