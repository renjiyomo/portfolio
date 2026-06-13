document.addEventListener("DOMContentLoaded", () => {
    const chatBtn = document.querySelector('button.fixed');
    
    if(chatBtn) {
        chatBtn.addEventListener('click', () => {
            window.location.href = "mailto:email@example.com?subject=Let's Connect";
        });
    }
});