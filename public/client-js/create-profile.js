const avatarCircles = document.querySelectorAll('.avatar-circle');
const hiddenInput = document.querySelector('#selected-avatar');

avatarCircles.forEach(circle => {
    circle.addEventListener('click', function() {

        avatarCircles.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        hiddenInput.value = this.dataset.avatar;
    });
});
