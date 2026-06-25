"use client";

import { RefObject } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartAgentResult } from "@/lib/agents/types";

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70) || "simap-diagramm";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[;"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function ChartDownloadButtons({
  chart,
  containerRef
}: {
  chart: ChartAgentResult;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const filename = safeFilename(chart.title);

  const downloadCsv = () => {
    if (!chart.data.length) return;
    const columns = Object.keys(chart.data[0]);
    const lines = [
      columns.map(csvCell).join(";"),
      ...chart.data.map((row) => columns.map((column) => csvCell(row[column])).join(";"))
    ];
    downloadBlob(new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
  };

  const downloadPng = () => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(bounds.width));
    clone.setAttribute("height", String(bounds.height));

    const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const headerHeight = 58;
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(bounds.width * scale);
      canvas.height = Math.ceil((bounds.height + headerHeight) * scale);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(scale, scale);
      context.fillStyle = "#0b1220";
      context.fillRect(0, 0, bounds.width, bounds.height + headerHeight);
      context.fillStyle = "#f8fafc";
      context.font = "600 16px Arial, sans-serif";
      context.fillText(chart.title.slice(0, 72), 16, 24);
      context.fillStyle = "#94a3b8";
      context.font = "12px Arial, sans-serif";
      context.fillText(chart.modelLabel, 16, 44);
      context.drawImage(image, 0, headerHeight, bounds.width, bounds.height);
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filename}.png`);
        URL.revokeObjectURL(svgUrl);
      }, "image/png");
    };
    image.onerror = () => URL.revokeObjectURL(svgUrl);
    image.src = svgUrl;
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={downloadPng}>
        <Download className="mr-2 h-3.5 w-3.5" /> PNG
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={downloadCsv}>
        <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> CSV
      </Button>
    </div>
  );
}
