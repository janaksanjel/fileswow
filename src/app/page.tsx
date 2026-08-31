import { ALL_TOOLS, getToolsByCategory, SUB_CATEGORY_LABELS, type SubCategory } from "@/lib/catalog";
import { HomeClient } from "./home-client";

export default function HomePage() {
  const pdfTools = getToolsByCategory("pdf");
  const wordTools = getToolsByCategory("word");
  const imageTools = getToolsByCategory("image");
  const crossTools = getToolsByCategory("cross");

  return <HomeClient pdfTools={pdfTools} wordTools={wordTools} imageTools={imageTools} crossTools={crossTools} />;
}
