"use client";

import { ImageFormatConverter } from "@/components/image-format-converter";
import type { ToolUIProps } from "@/components/tool-registry";

export default function JpgToPngTool(props: ToolUIProps) {
  return (
    <ImageFormatConverter
      {...props}
      accept=".jpg,.jpeg,image/jpeg"
      targetMime="image/png"
      targetExt="png"
      actionLabel="Convert to PNG"
      hint="JPG / JPEG images"
      showQuality={false}
    />
  );
}
