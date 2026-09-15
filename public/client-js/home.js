
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

const isLoggedIn = document.querySelector('.main-container')?.dataset.loggedIn === 'true';
const likeLoginUrl = `/account/login?failMessage=${encodeURIComponent('Please log in to like posts')}`;

document.body.addEventListener('click', async (event) => {
    const likeBtn = event.target.closest('.action-btn[title="Like"]');
    if (!likeBtn) return;

    event.preventDefault();

    // Only logged-in users can like: send guests to the login page instead of changing the count
    if (!isLoggedIn) {
        window.location.href = likeLoginUrl;
        return;
    }

    const countSpan = likeBtn.querySelector('span');
    let currentLikes = parseInt(countSpan.textContent) || 0;
    const isLiked = likeBtn.classList.contains('liked');
    if (isLiked) {
        likeBtn.classList.remove('liked');
        countSpan.textContent = currentLikes - 1;
    } else {
        likeBtn.classList.add('liked');
        countSpan.textContent = currentLikes + 1;
    }

    const postItem = likeBtn.closest('.post-card');
    const postId = postItem.dataset.postId;

    try {
        const response = await fetch(`/likePost/${postId}`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // so the server answers 401 (not a redirect) if the session expired
            },
            body: JSON.stringify({ isLikeAction: !isLiked })
        });
        if (response.status === 401) {
            // the session expired while the page was open
            window.location.href = likeLoginUrl;
            return;
        }
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        // Calibrate the like count here if the backend returns the latest, accurate data
        const data = await response.json();
        if (data && data.latestLikes !== undefined) {
            countSpan.textContent = data.latestLikes;
        }
    } catch (error) {
        console.error('Like failed:', error);
        // Revert frontend state if the backend request fails
        likeBtn.classList.toggle('liked');
        countSpan.textContent = currentLikes; // back to the count from before the click
        alert('can\'t link to server, please try it later.');
    }
})
