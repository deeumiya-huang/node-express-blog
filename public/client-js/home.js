const avatarBtn = document.querySelector('#avatar-btn');
const userMenu = document.querySelector('#nav-user-menu');
const bottomAvatarBtn = document.querySelector('#mobile-avatar-btn');
const bottomUserMenu = document.querySelector('#mobile-user-menu');

// click to show bottom user menu
if (bottomAvatarBtn && bottomUserMenu) {
    bottomAvatarBtn.addEventListener('click', (event) => {
        event.stopPropagation();// prevent trigger global close event
        bottomUserMenu.classList.toggle('active');
    });
}

if (avatarBtn && userMenu) {
    avatarBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        userMenu.classList.toggle('active');
    });
}

// close user menu when click other place
document.addEventListener('click', (event) => {
    if (bottomUserMenu && bottomAvatarBtn) {
        if (!bottomUserMenu.contains(event.target) && !bottomAvatarBtn.contains(event.target)) {
            bottomUserMenu.classList.remove('active');
        }
    }
    if (userMenu && avatarBtn) {
        if (!userMenu.contains(event.target) && !avatarBtn.contains(event.target)) {
            userMenu.classList.remove('active');
        }
    }
});



