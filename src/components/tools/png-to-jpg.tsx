"use client";

import { ImageFormatConverter } from "@/components/image-format-converter";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PngToJpgTool(props: ToolUIProps) {
  return (
    <ImageFormatConverter
      {...props}
      accept=".png,image/png"
      targetMime="image/jpeg"
      targetExt="jpg"
      actionLabel="Convert to JPG"
      hint="PNG images"
    />
  );
}
