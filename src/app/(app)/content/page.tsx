
"use client";
import { useState, useEffect } from "react";
import { useAppData } from "@/contexts/app-data-context";
import type { SocialMediaPost, SocialMediaPostData, Platform } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { PlusCircle, Edit2, Trash2, Loader2, WandSparkles } from "lucide-react";
import { GeneratePostForm } from "./GeneratePostForm";
import { PostCard } from "./PostCard";
import { PostForm, type PostFormData } from "./PostForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ContentStudioPage() {
  const { 
    socialMediaPosts, 
    isLoadingSocialMediaPosts, 
    addSocialMediaPost, 
    updateSocialMediaPost, 
    deleteSocialMediaPost,
    fetchSocialMediaPosts,
  } = useAppData();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [generatedContentForNewPost, setGeneratedContentForNewPost] = useState<{platform: Platform, content: string} | null>(null);

  useEffect(() => {
    fetchSocialMediaPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenForm = (post?: SocialMediaPost) => {
    setEditingPost(post || null);
    setGeneratedContentForNewPost(null); // Clear any pre-filled content
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPost(null);
    setGeneratedContentForNewPost(null);
  };

  const handleSavePost = async (data: PostFormData) => {
    const postData: SocialMediaPostData = {
      platform: data.platform,
      content: data.content,
      status: data.status,
      scheduledDate: data.scheduledDate?.toISOString(),
      imageUrl: data.imageUrl,
      notes: data.notes,
    };

    try {
      if (editingPost) {
        await updateSocialMediaPost(editingPost.id, postData);
        toast({ title: "Success", description: "Post updated." });
      } else {
        await addSocialMediaPost(postData);
        toast({ title: "Success", description: "Post created." });
      }
      handleCloseForm();
    } catch (error) {
      console.error("Failed to save post:", error);
      toast({ title: "Error", description: "Could not save post.", variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteSocialMediaPost(postId);
      toast({ title: "Success", description: "Post deleted." });
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({ title: "Error", description: "Could not delete post.", variant: "destructive" });
    }
  };
  
  const handlePostGeneratedByAI = (platform: Platform, content: string) => {
    setGeneratedContentForNewPost({ platform, content });
    setEditingPost(null); // Ensure we're in "create new" mode
    setIsFormOpen(true); // Open the form with the generated content
  };


  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-headline font-bold">Content Studio</h1>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-5 w-5" /> Create New Post
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><WandSparkles className="text-primary h-6 w-6"/>AI Post Generator</CardTitle>
          <CardDescription>Generate initial post content using AI, then refine it.</CardDescription>
        </CardHeader>
        <CardContent>
          <GeneratePostForm onPostGenerated={handlePostGeneratedByAI} />
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Posts</h2>
        {isLoadingSocialMediaPosts && socialMediaPosts.length === 0 && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading posts...</p>
          </div>
        )}
        {!isLoadingSocialMediaPosts && socialMediaPosts.length === 0 && (
          <p className="text-muted-foreground text-center py-10">No posts yet. Create one or generate ideas with AI!</p>
        )}
        {socialMediaPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialMediaPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onEdit={() => handleOpenForm(post)} 
                onDelete={handleDeletePost} 
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {if (!isOpen) handleCloseForm()}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Update the details of your social media post." : "Fill in the details for your new social media post."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1 pr-4"> {/* Added ScrollArea */}
            <PostForm
              onSubmit={handleSavePost}
              initialData={ generatedContentForNewPost ? { ...editingPost, platform: generatedContentForNewPost.platform, content: generatedContentForNewPost.content } as SocialMediaPost : editingPost}
              onCancel={handleCloseForm}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
