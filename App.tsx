import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Wand2, 
  Download, 
  RefreshCw, 
  Sparkles, 
  AlertCircle,
  ArrowLeftRight,
  Trash2,
  UserSquare2,
  Palette,
  Crop,
  History,
  Eraser,
  Zap
} from 'lucide-react';
import { 
  EditorSettings, 
  EnhancementQuality, 
  EnhancementMode, 
  ImageState,
  AppTab,
  IDPhotoSettings,
  IDPhotoSize,
  IDPhotoBackground,
  RestorationSettings
} from './types';
import { enhanceImageWithGemini, generateIDPhotoWithGemini, restoreImageWithGemini } from './services/geminiService';
import { Slider } from './components/Slider';

const DEFAULT_ENHANCE_SETTINGS: EditorSettings = {
  quality: EnhancementQuality.Q_4K,
  mode: EnhancementMode.ENHANCE_RESTORE,
  retouchLevel: 50,
  sharpenLevel: 30,
  upscaleLevel: 25,
  hyperRealism: true,
  colorize: true,
  makeup: false,
};

const DEFAULT_ID_SETTINGS: IDPhotoSettings = {
  size: IDPhotoSize.SIZE_3x4,
  backgroundColor: IDPhotoBackground.WHITE,
  quality: EnhancementQuality.Q_4K,
  skinSmoothing: 60,
  removeBlemishes: true,
  fixLighting: true,
};

const DEFAULT_RESTORE_SETTINGS: RestorationSettings = {
  scratchReduction: 80,
  denoiseLevel: 50,
  colorRestoration: true,
  faceRestoration: true,
  sharpenArtifacts: true,
  quality: EnhancementQuality.Q_4K
};

