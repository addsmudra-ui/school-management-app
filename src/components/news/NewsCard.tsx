'use client';

import Image from "next/image";
import { NewsPost } from "@/lib/mock-data";
import { Heart, MessageCircle, Share2, MapPin, Hash, Send, Star, ChevronDown, Maximize2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  // Real-time branding
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'config', 'admin');
  }, [firestore]);
  const { data: branding } = useDoc(brandingRef);

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
    const shareText = `${news.title}\n\nవార్త వివరాల కోసం News Pulse చూడండి.\n\n`;
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

  const scrollToNext = () => {
    const container = document.querySelector('.news-scroll-container');
    if (container) {
      container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full h-full max-w-full md:max-w-xl mx-auto bg-white relative flex flex-col md:h-[95dvh] md:rounded-[2.5rem] md:shadow-2xl overflow-hidden animate-in fade-in duration-500">
      {/* Media Section */}
      <div 
        className="relative h-[40%] md:h-[45%] w-full overflow-hidden bg-muted flex-shrink-0 cursor-zoom-in group/image"
        onClick={() => setIsImagePreviewOpen(true)}
      >
        <Image
          src={news.image_url}
          alt={news.title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 600px"
          className="object-cover transition-transform duration-700 group-hover/image:scale-105"
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
        
        {/* Fullscreen Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
            <Maximize2 className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-white to-slate-50/50 touch-pan-y">
        <div className="space-y-4 pb-12 md:pb-6">
          
          {/* Enhanced Reporter Header with Interactions */}
          <div className="flex items-center justify-between gap-4 mb-2 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
                {news.author_name ? news.author_name[0] : 'R'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black truncate text-slate-900 leading-none mb-1">{news.author_name || "Reporter"}</span>
                <div className="flex items-center gap-2">
                  {news.author_role && (
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                      {news.author_role}
                    </span>
                  )}
                  {news.author_stars && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: news.author_stars }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactions beside the name */}
            <div className="flex items-center gap-4 shrink-0 pr-1">
              <button onClick={toggleLike} className="flex flex-col items-center gap-0.5 group">
                <Heart className={cn("w-6 h-6 transition-all duration-300", isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-400")} />
                <span className="text-[10px] font-black text-slate-700">{news.likes || 0}</span>
              </button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center gap-0.5 group">
                    <MessageCircle className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                    <span className="text-[10px] font-black text-slate-700">{news.commentsCount || 0}</span>
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
                                  {comment.userName ? comment.userName[0] : 'U'}
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

              <button onClick={handleShare} className="group flex flex-col items-center gap-0.5">
                <Share2 className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-black text-slate-700">Share</span>
              </button>
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold font-headline leading-tight text-foreground tracking-tight">
            {news.title}
          </h2>
          
          <div className="h-px w-full bg-slate-100" />
          
          <p className="text-slate-600 leading-relaxed text-lg md:text-xl font-medium">
            {news.content}
          </p>

          <button 
            onClick={scrollToNext}
            className="flex flex-col items-center justify-center py-8 opacity-50 hover:opacity-100 transition-opacity md:hidden w-full group"
          >
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 group-active:scale-95 transition-transform">మరిన్ని వార్తలు చదవండి</p>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
              <ChevronDown className="w-6 h-6 text-primary" />
            </div>
          </button>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[80vh] md:h-[90vh] p-0 border-none bg-black/95 flex items-center justify-center rounded-[2.5rem] overflow-hidden z-[110] shadow-2xl group">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image 
                src={news.image_url} 
                alt={news.title} 
                fill 
                className="object-contain"
                priority
              />
              
              {/* Branding Overlay Bottom-Left */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3 opacity-30 select-none pointer-events-none group-hover:opacity-50 transition-opacity">
                {branding?.appLogo ? (
                  <div className="relative w-10 h-10">
                    <Image src={branding.appLogo} alt="Logo" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-white font-black text-xs tracking-[0.2em] uppercase leading-none">News Pulse</span>
                  <span className="text-white/80 font-bold text-[10px] tracking-widest lowercase mt-1">newspulse.app</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
