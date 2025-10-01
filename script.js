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

  function getJsPDFCtor() {
    if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
    if (window.jsPDF) return window.jsPDF;
    return null;
  }

  async function exportPdf() {
    const invoiceEl = document.getElementById('invoice');
    if (!invoiceEl) throw new Error('Invoice element not found');

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch(_) {}
    }

    const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
    const canvas = await window.html2canvas(invoiceEl, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: invoiceEl.scrollWidth,
      windowHeight: invoiceEl.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    const JsPDF = getJsPDFCtor();
    if (!JsPDF) throw new Error('jsPDF not available');

    const pdf = new JsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

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
      if (!window.html2canvas) throw new Error('html2canvas not loaded');
      if (!getJsPDFCtor()) throw new Error('jsPDF not loaded');
      await exportPdf();
    } catch (e) {
      console.error('PDF export failed:', e && (e.stack || e.message) || e);
      alert('PDF export failed. Please try again in a modern browser.');
    } finally {
      setBusy(false);
    }
  });
})();