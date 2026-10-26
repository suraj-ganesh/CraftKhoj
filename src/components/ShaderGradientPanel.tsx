"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

export default function ShaderGradientPanel() {
  return (
    <div className="shader-panel" aria-hidden>
      <ShaderGradientCanvas>
        <ShaderGradient
          control="query"
          urlString="https://www.shadergradient.co/custom?animate=on&bgType=1&brightness=1.1&cTone=x&color1=%2388D9E6&color2=%23F5B301&color3=%23374B4A&duration=18&deformation=4&deformationSpeed=7&exportType=&isAbsolute=0&lod=0&noiseStrength=0&position=x&positionX=-1.4&positionY=0&positionZ=1.2&range=enabled&rangeX=-199&rangeY=-999&rangeZ=999&rotation=45&rotationX=0&rotationY=0&rotationZ=50&shader=gradType&type=1&water=1&waterX=0&waterSpeed=14&waterY=0.9&zoomOut=false&zPosition=1.5"
        />
      </ShaderGradientCanvas>
    </div>
  );
}
