(function(){
  const downloadBtn = document.getElementById('downloadBtn');
  if (!downloadBtn) return;

  function setButtonBusy(isBusy) {
    if (isBusy) {
      downloadBtn.setAttribute('disabled', 'true');
      downloadBtn.setAttribute('aria-busy', 'true');
      downloadBtn.dataset.originalText = downloadBtn.textContent;
      downloadBtn.textContent = 'Preparing PDF…';
    } else {
      downloadBtn.removeAttribute('disabled');
      downloadBtn.removeAttribute('aria-busy');
      if (downloadBtn.dataset.originalText) {
        downloadBtn.textContent = downloadBtn.dataset.originalText;
        delete downloadBtn.dataset.originalText;
      }
    }
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error('Failed to load ' + url));
      document.head.appendChild(s);
    });
  }

  async function ensureLibs() {
    // Try html2pdf first (includes html2canvas + jsPDF inside the bundle)
    const html2pdfUrls = [
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
      'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
      'https://unpkg.com/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js'
    ];

    if (!window.html2pdf) {
      for (const u of html2pdfUrls) {
        try { await loadScript(u); if (window.html2pdf) break; } catch (_) {}
      }
    }

    // If still no html2pdf, try loading html2canvas + jsPDF separately for fallback
    if (!window.html2pdf) {
      const canvasUrls = [
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
      ];
      const jsPdfUrls = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
      ];
      if (!window.html2canvas) {
        for (const u of canvasUrls) {
          try { await loadScript(u); if (window.html2canvas) break; } catch (_) {}
        }
      }
      if (!window.jspdf) {
        for (const u of jsPdfUrls) {
          try { await loadScript(u); if (window.jspdf) break; } catch (_) {}
        }
      }
    }

    const libsAvailable = !!(window.html2pdf || (window.html2canvas && window.jspdf));
    if (!libsAvailable) throw new Error('Required PDF libraries could not be loaded.');
  }

  async function exportWithHtml2Pdf() {
    const page = document.querySelector('.page');
    if (!page || !window.html2pdf) throw new Error('html2pdf not available');

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
    setButtonBusy(true);
    try {
      await ensureLibs();
      if (window.html2pdf) {
        await exportWithHtml2Pdf();
      } else {
        await exportWithJsPdfFallback();
      }
    } catch (err) {
      console.error('PDF export failed', err);
      alert('PDF export failed. Please check your internet connection or try another browser.');
    } finally {
      setButtonBusy(false);
    }
  }

  downloadBtn.addEventListener('click', function(){
    // Ensure click always triggers processing
    handleDownload();
  });
})();