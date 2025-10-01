(function(){
  const downloadBtn = document.getElementById('downloadBtn');
  if (!downloadBtn) return;

  function setBusy(isBusy) {
    if (isBusy) {
      downloadBtn.setAttribute('disabled', 'true');
      downloadBtn.dataset.originalText = downloadBtn.textContent;
      downloadBtn.textContent = 'Preparing PDF…';
    } else {
      downloadBtn.removeAttribute('disabled');
      if (downloadBtn.dataset.originalText) {
        downloadBtn.textContent = downloadBtn.dataset.originalText;
        delete downloadBtn.dataset.originalText;
      }
    }
  }

  async function exportPdf() {
    const invoiceEl = document.getElementById('invoice');
    if (!invoiceEl) throw new Error('Invoice element not found');

    // Wait for web fonts to be ready to avoid FOUT in canvas
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch(_) {}
    }

    const canvas = await window.html2canvas(invoiceEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      windowWidth: invoiceEl.scrollWidth,
      windowHeight: invoiceEl.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) throw new Error('jsPDF not available');

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Convert canvas px to mm; assume 96dpi
    const pxToMm = 25.4 / 96;
    const imgWidthMm = canvas.width * pxToMm;
    const imgHeightMm = canvas.height * pxToMm;

    const ratio = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm);
    const renderW = imgWidthMm * ratio;
    const renderH = imgHeightMm * ratio;

    const offsetX = (pageWidth - renderW) / 2;
    const offsetY = (pageHeight - renderH) / 2;

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
    pdf.save('invoice.pdf');
  }

  downloadBtn.addEventListener('click', async function(){
    setBusy(true);
    try {
      // Ensure libs available
      if (!window.html2canvas) throw new Error('html2canvas not loaded');
      if (!window.jspdf) throw new Error('jsPDF not loaded');
      await exportPdf();
    } catch (e) {
      console.error('PDF export failed', e);
      alert('PDF export failed. Please try again or check your connection.');
    } finally {
      setBusy(false);
    }
  });
})();