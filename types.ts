export interface Rect {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage 0-100
  height: number; // Percentage 0-100
  shape?: 'rect' | 'circle';
}

export interface Template {
  id: string;
  name: string;
  imageUrl: string;
  faceRect: Rect;
  createdAt: number;
}

export interface UserState {
  isAdmin: boolean;
}

export interface ProcessingOptions {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
}