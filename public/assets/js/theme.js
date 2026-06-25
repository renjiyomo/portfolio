const htmlElement = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle');
const profileImage = document.getElementById('profile-image');
        
const lightModeImage = 'assets/images/light-profile.jpg';
const darkModeImage = 'assets/images/dark-profile.jpg';

const updateThemeToggleState = (isDark) => {
    themeToggleBtn.setAttribute('aria-pressed', String(isDark));
    themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
};

if (localStorage.theme === 'dark' || !('theme' in localStorage)) {
    htmlElement.classList.add('dark');
    profileImage.src = darkModeImage;
    updateThemeToggleState(true);
} else {
    htmlElement.classList.remove('dark');
    profileImage.src = lightModeImage;
    updateThemeToggleState(false);
}

themeToggleBtn.addEventListener('click', () => {
    htmlElement.classList.toggle('dark');
    const isDark = htmlElement.classList.contains('dark');
    updateThemeToggleState(isDark);

    profileImage.style.opacity = 0;
            
    setTimeout(() => {
        if (isDark) {
            localStorage.theme = 'dark';
            profileImage.src = darkModeImage;
        } else {
            localStorage.theme = 'light';
            profileImage.src = lightModeImage;
        }
        profileImage.style.opacity = 1;
    }, 150);
});
