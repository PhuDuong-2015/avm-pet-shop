/* =========================================================
   AVM PET SHOP
   FILE: js/register.js
========================================================= */

"use strict";


/* =========================================================
   FIREBASE IMPORT
========================================================= */

import {
    auth,
    db
} from "./firebase-config.js";


import {
    createUserWithEmailAndPassword,
    updateProfile,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   HTML ELEMENTS
========================================================= */

const registerForm =
    document.querySelector("#registerForm");

const fullNameInput =
    document.querySelector("#fullName");

const emailInput =
    document.querySelector("#registerEmail");

const passwordInput =
    document.querySelector("#registerPassword");

const confirmPasswordInput =
    document.querySelector("#confirmPassword");

const acceptTermsInput =
    document.querySelector("#acceptTerms");

const registerButton =
    document.querySelector("#registerButton");

const registerButtonText =
    document.querySelector("#registerButtonText");

const registerLoader =
    document.querySelector("#registerLoader");

const registerMessage =
    document.querySelector("#registerMessage");

const passwordToggleButtons =
    document.querySelectorAll(".password-toggle");


/* =========================================================
   ERROR ELEMENTS
========================================================= */

const errorElements = {
    fullName:
        document.querySelector("#fullNameError"),

    email:
        document.querySelector("#emailError"),

    password:
        document.querySelector("#passwordError"),

    confirmPassword:
        document.querySelector("#confirmPasswordError"),

    terms:
        document.querySelector("#termsError")
};


/* =========================================================
   VALIDATION
========================================================= */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function clearErrors() {
    Object.values(errorElements).forEach((element) => {
        if (element) {
            element.textContent = "";
        }
    });

    [
        fullNameInput,
        emailInput,
        passwordInput,
        confirmPasswordInput
    ].forEach((input) => {
        input?.classList.remove("input-error");
    });
}


function showFieldError(field, message) {
    const errorElement = errorElements[field];

    if (errorElement) {
        errorElement.textContent = message;
    }

    const inputMap = {
        fullName: fullNameInput,
        email: emailInput,
        password: passwordInput,
        confirmPassword: confirmPasswordInput
    };

    inputMap[field]?.classList.add("input-error");
}


function validateRegisterForm() {
    clearErrors();

    const fullName =
        fullNameInput.value.trim();

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;

    let isValid = true;


    if (fullName.length < 2) {
        showFieldError(
            "fullName",
            "Vui lòng nhập họ tên hợp lệ."
        );

        isValid = false;
    }


    if (!isValidEmail(email)) {
        showFieldError(
            "email",
            "Email không đúng định dạng."
        );

        isValid = false;
    }


    if (password.length < 6) {
        showFieldError(
            "password",
            "Mật khẩu phải có ít nhất 6 ký tự."
        );

        isValid = false;
    }


    if (confirmPassword !== password) {
        showFieldError(
            "confirmPassword",
            "Mật khẩu xác nhận không khớp."
        );

        isValid = false;
    }


    if (!acceptTermsInput.checked) {
        errorElements.terms.textContent =
            "Bạn cần đồng ý với điều khoản sử dụng.";

        isValid = false;
    }


    return isValid;
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(type, message) {
    registerMessage.textContent = message;

    registerMessage.classList.remove(
        "hidden",
        "auth-message-success",
        "auth-message-error"
    );

    registerMessage.classList.add(
        type === "success"
            ? "auth-message-success"
            : "auth-message-error"
    );
}


function hideMessage() {
    registerMessage.classList.add("hidden");
}


/* =========================================================
   LOADING
========================================================= */

function setLoading(isLoading) {
    registerButton.disabled = isLoading;

    registerButtonText.textContent =
        isLoading
            ? "Đang tạo tài khoản..."
            : "Tạo tài khoản";

    registerLoader.classList.toggle(
        "hidden",
        !isLoading
    );
}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getFirebaseErrorMessage(errorCode) {
    const errorMessages = {
        "auth/email-already-in-use":
            "Email này đã được đăng ký.",

        "auth/invalid-email":
            "Địa chỉ email không hợp lệ.",

        "auth/weak-password":
            "Mật khẩu chưa đủ mạnh.",

        "auth/network-request-failed":
            "Không thể kết nối Firebase. Hãy kiểm tra Internet.",

        "auth/operation-not-allowed":
            "Email/Password chưa được bật trong Firebase.",

        "auth/too-many-requests":
            "Bạn thao tác quá nhiều lần. Hãy thử lại sau."
    };

    return errorMessages[errorCode] ||
        "Không thể tạo tài khoản. Vui lòng thử lại.";
}


/* =========================================================
   REGISTER
========================================================= */

async function registerUser(event) {
    event.preventDefault();

    hideMessage();

    if (!validateRegisterForm()) {
        return;
    }

    setLoading(true);


    const fullName =
        fullNameInput.value.trim();

    const email =
        emailInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;


    try {
        /*
            1. Tạo tài khoản Authentication
        */

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        /*
            2. Cập nhật tên hiển thị Firebase Auth
        */

        await updateProfile(user, {
            displayName: fullName
        });


        /*
            3. Lưu hồ sơ vào Firestore
        */

        await setDoc(
            doc(db, "users", user.uid),
            {
                uid: user.uid,
                fullName,
                email,
                role: "user",
                status: "active",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        );


        /*
            4. Lưu thông tin cơ bản ở localStorage
        */

/*
    Không giữ trạng thái đăng nhập sau đăng ký.
    Người dùng phải đăng nhập lại.
*/

await signOut(auth);


localStorage.removeItem(
    "avmCurrentUser"
);


showMessage(
    "success",
    "Tạo tài khoản thành công! Đang chuyển đến trang đăng nhập..."
);


registerForm.reset();


window.setTimeout(() => {
    window.location.replace(
        "./login.html"
    );
}, 1300);

    } catch (error) {
        console.error(
            "Firebase registration error:",
            error
        );

        showMessage(
            "error",
            getFirebaseErrorMessage(error.code)
        );

    } finally {
        setLoading(false);
    }
}


/* =========================================================
   SHOW/HIDE PASSWORD
========================================================= */

passwordToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const targetId =
            button.dataset.target;

        const targetInput =
            document.querySelector(`#${targetId}`);

        if (!targetInput) {
            return;
        }

        const isPassword =
            targetInput.type === "password";

        targetInput.type =
            isPassword
                ? "text"
                : "password";

        button.textContent =
            isPassword
                ? "Ẩn"
                : "Hiện";
    });
});


/* =========================================================
   CLEAR ERROR WHEN TYPING
========================================================= */

[
    fullNameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput
].forEach((input) => {
    input?.addEventListener("input", () => {
        input.classList.remove("input-error");
        hideMessage();
    });
});


acceptTermsInput?.addEventListener("change", () => {
    errorElements.terms.textContent = "";
});


/* =========================================================
   SUBMIT
========================================================= */

registerForm?.addEventListener(
    "submit",
    registerUser
);