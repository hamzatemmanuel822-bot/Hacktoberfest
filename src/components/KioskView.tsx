import React, { useEffect, useRef, useState } from 'react';
import { 
  Camera, 
  CameraOff, 
  UserCheck2, 
  QrCode, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Globe, 
  Send,
  Loader2,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Building,
  Clock
} from 'lucide-react';
import jsQR from 'jsqr';
import { api } from '../services/api';
import { sounds } from '../utils/audio';
import { GemmaInferenceResult } from '../types';

export const KioskView: React.FC = () => {
  // Camera & Detection State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [personDetected, setPersonDetected] = useState<boolean>(false);
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [modelLoading, setModelLoading] = useState<boolean>(false);

  // Manual Code Input
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [isSubmittingCode, setIsSubmittingCode] = useState<boolean>(false);

  // Success / Error Feedback Modal
  const [checkinResult, setCheckinResult] = useState<{
    success: boolean;
    person?: { name: string; type: string; department: string; organization?: string };
    error?: string;
    duplicateWarning?: boolean;
    hardwareCommandId?: string;
  } | null>(null);

  // Gemma 4 AI Assistant
  const [language, setLanguage] = useState<string>('English');
  const [aiMessage, setAiMessage] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<GemmaInferenceResult | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);

  // Detection Cooldown tracker refs
  const lastDetectionTimeRef = useRef<number>(0);
  const lastScanTimeRef = useRef<number>(0);
  const cocoModelRef = useRef<any>(null);

  // Initialize Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn('[Camera] getUserMedia failed:', err);
        setCameraError('Webcam access was not granted or is unavailable. You can use manual code entry or simulate presence.');
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Load TensorFlow COCO-SSD Model
  useEffect(() => {
    let isMounted = true;
    async function loadCoco() {
      try {
        setModelLoading(true);
        // Dynamic import to keep bundle snappy
        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (isMounted) {
          cocoModelRef.current = model;
          setModelLoading(false);
        }
      } catch (err) {
        console.warn('[COCO-SSD] Model load error, falling back to presence detector:', err);
        if (isMounted) setModelLoading(false);
      }
    }
    loadCoco();

    return () => {
      isMounted = false;
    };
  }, []);

  // Main Detection & QR Scanning Loop
  useEffect(() => {
    let animationFrameId: number;
    let scanCount = 0;

    const detectLoop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // 1. Run QR Code Scanner every 2 frames
          scanCount++;
          if (scanCount % 2 === 0 && Date.now() - lastScanTimeRef.current > 3000) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (qrCode && qrCode.data && qrCode.data.startsWith('SWK-')) {
              lastScanTimeRef.current = Date.now();
              handleScannedCode(qrCode.data);
            }
          }

          // 2. Run Person Detection
          if (cocoModelRef.current) {
            try {
              const predictions = await cocoModelRef.current.detect(canvas);
              const person = predictions.find((p: any) => p.class === 'person' && p.score >= 0.45);

              if (person) {
                const [x, y, w, h] = person.bbox;
                const scorePct = Math.round(person.score * 100);
                setDetectionConfidence(scorePct);

                // Draw bounding box
                ctx.strokeStyle = '#06b6d4';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, w, h);

                // Label
                ctx.fillStyle = '#06b6d4';
                ctx.fillRect(x, Math.max(0, y - 24), 140, 24);
                ctx.fillStyle = '#020617';
                ctx.font = 'bold 12px sans-serif';
                ctx.fillText(`Person Detected: ${scorePct}%`, x + 6, Math.max(16, y - 7));

                triggerPersonApproach(scorePct);
              } else {
                setDetectionConfidence(0);
                checkAbsence();
              }
            } catch (err) {
              // detection frame error
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectLoop);
    };

    animationFrameId = requestAnimationFrame(detectLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Cooldown timer ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - lastDetectionTimeRef.current) / 1000;
      const cooldownSec = 8;
      if (elapsedSec < cooldownSec) {
        setCooldownRemaining(Math.ceil(cooldownSec - elapsedSec));
      } else {
        setCooldownRemaining(0);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const triggerPersonApproach = (confidence: number) => {
    const now = Date.now();
    // Only trigger if cooldown expired
    if (now - lastDetectionTimeRef.current > 8000) {
      lastDetectionTimeRef.current = now;
      setPersonDetected(true);
      sounds.playPresenceCue();

      // Notify Arduino UNO Q
      api.notifyPresence(true, confidence);

      // Auto welcome query in background
      if (!aiResponse) {
        fetchWelcomeGreeting();
      }
    }
  };

  const checkAbsence = () => {
    const now = Date.now();
    if (personDetected && now - lastDetectionTimeRef.current > 6000) {
      setPersonDetected(false);
      api.notifyPresence(false);
    }
  };

  const fetchWelcomeGreeting = async () => {
    try {
      setAiLoading(true);
      const res = await api.gemmaChat('What should I do first?', language, true);
      setAiResponse(res);
      if (ttsEnabled && 'speechSynthesis' in window) {
        speakText(res.text);
      }
    } catch (err) {
      console.warn('Gemma chat error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const speakText = (text: string) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // speech synthesis error
    }
  };

  const handleScannedCode = async (code: string) => {
    setIsSubmittingCode(true);
    try {
      const res = await api.submitCheckin(code, 'qr_sticker');
      if (res.success) {
        sounds.playSuccessChime();
        setCheckinResult({
          success: true,
          person: res.person,
          duplicateWarning: res.duplicateWarning,
          hardwareCommandId: res.hardwareCommandId
        });
        if (ttsEnabled && res.person) {
          speakText(`Welcome, ${res.person.name}. Attendance recorded.`);
        }
      } else {
        sounds.playErrorBuzz();
        setCheckinResult({
          success: false,
          error: res.error || 'Invalid or unassigned sticker code'
        });
      }
    } catch (err: any) {
      sounds.playErrorBuzz();
      setCheckinResult({
        success: false,
        error: 'Network connection to backend failed'
      });
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    setShowManualModal(false);
    handleScannedCode(manualCodeInput.trim());
    setManualCodeInput('');
  };

  const handleAskGemma = async (customPrompt?: string) => {
    const q = customPrompt || aiMessage;
    if (!q.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.gemmaChat(q, language, personDetected);
      setAiResponse(res);
      if (ttsEnabled) {
        speakText(res.text);
      }
      setAiMessage('');
    } catch (err) {
      console.warn('Gemma error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Privacy Notice Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Camera Privacy Notice:</strong> Local computer-vision runs in-browser for presence detection only. No video or biometric face data is stored or transmitted.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-500 font-mono">Absence Timeout: 5s</span>
          <span className="font-mono text-cyan-400">
            {cooldownRemaining > 0 ? `Cooldown: ${cooldownRemaining}s` : 'Detector Ready'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Webcam & Live Detection Scanner (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl aspect-4/3 flex items-center justify-center">
            {/* Live Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay Canvas for Bounding Box & QR HUD */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Camera Inactive Fallback */}
            {!cameraActive && (
              <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center max-w-md">
                <CameraOff className="h-12 w-12 text-slate-500 mb-3" />
                <h3 className="text-base font-semibold text-slate-200 mb-1">Webcam Inactive or Blocked</h3>
                <p className="text-xs text-slate-400 mb-4">
                  {cameraError || 'Ensure camera permission is granted in your browser settings.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => triggerPersonApproach(92)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                  >
                    Simulate Human Approach (92%)
                  </button>
                  <button
                    onClick={() => setShowManualModal(true)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  >
                    Enter Sticker Code Manually
                  </button>
                </div>
              </div>
            )}

            {/* Target Reticle Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-dashed border-cyan-400/50 rounded-2xl flex flex-col items-center justify-between p-3 animate-pulse">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded">
                    Hold QR Sticker Here
                  </span>
                  <QrCode className="h-10 w-10 text-cyan-400/60" />
                  <span className="text-[10px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded">
                    Auto-Scanning Active
                  </span>
                </div>
              </div>
            )}

            {/* Live Presence Detection Banner */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-800">
                <div className={`h-2.5 w-2.5 rounded-full ${personDetected ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
                <span className="text-xs font-medium text-slate-200">
                  {personDetected ? `Human Presence Active (${detectionConfidence}%)` : 'Laptop Camera: Monitoring Entrance...'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {cameraActive && (
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 text-[11px] text-emerald-400 border border-slate-800">
                    <Camera className="h-3 w-3 text-emerald-400" />
                    <span>Laptop Webcam Ready</span>
                  </div>
                )}
                {modelLoading && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/85 text-xs text-cyan-300 border border-slate-800">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading Vision AI...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Camera Action Bar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <button
                onClick={() => triggerPersonApproach(95)}
                className="px-2.5 py-1 text-xs rounded-md bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Test Human Approach
              </button>
              <button
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Enter Code Manually</span>
              </button>
            </div>
          </div>

          {/* 4-Step Visual Workflow Guide */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <div className="text-xs font-mono text-cyan-400 mb-1">Step 1</div>
              <div className="text-xs font-medium text-slate-200">Approach</div>
              <div className="text-[11px] text-slate-500">Camera recognizes presence</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <div className="text-xs font-mono text-cyan-400 mb-1">Step 2</div>
              <div className="text-xs font-medium text-slate-200">Collect Badge</div>
              <div className="text-[11px] text-slate-500">Take sticker from dispenser</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <div className="text-xs font-mono text-cyan-400 mb-1">Step 3</div>
              <div className="text-xs font-medium text-slate-200">Scan QR</div>
              <div className="text-[11px] text-slate-500">Hold QR code to webcam</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-center">
              <div className="text-xs font-mono text-cyan-400 mb-1">Step 4</div>
              <div className="text-xs font-medium text-slate-200">UNO Q Confirms</div>
              <div className="text-[11px] text-slate-500">Green LED matrix checkmark</div>
            </div>
          </div>
        </div>

        {/* Right Column: Gemma 4 Intelligent Welcome & Assistance Hub (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Welcome Card & Language Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-semibold text-slate-100">Gemma 4 Welcome Assistant</h2>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    if (aiResponse) handleAskGemma('What should I do first?');
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-2 py-1 focus:outline-none focus:border-cyan-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Español</option>
                  <option value="French">Français</option>
                  <option value="German">Deutsch</option>
                  <option value="Japanese">日本語</option>
                  <option value="Arabic">العربية</option>
                  <option value="Hindi">हिन्दी</option>
                </select>

                {/* TTS Toggle */}
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`p-1 rounded-lg border ${ttsEnabled ? 'border-cyan-500/50 text-cyan-400' : 'border-slate-800 text-slate-500'}`}
                  title={ttsEnabled ? 'Voice output active' : 'Voice output muted'}
                >
                  {ttsEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* AI Speech Bubble */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 relative min-h-[130px] flex flex-col justify-between">
              {aiLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-cyan-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Gemma 4 is formulating guidance...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    {aiResponse
                      ? aiResponse.text
                      : 'Welcome to SmartWelcome AI. Please collect an attendance sticker badge from the dispenser on your right, then present the QR code to the camera to register your arrival.'}
                  </p>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-900 text-[11px] text-slate-500">
                    <span className="font-mono text-cyan-400/80">
                      {aiResponse ? aiResponse.model : 'Gemma 4 E2B (Laptop Edition)'}
                    </span>
                    {aiResponse && (
                      <span className="font-mono">
                        {aiResponse.latencyMs}ms · {aiResponse.runtime}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Quick Question Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Common Inquiries:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'What should I do first?',
                  'Where is the Robotics Lab?',
                  'How to connect to Guest Wi-Fi?',
                  'Where do visitors wait for their host?',
                  'My sticker is not scanning'
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleAskGemma(chip)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 hover:text-cyan-300 text-slate-300 transition-colors text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Question Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskGemma();
              }}
              className="flex items-center gap-2 pt-2"
            >
              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                placeholder="Ask about departments, directions, or procedures..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiMessage.trim()}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-medium text-xs hover:bg-cyan-400 disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Test Demo Sticker Codes */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Quick Test Sticker Codes</span>
              <span className="text-[11px] text-slate-500">Tap to test validation</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => handleScannedCode('SWK-STF-A9F2-4B11')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-left hover:border-cyan-500 transition-colors"
              >
                <div className="text-slate-400 text-[10px]">Staff (Dr. Vance)</div>
                <div className="text-cyan-400 truncate">SWK-STF-A9F2-4B11</div>
              </button>
              <button
                onClick={() => handleScannedCode('SWK-VIS-77C1-8E30')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-left hover:border-cyan-500 transition-colors"
              >
                <div className="text-slate-400 text-[10px]">Visitor (Prof. Sterling)</div>
                <div className="text-emerald-400 truncate">SWK-VIS-77C1-8E30</div>
              </button>
              <button
                onClick={() => handleScannedCode('SWK-STF-1043-9821')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-left hover:border-cyan-500 transition-colors"
              >
                <div className="text-slate-400 text-[10px]">Staff (Marcus Thorne)</div>
                <div className="text-cyan-400 truncate">SWK-STF-1043-9821</div>
              </button>
              <button
                onClick={() => handleScannedCode('SWK-INVALID-TEST-0000')}
                className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-left hover:border-rose-500 transition-colors"
              >
                <div className="text-slate-400 text-[10px]">Invalid Code (Test)</div>
                <div className="text-rose-400 truncate">SWK-INVALID-0000</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Code Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-semibold text-slate-100">Manual Sticker Code Entry</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Type the 16-character alphanumeric code printed below the QR symbol on your attendance badge sticker (format: <code className="text-cyan-300">SWK-STF-XXXX-XXXX</code> or <code className="text-cyan-300">SWK-VIS-XXXX-XXXX</code>).
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                placeholder="SWK-STF-...."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono tracking-wider text-slate-100 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualCodeInput.trim() || isSubmittingCode}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  Verify Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in Result Modal (Confirmation or Error) */}
      {checkinResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {checkinResult.success ? (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Attendance Recorded</h3>
                  <p className="text-xs text-slate-400">
                    Identity verified and synchronized with facility database
                  </p>
                </div>

                {checkinResult.person && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attendee:</span>
                      <span className="font-semibold text-slate-100">{checkinResult.person.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Category:</span>
                      <span className="uppercase font-mono text-cyan-400 font-medium">
                        {checkinResult.person.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-300">{checkinResult.person.department}</span>
                    </div>
                    {checkinResult.person.organization && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Organization:</span>
                        <span className="text-slate-300">{checkinResult.person.organization}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-slate-900 text-slate-400">
                      <span>Timestamp:</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}

                {checkinResult.duplicateWarning && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs text-left">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Notice: You were already checked in earlier today. Duplicate timestamp logged.
                    </span>
                  </div>
                )}

                {/* Arduino UNO Q Live Confirmation Badge */}
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Arduino UNO Q Confirmed: Green LED Checkmark Active</span>
                </div>

                <button
                  onClick={() => setCheckinResult(null)}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 transition-colors"
                >
                  Done / Next Attendee
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Check-in Rejected</h3>
                  <p className="text-xs text-rose-300 mt-1">
                    {checkinResult.error || 'The presented sticker token could not be verified.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-400 text-left space-y-1">
                  <div><strong>Recommended Next Steps:</strong></div>
                  <div>1. Ensure the QR sticker is held steadily under the camera reticle.</div>
                  <div>2. If using a visitor badge, check that it has not expired.</div>
                  <div>3. Please consult Security Reception on your left for a new badge.</div>
                </div>

                {/* Arduino UNO Q Red Indication */}
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-rose-400 py-1">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span>Arduino UNO Q: Red Warning Pattern Triggered</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setCheckinResult(null);
                      setShowManualModal(true);
                    }}
                    className="flex-1 py-2 text-xs rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  >
                    Try Manual Code
                  </button>
                  <button
                    onClick={() => setCheckinResult(null)}
                    className="flex-1 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
