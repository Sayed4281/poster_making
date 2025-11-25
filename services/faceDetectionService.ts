import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import { Rect } from '../types';

let faceDetector: FaceDetector | null = null;

// Initialize the face detector model
export const initializeFaceDetector = async () => {
  if (faceDetector) return;
  
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
    );
    
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: "GPU"
      },
      runningMode: "IMAGE"
    });
  } catch (error) {
    console.error("Failed to initialize face detector:", error);
    throw error;
  }
};

// Detect face in an image URL (Base64 or external)
export const detectFace = async (imageSource: string): Promise<Rect | null> => {
  try {
    if (!faceDetector) {
      await initializeFaceDetector();
    }

    if (!faceDetector) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSource;
    await new Promise((resolve, reject) => { 
      img.onload = resolve;
      img.onerror = reject;
    });

    const result = faceDetector.detect(img);
    
    if (result.detections && result.detections.length > 0) {
      // Get the first face detected
      const box = result.detections[0].boundingBox;
      if (!box) return null;

      // Convert pixel coordinates to percentages for responsiveness
      // Add a slight padding to the detected face for better fit
      const padding = 0; 
      
      const x = (box.originX / img.width) * 100;
      const y = (box.originY / img.height) * 100;
      const w = (box.width / img.width) * 100;
      const h = (box.height / img.height) * 100;

      return {
        x: Math.max(0, x - padding),
        y: Math.max(0, y - padding),
        width: Math.min(100 - x, w + (padding * 2)),
        height: Math.min(100 - y, h + (padding * 2)),
        shape: 'rect' // Default to rectangle
      };
    }
    return null;
  } catch (error) {
    console.error("Face detection error:", error);
    return null;
  }
};