import './css/style.css';
import * as html2pdf from 'html2pdf.js';

function initRipple() {
    document.querySelectorAll('section, button').forEach(elem => {
        if (elem.dataset.ripple === 'true') return;
        elem.dataset.ripple = 'true';
        
        elem.classList.add('ripple-eff');
        elem.addEventListener('mousedown', function(e) {
            const rect = this.getBoundingClientRect();
            const wave = document.createElement('span');
            wave.classList.add('wave');
            const size = Math.max(rect.width, rect.height);
            wave.style.width = wave.style.height = size + 'px';
            wave.style.left = (e.clientX - rect.left - size/2) + 'px';
            wave.style.top = (e.clientY - rect.top - size/2) + 'px';
            this.appendChild(wave);
            setTimeout(() => wave.remove(), 500);
        });
    });
}

function saveResume() {
    const resumeContent = document.getElementById('resume');
    if (!resumeContent) return;
    const data = {
        html: resumeContent.innerHTML,
        timestamp: Date.now()
    };
    localStorage.setItem('myResume', JSON.stringify(data));
}

window.addEventListener('load', () => {
    const resumeEl = document.getElementById('resume');
    const downloadBtn = document.getElementById('download-btn');
    const saved = localStorage.getItem('myResume');
    if (saved && resumeEl) {
        try {
            const data = JSON.parse(saved);
            if (data.html) {
                resumeEl.innerHTML = data.html;
            }
        } catch(e) { 
            console.log('Ошибка загрузки локального хранилища'); 
        }
    }

    initRipple();

    if (resumeEl) {
        resumeEl.addEventListener('input', saveResume);
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const element = document.getElementById('resume');
            const btn = this;
            const originalText = btn.innerHTML;

            btn.innerHTML = 'Генерация...';
            btn.disabled = true;

            const opt = {
                margin: 0.5,
                filename: 'resume.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save()
                .then(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                })
                .catch(err => {
                    console.error('Ошибка PDF:', err);
                    btn.innerHTML = 'Ошибка';
                    btn.disabled = false;
                    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                });
        });
    }
});
