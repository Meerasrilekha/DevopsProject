const container = document.querySelector('.customers-container');
const boxes = document.querySelectorAll('.customers-container .box');

container.innerHTML += container.innerHTML;  // Duplicate the content for seamless looping

const scrollSpeed = 1; // Adjust this value to control the speed

let startPos = 0;

function scroll() {
    startPos -= scrollSpeed;
    container.style.transform = `translateX(${startPos}px)`;

    if (Math.abs(startPos) >= container.scrollWidth / 2) {
        startPos = 0;
    }

    requestAnimationFrame(scroll);
}

scroll();
