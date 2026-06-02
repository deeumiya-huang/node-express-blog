

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

// const sortSelect = document.querySelector('#sort-select');
// sortSelect.addEventListener('change', async function () {
//     const sortBy = this.value;
//     try {
//         const response = await fetch(`/sortPosts?sort=${sortBy}`);
//         if (!response.ok) {
//             throw new Error(`Server returned status ${response.status}`);
//         }
//
//         const posts = await response.json();
//         renderPosts(posts);
//     } catch (error) {
//         console.error(error);
//     }
// })
// const postsContainer = document.querySelector('.post-list');
//
// function renderPosts(posts) {
//     // delete original posts first
//     postsContainer.innerHTML = '';
//
//     posts.forEach(post => {
//         const postItem = document.createElement('article');
//         postItem.classList.add('post-card');
//         postItem.innerHTML = `
//         <div class="post-user">
//                     <div class="avatar">
//                         <img src="/public/assets/avatar/${post.avatar}" alt="Avatar">
//                     </div>
//                     <div class="user-meta">
//                         <span class="post-author">${post.username}</span>
//                         <span class="post-time">${post.post_at}</span>
//                     </div>
//                 </div>
//
//                 <div class="post-body">
//                     <span class="post-category">${post.category}</span>
//                     <h2 class="post-title">${post.title}</h2>
//                     <div class="post-content">${post.content}</div>
//                 </div>
//
//                 ${post.img_name ? `
//                     <div class="post-image">
//                         <a href="/public/assets/post-img/${post.img_name}">
//                             <img src="/public/assets/post-thumbnail/${post.img_name}" alt="Post Image">
//                         </a>
//                     </div>
//                 ` : ''}
//                 <div class="post-actions">
//                     <button class="action-btn" title="Like">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
//                         <span>${post.likes}</span>
//                     </button>
//                     <a href="/getComments" class="action-btn comment-link" data-post-id="${post.id}" title="Comment">
//                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
//                         <span>${post.comment}</span>
//                     </a>
//                 </div>
//         `;
//         postsContainer.appendChild(postItem);
//     })
// }

const commentsLinks = document.querySelectorAll('.comment-link');
commentsLinks.forEach(commentLink => {
    commentLink.addEventListener('click', async function (event) {
        event.preventDefault();
        const postId = this.dataset.postId;
        try {
            const response = await fetch(`/getComments?postId=${postId}`);
            if (!response.ok) {
                throw new Error('server error');
            }

            const treeComments = await response.json();
            renderComments(treeComments);

        } catch (error) {
            console.error('fetch comments', error);
        }
    })
})
const commentsContainer = document.querySelector('.post-comments-container');
function renderComments(comments) {
    commentsContainer.appendChild(comments);
}

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
