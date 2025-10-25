document.addEventListener("DOMContentLoaded", function() {
    const form = document.querySelector('.form');
    const formSteps = document.querySelectorAll('.form-step');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const nextBtns = document.querySelectorAll('.next-btn');

    let currentStep = 0;

    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            if (index === stepIndex) {
                step.classList.add('form-step-active');
            } else {
                step.classList.remove('form-step-active');
            }
        });
    }
    function handlePrev() {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    }
    function handleNext() {
        if (currentStep < formSteps.length - 1) {
            currentStep++;
            showStep(currentStep);
        }
    }
    prevBtns.forEach(prevBtn => {
        prevBtn.addEventListener('click', handlePrev);
    });
    nextBtns.forEach(nextBtn => {
        nextBtn.addEventListener('click', handleNext);
    });
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(this);
        const url = this.getAttribute('action');
        const method = this.getAttribute('method');
        try {
            const response = await fetch(url, {
                method: method,
                body: formData
            });
            if (response.ok) {
                alert('Form submitted successfully!');
                // Reset form after successful submission
                this.reset();
                // Go back to the first step
                currentStep = 0;
                showStep(currentStep);
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Form submission failed. Please try again later.');
        }
        
    });
});