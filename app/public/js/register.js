const form = document.getElementById("register-form");
const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const usernameError = document.getElementById("username-error");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");

function setError(input, errorElement, message) {
    input.classList.add("input-error");
    errorElement.textContent = message;
}

function clearError(input, errorElement) {
    input.classList.remove("input-error");
    errorElement.textContent = "";
}

function validateUsername() {
    const value = username.value.trim();

    if (value.length < 3) {
        setError(username, usernameError, "Username must be at least 3 characters.");
        return false;
    }

    if (value.length > 25) {
        setError(username, usernameError, "Username cannot exceed 25 characters.");
        return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        setError(username, usernameError, "Username can only contain letters, numbers, and underscores.");
        return false;
    }

    clearError(username, usernameError);
    return true;
}

function validateEmail() {
    const value = email.value.trim();

    if (value.length === 0) {
        setError(email, emailError, "Email is required.");
        return false;
    }

    if (value.length > 100) {
        setError(email, emailError, "Email cannot exceed 100 characters.");
        return false;
    }

    if (!email.validity.valid) {
        setError(email, emailError, "Please enter a valid email address.");
        return false;
    }

    clearError(email, emailError);
    return true;
}

function validatePassword() {
    const value = password.value;

    if (value.length < 4) {
        setError(password, passwordError, "Password must be at least 4 characters.");
        return false;
    }

    if (value.length > 128) {
        setError(password, passwordError, "Password cannot exceed 128 characters.");
        return false;
    }

    clearError(password, passwordError);
    return true;
}

function validateConfirmPassword() {
    if (confirmPassword.value !== password.value) {
        setError(confirmPassword, confirmPasswordError, "Passwords do not match.");
        return false;
    }

    clearError(confirmPassword, confirmPasswordError);
    return true;
}

username.addEventListener("input", validateUsername);
email.addEventListener("input", validateEmail);

password.addEventListener("input", function() {
    validatePassword();

    if (confirmPassword.value.length > 0) {
        validateConfirmPassword();
    }    
});

confirmPassword.addEventListener("input", validateConfirmPassword);

form.addEventListener("submit", function(event) {
    const usernameValid = validateUsername();
    const emailValid = validateEmail();
    const passwordValid = validatePassword();
    const confirmPasswordValid = validateConfirmPassword();

    if (!usernameValid || !emailValid || !passwordValid || !confirmPasswordValid) {
        event.preventDefault();
    }
});
