"use client";

import Image from "next/image";
import { NewsPost, Comment } from "@/lib/mock-data";
import { Heart, MessageCircle, Share2, MapPin, User, Hash, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface NewsCardProps {
  news: NewsPost;
}

export function NewsCard({ news }: NewsCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(news.engagement.likes);
  const [comments, setComments] = useState<Comment[]>(news.engagement.commentList);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const toggleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userName: "You",
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
    const shareData = {
      title: news.title,
      text: `${news.title}\n\nవార్త చదవండి:`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
        console.log("Sharing failed", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        toast({
          title: "లింక్ కాపీ చేయబడింది (Link Copied)",
          description: "వార్త లింక్ క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "షేర్ చేయడం వీలుపడలేదు.",
          variant: "destructive",
        });
      }
    }
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
            
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex flex-col items-center gap-1">
                  <MessageCircle className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{comments.length}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold">కామెంట్స్ ({comments.length})</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-4 pb-24">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/30 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-primary">{comment.userName}</span>
                            <span className="text-[10px] text-muted-foreground">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm text-foreground">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-10 italic">ఇంకా కామెంట్స్ ఏవీ లేవు. మొదటిగా కామెంట్ చేయండి!</p>
                    )}
                  </div>
                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-muted flex gap-2 items-center">
                    <Input 
                      placeholder="కామెంట్ జోడించండి..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button size="icon" onClick={handleAddComment}>
                      <Send className="w-4 h-4" />
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
            <Share2 className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
