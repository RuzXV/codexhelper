window.debounce = (callback, wait) => {
    let timeoutId = null;
    return (...args) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
            callback.apply(null, args);
        }, wait);
    };
};

window.animateCounter = (element, target, duration, prefix = '') => {
    if (!element) return;
    element.classList.add('counting-blur');
    
    const start = 0;
    const range = target - start;
    let startTime = null;

    if (range === 0) {
        element.textContent = prefix + target.toLocaleString();
        element.classList.remove('counting-blur');
        return;
    }

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const percentage = Math.min(progress / duration, 1);
        
        const current = Math.floor(start + range * percentage);
        element.textContent = prefix + current.toLocaleString();

        if (progress < duration) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = prefix + target.toLocaleString();
            element.classList.remove('counting-blur');
        }
    }

    window.requestAnimationFrame(step);
};

let confirmCallback = null;

window.showAlert = (message, title = "Notice") => {
    const alertModal = document.getElementById('custom-alert-modal');
    const alertTitle = document.getElementById('custom-alert-title');
    const alertMessage = document.getElementById('custom-alert-message');

    if (alertModal && alertTitle && alertMessage) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        alertModal.style.display = 'flex';
    } else {
        alert(message);
    }
};

window.showConfirm = (message, title, onConfirm) => {
    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmTitle = document.getElementById('custom-confirm-title');
    const confirmMessage = document.getElementById('custom-confirm-message');

    if (confirmModal && confirmTitle && confirmMessage) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmCallback = onConfirm;
        confirmModal.style.display = 'flex';
    } else {
        if (confirm(message)) {
            onConfirm();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const alertModal = document.getElementById('custom-alert-modal');
    const alertOkBtn = document.getElementById('custom-alert-ok-btn');
    if (alertModal && alertOkBtn) {
        alertOkBtn.addEventListener('click', () => alertModal.style.display = 'none');
    }

    const confirmModal = document.getElementById('custom-confirm-modal');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    if (confirmModal && confirmActionBtn && confirmCancelBtn) {
        confirmActionBtn.addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            confirmModal.style.display = 'none';
            confirmCallback = null;
        });

        confirmCancelBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
            confirmCallback = null;
        });
    }
});