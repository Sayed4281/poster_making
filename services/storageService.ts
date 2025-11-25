import { Template, Rect } from '../types';
import { LOCAL_STORAGE_KEY } from '../constants';

// Helper to get all templates
export const getTemplates = (): Template[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Helper to get a single template
export const getTemplateById = (id: string): Template | undefined => {
  const templates = getTemplates();
  return templates.find((t) => t.id === id);
};

// Helper to save a template
export const saveTemplate = (template: Template): void => {
  try {
    const templates = getTemplates();
    // Check if update or new
    const index = templates.findIndex((t) => t.id === template.id);
    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
  } catch (e: any) {
    console.error("Storage save failed:", e);
    // Specifically catch QuotaExceededError
    if (e.name === 'QuotaExceededError' || e.code === 22) {
       throw new Error("Storage is full. Please delete old templates or upload a smaller image.");
    }
    throw new Error("Failed to save template.");
  }
};

// Helper to delete a template
export const deleteTemplate = (id: string): void => {
  const templates = getTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
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