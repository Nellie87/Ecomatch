import React, { useEffect, useState } from "react";

export default function Splash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4 h-16 w-16 animate-pulse rounded-2xl mx-auto" style={{ background: "var(--color-primary,#2563EB)"}} />
        <h1 className="text-2xl font-semibold" style={{ color: "var(--color-primary,#2563EB)"}}>ECO Match</h1>
        <p className="text-gray-500">Human-in-the-Loop Entity Matching</p>
      </div>
    </div>
  );
}

