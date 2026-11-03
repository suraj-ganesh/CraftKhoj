"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

export default function ShaderGradientPanel() {
  return (
    <div className="shader-panel" aria-hidden>
      <ShaderGradientCanvas>
        <ShaderGradient
          control="props"
          color1="#C5FFFD"
          color2="#374B4A"
        />
      </ShaderGradientCanvas>
    </div>
  );
}
