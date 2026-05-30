import {logger} from "./Logger.js";

const inputUsername = document.querySelector('#username');

inputUsername.addEventListener('blur', async function (e) {
    const username = this.value;
    const message = document.querySelector('#username-msg');

    try {
        const response = await fetch(`/account/checkUser?username=${username}`);
        const json = await response.json();
        const hasUser = json.hasUser;
        if (hasUser) {
            message.textContent = '❌ This username is already taken';
        } else {
            message.textContent = '✓ Username is available';
        }
    } catch (error) {
        logger.error(error);
        message.textContent = '⚠️Please check internet connection. Unable to check username availability';
    }

})