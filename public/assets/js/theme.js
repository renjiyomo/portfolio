const htmlElement = document.documentElement;
        const themeToggleBtn = document.getElementById('theme-toggle');
        const profileImage = document.getElementById('profile-image');
        
        const lightModeImage = 'assets/images/light-profile.jpg';
        const darkModeImage = 'assets/images/dark-profile.jpg';

        if (localStorage.theme === 'dark' || !('theme' in localStorage)) {
            htmlElement.classList.add('dark');
            profileImage.src = darkModeImage;
        } else {
            htmlElement.classList.remove('dark');
            profileImage.src = lightModeImage;
        }

        themeToggleBtn.addEventListener('click', () => {
            htmlElement.classList.toggle('dark');
            const isDark = htmlElement.classList.contains('dark');

            profileImage.style.opacity = 0.3;
            
            setTimeout(() => {
                if (isDark) {
                    localStorage.theme = 'dark';
                    profileImage.src = darkModeImage;
                } else {
                    localStorage.theme = 'light';
                    profileImage.src = lightModeImage;
                }
                profileImage.style.opacity = 1;
            }, 200);
        });