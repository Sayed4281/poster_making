import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTemplateById, getTemplateByCustomId, fileToBase64 } from '../../services/storageService';
import { mergeImages } from '../../utils/canvasUtils';
import { Template, ProcessingOptions } from '../../types';
import { AUTH_STORAGE_KEY } from '../../constants';
import Button from '../../components/Button';

const TemplateView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Image Adjustment State
  const [options, setOptions] = useState<ProcessingOptions>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    rotation: 0,
  });

  const isAdmin = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';

  useEffect(() => {
    if (id) {
      (async () => {
        let t = await getTemplateById(id);
        if (!t) {
          t = await getTemplateByCustomId(id);
        }
        if (t) {
          console.log('Loaded template:', t);
          setTemplate(t);
        }
      })();
    }
  }, [id]);

  // Real-time update of preview when options change
  useEffect(() => {
    if (template && userImage) {
      const timer = setTimeout(() => {
        handleProcess();
      }, 100); // Debounce
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, userImage]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setUserImage(base64);
    }
  };

  const handleProcess = async () => {
    if (!template || !userImage) return;
    try {
      console.log('Processing image with:', {
        imageUrl: template.imageUrl,
        userImage,
        faceRect: template.faceRect,
        options
      });
      const result = await mergeImages(template.imageUrl, userImage, template.faceRect, options);
      setResultImage(result);
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Error processing image: ' + (err?.message || err));
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `smart-gen-${Date.now()}.png`;
      link.click();
    }
  };

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 flex-col gap-4">
        <h2 className="text-2xl font-semibold">Loading Template...</h2>
          {/* Dashboard navigation removed */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      {/* Header Navigation */}
      <div className="max-w-5xl mx-auto mb-6 flex items-center justify-between">
        <div className="font-bold text-slate-400 text-sm tracking-wide uppercase">Smart Template Gen</div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h1 className="text-xl font-bold text-slate-800 mb-2">{template.name}</h1>
            <p className="text-sm text-slate-500 mb-6">Upload your photo to generate.</p>
            
            <label className="block w-full cursor-pointer bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-lg p-4 text-center transition mb-6">
              <span className="font-medium"><i className="fas fa-camera mr-2"></i> Upload Your Face</span>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>

            {userImage && (
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="font-medium text-slate-700 text-sm">Adjustments</h3>
                
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Rotation</span>
                    <span>{options.rotation}°</span>
                  </div>
                  <input 
                    type="range" min="-180" max="180" 
                    value={options.rotation} 
                    onChange={(e) => setOptions({...options, rotation: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                   <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Brightness</span>
                    <span>{options.brightness}</span>
                  </div>
                  <input 
                    type="range" min="-100" max="100" 
                    value={options.brightness} 
                    onChange={(e) => setOptions({...options, brightness: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                   <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Contrast</span>
                    <span>{options.contrast}</span>
                  </div>
                  <input 
                    type="range" min="-100" max="100" 
                    value={options.contrast} 
                    onChange={(e) => setOptions({...options, contrast: Number(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>
          
           {resultImage && (
             <Button onClick={handleDownload} className="w-full py-3 text-lg shadow-lg shadow-indigo-200">
               Download Image
             </Button>
           )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-2 relative min-h-[500px] flex items-center justify-center checkerboard">
             {resultImage ? (
               <img src={resultImage} alt="Result" className="max-w-full max-h-[70vh] rounded shadow-sm" />
             ) : template.imageUrl ? (
                <>
                  {console.log('Preview image URL:', template.imageUrl)}
                  <img src={template.imageUrl} alt="Preview" className="max-w-full max-h-[60vh] opacity-50 blur-sm rounded" onError={(e) => { console.error('Image failed to load:', template.imageUrl); e.currentTarget.style.display = 'none'; }} />
                </>
             ) : (
                <div className="text-center">
                  <span className="bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-md">
                    Waiting for upload...
                  </span>
                </div>
             )}
             
    {isProcessing && (
               <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm">
                 <div className="flex flex-col items-center">
                    <svg className="animate-spin h-10 w-10 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-slate-600 font-medium">Processing...</p>
                 </div>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};


export default TemplateView;