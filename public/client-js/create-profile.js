const avatarCircles = document.querySelectorAll('.avatar-circle');
const hiddenInput = document.querySelector('#selected-avatar');

const currentAvatar = hiddenInput.value;
if (currentAvatar) {
    avatarCircles.forEach(circle => {
        if (circle.dataset.avatar === currentAvatar) {
            circle.classList.add('active');
        } else {
            circle.classList.remove('active');
        }
    });
}

avatarCircles.forEach(circle => {
    circle.addEventListener('click', function() {

        avatarCircles.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        hiddenInput.value = this.dataset.avatar;
    });
});
