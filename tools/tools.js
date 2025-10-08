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

    function applyTag(tag, value = null) {
        const start = mailInput.selectionStart;
        const end = mailInput.selectionEnd;
        const selectedText = mailInput.value.substring(start, end);

        if (selectedText) {
            let replacement;
            if (value) {
                replacement = `<${tag}=${value}>${selectedText}</${tag}>`;
            } else {
                replacement = `<${tag}>${selectedText}</${tag}>`;
            }
            mailInput.value = mailInput.value.substring(0, start) + replacement + mailInput.value.substring(end);
            updatePreview();
        }
    }

    function updatePreview() {
        let text = mailInput.value;
        text = text.replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>');
        text = text.replace(/<i>(.*?)<\/i>/g, '<em>$1</em>');
        text = text.replace(/<size=(\d+)>(.*?)<\/size>/g, '<span style="font-size: $1px;">$2</span>');
        text = text.replace(/<color=([^>]+)>(.*?)<\/color>/g, '<span style="color: $1;">$2</span>');
        
        mailPreview.innerHTML = text.replace(/\n/g, '<br>');
    }

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
        mailInput.select();
        document.execCommand('copy');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = 'Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });

    updatePreview();
});