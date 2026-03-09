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

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className="w-full h-full max-w-full md:max-w-xl mx-auto bg-white relative flex flex-col md:h-[95dvh] md:rounded-[2.5rem] md:shadow-2xl overflow-hidden animate-in fade-in duration-500">
      {/* Media Section */}
      <div className="relative h-[40%] md:h-[45%] w-full overflow-hidden bg-muted flex-shrink-0">
        <Image
          src={news.image_url}
          alt={news.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover"
        />
        {/* Badges */}
        <div className="absolute top-[4.5rem] left-4 flex flex-col gap-2 z-10 md:top-6">
          <div className="bg-primary/90 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm">
            <MapPin className="w-3 h-3" />
            {news.location.mandal}, {news.location.district}
          </div>
          <div className="bg-black/60 text-white px-3 py-1 rounded-full text-[10px] font-mono flex items-center gap-1 shadow-lg w-fit backdrop-blur-sm border border-white/10">
            <Hash className="w-3 h-3" />
            ID: {news.unique_code}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-white to-slate-50/50 touch-pan-y">
        <div className="space-y-4 pb-24 md:pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] border border-primary/5">
                {news.author_name[0]}
              </div>
              <span className="max-w-[120px] truncate">{news.author_name}</span>
              {news.author_role && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded text-primary font-bold text-[8px]">
                  {news.author_role}
                </span>
              )}
            </div>
            {news.author_stars && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: news.author_stars }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            )}
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold font-headline leading-tight text-foreground tracking-tight">
            {news.title}
          </h2>
          
          <div className="h-px w-full bg-slate-100" />
          
          <p className="text-slate-600 leading-relaxed text-lg md:text-xl font-medium">
            {news.content}
          </p>

          {/* Swipe Hint for Mobile - only visible on small screens */}
          <div className="flex flex-col items-center justify-center py-8 opacity-30 md:hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Scroll for more</p>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Right side on mobile, Bottom bar on desktop) */}
      <div className="absolute right-4 bottom-[20%] flex flex-col gap-6 z-30 md:static md:flex-row md:justify-between md:py-5 md:px-8 md:bg-white/95 md:backdrop-blur-md md:border-t md:border-slate-100">
        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
          {/* Like Button */}
          <button
            onClick={toggleLike}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md md:shadow-none md:w-auto md:h-auto border border-white/20",
              isLiked ? "bg-rose-500/20" : "bg-black/30 md:bg-transparent"
            )}>
              <Heart 
                className={cn(
                  "w-8 h-8 transition-all duration-300", 
                  isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-white md:text-muted-foreground group-hover:scale-110"
                )} 
              />
            </div>
            <span className="text-[11px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] md:text-muted-foreground md:text-sm md:drop-shadow-none">{news.likes || 0}</span>
          </button>
          
          {/* Comment Button */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-1 group">
                <div className="w-14 h-14 rounded-full bg-black/30 flex items-center justify-center shadow-xl backdrop-blur-md transition-all group-hover:scale-110 border border-white/20 md:shadow-none md:bg-transparent md:w-auto md:h-auto">
                  <MessageCircle className="w-8 h-8 text-white md:text-muted-foreground" />
                </div>
                <span className="text-[11px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] md:text-muted-foreground md:text-sm md:drop-shadow-none">{news.commentsCount || 0}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85dvh] rounded-t-[3rem] p-0 z-[100] border-none shadow-2xl">
              <SheetHeader className="p-6 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
                <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-primary" />
                  కామెంట్స్ ({news.commentsCount || 0})
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full bg-white">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-40">
                  {comments && comments.length > 0 ? (
                    comments.map((comment: any) => (
                      <div key={comment.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm text-primary flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                              {comment.userName[0]}
                            </div>
                            {comment.userName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium bg-slate-200/50 px-2 py-0.5 rounded-full">
                            {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                          </span>
                        </div>
                        <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-10 h-10 opacity-20" />
                      </div>
                      <p className="font-bold text-lg">ఇంకా కామెంట్స్ ఏవీ లేవు.</p>
                    </div>
                  )}
                </div>
                <div className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-white/80 backdrop-blur-xl border-t flex gap-3 items-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                  <Input 
                    placeholder="కామెంట్ జోడించండి..." 
                    value={newComment}
                    className="rounded-full h-14 bg-slate-100 border-none focus-visible:ring-primary/20 text-base px-6"
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button size="icon" className="rounded-full h-14 w-14 shadow-xl shadow-primary/20" onClick={handleAddComment}>
                    <Send className="w-6 h-6" />
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
          <div className="w-14 h-14 rounded-full bg-black/30 flex items-center justify-center shadow-xl backdrop-blur-md transition-all group-hover:scale-110 border border-white/20 md:shadow-none md:bg-transparent md:w-auto md:h-auto">
            <Share2 className="w-8 h-8 text-white md:text-muted-foreground" />
          </div>
          <span className="text-[11px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] uppercase tracking-tighter md:text-muted-foreground md:text-sm md:drop-shadow-none">Share</span>
        </button>
      </div>
    </div>
  );
}