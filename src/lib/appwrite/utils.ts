import { storage, BUCKETS } from './services';
import { ID } from 'appwrite';

export async function uploadFile(bucketId: string, file: File) {
  try {
    const response = await storage.createFile(bucketId, ID.unique(), file);
    return response.$id;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

export async function getFilePreview(bucketId: string, fileId: string) {
  try {
    return storage.getFilePreview(bucketId, fileId);
  } catch (error) {
    console.error('Error getting file preview:', error);
    throw error;
  }
}

export async function deleteFile(bucketId: string, fileId: string) {
  try {
    await storage.deleteFile(bucketId, fileId);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export function getImageUrl(photoId: string, width = 800, height = 800) {
  return storage.getFilePreview(
    BUCKETS.CATCH_PHOTOS,
    photoId,
    width,
    height,
    'center',
    100,
    0,
    'jpg'
  ).href;
}

export function getStorage() {
  return storage;
}