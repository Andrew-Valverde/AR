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

const DEFAULT_UPLOAD_INSIGHTS: ARInsight[] = [
  {
    id: "1",
    title: "Surface plane",
    detail: "Horizontal plane detected · confidence 0.94",
    tone: "info",
    style: { top: "12%", left: "8%", maxWidth: "min(220px, 42vw)" },
  },
  {
    id: "2",
    title: "Depth regions",
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

type DemoExample = {
  id: string;
  label: string;
  description: string;
  image: string;
  insights: ARInsight[];
};

type DemoExamplesFile = {
  examples: DemoExample[];
};

function isTone(v: unknown): v is ARInsight["tone"] {
  return v === "info" || v === "success" || v === "warning";
}

function parseDemoExamples(raw: unknown): DemoExample[] {
  if (!raw || typeof raw !== "object") return [];
  const ex = (raw as DemoExamplesFile).examples;
  if (!Array.isArray(ex)) return [];
  const out: DemoExample[] = [];
  for (const row of ex) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.label !== "string" || typeof r.image !== "string")
      continue;
    const description = typeof r.description === "string" ? r.description : "";
    const insightsIn = Array.isArray(r.insights) ? r.insights : [];
    const insights: ARInsight[] = [];
    for (const ins of insightsIn) {
      if (!ins || typeof ins !== "object") continue;
      const i = ins as Record<string, unknown>;
      if (
        typeof i.id !== "string" ||
        typeof i.title !== "string" ||
        typeof i.detail !== "string" ||
        !isTone(i.tone) ||
        !i.style ||
        typeof i.style !== "object"
      ) {
        continue;
      }
      insights.push({
        id: i.id,
        title: i.title,
        detail: i.detail,
        tone: i.tone,
        style: i.style as ARInsight["style"],
      });
    }
    if (!insights.length) continue;
    out.push({
      id: r.id,
      label: r.label,
      description,
      image: r.image,
      insights,
    });
  }
  return out;
}

type ARAnalysisViewProps = {
  username: string;
};

export function ARAnalysisView({ username }: ARAnalysisViewProps) {
  const showGuidedDemos = username.trim().toLowerCase() === "demo";

  const fileInputId = useId();
  const captureInputId = useId();
  const demosSectionId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [arActive, setArActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraVideoReady, setCameraVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  const [demoExamples, setDemoExamples] = useState<DemoExample[]>([]);
  const [demosLoadError, setDemosLoadError] = useState<string | null>(null);
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null);
  const [scanInsights, setScanInsights] = useState<ARInsight[]>(DEFAULT_UPLOAD_INSIGHTS);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const setImageFromHref = useCallback((href: string) => {
    setImageUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return href;
    });
  }, []);

  const revokeAndSetUrl = useCallback((file: File | null) => {
    setImageUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }, []);

  useEffect(() => {
    if (!showGuidedDemos) {
      setDemoExamples([]);
      setDemosLoadError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/demo-examples.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setDemoExamples(parseDemoExamples(json));
          setDemosLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setDemoExamples([]);
          setDemosLoadError("Could not load guided demos (demo-examples.json).");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showGuidedDemos]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      revokeAndSetUrl(f);
      setActiveExampleId(null);
      setScanInsights(DEFAULT_UPLOAD_INSIGHTS);
      setArActive(false);
    }
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

  useEffect(() => {
    imageUrlRef.current = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      const u = imageUrlRef.current;
      if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
    };
  }, []);

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
        setActiveExampleId(null);
        setScanInsights(DEFAULT_UPLOAD_INSIGHTS);
        setArActive(false);
        closeCameraModal();
      },
      "image/jpeg",
      0.92,
    );
  };

  const selectDemo = (ex: DemoExample) => {
    setImageFromHref(ex.image);
    setActiveExampleId(ex.id);
    setScanInsights(ex.insights);
    setArActive(false);
  };

  const startAR = async () => {
    if (!imageUrl || analyzing) return;
    
    // If it's a pre-analyzed demo, we don't necessarily need to re-upload.
    // But since you asked to connect it, we can just display the active demo's insights
    // or upload it. The original code set active example insights immediately on selectDemo.
    if (activeExampleId) {
      setArActive(true);
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);
    setArActive(false);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append("image", blob, "image.jpg");

      const uploadRes = await fetch("/api/analyzer/scan", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Analysis failed on the server.");
      }

      const data = await uploadRes.json();
      
      if (data && Array.isArray(data.insights)) {
        setScanInsights(data.insights);
      }
      setArActive(true);
    } catch (err) {
      console.error("AR Analysis error:", err);
      setAnalysisError("Could not analyze the image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
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

      {showGuidedDemos && (
        <div className="ar-demos" role="region" aria-labelledby={demosSectionId}>
          <div className="ar-demos-header">
            <p id={demosSectionId} className="ar-demos-title">
              Guided demos
            </p>
            <p className="ar-demos-caption">
              Pre-selected scenes from <code className="ar-demos-code">demo-examples.json</code>{" "}
              — load an image, then run <strong>Start AR check</strong> to see matched overlays.
            </p>
          </div>
          {demosLoadError && <p className="ar-demos-error">{demosLoadError}</p>}
          <div className="ar-demos-row">
            {demoExamples.map((ex) => (
              <button
                key={ex.id}
                type="button"
                className={`ar-demo-card ${activeExampleId === ex.id ? "ar-demo-card--active" : ""}`}
                onClick={() => selectDemo(ex)}
              >
                <span className="ar-demo-thumb-wrap">
                  <img src={ex.image} alt="" className="ar-demo-thumb" />
                </span>
                <span className="ar-demo-label">{ex.label}</span>
                {ex.description ? (
                  <span className="ar-demo-desc">{ex.description}</span>
                ) : null}
              </button>
            ))}
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
              {showGuidedDemos ? (
                <>
                  Pick a guided demo above, add a photo from your library, or capture one with the
                  camera.
                </>
              ) : (
                <>
                  Add a photo from your library or capture one with the camera. The whole area below
                  the ribbon is your workspace.
                </>
              )}
            </p>
          </div>
        )}

        {arActive && imageUrl && (
          <>
            <div className="ar-scanline" aria-hidden />
            <ARInsightModals insights={scanInsights} onDismiss={dismissAR} />
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

        {analysisError && (
          <p className="ar-demos-error" style={{ textAlign: "center", marginBottom: "1rem" }}>
            {analysisError}
          </p>
        )}

        <button
          type="button"
          className="ar-btn ar-btn--primary"
          disabled={!imageUrl || analyzing}
          onClick={startAR}
        >
          {analyzing ? "Analyzing..." : "Start AR check"}
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
