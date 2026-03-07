"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LOCATIONS } from "@/lib/mock-data";
import { generateHeadlines } from "@/ai/flows/reporter-ai-headline-generation";
import { summarizeArticleForReporter } from "@/ai/flows/reporter-ai-content-summarization";
import { Sparkles, Loader2, Send, Wand2 } from "lucide-react";

export default function ReporterPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [district, setDistrict] = useState("");
  const [mandal, setMandal] = useState("");
  const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleGenerateHeadlines = async () => {
    if (!content) {
      toast({ title: "Error", description: "Please enter some content first", variant: "destructive" });
      return;
    }
    setIsGeneratingHeadlines(true);
    try {
      const result = await generateHeadlines({ articleContent: content });
      if (result.headlines?.length > 0) {
        setTitle(result.headlines[0]);
        toast({ title: "Success", description: "Headline generated!" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate headlines", variant: "destructive" });
    } finally {
      setIsGeneratingHeadlines(false);
    }
  };

  const handleSummarize = async () => {
    if (!content) {
      toast({ title: "Error", description: "Please enter detailed content first", variant: "destructive" });
      return;
    }
    setIsSummarizing(true);
    try {
      const result = await summarizeArticleForReporter({ detailedArticle: content });
      setContent(result.summary);
      toast({ title: "Success", description: "Content summarized!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to summarize content", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !district || !mandal) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // Simulate Firestore submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({ title: "Success", description: "News submitted for moderation!" });
      setTitle("");
      setContent("");
      setDistrict("");
      setMandal("");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-primary/5 rounded-t-lg">
            <CardTitle className="text-2xl font-headline text-primary">Submit News Report</CardTitle>
            <CardDescription>Enter details about the local event. Submissions will be reviewed by editors.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select onValueChange={setDistrict} value={district}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(LOCATIONS).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mandal</Label>
                  <Select onValueChange={setMandal} value={mandal} disabled={!district}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mandal" />
                    </SelectTrigger>
                    <SelectContent>
                      {district && LOCATIONS[district as keyof typeof LOCATIONS].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label htmlFor="title">Headline</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-accent hover:text-accent hover:bg-accent/10"
                    onClick={handleGenerateHeadlines}
                    disabled={isGeneratingHeadlines}
                  >
                    {isGeneratingHeadlines ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Suggest Headline
                  </Button>
                </div>
                <Input 
                  id="title" 
                  placeholder="Enter a catchy headline" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <Label htmlFor="content">Report Content</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-accent hover:text-accent hover:bg-accent/10"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                  >
                    {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                    Auto-Summarize
                  </Button>
                </div>
                <Textarea 
                  id="content" 
                  className="min-h-[200px]" 
                  placeholder="Describe the news in detail..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  Optimal length: 70-100 words.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Image Upload</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/20">
                  <p className="text-sm text-muted-foreground">Click to upload image or drag and drop</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-lg font-semibold" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit for Approval
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
