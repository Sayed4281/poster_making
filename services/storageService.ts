import { Template, Rect } from '../types';
import { db } from './firebase';
import { collection, getDocs, getDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Helper to get all templates from Firestore
export const getTemplates = async (): Promise<Template[]> => {
  const snapshot = await getDocs(collection(db, 'templates'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Template));
};

// Helper to get a single template from Firestore
export const getTemplateById = async (id: string): Promise<Template | undefined> => {
  const docRef = doc(db, 'templates', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Template) : undefined;
};

// Helper to save a template to Firestore
export const saveTemplate = async (template: Template): Promise<void> => {
  await setDoc(doc(db, 'templates', template.id), template);
};

// Helper to delete a template from Firestore
export const deleteTemplate = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'templates', id));
};

// Convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};