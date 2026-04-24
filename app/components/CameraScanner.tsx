'use client'

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, X } from 'lucide-react';

interface CameraScannerProps {
  onScanned: (barcode: string) => void;
  onClose: () => void;
}

export function CameraScanner({ onScanned, onClose }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const readerRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);

  // Load cameras on mount
  useEffect(() => {
    async function loadCameras() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        setCameras(devices);
        // Prefer back camera on mobile
        const back = devices.find(d => /back|rear|environment/i.test(d.label));
        setSelectedCamera(back?.deviceId ?? devices[0]?.deviceId ?? '');
      } catch (e: any) {
        setError('Could not access camera list. Please allow camera permission.');
      }
    }
    loadCameras();
  }, []);

  // Start scanning when camera is selected
  useEffect(() => {
    if (!selectedCamera || !videoRef.current) return;

    let cancelled = false;

    async function startScan() {
      setError(null);
      setScanning(false);

      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const { DecodeHintType } = await import('@zxing/library');

        const hints = new Map();
        // Prioritise CODE128 but also try other 1D formats for flexibility
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints);
        readerRef.current = reader;

        if (cancelled) return;

        const controls = await reader.decodeFromVideoDevice(
          selectedCamera,
          videoRef.current!,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText();
              setLastResult(text);
              setScanning(false);
              onScanned(text);
            }
          }
        );

        controlsRef.current = controls;
        setScanning(true);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.message?.includes('Permission')
              ? 'Camera permission denied. Please allow camera access in your browser settings.'
              : `Camera error: ${e?.message ?? 'Unknown error'}`
          );
        }
      }
    }

    startScan();

    return () => {
      cancelled = true;
      controlsRef.current?.stop?.();
      controlsRef.current = null;
    };
  }, [selectedCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCameraChange = (deviceId: string) => {
    controlsRef.current?.stop?.();
    controlsRef.current = null;
    setSelectedCamera(deviceId);
    setLastResult(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Camera selector */}
      {cameras.length > 1 && (
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={selectedCamera}
            onChange={(e) => handleCameraChange(e.target.value)}
            className="flex-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cam.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video feed */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />

        {/* Scanning overlay */}
        {scanning && !error && (
          <>
            {/* Corner brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-28">
                {/* Animated scan line */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-[#2563EB] opacity-80 animate-[scanline_2s_ease-in-out_infinite]" />
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white" />
              </div>
            </div>
            {/* Status pill */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Scanning…
            </div>
          </>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-4 text-center">
            <CameraOff className="w-10 h-10 text-red-400 mb-2" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* No camera selected */}
        {cameras.length === 0 && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-4 text-center">
            <Camera className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-400">Looking for cameras…</p>
          </div>
        )}
      </div>

      {/* Last scanned result */}
      {lastResult && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-sm text-green-800 dark:text-green-300 font-mono truncate">{lastResult}</span>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Point your camera at a CODE128 barcode — it will be detected automatically.
      </p>
    </div>
  );
}
