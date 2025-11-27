import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveTemplate } from '../../services/storageService';
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
  const [customId, setCustomId] = useState('');
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
    if (!genPrompt) return alert("Please enter a prompt");
    setIsLoading(true);
    setLoadingMessage("Generating image with Gemini...");
    try {
      const imageUrl = await generateTemplateImage(genPrompt);
      if (imageUrl) {
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
    if (!imageFile || imageFile === 'undefined' || !imageFile.startsWith('https://res.cloudinary.com/')) {
      alert('Image not uploaded, invalid, or undefined. Please upload again and wait for the Cloudinary URL.');
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
      customId: customId.trim() ? customId.trim() : undefined,
    };

    try {
      await saveTemplate(newTemplate);
      navigate('/admin/dashboard');
    } catch (e: any) {
      alert(e.message || "Failed to save template");
    }
  };

  return (
    <div className="min-h-screen p-6 relative">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="max-w-5xl mx-auto glass-panel rounded-2xl overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/30">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${step === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-700 text-slate-400'}`}>1</div>
            <div className="h-1 w-12 bg-slate-700 rounded-full">
              <div className={`h-full bg-indigo-600 rounded-full transition-all duration-500 ${step === 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${step === 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-700 text-slate-400'}`}>2</div>
          </div>

          <button onClick={() => navigate('/admin/dashboard')} className="text-slate-400 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 1 ? 'Upload Template' : 'Configure Template'}
            </h1>
            <p className="text-slate-400">
              {step === 1 ? 'Choose an image or generate one with AI to get started.' : 'Fine-tune the face placement area.'}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none text-white placeholder-slate-500"
                  placeholder="e.g. Superhero, Magazine Cover..."
                />
                <label className="block text-sm font-medium text-slate-300 mb-2 mt-6">Custom Link ID <span className="text-slate-500">(optional)</span></label>
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none text-white placeholder-slate-500"
                  placeholder="e.g. superhero2025, mag-cover"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* File Upload */}
                <div className="relative border-2 border-dashed border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 hover:border-indigo-500 transition-all cursor-pointer overflow-hidden group h-80">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isLoading}
                  />
                  <div className="bg-slate-800 group-hover:bg-indigo-600/20 text-indigo-400 group-hover:text-indigo-300 rounded-full w-20 h-20 flex items-center justify-center mb-6 transition-colors">
                    <i className="fas fa-cloud-upload-alt text-3xl"></i>
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-1">Upload Image</h3>
                  <p className="text-sm text-slate-400">JPG or PNG up to 10MB</p>

                  {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                      <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-lg font-medium text-indigo-300 animate-pulse">{loadingMessage}</span>
                    </div>
                  )}
                </div>

                {/* AI Generate */}
                <div className="glass-panel border-indigo-500/30 rounded-2xl p-8 relative overflow-hidden h-80 flex flex-col">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <i className="fas fa-robot text-9xl text-indigo-500"></i>
                  </div>

                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <i className="fas fa-magic text-indigo-400"></i>
                    </div>
                    <h3 className="font-semibold text-white text-lg">Generate with AI</h3>
                  </div>

                  <textarea
                    className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 text-sm mb-4 flex-grow resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Describe the template... e.g. An astronaut floating in space with a clear view of the helmet visor."
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    disabled={isLoading}
                  ></textarea>
                  <Button onClick={handleGenerateAI} isLoading={isLoading} className="w-full" variant="primary" icon="fas fa-wand-magic-sparkles">
                    Generate Template
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && imageFile && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                    <FaceSelector
                      imageUrl={imageFile}
                      initialRect={faceRect}
                      onChange={setFaceRect}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Template Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none text-white placeholder-slate-500"
                      placeholder="e.g. Superhero"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Custom Link ID</label>
                    <input
                      type="text"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-input focus:outline-none text-white placeholder-slate-500"
                      placeholder="e.g. superhero2025"
                    />
                  </div>

                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 p-4 rounded-xl text-sm flex items-start gap-3">
                    <i className="fas fa-info-circle mt-1 text-indigo-400"></i>
                    <div>
                      <p className="font-semibold text-indigo-300 mb-1">Face Position Config</p>
                      <p className="opacity-80">We've automatically detected the face area. Drag and resize the box to perfect the placement.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <Button variant="primary" onClick={handleSave} className="w-full py-3 text-lg" icon="fas fa-save">Save Template</Button>
                    <Button variant="secondary" onClick={() => setStep(1)} className="w-full" icon="fas fa-arrow-left">Back to Upload</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;