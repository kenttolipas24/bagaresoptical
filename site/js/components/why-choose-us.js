// Load Why Choose Us Component
fetch('components/why-choose-us.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('why-choose-us-placeholder').innerHTML = data;
    console.log('Why choose us section loaded');
  })
  .catch(error => console.error('Error loading why choose us:', error));

document.addEventListener('DOMContentLoaded', () => {
    const whySection = document.querySelector('#why-choose-us');
    if (!whySection) return;

    console.log('Why Choose Us section loaded');

    // Optional: Add simple entrance animation when section comes into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                whySection.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    observer.observe(whySection);
});