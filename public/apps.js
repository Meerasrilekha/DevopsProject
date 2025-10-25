document.addEventListener('DOMContentLoaded', function () {
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const formSteps = document.querySelectorAll('.form-step');

    let formStepNum = 0;

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formSteps[formStepNum].classList.remove('form-step-active');
            formStepNum++;
            formSteps[formStepNum].classList.add('form-step-active');
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formSteps[formStepNum].classList.remove('form-step-active');
            formStepNum--;
            formSteps[formStepNum].classList.add('form-step-active');
        });
    });
});