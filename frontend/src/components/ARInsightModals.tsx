import type { CSSProperties } from "react";
import "./ARInsightModals.css";

export type ARInsight = {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning";
  style: CSSProperties;
};

type Props = {
  insights: ARInsight[];
  onDismiss: () => void;
};

export function ARInsightModals({ insights, onDismiss }: Props) {
  return (
    <div className="ar-modals-layer" role="dialog" aria-modal="false" aria-label="AR observations">
      {insights.map((insight) => (
        <article
          key={insight.id}
          className={`ar-modal ar-modal--${insight.tone}`}
          style={insight.style}
        >
          <h3 className="ar-modal-title">{insight.title}</h3>
          <p className="ar-modal-detail">{insight.detail}</p>
        </article>
      ))}
      <button type="button" className="ar-modals-dismiss" onClick={onDismiss}>
        Dismiss all
      </button>
    </div>
  );
}
