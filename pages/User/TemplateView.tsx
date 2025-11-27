import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTemplateById, getTemplateByCustomId, fileToBase64 } from '../../services/storageService';
import { mergeImages } from '../../utils/canvasUtils';
import { Template, ProcessingOptions, Rect } from '../../types';
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
      <div className="min-h-screen flex items-center justify-center flex-col gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-2xl font-semibold text-white">Loading ...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-10 px-3 sm:px-4 md:px-6 relative">
      {/* Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>
      </div>

      {/* Header Navigation */}
      <div className="max-w-6xl mx-auto mb-4 sm:mb-6 md:mb-8 flex items-center justify-between">
        <div className="font-bold text-indigo-400 text-xs sm:text-sm tracking-widest uppercase flex items-center gap-2">
          <i className="fas fa-bolt"></i> <span className="hidden xs:inline">Smart Template Gen</span><span className="xs:hidden">Template Gen</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">

        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6 animate-fade-in">
          <div className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{template.name}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-6 md:mb-8">Upload your photo to generate your personalized poster.</p>

            <label className="block w-full cursor-pointer bg-slate-800 border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-700/50 text-indigo-300 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-center transition-all group mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                <i className="fas fa-camera text-lg sm:text-xl text-indigo-400"></i>
              </div>
              <span className="font-medium block text-white text-sm sm:text-base">Upload Your Face</span>
              <span className="text-xs text-slate-500 mt-1 block">JPG or PNG</span>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            {/* Take Photo button removed as requested */}

            {userImage && (
              <div className="space-y-4 sm:space-y-6 border-t border-slate-700/50 pt-4 sm:pt-6">


                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h3 className="font-medium text-white text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                    <i className="fas fa-sliders-h text-indigo-400 text-xs sm:text-sm"></i> Adjustments
                  </h3>
                  <button
                    onClick={() => setOptions({ brightness: 0, contrast: 0, saturation: 0, rotation: 0 })}
                    className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    title="Reset all adjustments"
                  >
                    <i className="fas fa-undo"></i> Reset
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Rotation</span>
                      <span className="text-indigo-300 font-mono">{options.rotation}°</span>
                    </div>
                    <input
                      type="range" min="-180" max="180"
                      value={options.rotation}
                      onChange={(e) => setOptions({ ...options, rotation: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Brightness</span>
                      <span className="text-indigo-300 font-mono">{options.brightness}</span>
                    </div>
                    <input
                      type="range" min="-100" max="100"
                      value={options.brightness}
                      onChange={(e) => setOptions({ ...options, brightness: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Contrast</span>
                      <span className="text-indigo-300 font-mono">{options.contrast}</span>
                    </div>
                    <input
                      type="range" min="-100" max="100"
                      value={options.contrast}
                      onChange={(e) => setOptions({ ...options, contrast: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {resultImage && (
            <Button onClick={handleDownload} className="w-full py-3 sm:py-4 text-base sm:text-lg shadow-xl shadow-indigo-500/20" variant="primary" icon="fas fa-download">
              Download Image
            </Button>
          )}
        </div>

        {/* Right Column: Preview or Cropper */}
        <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="glass-panel rounded-xl sm:rounded-2xl shadow-2xl border border-slate-700/50 p-2 relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center justify-center checkerboard overflow-hidden">

            {resultImage ? (
              <img src={resultImage} alt="Result" className="max-w-full max-h-[60vh] sm:max-h-[70vh] md:max-h-[80vh] rounded-lg sm:rounded-xl shadow-lg" />
            ) : template.imageUrl ? (
              <>
                <img src={template.imageUrl} alt="Preview" className="max-w-full max-h-[60vh] sm:max-h-[70vh] md:max-h-[80vh] opacity-40 blur-sm rounded-lg sm:rounded-xl" onError={(e) => { console.error('Image failed to load:', template.imageUrl); e.currentTarget.style.display = 'none'; }} />
                {!userImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-700 shadow-xl text-center">
                      <i className="fas fa-arrow-up md:hidden mb-2 text-xl sm:text-2xl text-indigo-400 animate-bounce"></i>
                      <i className="fas fa-arrow-left hidden md:block mb-2 text-2xl text-indigo-400 animate-bounce"></i>
                      <p className="font-medium text-sm sm:text-base">Upload your photo to start</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <span className="bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-md">
                  Waiting for upload...
                </span>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10 backdrop-blur-md rounded-2xl">
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-4">
                    <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-indigo-300 font-medium text-lg animate-pulse">Processing Magic...</p>
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
