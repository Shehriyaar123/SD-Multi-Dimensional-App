import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, RefreshCw, Circle } from 'lucide-react';

interface CameraModalProps {
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Camera error:", err);
        setError("Could not access camera. Please ensure permissions are granted.");
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
          onClose();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-white/60 hover:text-white p-2 -ml-2">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-white font-bold flex items-center gap-2">
            <Camera className="w-5 h-5" /> Camera
          </h3>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-black">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4">{error}</p>
            <button onClick={onClose} className="px-6 py-2 bg-primary rounded-full font-bold">Close</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover md:object-contain"
          />
        )}
      </div>

      {!error && (
        <div className="p-8 bg-black/50 backdrop-blur-md absolute bottom-0 left-0 right-0 flex items-center justify-center gap-8">
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <div className="w-16 h-16 rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>,
    document.body
  );
};
