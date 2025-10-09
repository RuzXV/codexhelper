document.addEventListener('DOMContentLoaded', function() {
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const sizeSelect = document.getElementById('size-select');
    const colorSelect = document.getElementById('color-select');
    const hexColorPicker = document.getElementById('hex-color-picker');
    const hexColorBtn = document.getElementById('hex-color-btn');
    const mailInput = document.getElementById('mail-input');
    const mailPreview = document.getElementById('mail-preview');
    const copyBtn = document.getElementById('copy-btn');
    const previewContainer = document.getElementById('mail-preview-container');

    const generatorTab = document.querySelector('.generator-tab-btn[data-tab="generator"]');
    const templatesTab = document.querySelector('.generator-tab-btn[data-tab="templates"]');
    const generatorView = document.getElementById('generator-view');
    const templatesView = document.getElementById('templates-view');
    
    const previewTabBtns = document.querySelectorAll('.preview-tab-btn');

    const templateGallery = document.getElementById('template-gallery');
    const templateSearch = document.getElementById('template-search');
    const loadTemplateBtn = document.getElementById('load-template-btn');

    let templates = [];
    let selectedTemplate = null;

    function applyTag(tag, value = null) {
        const start = mailInput.selectionStart;
        const end = mailInput.selectionEnd;
        const selectedText = mailInput.value.substring(start, end);

        if (!selectedText) return;

        let replacement;
        if (value) {
            replacement = `<${tag}=${value}>${selectedText}</${tag}>`;
        } else {
            replacement = `<${tag}>${selectedText}</${tag}>`;
        }
        mailInput.value = mailInput.value.substring(0, start) + replacement + mailInput.value.substring(end);
        updatePreview();
    }

    function updatePreview() {
        let text = mailInput.value;
        text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        text = text.replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/g, '<strong>$1</strong>');
        text = text.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/g, '<em>$1</em>');
        text = text.replace(/&lt;size=(\d+)&gt;(.*?)&lt;\/size&gt;/g, '<span style="font-size: $1px;">$2</span>');
        
        text = text.replace(/&lt;color=([a-zA-Z]+|#[0-9a-fA-F]{6})&gt;(.*?)&lt;\/color&gt;/g, (match, colorValue, content) => {
            return `<span style="color: ${colorValue};">${content}</span>`;
        });
        
        mailPreview.innerHTML = text.replace(/\n/g, '<br>');
    }
    
    function switchView(tab) {
        generatorTab.classList.toggle('active', tab === 'generator');
        templatesTab.classList.toggle('active', tab === 'templates');
        generatorView.classList.toggle('active', tab === 'generator');
        templatesView.classList.toggle('active', tab === 'templates');
    }

    generatorTab.addEventListener('click', () => switchView('generator'));
    templatesTab.addEventListener('click', () => switchView('templates'));
    
    previewTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            previewTabBtns.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            
            previewContainer.classList.remove('mail-bg', 'board-bg');
            if (btn.dataset.bg === 'mail') {
                previewContainer.classList.add('mail-bg');
            } else {
                previewContainer.classList.add('board-bg');
            }
        });
    });

    async function fetchTemplates() {
        try {
            const response = await fetch('/tools/templates.json');
            if (!response.ok) throw new Error('Network response was not ok');
            templates = await response.json();
            renderTemplates();
        } catch (error) {
            templateGallery.innerHTML = '<p style="color: var(--text-muted);">Could not load templates.</p>';
            console.error('Error fetching templates:', error);
        }
    }
    
    function renderTemplates(filter = '') {
        templateGallery.innerHTML = '';
        const filteredTemplates = templates.filter(t => 
            t.title.toLowerCase().includes(filter) || 
            t.content.toLowerCase().includes(filter) ||
            t.tags.some(tag => tag.toLowerCase().includes(filter))
        );

        if (filteredTemplates.length === 0) {
             templateGallery.innerHTML = '<p style="color: var(--text-muted);">No templates found.</p>';
             return;
        }

        filteredTemplates.forEach((template, index) => {
            const item = document.createElement('div');
            item.className = 'template-item';
            item.dataset.index = templates.findIndex(t => t.title === template.title);
            item.innerHTML = `
                <h4>${template.title}</h4>
                <p>${template.tags.join(', ')}</p>
            `;
            item.addEventListener('click', () => selectTemplate(item, template));
            templateGallery.appendChild(item);
        });
    }

    function selectTemplate(element, template) {
        document.querySelectorAll('.template-item').forEach(item => item.classList.remove('selected'));
        element.classList.add('selected');
        selectedTemplate = template;
        loadTemplateBtn.disabled = false;
    }

    templateSearch.addEventListener('input', () => {
        renderTemplates(templateSearch.value.toLowerCase());
    });
    
    loadTemplateBtn.addEventListener('click', () => {
        if (selectedTemplate) {
            mailInput.value = selectedTemplate.content;
            updatePreview();
            switchView('generator');
        }
    });

    boldBtn.addEventListener('click', () => applyTag('b'));
    italicBtn.addEventListener('click', () => applyTag('i'));
    
    sizeSelect.addEventListener('change', () => {
        if (sizeSelect.value) {
            applyTag('size', sizeSelect.value);
            sizeSelect.selectedIndex = 0;
        }
    });

    colorSelect.addEventListener('change', () => {
        if (colorSelect.value) {
            applyTag('color', colorSelect.value);
            colorSelect.selectedIndex = 0;
        }
    });

    hexColorBtn.addEventListener('click', () => applyTag('color', hexColorPicker.value));

    mailInput.addEventListener('input', updatePreview);

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(mailInput.value).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = 'Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });

    updatePreview();
    fetchTemplates();
});