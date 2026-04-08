import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ARInsightModals, type ARInsight } from "./ARInsightModals";
import "./ARAnalysisView.css";

const MOCK_INSIGHTS: ARInsight[] = [
  {
    id: "1",
    title: "Surface plane",
    detail: "Horizontal plane detected · confidence 0.94",
    tone: "info",
    style: { top: "12%", left: "8%", maxWidth: "min(220px, 42vw)" },
  },
  {
    id: "2",
    title: "uigvfiugf iuyfbiuy",
    detail: "3 distinct regions · nearest ~1.2 m",
    tone: "success",
    style: { top: "38%", right: "6%", maxWidth: "min(200px, 40vw)" },
  },
  {
    id: "3",
    title: "Lighting",
    detail: "Mixed indoor light · mild glare upper-right",
    tone: "warning",
    style: { bottom: "28%", left: "10%", maxWidth: "min(240px, 55vw)" },
  },
  {
    id: "4",
    title: "Tracking",
    detail: "World tracking stable · 6 feature points",
    tone: "info",
    style: { bottom: "14%", right: "10%", maxWidth: "min(210px, 48vw)" },
  },
];

export function ARAnalysisView() {
  const fileInputId = useId();
  const captureInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [arActive, setArActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraVideoReady, setCameraVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const revokeAndSetUrl = useCallback((file: File | null) => {
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }, []);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) revokeAndSetUrl(f);
    e.target.value = "";
  };

  const stopCameraStream = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const closeCameraModal = useCallback(() => {
    setCameraStream((prev) => {
      stopCameraStream(prev);
      return null;
    });
    setCameraVideoReady(false);
  }, [stopCameraStream]);

  useEffect(() => {
    const video = videoRef.current;
    if (!cameraStream || !video) return;
    video.srcObject = cameraStream;
    void video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [cameraStream]);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      stopCameraStream(cameraStreamRef.current);
    };
  }, [stopCameraStream]);

  const openCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      captureRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setCameraVideoReady(false);
      setCameraStream(stream);
    } catch {
      captureRef.current?.click();
    }
  };

  const capturePhotoFromStream = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        revokeAndSetUrl(file);
        closeCameraModal();
      },
      "image/jpeg",
      0.92,
    );
  };

  const startAR = () => {
    if (!imageUrl) return;
    setArActive(true);
  };

  const dismissAR = () => setArActive(false);

  return (
    <div className="ar-view">
      {cameraStream && (
        <div
          className="ar-camera-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Camera capture"
        >
          <div className="ar-camera-dialog">
            <div className="ar-camera-video-wrap">
              <video
                ref={videoRef}
                className="ar-camera-video"
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setCameraVideoReady(true)}
              />
            </div>
            <p className="ar-camera-hint">
              Position the scene, then capture. If the live preview does not appear, check camera
              permissions for this site.
            </p>
            <div className="ar-camera-actions">
              <button
                type="button"
                className="ar-btn ar-btn--ghost"
                onClick={closeCameraModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ar-btn ar-btn--primary"
                disabled={!cameraVideoReady}
                onClick={capturePhotoFromStream}
              >
                Capture photo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ar-canvas">
        {imageUrl ? (
          <img src={imageUrl} alt="Scene for AR analysis" className="ar-image" />
        ) : (
          <div className="ar-placeholder">
            <p className="ar-placeholder-title">No image yet</p>
            <p className="ar-placeholder-hint">
              Add a photo from your library or capture one with the camera. The whole area below the
              ribbon is your workspace.
            </p>
          </div>
        )}

        {arActive && imageUrl && (
          <>
            <div className="ar-scanline" aria-hidden />
            <ARInsightModals insights={MOCK_INSIGHTS} onDismiss={dismissAR} />
          </>
        )}
      </div>

      <div className="ar-toolbar">
        <input
          ref={fileRef}
          id={fileInputId}
          type="file"
          accept="image/*"
          className="ar-input-hidden"
          onChange={onFileChange}
        />
        <input
          ref={captureRef}
          id={captureInputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="ar-input-hidden"
          onChange={onFileChange}
        />

        <button
          type="button"
          className="ar-btn ar-btn--secondary"
          onClick={() => fileRef.current?.click()}
        >
          Choose image
        </button>
        <button type="button" className="ar-btn ar-btn--secondary" onClick={openCamera}>
          Use camera
        </button>

        <button
          type="button"
          className="ar-btn ar-btn--primary"
          disabled={!imageUrl}
          onClick={startAR}
        >
          Start AR check
        </button>

        {arActive && (
          <button type="button" className="ar-btn ar-btn--ghost" onClick={dismissAR}>
            Clear overlays
          </button>
        )}
      </div>
    </div>
  );
}
