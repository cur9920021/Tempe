(function(){
  const downloadBtn = document.getElementById('downloadBtn');
  if (!downloadBtn) return;

  async function exportToPdf() {
    const { jsPDF } = window.jspdf;
    const page = document.querySelector('.page');
    if (!page || !jsPDF) return;

    // Ensure fonts/colors render crisply
    const scale = 2; // improve resolution
    const canvas = await html2canvas(page, {
      scale,
      backgroundColor: null,
      useCORS: true,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');

    // Create single A4 page PDF in portrait
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit entirely within the page
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    // Convert px to mm: 96 px ~ 25.4 mm, so 1 px = 25.4/96 mm
    const pxToMm = 25.4 / 96;
    const imgWidthMm = imgWidthPx * pxToMm;
    const imgHeightMm = imgHeightPx * pxToMm;

    const scaleRatio = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm);
    const renderWidth = imgWidthMm * scaleRatio;
    const renderHeight = imgHeightMm * scaleRatio;

    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
    pdf.save('invoice.pdf');
  }

  downloadBtn.addEventListener('click', function(){
    exportToPdf().catch(console.error);
  });
})();