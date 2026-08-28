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
    document.querySelector("#registerFullName");

const emailInput =
    document.querySelector("#registerEmail");

const passwordInput =
    document.querySelector("#registerPassword");

const confirmPasswordInput =
    document.querySelector("#registerConfirmPassword");

const acceptTermsInput =
    document.querySelector("#registerTerms");

const registerButton =
    document.querySelector("#registerButton");

const registerButtonText =
    document.querySelector("#registerButtonText");

const registerLoader =
    document.querySelector("#registerLoader");

const registerMessage =
    document.querySelector("#registerMessage");

const passwordToggle =
    document.querySelector("#registerPasswordToggle");

const confirmPasswordToggle =
    document.querySelector("#registerConfirmPasswordToggle");


/* =========================================================
   ERROR ELEMENTS
========================================================= */

const errorElements = {

    fullName:
        document.querySelector(
            "#registerFullNameError"
        ),

    email:
        document.querySelector(
            "#registerEmailError"
        ),

    password:
        document.querySelector(
            "#registerPasswordError"
        ),

    confirmPassword:
        document.querySelector(
            "#registerConfirmPasswordError"
        ),

    terms:
        document.querySelector(
            "#registerTermsError"
        )

};


/* =========================================================
   VALIDATION
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


function clearErrors() {

    Object
        .values(errorElements)
        .forEach((element) => {

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

        input?.classList.remove(
            "input-error"
        );

    });

}


function showFieldError(
    field,
    message
) {

    const errorElement =
        errorElements[field];


    if (errorElement) {

        errorElement.textContent =
            message;

    }


    const inputMap = {

        fullName:
            fullNameInput,

        email:
            emailInput,

        password:
            passwordInput,

        confirmPassword:
            confirmPasswordInput

    };


    inputMap[field]
        ?.classList.add(
            "input-error"
        );

}


function validateRegisterForm() {

    clearErrors();


    const fullName =
        fullNameInput
            ?.value
            .trim() || "";

    const email =
        emailInput
            ?.value
            .trim() || "";

    const password =
        passwordInput
            ?.value || "";

    const confirmPassword =
        confirmPasswordInput
            ?.value || "";


    let isValid = true;


    if (
        fullName.length < 2
    ) {

        showFieldError(
            "fullName",
            "Vui lòng nhập họ tên hợp lệ."
        );

        isValid = false;

    }


    if (
        !isValidEmail(email)
    ) {

        showFieldError(
            "email",
            "Email không đúng định dạng."
        );

        isValid = false;

    }


    if (
        password.length < 6
    ) {

        showFieldError(
            "password",
            "Mật khẩu phải có ít nhất 6 ký tự."
        );

        isValid = false;

    }


    if (
        confirmPassword !==
        password
    ) {

        showFieldError(
            "confirmPassword",
            "Mật khẩu xác nhận không khớp."
        );

        isValid = false;

    }


    if (
        !acceptTermsInput?.checked
    ) {

        if (
            errorElements.terms
        ) {

            errorElements
                .terms
                .textContent =
                "Bạn cần đồng ý với điều khoản sử dụng.";

        }

        isValid = false;

    }


    return isValid;

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    type,
    message
) {

    if (
        !registerMessage
    ) {
        return;
    }


    registerMessage.textContent =
        message;


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

    registerMessage
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
    isLoading
) {

    if (
        registerButton
    ) {

        registerButton.disabled =
            isLoading;

    }


    if (
        registerButtonText
    ) {

        registerButtonText.textContent =
            isLoading
                ? "Đang tạo tài khoản..."
                : "Tạo tài khoản";

    }


    registerLoader
        ?.classList.toggle(
            "hidden",
            !isLoading
        );

}


/* =========================================================
   FIREBASE ERROR MESSAGE
========================================================= */

function getFirebaseErrorMessage(
    errorCode
) {

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


    return (
        errorMessages[errorCode] ||
        "Không thể tạo tài khoản. Vui lòng thử lại."
    );

}


/* =========================================================
   REGISTER USER
========================================================= */

