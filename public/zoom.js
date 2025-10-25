document.addEventListener("DOMContentLoaded", function() {
    const zoomCursor = document.querySelector('.zoom-cursor');

    zoomCursor.addEventListener('mousemove', function(e) {
        const zoomLens = zoomCursor.querySelector('::after');
        zoomCursor.style.setProperty('--cursorX', e.clientX + 'px');
        zoomCursor.style.setProperty('--cursorY', e.clientY + 'px');
        zoomCursor.classList.add('zooming');
    });

    zoomCursor.addEventListener('mouseleave', function() {
        zoomCursor.classList.remove('zooming');
    });
});
