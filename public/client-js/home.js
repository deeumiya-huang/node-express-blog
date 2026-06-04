

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

// sort all posts by dataset
const postsContainer = document.querySelector('.post-list');
const sortSelect = document.querySelector('#sort-select');
sortSelect.addEventListener('change', async function () {
    const sortBy = this.value;
    const posts = Array.from(document.querySelectorAll('.post-card'));
    posts.sort(function (a, b) {
        const valA = a.dataset[sortBy] || '';
        const valB = b.dataset[sortBy] || '';

        if (sortBy === 'latest') {
            const timeA = Date.parse(valA) || 0;
            const timeB = Date.parse(valB) || 0;
            return timeB - timeA; // desc
        } else {
            return valA.localeCompare(valB, 'en', { sensitivity: 'base' }); // case-insensitive
        }
    });
    posts.forEach((post) => {postsContainer.appendChild(post)});
})


