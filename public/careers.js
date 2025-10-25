document.addEventListener('DOMContentLoaded', () => {
    const jobForm = document.getElementById('job-form');
    const jobsContainer = document.getElementById('jobs-container');

    jobForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const jobTitle = document.getElementById('job-title').value;
        const jobDescription = document.getElementById('job-description').value;
        const jobLocation = document.getElementById('job-location').value;
        const jobType = document.getElementById('job-type').value;

        addJob(jobTitle, jobDescription, jobLocation, jobType);

        jobForm.reset();
    });

    function addJob(title, description, location, type) {
        const jobElement = document.createElement('div');
        jobElement.className = 'job';

        jobElement.innerHTML = `
            <h3>${title}</h3>
            <p>${description}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Type:</strong> ${type}</p>
        `;
        jobsContainer.appendChild(jobElement);
    }
});