"use client";

import { ImageFormatConverter } from "@/components/image-format-converter";
import type { ToolUIProps } from "@/components/tool-registry";

export default function AvifToJpgTool(props: ToolUIProps) {
  return (
    <ImageFormatConverter
      {...props}
      accept=".avif,image/avif"
      targetMime="image/jpeg"
      targetExt="jpg"
      actionLabel="Convert to JPG"
      hint="AVIF images"
    />
  );
}
