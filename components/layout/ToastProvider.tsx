"use client";

import { Toaster } from "react-hot-toast";

/**
 * 잉크/종이 톤 Toast. 광고·게이미피케이션 회피 헌법에 따라
 * 알림은 *최소화*. 주로 신고 결과·의견 답변 같은 사용자 직접 트리거 결과만 띄움.
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 3200,
        style: {
          background: "rgba(43, 38, 32, 0.94)",
          color: "var(--paper-cream)",
          fontFamily: "var(--sans)",
          fontSize: "var(--fs-small)",
          letterSpacing: "-0.005em",
          padding: "11px 20px",
          borderRadius: "2px",
          maxWidth: "420px",
          lineHeight: 1.5,
          textAlign: "center",
          boxShadow: "0 2px 14px rgba(0,0,0,0.14)",
        },
        success: { iconTheme: { primary: "var(--paper-cream)", secondary: "var(--bg-dark)" } },
        error: { iconTheme: { primary: "var(--accent-warn)", secondary: "var(--paper-cream)" } },
      }}
    />
  );
}