const App: React.FC = () => {
  // App State
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ENHANCE);
  const [enhanceSettings, setEnhanceSettings] = useState<EditorSettings>(DEFAULT_ENHANCE_SETTINGS);
  const [idSettings, setIdSettings] = useState<IDPhotoSettings>(DEFAULT_ID_SETTINGS);
  const [restoreSettings, setRestoreSettings] = useState<RestorationSettings>(DEFAULT_RESTORE_SETTINGS);
  
  const [imgState, setImgState] = useState<ImageState>({
    originalUrl: null,
    processedUrl: null,
    isProcessing: false,
    error: null,
  });
  
  // Refs for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      setImgState(prev => ({ ...prev, error: 'Please upload a valid image file.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImgState({
        originalUrl: e.target?.result as string,
        processedUrl: null,
        isProcessing: false,
        error: null,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleProcess = async () => {
    if (!imgState.originalUrl) return;

    setImgState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      let result;
      if (activeTab === AppTab.ENHANCE) {
        result = await enhanceImageWithGemini(imgState.originalUrl, enhanceSettings);
      } else if (activeTab === AppTab.ID_PHOTO) {
        result = await generateIDPhotoWithGemini(imgState.originalUrl, idSettings);
      } else if (activeTab === AppTab.RESTORE) {
        result = await restoreImageWithGemini(imgState.originalUrl, restoreSettings);
      }
      
      setImgState(prev => ({
        ...prev,
        processedUrl: result,
        isProcessing: false
      }));
    } catch (err: any) {
      setImgState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || "Failed to process image."
      }));
    }
  };

  const handleDownload = () => {
    if (imgState.processedUrl) {
      const link = document.createElement('a');
      link.href = imgState.processedUrl;
      let prefix = 'Enhanced';
      if (activeTab === AppTab.ID_PHOTO) prefix = 'ID_Photo';
      if (activeTab === AppTab.RESTORE) prefix = 'Restored_Gemini3Pro';
      
      link.download = `LongRau_${prefix}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetImage = () => {
    setImgState({
      originalUrl: null,
      processedUrl: null,
      isProcessing: false,
      error: null
    });
  };

  // Helper to get background color CSS
  const getBgColorCss = (bg: IDPhotoBackground) => {
    switch(bg) {
      case IDPhotoBackground.WHITE: return 'bg-white border-gray-300';
      case IDPhotoBackground.BLUE: return 'bg-blue-600 border-blue-400';
      case IDPhotoBackground.RED: return 'bg-red-600 border-red-400';
      case IDPhotoBackground.BLACK: return 'bg-black border-gray-600';
      case IDPhotoBackground.GRAY: return 'bg-gray-500 border-gray-400';
      default: return 'bg-white';
    }
  };

  // Helper text for processing overlay
  const getProcessingText = () => {
    switch(activeTab) {
      case AppTab.ID_PHOTO: return 'Removing background & Formatting...';
      case AppTab.RESTORE: return 'Restoring details with Gemini 3 Pro...';
      default: return enhanceSettings.quality === EnhancementQuality.Q_8K 
        ? 'Enhancing with Gemini 3 Pro (High Res)...' 
        : 'Enhancing details & Upscaling...';
    }
  };

  // Main App
  return (
    <div className="min-h-screen bg-black p-4 md:p-8 font-sans text-gray-200">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-gray-900 rounded-full shadow-lg border border-gray-800 mb-4">
          <Sparkles className="w-6 h-6 text-purple-500 mr-2" />
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Long Râu Digital Photo
            <span className="text-purple-500 ml-2">AI Enhancer</span>
          </h1>
        </div>
        <p className="text-gray-400 font-medium flex items-center justify-center gap-2">
          V2.0 Pro 
          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
          <span className="flex items-center text-purple-400"><Zap className="w-3 h-3 mr-1"/> Gemini 3 Pro Active</span>
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-center w-full overflow-x-auto">
        <div className="bg-gray-900/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-lg border border-gray-800 inline-flex flex-wrap md:flex-nowrap justify-center gap-1">
          <button
            onClick={() => setActiveTab(AppTab.ENHANCE)}
            className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === AppTab.ENHANCE
                ? 'bg-gradient-to-r from-purple-700 to-pink-700 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Nâng Cấp Ảnh
          </button>
          <button
            onClick={() => setActiveTab(AppTab.ID_PHOTO)}
            className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === AppTab.ID_PHOTO
                ? 'bg-gradient-to-r from-purple-700 to-pink-700 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <UserSquare2 className="w-4 h-4 mr-2" />
            Tạo Ảnh Thẻ
          </button>
          <button
            onClick={() => setActiveTab(AppTab.RESTORE)}
            className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
              activeTab === AppTab.RESTORE
                ? 'bg-gradient-to-r from-purple-700 to-pink-700 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            Khôi Phục Ảnh
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-800">
            
            {/* Render Content Based on Tab */}
            {activeTab === AppTab.ENHANCE && (
              // --- ENHANCE CONTROLS ---
              <>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Wand2 className="w-5 h-5 mr-2 text-pink-500" />
                  Enhancement Controls
                </h2>

                {/* Quality Selection */}
                <div className="mb-6 space-y-3">
                  <label className="block text-sm font-semibold text-gray-300">Output Quality</label>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.values(EnhancementQuality).map((q) => (
                      <button
                        key={q}
                        onClick={() => setEnhanceSettings(s => ({ ...s, quality: q }))}
                        className={`px-4 py-3 rounded-xl text-left transition-all duration-200 border ${
                          enhanceSettings.quality === q
                            ? 'bg-purple-900/30 border-purple-500 text-purple-300 shadow-sm ring-1 ring-purple-500'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{q}</span>
                          {q.includes('8K') && (
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                              GEMINI 3 PRO
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Processing Mode</label>
                  <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                    {Object.values(EnhancementMode).map((m) => (
                      <button
                        key={m}
                        onClick={() => setEnhanceSettings(s => ({ ...s, mode: m }))}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                          enhanceSettings.mode === m
                            ? 'bg-gray-700 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-1 mb-6">
                  <Slider 
                    label="Face Retouch" 
                    value={enhanceSettings.retouchLevel} 
                    onChange={(v) => setEnhanceSettings(s => ({...s, retouchLevel: v}))} 
                  />
                  <Slider 
                    label="Sharpening" 
                    value={enhanceSettings.sharpenLevel} 
                    max={200}
                    onChange={(v) => setEnhanceSettings(s => ({...s, sharpenLevel: v}))} 
                  />
                  <Slider 
                    label="AI Upscale Strength" 
                    value={enhanceSettings.upscaleLevel} 
                    onChange={(v) => setEnhanceSettings(s => ({...s, upscaleLevel: v}))} 
                  />
                </div>

                <div className="h-px bg-gray-800 my-6" />

                {/* Advanced Options */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-300">Advanced Options</label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={enhanceSettings.hyperRealism}
                      onChange={(e) => setEnhanceSettings(s => ({...s, hyperRealism: e.target.checked}))}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500 transition-colors"
                    />
                    <span className="text-sm text-gray-400 group-hover:text-gray-200">Hyper-Realism Texture</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={enhanceSettings.colorize}
                      onChange={(e) => setEnhanceSettings(s => ({...s, colorize: e.target.checked}))}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500 transition-colors"
                    />
                    <span className="text-sm text-gray-400 group-hover:text-gray-200">Color Correction</span>
                  </label>
                </div>
              </>
            )}

            {activeTab === AppTab.ID_PHOTO && (
              // --- ID PHOTO CONTROLS ---
              <>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                  <UserSquare2 className="w-5 h-5 mr-2 text-pink-500" />
                  Cấu Hình Ảnh Thẻ
                </h2>

                {/* Size Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <Crop className="w-4 h-4 mr-1" /> Kích Thước
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(IDPhotoSize).map((size) => (
                      <button
                        key={size}
                        onClick={() => setIdSettings(s => ({ ...s, size }))}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                          idSettings.size === size
                            ? 'bg-purple-900/30 border-purple-500 text-purple-300 ring-1 ring-purple-500'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <Palette className="w-4 h-4 mr-1" /> Màu Nền
                  </label>
                  <div className="flex space-x-3 bg-gray-800 p-3 rounded-xl justify-around border border-gray-700">
                    {Object.values(IDPhotoBackground).map((bg) => (
                      <button
                        key={bg}
                        onClick={() => setIdSettings(s => ({ ...s, backgroundColor: bg }))}
                        className={`w-8 h-8 rounded-full border-2 shadow-sm transition-transform hover:scale-110 focus:outline-none ${
                          getBgColorCss(bg)
                        } ${idSettings.backgroundColor === bg ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''}`}
                        title={bg}
                      />
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-800 my-6" />

                {/* Retouching */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-300">Làm Đẹp Da & Xử Lý</label>
                  
                  <Slider 
                    label="Mịn Da (Skin Smooth)" 
                    value={idSettings.skinSmoothing} 
                    onChange={(v) => setIdSettings(s => ({...s, skinSmoothing: v}))} 
                  />

                  <div className="space-y-3 mt-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={idSettings.removeBlemishes}
                        onChange={(e) => setIdSettings(s => ({...s, removeBlemishes: e.target.checked}))}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-300">Nhặt Mụn / Xóa Vết Xước</span>
                        <span className="text-xs text-gray-500">Acne & Blemish Removal</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={idSettings.fixLighting}
                        onChange={(e) => setIdSettings(s => ({...s, fixLighting: e.target.checked}))}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-300">Cân Bằng Ánh Sáng</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {activeTab === AppTab.RESTORE && (
              // --- RESTORE CONTROLS ---
              <>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                  <History className="w-5 h-5 mr-2 text-pink-500" />
                  Khôi Phục Ảnh Cũ
                </h2>

                <div className="bg-gradient-to-r from-amber-900/40 to-amber-900/10 p-3 rounded-lg border border-amber-800 mb-6 flex items-start">
                   <Zap className="w-4 h-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                   <div className="text-sm text-amber-200">
                     <b>Powered by Gemini 3 Pro</b><br/>
                     Sử dụng mô hình AI mới nhất để tái tạo chi tiết và màu sắc siêu thực.
                   </div>
                </div>

                {/* Restoration Sliders */}
                <div className="space-y-1 mb-6">
                   <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center">
                    <Eraser className="w-4 h-4 mr-1 text-gray-400" /> Xử lý vết xước & Nhiễu
                  </label>
                  <Slider 
                    label="Xóa Vết Xước (Scratch Removal)" 
                    value={restoreSettings.scratchReduction} 
                    onChange={(v) => setRestoreSettings(s => ({...s, scratchReduction: v}))} 
                  />
                  <Slider 
                    label="Khử Nhiễu (Denoise)" 
                    value={restoreSettings.denoiseLevel} 
                    onChange={(v) => setRestoreSettings(s => ({...s, denoiseLevel: v}))} 
                  />
                </div>

                <div className="h-px bg-gray-800 my-6" />

                {/* Toggles */}
                <div className="space-y-4">
                   <label className="block text-sm font-semibold text-gray-300">Tùy Chọn Phục Chế</label>
                  
                   <label className="flex items-start space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={restoreSettings.colorRestoration}
                      onChange={(e) => setRestoreSettings(s => ({...s, colorRestoration: e.target.checked}))}
                      className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Tái Tạo Màu Sắc (Colorize)</span>
                      <span className="text-xs text-gray-500">Tô màu ảnh đen trắng hoặc phục hồi màu phai</span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={restoreSettings.faceRestoration}
                      onChange={(e) => setRestoreSettings(s => ({...s, faceRestoration: e.target.checked}))}
                      className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-300">Khôi Phục Khuôn Mặt (Face Restore)</span>
                      <span className="text-xs text-gray-500">Giữ nguyên nét gốc, không làm biến dạng</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={restoreSettings.sharpenArtifacts}
                      onChange={(e) => setRestoreSettings(s => ({...s, sharpenArtifacts: e.target.checked}))}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                     <span className="text-sm font-medium text-gray-300">Làm Nét & Khử Mờ (Deblur)</span>
                  </label>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Right Column: Workspace */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Display Area */}
          <div 
            className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 min-h-[600px] flex flex-col overflow-hidden relative"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Workspace</span>
                {activeTab === AppTab.ID_PHOTO && imgState.originalUrl && (
                   <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-md font-bold border border-blue-800">ID MODE</span>
                )}
                {activeTab === AppTab.RESTORE && imgState.originalUrl && (
                   <span className="bg-amber-900/50 text-amber-300 text-xs px-2 py-1 rounded-md font-bold flex items-center border border-amber-800">
                     <History className="w-3 h-3 mr-1"/> RESTORE MODE
                   </span>
                )}
              </div>
              <div className="flex space-x-2">
                {imgState.originalUrl && (
                  <button 
                    onClick={resetImage}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex items-center text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
              {!imgState.originalUrl ? (
                /* Empty State / Upload */
                <div 
                  className="text-center p-12 border-2 border-dashed border-gray-700 rounded-3xl hover:border-purple-500 hover:bg-purple-900/10 transition-all cursor-pointer group max-w-lg w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 bg-gray-800 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-200 mb-2">Drop your photo here</h3>
                  <p className="text-gray-400 mb-6">or click to browse your files</p>
                  <p className="text-xs text-gray-500">Supports JPG, PNG, WEBP (Max 10MB)</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                /* Image View */
                <div className="w-full h-full flex flex-col md:flex-row gap-4 items-center justify-center relative">
                  
                  {/* Image Container */}
                  <div className="relative max-h-[500px] w-full flex justify-center">
                    <img 
                      src={imgState.processedUrl || imgState.originalUrl} 
                      alt="Workspace" 
                      className="max-h-[500px] max-w-full object-contain rounded-lg shadow-2xl"
                    />
                    
                    {/* Status Overlays */}
                    {imgState.isProcessing && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
                        <div className="w-12 h-12 border-4 border-gray-700 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-300 font-semibold animate-pulse">Processing with Gemini 3 Pro...</p>
                        <p className="text-gray-400 text-sm mt-1">
                           {getProcessingText()}
                        </p>
                      </div>
                    )}
                    
                    {imgState.processedUrl && !imgState.isProcessing && (
                      <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center border border-green-500">
                        <Sparkles className="w-3 h-3 mr-1" /> 
                        {activeTab === AppTab.ID_PHOTO ? 'ID CREATED' : activeTab === AppTab.RESTORE ? 'RESTORED' : 'ENHANCED'}
                      </div>
                    )}
                  </div>
                  
                  {/* Compare Hint - Only if we have processed image */}
                  {imgState.processedUrl && (
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md border border-gray-700">
                        <ArrowLeftRight className="inline w-4 h-4 mr-2"/>
                        Result View
                     </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Action Bar */}
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              {imgState.error && (
                <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-lg flex items-center text-sm border border-red-800">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {imgState.error}
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4 justify-end">
                 {imgState.processedUrl ? (
                   <>
                    <button 
                      onClick={() => setImgState(prev => ({...prev, processedUrl: null}))}
                      className="px-6 py-3 rounded-xl border border-gray-600 font-bold text-gray-300 hover:bg-gray-800 flex items-center justify-center"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Try Again
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="px-6 py-3 rounded-xl bg-green-700 text-white font-bold shadow-lg shadow-green-900/50 hover:bg-green-600 transition-all flex items-center justify-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Result
                    </button>
                   </>
                 ) : (
                   <button 
                    onClick={handleProcess}
                    disabled={!imgState.originalUrl || imgState.isProcessing}
                    className={`
                      w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center transition-all
                      ${!imgState.originalUrl || imgState.isProcessing
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#7c4dff] to-[#651fff] text-white hover:scale-105 hover:shadow-purple-900/50'
                      }
                    `}
                  >
                    {imgState.isProcessing ? (
                      'Processing...'
                    ) : (
                      <>
                        {activeTab === AppTab.ID_PHOTO ? <UserSquare2 className="w-5 h-5 mr-2"/> : 
                         activeTab === AppTab.RESTORE ? <History className="w-5 h-5 mr-2"/> :
                         <Sparkles className="w-5 h-5 mr-2" />}
                        
                        {activeTab === AppTab.ID_PHOTO ? 'Generate ID Photo' : 
                         activeTab === AppTab.RESTORE ? 'Restore (Gemini 3 Pro)' :
                         'Enhance Photo'}
                      </>
                    )}
                  </button>
                 )}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          {activeTab === AppTab.ENHANCE && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Smart Upscaling", desc: "Up to 800% zoom without quality loss" },
                { title: "Face Recovery", desc: "Restores blurry faces with AI precision" },
                { title: "Auto Color", desc: "Balances lighting and corrects tone" }
              ].map((tip, i) => (
                <div key={i} className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-800">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <h4 className="font-semibold text-gray-200 text-sm">{tip.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500 pl-4">{tip.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === AppTab.ID_PHOTO && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Auto Background", desc: "Removes clutter, adds solid color" },
                { title: "Pro Retouch", desc: "Removes acne & smooths skin" },
                { title: "Standard Sizes", desc: "Ready for ID cards & Passports" }
              ].map((tip, i) => (
                <div key={i} className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-800">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <h4 className="font-semibold text-gray-200 text-sm">{tip.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500 pl-4">{tip.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === AppTab.RESTORE && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Gemini 3 Pro", desc: "Using latest Vision model" },
                { title: "Smart Colorize", desc: "Brings B&W photos to life" },
                { title: "Authentic Restore", desc: "Keeps original facial features" }
              ].map((tip, i) => (
                <div key={i} className="bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-800">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <h4 className="font-semibold text-gray-200 text-sm">{tip.title}</h4>
                  </div>
                  <p className="text-xs text-gray-500 pl-4">{tip.desc}</p>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default App;