async function registerUser(
    event
) {

    event.preventDefault();

    hideMessage();


    if (
        !validateRegisterForm()
    ) {
        return;
    }


    setLoading(true);


    const fullName =
        fullNameInput
            .value
            .trim();

    const email =
        emailInput
            .value
            .trim()
            .toLowerCase();

    const password =
        passwordInput
            .value;


    try {

        /* =================================================
           1. CREATE FIREBASE AUTH ACCOUNT
        ================================================= */

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        /* =================================================
           2. UPDATE DISPLAY NAME
        ================================================= */

        await updateProfile(
            user,
            {
                displayName:
                    fullName
            }
        );


        /* =================================================
           3. CREATE USER DOCUMENT IN FIRESTORE
        ================================================= */

        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            {

                uid:
                    user.uid,

                fullName:
                    fullName,

                email:
                    email,

                role:
                    "user",

                status:
                    "active",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        /* =================================================
           4. SIGN OUT AFTER REGISTER
        ================================================= */

        await signOut(auth);


        localStorage.removeItem(
            "avmCurrentUser"
        );


        /* =================================================
           5. SUCCESS
        ================================================= */

        showMessage(
            "success",
            "Tạo tài khoản thành công! Đang chuyển đến trang đăng nhập..."
        );


        registerForm.reset();


        window.setTimeout(
            () => {

                window.location.replace(
                    "./login.html"
                );

            },
            1300
        );


    } catch (error) {

        console.error(
            "Firebase registration error:",
            error
        );


        showMessage(
            "error",
            getFirebaseErrorMessage(
                error.code
            )
        );


    } finally {

        setLoading(false);

    }

}


/* =========================================================
   SHOW / HIDE MAIN PASSWORD
========================================================= */

passwordToggle
    ?.addEventListener(
        "click",
        () => {

            const isPassword =
                passwordInput.type ===
                "password";


            passwordInput.type =
                isPassword
                    ? "text"
                    : "password";


            passwordToggle.textContent =
                isPassword
                    ? "Ẩn"
                    : "Hiện";

        }
    );


/* =========================================================
   SHOW / HIDE CONFIRM PASSWORD
========================================================= */

confirmPasswordToggle
    ?.addEventListener(
        "click",
        () => {

            const isPassword =
                confirmPasswordInput.type ===
                "password";


            confirmPasswordInput.type =
                isPassword
                    ? "text"
                    : "password";


            confirmPasswordToggle.textContent =
                isPassword
                    ? "Ẩn"
                    : "Hiện";

        }
    );


/* =========================================================
   CLEAR ERROR WHEN TYPING
========================================================= */

fullNameInput
    ?.addEventListener(
        "input",
        () => {

            fullNameInput
                .classList
                .remove(
                    "input-error"
                );

            if (
                errorElements.fullName
            ) {

                errorElements
                    .fullName
                    .textContent =
                    "";

            }

            hideMessage();

        }
    );


emailInput
    ?.addEventListener(
        "input",
        () => {

            emailInput
                .classList
                .remove(
                    "input-error"
                );

            if (
                errorElements.email
            ) {

                errorElements
                    .email
                    .textContent =
                    "";

            }

            hideMessage();

        }
    );


passwordInput
    ?.addEventListener(
        "input",
        () => {

            passwordInput
                .classList
                .remove(
                    "input-error"
                );

            if (
                errorElements.password
            ) {

                errorElements
                    .password
                    .textContent =
                    "";

            }

            hideMessage();

        }
    );


confirmPasswordInput
    ?.addEventListener(
        "input",
        () => {

            confirmPasswordInput
                .classList
                .remove(
                    "input-error"
                );

            if (
                errorElements.confirmPassword
            ) {

                errorElements
                    .confirmPassword
                    .textContent =
                    "";

            }

            hideMessage();

        }
    );


acceptTermsInput
    ?.addEventListener(
        "change",
        () => {

            if (
                errorElements.terms
            ) {

                errorElements
                    .terms
                    .textContent =
                    "";

            }

            hideMessage();

        }
    );


/* =========================================================
   SUBMIT
========================================================= */

registerForm
    ?.addEventListener(
        "submit",
        registerUser
    );