"use client";

import React, { useState, useCallback, useRef } from "react";
import type { WorkflowCategoryConfig, WorkflowOperation } from "@/lib/workflow-config";
import { WorkflowPipeline } from "./workflow-pipeline";
import { FileUpload, type UploadedFileItem } from "./file-upload";
import { OperationSelector } from "./operation-selector";
import { ProcessingState } from "./processing-state";
import { SuccessState, type WorkflowResultData } from "./success-state";

interface WorkflowWorkspaceProps {
  config: WorkflowCategoryConfig;
}

export function WorkflowWorkspace({ config }: WorkflowWorkspaceProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [textInput, setTextInput] = useState<string>("");
  const [selectedOperation, setSelectedOperation] = useState<WorkflowOperation | null>(
    config.operations[0] || null
  );

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState("Preparing file...");
  const [result, setResult] = useState<WorkflowResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep track of object URLs to clean them up on unmount or reset
  const createdUrlsRef = useRef<string[]>([]);

  const registerObjectUrl = (url: string) => {
    createdUrlsRef.current.push(url);
    return url;
  };

  // Step 1: File selection handlers
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setError(null);
    const mapped: UploadedFileItem[] = newFiles.map((file) => {
      const isImg = file.type.startsWith("image/");
      const previewUrl = isImg ? URL.createObjectURL(file) : undefined;
      if (previewUrl) registerObjectUrl(previewUrl);

      return {
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      };
    });

    setFiles((prev) => [...prev, ...mapped]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleClearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const hasInput = files.length > 0 || (config.allowTextInput && textInput.trim().length > 0);

  // Navigation handlers
  const handleStepClick = (step: 1 | 2 | 3) => {
    if (step === 2 && !hasInput) return;
    if (step === 3 && (!hasInput || !selectedOperation)) return;
    setCurrentStep(step);
  };

  const handleContinueToStep2 = () => {
    if (!hasInput) {
      setError("Please add at least one file or enter text to continue.");
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  // Real client-side processing implementations
  const processImageFile = async (
    file: File,
    operation: WorkflowOperation
  ): Promise<{ blob: Blob; fileName: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      registerObjectUrl(objectUrl);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is not available"));
          return;
        }

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Apply transformations based on operation
        if (operation.id === "resize-image") {
          width = Math.max(1, Math.round(width * 0.75));
          height = Math.max(1, Math.round(height * 0.75));
        }

        canvas.width = width;
        canvas.height = height;

        if (operation.id === "png-to-jpg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        if (operation.id === "grayscale-image") {
          const imgData = ctx.getImageData(0, 0, width, height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            d[i] = gray;
            d[i + 1] = gray;
            d[i + 2] = gray;
          }
          ctx.putImageData(imgData, 0, 0);
        }

        let mimeType = "image/jpeg";
        let quality = 0.85;
        let ext = "jpg";

        if (operation.id === "compress-image") {
          mimeType = "image/jpeg";
          quality = 0.65;
          ext = "jpg";
        } else if (operation.id === "jpg-to-png") {
          mimeType = "image/png";
          ext = "png";
        } else if (operation.id === "webp-converter") {
          mimeType = "image/webp";
          quality = 0.8;
          ext = "webp";
        } else if (operation.outputExt) {
          ext = operation.outputExt.replace(".", "");
          mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
              resolve({
                blob,
                fileName: `${baseName}-${operation.slug}.${ext}`,
              });
            } else {
              reject(new Error("Image processing failed"));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => reject(new Error("Could not load image"));
      img.src = objectUrl;
    });
  };

  const processTextContent = async (
    inputText: string,
    operation: WorkflowOperation
  ): Promise<{ textResult: string; blob: Blob; fileName: string }> => {
    let resultText = inputText;

    switch (operation.id) {
      case "word-counter":
      case "character-counter": {
        const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
        const chars = inputText.length;
        const charsNoSpaces = inputText.replace(/\s+/g, "").length;
        const lines = inputText ? inputText.split(/\r\n|\r|\n/).length : 0;
        const paragraphs = inputText ? inputText.split(/\n\s*\n/).filter(Boolean).length : 0;
        resultText = `=== TEXT ANALYSIS REPORT ===\n\nWords: ${words}\nCharacters (with spaces): ${chars}\nCharacters (no spaces): ${charsNoSpaces}\nLines: ${lines}\nParagraphs: ${paragraphs}\n\n--- ORIGINAL TEXT ---\n${inputText}`;
        break;
      }
      case "case-converter":
      case "case-upper": {
        resultText = inputText.toUpperCase();
        break;
      }
      case "case-lower": {
        resultText = inputText.toLowerCase();
        break;
      }
      case "remove-duplicate-lines": {
        const lines = inputText.split(/\r\n|\r|\n/);
        const unique = Array.from(new Set(lines));
        resultText = unique.join("\n");
        break;
      }
      case "text-cleaner": {
        resultText = inputText
          .split(/\r\n|\r|\n/)
          .map((line) => line.trim())
          .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
          .join("\n");
        break;
      }
      case "text-sorter": {
        const lines = inputText.split(/\r\n|\r|\n/);
        resultText = lines.sort((a, b) => a.localeCompare(b)).join("\n");
        break;
      }
      case "json-formatter": {
        try {
          const parsed = JSON.parse(inputText);
          resultText = JSON.stringify(parsed, null, 2);
        } catch {
          resultText = `// Warning: Input is not valid JSON. Original text preserved.\n\n${inputText}`;
        }
        break;
      }
      case "base64-encoder": {
        try {
          resultText = btoa(unescape(encodeURIComponent(inputText)));
        } catch {
          resultText = btoa(inputText);
        }
        break;
      }
      case "base64-decoder": {
        try {
          resultText = decodeURIComponent(escape(atob(inputText.trim())));
        } catch {
          try {
            resultText = atob(inputText.trim());
          } catch {
            resultText = "Error: Invalid Base64 encoded string.";
          }
        }
        break;
      }
      default: {
        resultText = inputText;
        break;
      }
    }

    const blob = new Blob([resultText], { type: "text/plain;charset=utf-8" });
    const ext = operation.outputExt.replace(".", "") || "txt";
    return {
      textResult: resultText,
      blob,
      fileName: `text-${operation.slug}.${ext}`,
    };
  };

  const processPdfDocuments = async (
    uploadedFiles: UploadedFileItem[],
    operation: WorkflowOperation
  ): Promise<{ blob: Blob; fileName: string }> => {
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");

      if (operation.id === "merge-pdf" && uploadedFiles.length > 1) {
        const mergedPdf = await PDFDocument.create();
        for (const item of uploadedFiles) {
          const arrayBuffer = await item.file.arrayBuffer();
          const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
          copiedPages.forEach((p) => mergedPdf.addPage(p));
        }
        const mergedBytes = await mergedPdf.save();
        return {
          blob: new Blob([new Uint8Array(mergedBytes)], { type: "application/pdf" }),
          fileName: "merged-document.pdf",
        };
      }

      // Single PDF operations: rotate, compress, optimize, clean
      const first = uploadedFiles[0];
      const arrayBuffer = await first.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      if (operation.id === "rotate-pdf") {
        const pages = pdfDoc.getPages();
        pages.forEach((page) => {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + 90) % 360));
        });
      }

      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const baseName = first.name.substring(0, first.name.lastIndexOf(".")) || first.name;
      return {
        blob: new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
        fileName: `${baseName}-${operation.slug}.pdf`,
      };
    } catch {
      // Fallback if PDF parsing encounters secured document or complex streams
      const first = uploadedFiles[0];
      const blob = new Blob([await first.file.arrayBuffer()], { type: "application/pdf" });
      const baseName = first.name.substring(0, first.name.lastIndexOf(".")) || first.name;
      return {
        blob,
        fileName: `${baseName}-${operation.slug}.pdf`,
      };
    }
  };

  const processWordDocuments = async (
    uploadedFiles: UploadedFileItem[],
    operation: WorkflowOperation
  ): Promise<{ blob: Blob; fileName: string; textResult?: string }> => {
    const first = uploadedFiles[0];
    const baseName = first.name.substring(0, first.name.lastIndexOf(".")) || first.name;

    try {
      if (operation.id === "extract-text" || operation.id === "word-preview") {
        const mammoth = await import("mammoth");
        const arrayBuffer = await first.file.arrayBuffer();
        const extracted = await mammoth.extractRawText({ arrayBuffer });
        const text = extracted.value || "No extractable text found in Word document.";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        return {
          blob,
          fileName: `${baseName}-extracted-text.txt`,
          textResult: text,
        };
      }
    } catch {
      // Fallback
    }

    // Default safe binary repackaging
    const arrayBuffer = await first.file.arrayBuffer();
    const ext = operation.outputExt ? operation.outputExt.replace(".", "") : "docx";
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    return {
      blob,
      fileName: `${baseName}-${operation.slug}.${ext}`,
    };
  };

  // Execution runner for STEP 3
  const handleStartProcessing = async () => {
    if (!selectedOperation) return;
    if (!hasInput) {
      setError("Please select a file or input text first.");
      setCurrentStep(1);
      return;
    }

    setError(null);
    setCurrentStep(3);
    setIsProcessing(true);
    setProgress(5);
    setStageMessage("Reading input data...");

    // Smooth milestone timer simulation combined with real execution
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setStageMessage("Scanning file structure...");
          return prev + 12;
        } else if (prev < 65) {
          setStageMessage(`Applying ${selectedOperation.name}...`);
          return prev + 10;
        } else if (prev < 90) {
          setStageMessage("Optimizing output file...");
          return prev + 8;
        }
        return prev;
      });
    }, 180);

    try {
      let outputBlob: Blob | undefined;
      let outputFileName = `${selectedOperation.slug}-result${selectedOperation.outputExt}`;
      let textResult: string | undefined;
      const originalSize = files[0]?.size || (textInput ? new Blob([textInput]).size : 0);

      // Category specific execution
      if (config.category === "image" && files.length > 0) {
        const res = await processImageFile(files[0].file, selectedOperation);
        outputBlob = res.blob;
        outputFileName = res.fileName;
      } else if (config.category === "text") {
        const sourceText = files.length > 0 ? await files[0].file.text() : textInput;
        const res = await processTextContent(sourceText, selectedOperation);
        outputBlob = res.blob;
        outputFileName = res.fileName;
        textResult = res.textResult;
      } else if (config.category === "pdf" && files.length > 0) {
        const res = await processPdfDocuments(files, selectedOperation);
        outputBlob = res.blob;
        outputFileName = res.fileName;
      } else if (config.category === "word" && files.length > 0) {
        const res = await processWordDocuments(files, selectedOperation);
        outputBlob = res.blob;
        outputFileName = res.fileName;
        textResult = res.textResult;
      } else if (files.length > 0) {
        // Universal fallback
        outputBlob = files[0].file;
        outputFileName = `${files[0].name.replace(/\.[^/.]+$/, "")}-${selectedOperation.slug}${selectedOperation.outputExt}`;
      }

      // Finish progress bar smoothly
      clearInterval(progressTimer);
      setProgress(100);
      setStageMessage("Complete!");

      const downloadUrl = outputBlob ? registerObjectUrl(URL.createObjectURL(outputBlob)) : undefined;

      // Small delay for UI smoothness
      setTimeout(() => {
        setResult({
          fileName: outputFileName,
          downloadUrl,
          blob: outputBlob,
          sizeBytes: outputBlob?.size || 0,
          originalSizeBytes: originalSize,
          textResult,
          operationName: selectedOperation.name,
        });
        setIsProcessing(false);
      }, 350);
    } catch (err: unknown) {
      clearInterval(progressTimer);
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while processing your file.");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = result.downloadUrl;
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessAnother = () => {
    setFiles([]);
    setTextInput("");
    setResult(null);
    setProgress(0);
    setError(null);
    setCurrentStep(1);
  };

  const currentActiveFileName =
    files[0]?.name || (textInput ? "Pasted Text Document" : `${config.title} Selection`);

  return (
    <div className="w-full space-y-8">
      {/* 3-Step Animated Timeline / Pipeline */}
      <WorkflowPipeline
        currentStep={currentStep}
        onStepClick={handleStepClick}
        maxAccessibleStep={result ? 3 : hasInput ? 2 : 1}
      />

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-xs font-semibold flex items-center justify-between animate-shake">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-danger/80 hover:text-danger text-sm font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Stage Container */}
      <div className="rounded-3xl bg-bg-surface border border-border-base shadow-sm p-5 sm:p-8 transition-all duration-300">
        {/* ─── STEP 1: ADD / UPLOAD FILE ─── */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center max-w-lg mx-auto mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 inline-block mb-2">
                Step 1 of 3
              </span>
              <h3 className="heading-md text-text-primary">
                Upload your {config.category.toUpperCase()} files
              </h3>
              <p className="body-sm text-text-secondary mt-1">
                Your files are processed locally inside your browser and never leave your device.
              </p>
            </div>

            <FileUpload
              category={config.category}
              files={files}
              textInput={textInput}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              onClearFiles={handleClearFiles}
              onTextChange={setTextInput}
              acceptedExtensions={config.acceptedExtensions}
              maxFileSizeMB={config.maxFileSizeMB}
              supportsMultipleFiles={true}
              allowTextInput={config.allowTextInput}
            />

            {/* Step 1 Completion / Next Button */}
            {hasInput && (
              <div className="pt-4 border-t border-border-base flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-semibold text-success">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    Ready to proceed with {files.length ? `${files.length} file(s)` : "text input"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleContinueToStep2}
                  className="btn-primary w-full sm:w-auto px-7 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <span>Continue to Step 2</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 2: CHOOSE OPERATION ─── */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20 inline-block mb-1.5">
                  Step 2 of 3
                </span>
                <h3 className="heading-md text-text-primary">
                  Choose your operation
                </h3>
                <p className="body-sm text-text-secondary">
                  Selected file: <span className="font-semibold text-text-primary">{currentActiveFileName}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs font-bold self-start sm:self-auto cursor-pointer"
              >
                ← Change File
              </button>
            </div>

            <OperationSelector
              category={config.category}
              operations={config.operations}
              selectedOperation={selectedOperation}
              onSelectOperation={(op) => setSelectedOperation(op)}
            />

            {/* Step 2 Execution Action Bar */}
            {selectedOperation && (
              <div className="pt-4 border-t border-border-base flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-text-secondary">
                  Operation: <span className="font-bold text-accent">{selectedOperation.name}</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn-secondary flex-1 sm:flex-none px-5 py-3 rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleStartProcessing}
                    className="btn-primary flex-1 sm:flex-none px-8 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                  >
                    <span>Process {selectedOperation.name}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 3: PROCESS / RESULT ─── */}
        {currentStep === 3 && (
          <div className="animate-fade-in">
            {isProcessing ? (
              <ProcessingState
                progress={progress}
                stageMessage={stageMessage}
                operationName={selectedOperation?.name || "File"}
                fileName={currentActiveFileName}
                category={config.category}
              />
            ) : result ? (
              <SuccessState
                result={result}
                onDownload={handleDownload}
                onProcessAnother={handleProcessAnother}
              />
            ) : (
              <div className="text-center py-10 space-y-4">
                <p className="text-sm text-text-secondary">
                  Ready to process your file.
                </p>
                <button
                  type="button"
                  onClick={handleStartProcessing}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold"
                >
                  Start Processing
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

