
import { db } from '@/lib/firebase';
import type { SocialMediaPost, SocialMediaPostData } from '@/types';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

const POST_COLLECTION = 'socialMediaPosts';

const fromFirestore = (snapshot: QueryDocumentSnapshot<DocumentData>): SocialMediaPost => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: data.userId,
    platform: data.platform,
    content: data.content,
    status: data.status,
    scheduledDate: data.scheduledDate ? (data.scheduledDate as Timestamp).toDate().toISOString() : undefined,
    imageUrl: data.imageUrl || undefined,
    notes: data.notes || undefined,
    topic: data.topic || undefined,
    tone: data.tone || undefined,
    createdAt: data.createdAt, // This will be a Firestore Timestamp
    updatedAt: data.updatedAt, // This will be a Firestore Timestamp
  };
};

export const getSocialMediaPosts = async (userId: string): Promise<SocialMediaPost[]> => {
  if (!userId) {
    console.error("User ID is required to fetch social media posts.");
    return [];
  }
  try {
    const postsRef = collection(db, POST_COLLECTION);
    const q = query(postsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error("Error fetching social media posts:", error);
    console.error("Full error object during getSocialMediaPosts:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};

export const addSocialMediaPost = async (userId: string, postData: SocialMediaPostData): Promise<SocialMediaPost> => {
  if (!userId) {
    throw new Error("User ID is required to add a social media post.");
  }
  try {
    const postsRef = collection(db, POST_COLLECTION);
    const docData: any = {
      ...postData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      scheduledDate: postData.scheduledDate ? Timestamp.fromDate(new Date(postData.scheduledDate)) : null,
    };

    const docRef = await addDoc(postsRef, docData);
    // For optimistic UI, create a client-side representation
    // The actual server timestamps will be different.
    return {
      id: docRef.id,
      userId,
      ...postData,
      createdAt: Timestamp.now(), // Placeholder, will be replaced by server value on next fetch
      updatedAt: Timestamp.now(), // Placeholder
    } as SocialMediaPost;
  } catch (error) {
    console.error("Error adding social media post:", error);
    console.error("Full error object during addSocialMediaPost:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};

export const updateSocialMediaPost = async (userId: string, postId: string, postUpdate: Partial<SocialMediaPostData>): Promise<void> => {
  if (!userId || !postId) {
    throw new Error("User ID and Post ID are required to update a social media post.");
  }
  try {
    const postRef = doc(db, POST_COLLECTION, postId);
    const updateData: any = { ...postUpdate, updatedAt: serverTimestamp() };

    if (postUpdate.scheduledDate) {
      updateData.scheduledDate = Timestamp.fromDate(new Date(postUpdate.scheduledDate));
    } else if (postUpdate.hasOwnProperty('scheduledDate') && postUpdate.scheduledDate === undefined) {
      updateData.scheduledDate = null;
    }
    
    // Ensure we don't try to update userId or createdAt directly
    delete updateData.userId;
    delete updateData.createdAt;

    await updateDoc(postRef, updateData);
  } catch (error) {
    console.error("Error updating social media post:", error);
    console.error("Full error object during updateSocialMediaPost:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};

export const deleteSocialMediaPost = async (userId: string, postId: string): Promise<void> => {
   if (!userId || !postId) {
    throw new Error("User ID and Post ID are required to delete a social media post.");
  }
  try {
    const postRef = doc(db, POST_COLLECTION, postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("Error deleting social media post:", error);
    console.error("Full error object during deleteSocialMediaPost:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    throw error;
  }
};
