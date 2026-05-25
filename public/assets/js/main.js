document.addEventListener("DOMContentLoaded", () => {
    // Select the floating chat button
    const chatBtn = document.querySelector('button.fixed');
    
    if(chatBtn) {
        chatBtn.addEventListener('click', () => {
            // In the future, you can trigger a modal or open an email draft here
            window.location.href = "mailto:email@example.com?subject=Let's Connect";
        });
    }
});