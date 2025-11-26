import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTemplate, fileToBase64 } from '../../services/storageService';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';
import { generateTemplateImage } from '../../services/geminiService';
import { detectFace } from '../../services/faceDetectionService';
import { compressImage } from '../../utils/canvasUtils';
import { DEFAULT_RECT } from '../../constants';
import { Rect } from '../../types';
import Button from '../../components/Button';
import FaceSelector from '../../components/FaceSelector';

const TemplateEditor: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [faceRect, setFaceRect] = useState<Rect>(DEFAULT_RECT);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [genPrompt, setGenPrompt] = useState('');

  // Helper to process, compress and detect face
  const processNewImage = async (base64: string) => {
    setIsLoading(true);
    setLoadingMessage("Optimizing image...");
    
    try {
      // 1. Compress Image (Resize to max 1024px to fit in LocalStorage)
      const compressed = await compressImage(base64, 1024, 0.85);
      setImageFile(compressed);
      
      // 2. Detect Face
      setLoadingMessage("Detecting face...");
      const detected = await detectFace(compressed);
      
      if (detected) {
        setFaceRect(detected);
        console.log("Face detected:", detected);
      } else {
        setFaceRect(DEFAULT_RECT);
        console.log("No face detected, using default.");
      }
      
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Error processing image. Please try another file.");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsLoading(true);
      setLoadingMessage('Uploading image to Cloudinary...');
      try {
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(e.target.files[0]);
        setImageFile(cloudinaryUrl);
        // Optionally, you can process the image further if needed
        setStep(2);
      } catch (err) {
        console.error(err);
        alert('Error uploading image');
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  };

  const handleGenerateAI = async () => {
    if(!genPrompt) return alert("Please enter a prompt");
    setIsLoading(true);
    setLoadingMessage("Generating image with Gemini...");
    try {
      const imageUrl = await generateTemplateImage(genPrompt);
      if(imageUrl) {
        await processNewImage(imageUrl);
      } else {
        alert("Failed to generate image.");
        setIsLoading(false);
      }
    } catch (e) {
      alert("Error generating image. Check API Key configuration.");
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name.');
      return;
    }
    if (!imageFile || !imageFile.startsWith('https://res.cloudinary.com/')) {
      alert('Image not uploaded or invalid Cloudinary URL. Please upload again.');
      return;
    }
    // Generate UUID with fallback
    let id = '';
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
       id = crypto.randomUUID();
    } else {
       id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    const newTemplate = {
      id,
      name: name.trim(),
      imageUrl: imageFile,
      faceRect,
      createdAt: Date.now(),
    };

    try {
      await saveTemplate(newTemplate);
      navigate('/admin/dashboard');
    } catch (e: any) {
      alert(e.message || "Failed to save template");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800">
            {step === 1 ? 'Step 1: Upload Template' : 'Step 2: Configure Template'}
          </h1>
          <button onClick={() => navigate('/admin/dashboard')} className="text-slate-400 hover:text-slate-600">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Superhero, Magazine Cover..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* File Upload */}
                <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isLoading}
                  />
                  <div className="bg-indigo-50 text-indigo-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <i className="fas fa-cloud-upload-alt text-2xl"></i>
                  </div>
                  <h3 className="font-medium text-slate-700">Upload Image</h3>
                  <p className="text-xs text-slate-400 mt-1">JPG or PNG</p>
                  
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center">
                       <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       <span className="text-sm font-medium text-indigo-700">{loadingMessage}</span>
                    </div>
                  )}
                </div>

                {/* AI Generate */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-100 relative">
                   <div className="flex items-center gap-2 mb-4">
                     <i className="fas fa-magic text-indigo-600"></i>
                     <h3 className="font-medium text-indigo-900">Generate with AI</h3>
                   </div>
                   <textarea 
                      className="w-full p-3 rounded-lg border border-indigo-200 text-sm mb-4 h-24 resize-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Describe the template... e.g. An astronaut floating in space with a clear view of the helmet visor."
                      value={genPrompt}
                      onChange={(e) => setGenPrompt(e.target.value)}
                      disabled={isLoading}
                   ></textarea>
                   <Button onClick={handleGenerateAI} isLoading={isLoading} className="w-full" variant="primary">
                     Generate Template
                   </Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && imageFile && (
            <div className="space-y-6">
               {/* Name Input Repeated here to ensure user enters it */}
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Superhero, Magazine Cover..."
                />
               </div>

               <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                  <i className="fas fa-info-circle mt-1"></i>
                  <div>
                    <p className="font-semibold">Face Position Config</p>
                    <p>We've automatically detected the face area. Drag and resize the box to perfect the placement.</p>
                  </div>
               </div>

               <FaceSelector 
                 imageUrl={imageFile} 
                 initialRect={faceRect} 
                 onChange={setFaceRect} 
               />

               <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                 <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                 <Button variant="primary" onClick={handleSave}>Save Template</Button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;