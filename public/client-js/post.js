const openPostBtn = document.querySelector('#new-post');
const openPostBtn2 = document.querySelector('#new-post2');
const closePostBtn = document.querySelector('#closePostBtn');
const cancelBtn = document.querySelector('#cancelBtn');
const postModal = document.querySelector('#postModal');

const quill = new Quill('#quill-editor', {
    theme: 'snow',
    placeholder: 'Write something amazing ...',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    }
});

const openModal = function (){postModal.style.display = 'flex';}
const closeModal = function (){
    postModal.style.display = 'none';
    resetPostForm();
}

function resetPostForm() {
    postForm.reset();
    imagePreview.innerHTML = '';
    quill.setText('');
}

openPostBtn2.addEventListener('click', openModal);
openPostBtn.addEventListener('click', openModal);
closePostBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// preview image before upload
const fileInput = document.querySelector('#postImage');
const imagePreview = document.querySelector('#imagePreview');


fileInput.addEventListener('change', function () {
    imagePreview.innerHTML = ''; // clear old img
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            imagePreview.appendChild(img);
        }
        reader.readAsDataURL(file); // this will trigger reader.onload event
    }
});

// wrap quill html into hidden input before submit form
const postForm = document.getElementById('postForm');
const contentInput = document.getElementById('content');

postForm.addEventListener('submit', function (e) {
    const quillHtml = quill.getSemanticHTML();

    if (quill.getText().trim() === '') {
        e.preventDefault();
        alert(`Please enter some content for your post!`);
        return;
    }
    contentInput.value = quillHtml;
})
