import "./Ribbon.css";

export type AppMode = "ar" | "chat";

type RibbonProps = {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
};

export function Ribbon({ mode, onModeChange }: RibbonProps) {
  return (
    <header className="ribbon" role="tablist" aria-label="Main navigation">
      <div className="ribbon-inner">
        <span className="ribbon-brand">AR Lookup</span>
        <div className="ribbon-tabs">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "ar"}
            className={`ribbon-tab ${mode === "ar" ? "ribbon-tab--active" : ""}`}
            onClick={() => onModeChange("ar")}
          >
            Image AR analysis
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "chat"}
            className={`ribbon-tab ${mode === "chat" ? "ribbon-tab--active" : ""}`}
            onClick={() => onModeChange("chat")}
          >
            AI chat
          </button>
        </div>
      </div>
    </header>
  );
}
