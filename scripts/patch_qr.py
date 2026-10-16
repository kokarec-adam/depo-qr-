from pathlib import Path
p = Path('app.js')
s = p.read_text()
old = """    drawQrs();showToast(total+' QR etiket önizlemesi oluşturuldu.');
  }
"""
new = """    goView('labels');
    drawQrs();
    if(!$('downloadLabels')){
      const b=document.createElement('button');
      b.id='downloadLabels'; b.className='secondary-button'; b.textContent='⇩ İndir';
      $('printLabels').parentElement.appendChild(b);
      b.addEventListener('click',downloadCurrentQR);
    }
    showToast(total+' QR etiket önizlemesi oluşturuldu.');
  }
  function downloadCurrentQR(){
    const label=$('printRoot').querySelector('.qr-label');
    const canvas=label?.querySelector('canvas');
    const img=label?.querySelector('img');
    if(!canvas && !img){showToast('Önce QR etiketi oluştur.',true);return;}
    const a=document.createElement('a');
    a.href=canvas?canvas.toDataURL('image/png'):img.src;
    a.download='depoqr-'+(label.querySelector('code')?.textContent||'etiket')+'.png';
    document.body.appendChild(a);a.click();a.remove();
    showToast('QR etiketi PNG olarak indirildi.');
  }
"""
if old not in s:
    raise SystemExit('target block not found')
p.write_text(s.replace(old, new, 1))
