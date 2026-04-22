import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import { predictImage, PredictionResponse } from "../services/api";
import {
  UploadCloud,
  FileImage,
  Loader2,
  AlertCircle,
  X,
  Scan,
} from "lucide-react";

interface ImageUploaderProps {
  onPrediction: (result: PredictionResponse) => void;
}

export default function ImageUploader({ onPrediction }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (selectedFile: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Unsupported format. Please upload a JPEG or PNG image.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreview(null);
    setFile(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const prediction = await predictImage(file);
      onPrediction(prediction);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during prediction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surface-container rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out relative">
      <div className="absolute -bottom-10 -left-10 w-48 h-48 serenity-blur opacity-20 pointer-events-none" />
      
      {/* Header */}
      <div className="px-8 py-6 bg-surface-container-high/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <FileImage size={24} />
          </div>
          <div>
            <h2 className="text-xl font-headline font-black text-on-surface tracking-tight">
              Diagnostic Upload
            </h2>
            <p className="text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-widest mt-0.5">
              Submit Knee X-Ray for AI Analysis
            </p>
          </div>
        </div>
        <div className="hidden sm:block">
            <div className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold text-on-surface-variant border border-on-surface-variant/10">
                DICOM / JPEG / PNG
            </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 relative z-10">
        {!preview ? (
          <div
            className={`rounded-3xl p-16 text-center cursor-pointer transition-all duration-500 flex flex-col items-center gap-6 relative overflow-hidden group ${
              isDragging
                ? "bg-primary/10 scale-[1.02]"
                : "bg-surface-container-low hover:bg-surface-container-high"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={triggerSelect}
          >
            {/* Ghost Border Effect */}
            <div className="absolute inset-4 border-2 border-dashed border-on-surface-variant/20 rounded-2xl pointer-events-none group-hover:border-primary/40 transition-colors" />
            
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png"
            />
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 relative ${
                isDragging
                  ? "bg-primary text-on-primary shadow-xl shadow-primary/20 scale-110"
                  : "bg-surface-container-highest text-primary group-hover:scale-110"
              }`}
            >
              <UploadCloud size={36} />
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100" />
            </div>
            <div className="relative z-10">
              <p className="text-xl font-headline font-extrabold text-on-surface">
                Drop X-ray scan here
              </p>
              <p className="text-sm font-medium text-on-surface-variant mt-2">
                Secure clinical upload portal
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            {/* Image Preview */}
            <div className="relative rounded-3xl overflow-hidden bg-black flex justify-center h-[500px] shadow-2xl group">
              <img
                src={preview}
                alt="Knee X-ray preview"
                className="max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <button
                onClick={clearImage}
                className="absolute top-6 right-6 bg-white/10 backdrop-blur-xl text-white hover:bg-red-500 p-3 rounded-full shadow-2xl transition-all z-10 hover:scale-110"
                title="Remove image"
              >
                <X size={20} />
              </button>
              
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                 <div className="bg-white/10 backdrop-blur-xl text-white text-[11px] px-4 py-2 rounded-xl font-bold border border-white/5 uppercase tracking-wider">
                    {file?.name}
                 </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-4 p-5 bg-error/10 rounded-2xl animate-in shake-in-1 duration-300">
                <AlertCircle className="text-error shrink-0 mt-0.5" size={20} />
                <p className="text-sm font-bold text-error">{error}</p>
              </div>
            )}

            {/* Run Prediction Button */}
            <button
              onClick={handlePredict}
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-headline font-black text-lg flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl relative overflow-hidden ${
                loading
                  ? "bg-surface-container-highest cursor-not-allowed text-on-surface-variant"
                  : "cta-gradient text-on-primary hover:scale-[1.01] hover:shadow-primary/20 active:scale-100"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span className="tracking-tight italic opacity-70">Synthesizing clinical data...</span>
                </>
              ) : (
                <>
                  <Scan size={24} />
                  <span className="uppercase tracking-[0.1em]">Analyze Diagnostic Data</span>
                </>
              )}
              {!loading && <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
