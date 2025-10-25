document.addEventListener("DOMContentLoaded", function() {
    const menuIcon = document.querySelector('#menu-icon');
    const navbar = document.querySelector('.navbar');

    menuIcon.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });
    window.addEventListener('scroll', () => {
        if (window.innerWidth > 768) {
            navbar.classList.remove('active');
        }
    });
    

    
});