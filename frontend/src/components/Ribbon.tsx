import "./Ribbon.css";

export type AppMode = "ar" | "chat";

type RibbonProps = {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  userDisplayName?: string;
  onSignOut?: () => void;
};

export function Ribbon({ mode, onModeChange, userDisplayName, onSignOut }: RibbonProps) {
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
        <div className="ribbon-user">
          {userDisplayName && onSignOut ? (
            <>
              <span className="ribbon-user-name" title={userDisplayName}>
                {userDisplayName}
              </span>
              <button type="button" className="ribbon-sign-out" onClick={onSignOut}>
                Sign out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
