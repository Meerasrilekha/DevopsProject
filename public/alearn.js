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
    document.addEventListener('DOMContentLoaded', function() {
        const menuLinks = document.querySelectorAll('.navbar li a');
    
        menuLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                // Remove active class from all links
                menuLinks.forEach(function(item) {
                    item.classList.remove('active');
                });
    
                // Add active class to the clicked link
                link.classList.add('active');
            });
            // Check if the link's href matches the current page URL
            if (link.href === window.location.href) {
                link.classList.add('active');
            }
        });
    });
    
});