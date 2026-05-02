import jsPDF from "jspdf";
import { stageRegistry } from "../canvas/stageRef";
import type { Sheet } from "../models/sheet";

const PIXELS_PER_MM = 3.7795;

export async function exportSheetToPDF(sheet: Sheet): Promise<void> {
  const stage = stageRegistry.current;
  if (!stage) {
    alert("Canvas not ready. Please try again.");
    return;
  }

  const sheetW = sheet.width * PIXELS_PER_MM;
  const sheetH = sheet.height * PIXELS_PER_MM;

  // Save current stage transform
  const origX = stage.x();
  const origY = stage.y();
  const origSX = stage.scaleX();
  const origSY = stage.scaleY();
  const origW = stage.width();
  const origH = stage.height();

  // Temporarily hide non-printable layers in Konva
  const hiddenNodes: Array<{ node: { visible: (v: boolean) => void }; wasVisible: boolean }> = [];
  sheet.layers
    .filter((l) => !l.printable)
    .forEach((l) => {
      const node = stage.findOne(`#layer-${l.id}`);
      if (node) {
        hiddenNodes.push({ node: node as unknown as { visible: (v: boolean) => void }, wasVisible: (node as unknown as { isVisible: () => boolean }).isVisible() });
        (node as unknown as { visible: (v: boolean) => void }).visible(false);
      }
    });

  // Set stage to exact sheet size at 1:1 scale
  stage.x(0);
  stage.y(0);
  stage.scaleX(1);
  stage.scaleY(1);
  stage.width(sheetW);
  stage.height(sheetH);
  stage.batchDraw();

  const dataUrl = stage.toDataURL({ pixelRatio: 2, mimeType: "image/png" });

  // Restore transform
  stage.x(origX);
  stage.y(origY);
  stage.scaleX(origSX);
  stage.scaleY(origSY);
  stage.width(origW);
  stage.height(origH);
  stage.batchDraw();

  // Restore hidden layers
  hiddenNodes.forEach(({ node, wasVisible }) => node.visible(wasVisible));

  const isLandscape = sheet.width > sheet.height;
  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: [sheet.width, sheet.height],
  });

  doc.addImage(dataUrl, "PNG", 0, 0, sheet.width, sheet.height);
  doc.save(`${sheet.name.replace(/\s+/g, "_")}.pdf`);
}
