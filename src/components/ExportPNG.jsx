import * as htmlToImage from "html-to-image";

export default function ExportPNG({ targetRef, fileBase = "not-wrapped" }) {
  async function onExport() {
    if (!targetRef?.current) return;

    const node = targetRef.current;

    // Use a higher pixel ratio for crisp text
    const dataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 2,
      backgroundColor: "#070712",
      cacheBust: true,
    });

    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0, 10);
    a.download = `${fileBase}-${ts}.png`;
    a.href = dataUrl;
    a.click();
  }

  return (
    <button className="btn" onClick={onExport}>
      Export PNG
    </button>
  );
}