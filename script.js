(function(){
  const downloadBtn = document.getElementById('downloadBtn');
  if (!downloadBtn) return;

  async function exportWithHtml2Pdf() {
    const page = document.querySelector('.page');
    if (!page || !window.html2pdf) throw new Error('html2pdf not available');

    // Options tuned for single A4 page, preserving on-screen appearance
    const opt = {
      margin:       [0, 0, 0, 0],
      filename:     'invoice.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: null, windowWidth: page.scrollWidth, windowHeight: page.scrollHeight },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css'] }
    };

    await window.html2pdf().from(page).set(opt).save();
  }

  async function exportWithJsPdfFallback() {
    const { jsPDF } = window.jspdf || {};
    const page = document.querySelector('.page');
    if (!page || !jsPDF || !window.html2canvas) throw new Error('Fallback unavailable');

    const scale = 2;
    const canvas = await window.html2canvas(page, {
      scale,
      backgroundColor: null,
      useCORS: true,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const pxToMm = 25.4 / 96;
    const imgWidthMm = canvas.width * pxToMm;
    const imgHeightMm = canvas.height * pxToMm;
    const scaleRatio = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm);
    const renderWidth = imgWidthMm * scaleRatio;
    const renderHeight = imgHeightMm * scaleRatio;
    const offsetX = (pageWidth - renderWidth) / 2;
    const offsetY = (pageHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
    pdf.save('invoice.pdf');
  }

  async function handleDownload(){
    try {
      await exportWithHtml2Pdf();
    } catch (e) {
      try {
        await exportWithJsPdfFallback();
      } catch (err) {
        console.error('PDF export failed', err);
        alert('PDF export failed. Please try a modern browser.');
      }
    }
  }

  downloadBtn.addEventListener('click', function(){
    handleDownload();
  });
})();