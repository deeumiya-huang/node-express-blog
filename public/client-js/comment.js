// show up comments when clicking comment icon
const commentLinks = document.querySelectorAll('.comment-link');
commentLinks.forEach(commentLink => {
    commentLink.addEventListener('click', function (event) {
        const post = event.target.closest('.post-card');
        const commentsContainer = post.querySelector('.post-comments-container');
        if (commentsContainer) {
            commentsContainer.classList.toggle('active');
        }
    })
})

// show up reply block when clicking btns.
const replyBtns = document.querySelectorAll('.toggle-reply');
replyBtns.forEach(replyBtn => {
    replyBtn.addEventListener('click', function (event) {
        const commentNode = event.target.closest('.comment-node');
        const replyForm = commentNode.querySelector('.reply-form-container');
        if (replyForm) {
            replyForm.classList.toggle('active');
        }
    })
})

// show up edit post form when click btn