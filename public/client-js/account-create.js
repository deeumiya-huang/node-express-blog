import {logger} from "./Logger.js";

const form = document.querySelector('#signup-form');
const inputUsername = document.querySelector('#username');
const inputPassword = document.querySelector('#password');
const inputPassword2 = document.querySelector('#password2');
const usernameMsg = document.querySelector('#username-msg');
const passwordMsg = document.querySelector('#password-msg');

let isUsernameValid = false; // to record status can pass or not when submitting form.
let isPasswordValid = false;

// check if username have been used when user creating new account.
inputUsername.addEventListener('blur', async function (e) {
    const username = this.value;

    try {
        const response = await fetch(`/account/checkUser?username=${username}`);

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        const json = await response.json();
        const hasUser = json.hasUser;
        if (hasUser) {
            usernameMsg.textContent = '❌ This username is already taken';
            usernameMsg.className = 'msg-error';
            isUsernameValid = false;
        } else {
            usernameMsg.textContent = '✓ Username is available';
            usernameMsg.className = 'msg-success';
            isUsernameValid = true;
        }
    } catch (error) {
        logger.error(error);
        usernameMsg.textContent = '⚠️Please check internet connection. Unable to check username availability';
        usernameMsg.className = 'msg-warning';
        isUsernameValid = false;
    }
})

form.addEventListener('submit', function (e) {

    if (inputPassword.value === inputPassword2.value) {
        isPasswordValid = true;
    } else {
        passwordMsg.textContent = '❌ Passwords do not match';
        passwordMsg.className = 'msg-error';
    }

    // if one of the validation fails, reject the form to be submitted.
    if (!isPasswordValid || !isUsernameValid) {
        e.preventDefault();
    }
});