
"use client";
import { useState, useMemo, useEffect } from "react";
import { useAppData } from "@/contexts/app-data-context";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { GeneratePostForm } from "@/components/content/GeneratePostForm";
import { PostCard } from "@/components/content/PostCard";
import { PostForm, type PostFormData } from "@/components/content/PostForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Share2, Wand2, Filter, Loader2, Shield } from "lucide-react";
import type { SocialMediaPost, Platform, PostStatus, SocialMediaPostData } from "@/types";
import { SOCIAL_PLATFORMS, POST_STATUSES } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Alert, AlertTitle } from "@/components/ui/alert";


export default function ContentStudioPage() {
  const { 
    socialMediaPosts, 
    addSocialMediaPost, 
    updateSocialMediaPost, 
    deleteSocialMediaPost, 
    isLoadingSocialMediaPosts,
    fetchSocialMediaPosts,
  } = useAppData();
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | undefined>(undefined);
  
  const [generatedContent, setGeneratedContent] = useState<{ platform: Platform, content: string} | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "All">("All");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "All">("All");

  const isPremium = userProfile?.plan === 'premium';

  useEffect(() => {
    if(isPremium) {
        fetchSocialMediaPosts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const handleEdit = (post: SocialMediaPost) => {
    setGeneratedContent(null);
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const handleDelete = async (postId: string) => {
    try {
      await deleteSocialMediaPost(postId);
      toast({ title: "Success", description: "Post deleted." });
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({ title: "Error", description: "Could not delete post.", variant: "destructive" });
    }
  };

  const handlePostGenerated = (platform: Platform, content: string) => {
    setGeneratedContent({ platform, content });
    setIsGeneratorOpen(false); // Close generator
    setEditingPost(undefined); // Ensure it's a new post
    setIsFormOpen(true); // Open manual post form with generated content
  };

  const handleSubmit = async (data: PostFormData) => {
    const postToSave: SocialMediaPostData = {
      platform: data.platform,
      content: data.content,
      status: data.status,
      scheduledDate: data.scheduledDate?.toISOString(),
      imageUrl: data.imageUrl,
      notes: data.notes,
    };

    try {
      if (editingPost) {
        await updateSocialMediaPost(editingPost.id, postToSave);
        toast({ title: "Success", description: "Post updated." });
      } else {
        await addSocialMediaPost(postToSave);
        toast({ title: "Success", description: "Post created." });
      }
      setIsFormOpen(false);
      setEditingPost(undefined);
      setGeneratedContent(null);
    } catch (error) {
      console.error("Failed to save post:", error);
      toast({ title: "Error", description: "Could not save post.", variant: "destructive" });
    }
  };
  
  const filteredPosts = useMemo(() => {
    return socialMediaPosts.filter(post => {
      const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (post.notes && post.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPlatform = platformFilter === "All" || post.platform === platformFilter;
      const matchesStatus = statusFilter === "All" || post.status === statusFilter;
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [socialMediaPosts, searchTerm, platformFilter, statusFilter]);

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium) {
     return (
      <div className="px-4 sm:px-6 md:py-6 flex flex-col items-center justify-center text-center">
        <Card className="max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              Upgrade to Premium
            </CardTitle>
            <CardDescription>
              The Content Studio is a premium feature. Unlock it by upgrading your plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Premium Feature</AlertTitle>
              <AlertDescription>
                Gain access to the Content Studio, AI assistant, and advanced insights by upgrading your account.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/settings">View Plans</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="px-4 sm:px-6 md:py-6 space-y-6">
      <PageHeader 
        title="Content Studio"
        description="Generate, manage, and schedule your social media content."
        icon={Share2}
        actionButtons={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsGeneratorOpen(true)}>
              <Wand2 className="mr-2 h-5 w-5" /> AI Generate Post
            </Button>
            <Button onClick={() => { setEditingPost(undefined); setGeneratedContent(null); setIsFormOpen(true); }}>
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Post
            </Button>
          </div>
        }
      />

      <Card className="shadow-sm border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <label htmlFor="search-posts" className="block text-sm font-medium text-muted-foreground mb-1.5">
                <Filter className="inline h-4 w-4 mr-1"/>
                Search Posts
              </label>
              <Input
                id="search-posts"
                placeholder="Keywords, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <div className="flex flex-col gap-1.5">
               <label htmlFor="platform-filter" className="text-sm font-medium text-muted-foreground">Platform</label>
               <Select value={platformFilter} onValueChange={(value) => setPlatformFilter(value as Platform | "All")}>
                <SelectTrigger id="platform-filter"><SelectValue placeholder="Filter by platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Platforms</SelectItem>
                  {SOCIAL_PLATFORMS.filter(p=>p !== 'General').map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="flex flex-col gap-1.5">
              <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PostStatus | "All")}>
                <SelectTrigger id="status-filter"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {POST_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoadingSocialMediaPosts && socialMediaPosts.length === 0 && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading posts...</p>
        </div>
      )}

      {!isLoadingSocialMediaPosts && filteredPosts.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No posts found matching your criteria. Try adjusting filters or create a new post.
          </CardContent>
        </Card>
      )}
      
      {filteredPosts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}


      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Wand2 className="text-primary"/>AI Post Generator</DialogTitle>
            <DialogDescription>
              Let AI help you craft engaging social media posts.
            </DialogDescription>
          </DialogHeader>
          <GeneratePostForm onPostGenerated={handlePostGenerated} />
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) {
          setEditingPost(undefined);
          setGeneratedContent(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : (generatedContent ? "Finalize Generated Post" : "Create New Post")}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Update the details of your social media post." : "Fill in the details for your new post."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-4">
            <PostForm 
              onSubmit={handleSubmit} 
              initialData={editingPost || (generatedContent ? { ...generatedContent, status: 'Draft', platform: generatedContent.platform } as Partial<SocialMediaPost> : undefined)}
              onCancel={() => { setIsFormOpen(false); setEditingPost(undefined); setGeneratedContent(null); }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
