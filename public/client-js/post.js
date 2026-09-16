const openPostBtn = document.querySelector('#new-post');
const openPostBtn2 = document.querySelector('#new-post2');
const closePostBtn = document.querySelector('#closePostBtn');
const cancelBtn = document.querySelector('#cancelBtn');
const postModal = document.querySelector('#postModal');
const postForm = document.querySelector('#postForm');
const contentInput = document.querySelector('#content');
const fileInput = document.querySelector('#postImage');
const imagePreview = document.querySelector('#imagePreview');

const modalTitle = postModal.querySelector('.modal-title');
const categorySelect = document.querySelector('#category');
const titleInput = document.querySelector('#title');
const editPostId = postModal.querySelector('#editPostId');
const removeImageInput = postModal.querySelector('#removeImage');

let originalImage = null; // file name of the post's current image (edit mode only)
let navItemsActiveBeforeModal = []; // nav items to highlight again when the "New Post" modal closes

const quill = new Quill('#quill-editor', {
    theme: 'snow',
    placeholder: 'Write something amazing ...',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }]
        ]
    }
});
// Show an image in the preview box, with an X button on its corner to remove it
function showPreview(src) {
    imagePreview.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-item';

    const img = document.createElement('img');
    img.src = src;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button'; // not "submit", so clicking it doesn't send the form
    removeBtn.className = 'btn-remove-image';
    removeBtn.title = 'Remove image';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', removeImage);

    wrapper.append(img, removeBtn);
    imagePreview.appendChild(wrapper);
}

// X button: the post ends up with no image (whether the preview showed the current image or a newly chosen one)
function removeImage() {
    fileInput.value = ''; // drop a newly chosen file, so it isn't uploaded
    imagePreview.innerHTML = '';
    // editing a post that has an image: tell the server to remove it
    removeImageInput.value = originalImage ? '1' : '';
}

// Highlight "New Post" in the navbars while the create modal is open, and restore the previous highlight after
function highlightNewPost() {
    navItemsActiveBeforeModal = [...document.querySelectorAll('.nav-item.active, .mobile-nav-item.active')];
    navItemsActiveBeforeModal.forEach(item => item.classList.remove('active'));
    openPostBtn?.classList.add('active');
    openPostBtn2?.classList.add('active');
}

function restoreNavHighlight() {
    openPostBtn?.classList.remove('active');
    openPostBtn2?.classList.remove('active');
    navItemsActiveBeforeModal.forEach(item => item.classList.add('active'));
    navItemsActiveBeforeModal = [];
}

// null for creat, postData for edit
const openModal = function (postData = null){
    if (postData) {
        modalTitle.textContent = 'Edit Post';
        postForm.action = `/editPost/${postData.id}`;
        editPostId.value = postData.id;

        categorySelect.value = postData.category;
        titleInput.value = postData.title;
        quill.clipboard.dangerouslyPasteHTML(postData.content);
        originalImage = postData.image || null; // data-image is "" when the post has no image
        if (originalImage) {
            showPreview(`/public/assets/post-thumbnail/${originalImage}`);
        }

    } else {
        modalTitle.textContent = 'Create Post';
        postForm.action = '/createPost';
        editPostId.value = '';
        highlightNewPost();
    }
    postModal.style.display = 'flex';
}

const closeModal = function (){
    postModal.style.display = 'none';
    resetPostForm();
    restoreNavHighlight();
}

function resetPostForm() {
    postForm.reset();
    imagePreview.innerHTML = '';
    quill.setText('');
    modalTitle.textContent = 'Create Post';
    postForm.action = '/createPost';
    editPostId.value = '';
    // hidden inputs aren't cleared by form.reset() once their value was set from JS
    removeImageInput.value = '';
    originalImage = null;
}

openPostBtn2?.addEventListener('click', () => openModal());
openPostBtn?.addEventListener('click', () => openModal());
closePostBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// preview image before upload
fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) {
        // file dialog cancelled (the browser clears the input): show what will actually be saved
        if (originalImage && removeImageInput.value !== '1') {
            showPreview(`/public/assets/post-thumbnail/${originalImage}`);
        } else {
            imagePreview.innerHTML = '';
        }
        return;
    }
    removeImageInput.value = ''; // a new file replaces the old image anyway
    const reader = new FileReader();
    reader.onload = function (e) {
        showPreview(e.target.result);
    }
    reader.readAsDataURL(file); // this will trigger reader.onload event
});

// wrap quill HTML into hidden input before submit form
postForm.addEventListener('submit', function (e) {
    const quillHtml = quill.getSemanticHTML();

    if (quill.getText().trim() === '') {
        e.preventDefault();
        alert(`Please enter some content for your post!`);
        return;
    }
    contentInput.value = quillHtml;
})

const editBtns = document.querySelectorAll('.post-btn-edit');
editBtns.forEach(editBtn => {
    editBtn.addEventListener('click', e => {
        const postCard = editBtn.closest('.post-card');
        const postData = {
            id: editBtn.getAttribute('data-post-id'),
            category: postCard.getAttribute('data-category'),
            title: postCard.getAttribute('data-title'),
            content: postCard.getAttribute('data-content'),
            image: postCard.getAttribute('data-image'),
        };
        openModal(postData);
    })
})