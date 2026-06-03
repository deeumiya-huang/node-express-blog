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

document.addEventListener('DOMContentLoaded', function() {
    // listen whole page
    document.body.addEventListener('click', function(e) {

        // edit comment btn
        if (e.target.classList.contains('toggle-edit')) {
            e.preventDefault();

            // get the comment (.comment-main)
            const commentMain = e.target.closest('.comment-main');
            const contentDisplay = commentMain.querySelector('.comment-content-display');
            const editForm = commentMain.querySelector('.edit-form-container');
            const commentActions = commentMain.querySelector('.comment-actions');

            contentDisplay.classList.toggle('active');
            editForm.classList.toggle('active');
            commentActions.classList.toggle('active');
        }

        // --- click cancel btn in edit comment form ---
        if (e.target.classList.contains('btn-cancel-edit')) {
            e.preventDefault();

            const commentMain = e.target.closest('.comment-main');
            const contentDisplay = commentMain.querySelector('.comment-content-display');
            const editForm = commentMain.querySelector('.edit-form-container');
            const commentActions = commentMain.querySelector('.comment-actions');

            if (contentDisplay && editForm) {
                contentDisplay.classList.toggle('active');
                editForm.classList.toggle('active');
                commentActions.classList.toggle('active');

                //reset textarea content
                const textarea = editForm.querySelector('textarea');
                const originalText = contentDisplay.querySelector('.comment-text').innerText;
                textarea.value = originalText;
            }
        }
    });
});