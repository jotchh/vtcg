const form = document.getElementById("login-form");
const email = document.getElementById("email");
const password = document.getElementById("password");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const errorMessage = document.getElementById("error-msg");

function setError(input, errorElement, message) {
    input.classList.add("input-error");
    errorElement.textContent = message;
}

function clearError(input, errorElement) {
    input.classList.remove("input-error");
    errorElement.textContent = "";
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
    if (password.value.length === 0) {
        setError(password, passwordError, "Password is required.");
        return false;
    }

    clearError(password, passwordError);
    return true;
}

email.addEventListener("input", validateEmail);
password.addEventListener("input", validatePassword);

form.addEventListener("submit", function(event) {
    const emailValid = validateEmail();
    const passwordValid = validatePassword();

    if (!emailValid || !passwordValid) {
        event.preventDefault();
    }
});

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has("error")) {
    errorMessage.textContent = "Invalid email or password.";
    errorMessage.style.display = "block";
}
