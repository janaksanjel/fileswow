"use client";

import { ImageFormatConverter } from "@/components/image-format-converter";
import type { ToolUIProps } from "@/components/tool-registry";

export default function WebpToJpgTool(props: ToolUIProps) {
  return (
    <ImageFormatConverter
      {...props}
      accept=".webp,image/webp"
      targetMime="image/jpeg"
      targetExt="jpg"
      actionLabel="Convert to JPG"
      hint="WebP images"
    />
  );
}
