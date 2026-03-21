'use client';

import Image from "next/image";
import { NewsPost, NEWS_CATEGORIES } from "@/lib/mock-data";
import { Heart, MessageCircle, Share2, MapPin, Hash, Send, Star, ChevronDown, Maximize2, Globe, Newspaper, Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { NewsService } from "@/lib/storage";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import html2canvas from "html2canvas";

interface NewsCardProps {
  news: NewsPost;
}

export function NewsCard({ news }: NewsCardProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [newComment, setNewComment] = useState("");
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Video Intersection Logic
  useEffect(() => {
    if (!videoRef.current || !news.video_url) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [news.video_url]);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Login Required", description: "Please login to like posts." });
      return;
    }
    NewsService.toggleLike(firestore, news.id, user.uid, isLiked);
  };

  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
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
    if (!cardRef.current || isSharing) return;

    setIsSharing(true);
    const shareTitle = news.title;
    const shareText = `${news.title}\n\nవార్త వివరాల కోసం Telugu News Pulse చూడండి.\n\n`;
    const shareUrl = `${window.location.origin}/?postId=${news.id}`;

    try {
      // 1. Create Screenshot
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          return element.tagName === 'BUTTON' || element.classList.contains('share-ignore');
        }
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'news.png', { type: 'image/png' })] })) {
        const file = new File([blob], `news-${news.unique_code}.png`, { type: 'image/png' });
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          files: [file],
        });
      } else {
        // Fallback to text share if files aren't supported
        if (navigator.share) {
          await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        } else {
          await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
          toast({ title: "లింక్ కాపీ చేయబడింది", description: "వార్త లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది." });
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast({ variant: "destructive", title: "Error", description: "Could not share." });
      }
    } finally {
      setIsSharing(false);
    }
  };

  const scrollToNext = () => {
    const container = document.querySelector('.news-scroll-container');
    if (container) {
      container.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const categoryLabel = NEWS_CATEGORIES.find(c => c.value === news.category)?.label || news.category;

  return (
    <div ref={cardRef} className="w-full h-full max-w-full md:max-w-xl mx-auto bg-white relative flex flex-col md:h-[95dvh] md:rounded-[2rem] md:shadow-2xl overflow-hidden animate-in fade-in duration-500">
      
      {/* Media Section */}
      <div 
        className="relative h-[40%] md:h-[45%] w-full overflow-hidden bg-black flex-shrink-0 cursor-zoom-in group/image"
        onClick={() => !news.video_url && setIsImagePreviewOpen(true)}
      >
        {news.video_url ? (
          <div className="relative w-full h-full" onClick={toggleVideo}>
            <video 
              ref={videoRef}
              src={news.video_url} 
              className="w-full h-full object-cover" 
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none share-ignore">
              {!isPlaying && (
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-full border border-white/20">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 z-20 share-ignore">
              <div className="bg-black/40 backdrop-blur-md text-white p-1 rounded-md text-[8px] font-bold border border-white/10 uppercase tracking-tighter flex items-center gap-1">
                <Play className="w-2 h-2" />
                Video
              </div>
            </div>
          </div>
        ) : (
          <Image
            src={news.image_url}
            alt={news.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover transition-transform duration-700 group-hover/image:scale-105"
          />
        )}
        
        {/* Large Logo Watermark Overlay */}
        <div className="absolute bottom-4 left-4 z-20 select-none pointer-events-none drop-shadow-2xl opacity-100">
          {branding?.appLogo ? (
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <Image src={branding.appLogo} alt="Logo" fill className="object-contain opacity-100" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white opacity-80">
              <Newspaper className="w-6 h-6" />
              <span className="font-headline font-black text-sm tracking-tighter uppercase">News Pulse</span>
            </div>
          )}
        </div>

        {/* Info Badges Top-Left */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
          <div className="flex gap-1.5">
            <div className="bg-primary/90 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-lg backdrop-blur-sm tracking-widest">
              {categoryLabel}
            </div>
            <div className="bg-black/60 text-white px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm border border-white/10">
              <MapPin className="w-2 h-2" />
              {news.location.mandal}, {news.location.district}
            </div>
          </div>
          <div className="bg-black/40 text-white px-2 py-0.5 rounded-full text-[8px] font-mono flex items-center gap-1 shadow-lg w-fit backdrop-blur-sm border border-white/10 opacity-70">
            <Hash className="w-2 h-2" />
            ID: {news.unique_code}
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
      </div>

      {/* Content Section */}
      <div className="px-4 py-3 flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white touch-pan-y">
        <div className="space-y-3 pb-10 md:pb-4">
          
          {/* Reporter Header */}
          <div className="flex items-center justify-between gap-2 mb-1 bg-white/80 p-1.5 rounded-xl border border-slate-100 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] shrink-0">
                {news.author_name ? news.author_name[0] : 'R'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black truncate text-slate-900 leading-none mb-0.5">{news.author_name || "Reporter"}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[7px] font-black text-primary uppercase tracking-wider">
                    {news.author_role || "Reporter"}
                  </span>
                  {news.author_stars && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: news.author_stars }).map((_, i) => (
                        <Star key={i} className="w-1.5 h-1.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactions */}
            <div className="flex items-center gap-3 shrink-0 pr-1 share-ignore">
              <button onClick={toggleLike} className="flex flex-col items-center gap-0.5 group">
                <Heart className={cn("w-3.5 h-3.5 transition-all duration-300", isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-400")} />
                <span className="text-[7px] font-black text-slate-700">{news.likes || 0}</span>
              </button>
              
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center gap-0.5 group">
                    <MessageCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
                    <span className="text-[7px] font-black text-slate-700">{news.commentsCount || 0}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80dvh] rounded-t-[2.5rem] p-0 z-[100] border-none shadow-2xl overflow-hidden">
                  <SheetHeader className="p-4 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
                    <SheetTitle className="text-sm font-bold flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      కామెంట్స్ ({news.commentsCount || 0})
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col h-full bg-white">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-40">
                      {comments && comments.length > 0 ? (
                        comments.map((comment: any) => (
                          <div key={comment.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[10px] text-primary flex items-center gap-1.5">
                                {comment.userName}
                              </span>
                              <span className="text-[8px] text-muted-foreground font-medium">
                                {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{comment.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50">
                          <MessageCircle className="w-8 h-8 opacity-10 mb-2" />
                          <p className="font-bold text-xs">ఇంకా కామెంట్స్ ఏవీ లేవు.</p>
                        </div>
                      )}
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 p-3 pb-10 bg-white border-t flex gap-2 items-center">
                      <Input 
                        placeholder="కామెంట్ జోడించండి..." 
                        value={newComment}
                        className="rounded-full h-10 bg-slate-100 border-none text-[11px] px-4"
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      />
                      <Button size="icon" className="rounded-full h-10 w-10 shrink-0 shadow-lg shadow-primary/20" onClick={handleAddComment}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <button onClick={handleShare} disabled={isSharing} className="group flex flex-col items-center gap-0.5">
                {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Share2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />}
                <span className="text-[7px] font-black text-slate-700 uppercase">Share</span>
              </button>
            </div>
          </div>
          
          <h2 className="text-sm md:text-base font-bold font-headline leading-tight text-slate-900 tracking-tight">
            {news.title}
          </h2>
          
          <div className="h-px w-full bg-slate-100" />
          
          <p className="text-slate-600 leading-relaxed text-[11px] md:text-sm font-medium">
            {news.content}
          </p>

          <button 
            onClick={scrollToNext}
            className="flex flex-col items-center justify-center py-4 opacity-30 hover:opacity-100 transition-opacity md:hidden w-full group share-ignore"
          >
            <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1">మరిన్ని వార్తలు</p>
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
              <ChevronDown className="w-4 h-4 text-primary" />
            </div>
          </button>
        </div>
      </div>

      {/* Image Preview Dialog */}
      {!news.video_url && (
        <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
          <DialogContent className="max-w-[95vw] w-full h-[80vh] p-0 border-none bg-black/95 flex items-center justify-center rounded-[2rem] overflow-hidden z-[110] shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-full p-4 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image src={news.image_url} alt={news.title} fill className="object-contain opacity-100" priority />
                <div className="absolute bottom-6 left-6 flex items-center gap-2 select-none pointer-events-none opacity-80">
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-black text-[8px] tracking-[0.2em] uppercase leading-none">Telugu News Pulse</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}