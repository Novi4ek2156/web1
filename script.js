import "./style.css"
(function() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    function animateElement(el) {
        if (!el) return;
        el.classList.add('animate-change');
        setTimeout(() => {
            el.classList.remove('animate-change');
        }, 300);
    }
    
    function saveToLocalStorage() {
        const dataToStore = {};
        editableElements.forEach(el => {
            if (el.id) {
                dataToStore[el.id] = el.innerHTML;
            } else if (el.parentElement && el.parentElement.id) {
                const index = Array.from(el.parentElement.children).indexOf(el);
                dataToStore[`${el.parentElement.id}_${index}`] = el.innerHTML;
            }
        });
        localStorage.setItem('resumeData', JSON.stringify(dataToStore));
    }
    
    function loadFromLocalStorage() {
        const savedRaw = localStorage.getItem('resumeData');
        if (!savedRaw) return false;
        
        try {
            const savedData = JSON.parse(savedRaw);
            for (let id in savedData) {
                const el = document.getElementById(id);
                if (el && el.contentEditable === "true") {
                    el.innerHTML = savedData[id];
                } else if (id.includes('_')) {
                    const [parentId, index] = id.split('_');
                    const parent = document.getElementById(parentId);
                    if (parent && parent.children[parseInt(index)]) {
                        parent.children[parseInt(index)].innerHTML = savedData[id];
                    }
                }
            }
            return true;
        } catch(e) {
            console.error('Ошибка загрузки:', e);
            return false;
        }
    }
    
    function attachEditableHandlers() {
        editableElements.forEach(el => {
            el.addEventListener('input', function() {
                animateElement(this);
                saveToLocalStorage();
            });
            el.addEventListener('blur', () => saveToLocalStorage());
            el.classList.add('ripple');
        });
    }
    
    function createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.position = 'absolute';
        ripple.style.pointerEvents = 'none';
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 1000)
    }
    
    function initRipple() {
        const interactiveElements = document.querySelectorAll('.btn, .resume-container, [contenteditable="true"], .avatar-img');
        interactiveElements.forEach(el => {
            if (el.getAttribute('data-ripple')) return;
            el.setAttribute('data-ripple', 'true');
            el.addEventListener('click', function(e) {
                if (e.target.contentEditable === 'true') return;
                createRipple(e, this);
            });
        });
    }
    
    function loadPdfLibraries(callback) {
        if (window.html2canvas && window.jspdf && window.jspdf.jsPDF) {
            callback();
            return;
        }
        
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script2.onload = callback;
            document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    }
    
    async function downloadPDF() {
        const element = document.getElementById('resume');
        if (!element) return;
        
        const btn = document.getElementById('download-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Генерация PDF...';
        btn.disabled = true;
        
        const originalOverflow = element.style.overflow;
        element.style.overflow = 'visible';
        
        try {
            await loadPdfLibraries(async () => {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true,
                    allowTaint: false
                });
                
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = pdfWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                let heightLeft = imgHeight;
                let position = 0;
                let page = 1;
                
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
                
                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pdfHeight;
                    page++;
                }
                
                pdf.save('resume_jonah_hill.pdf');
            });
        } catch (error) {
            console.error('PDF Error:', error);
            alert('Ошибка при создании PDF: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            element.style.overflow = originalOverflow;
        }
    }
    
    function resetToDefault() {
        const defaultData = {
            name: "Джона Хилл",
            subtitle: "Актер, режиссер, сценарист",
            "experience-title": "Опыт работы",
            "experience-text": "В индустрии кино с 2000-го года. Есть опыт работы режиссером и сценаристом. Популярные фильмы в которых участвовал:",
            "movies-list": "<li>«Человек, который изменил всё» (2011)</li><li>«Волк с Уолл-стрит» (2013)</li><li>«Парни со стволами» (2016)</li>",
            "skills-title": "Навыки",
            "skills-list": "<li>Актерское мастерство</li><li>Импровизация</li><li>Сценарное мастерство</li><li>Режиссура</li><li>Продюсирование</li>"
        };
        
        for (let [id, value] of Object.entries(defaultData)) {
            const el = document.getElementById(id);
            if (el && el.contentEditable === "true") {
                el.innerHTML = value;
                animateElement(el);
            }
        }
        
        saveToLocalStorage();
        
        const container = document.getElementById('resume');
        container.classList.add('animate-change');
        setTimeout(() => container.classList.remove('animate-change'), 400);
    }
    
    function init() {
        attachEditableHandlers();
        loadFromLocalStorage();
        initRipple();
        const downloadBtn = document.getElementById('download-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                createRipple(e, downloadBtn);
                downloadPDF();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                createRipple(e, resetBtn);
                resetToDefault();
            });
        }
        
        document.body.addEventListener('click', function(e) {
            if (e.target.closest('.btn')) return;
            if (e.target.contentEditable === 'true') return;
            if (!e.target.closest('.ripple')) return;
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();