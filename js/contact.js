/* =========================================================
   AVM PET SHOP
   FILE: js/contact.js

   CHỨC NĂNG:
   - Đọc người dùng đang đăng nhập
   - Tự điền họ tên và email
   - Kiểm tra dữ liệu form
   - Lưu yêu cầu liên hệ vào Firestore
   - Tạo mã yêu cầu
   - Điều khiển FAQ
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
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   1. TRẠNG THÁI
========================================================= */

const contactState = {
    currentUser: null,
    currentProfile: null,
    isSubmitting: false
};


/* =========================================================
   2. HTML ELEMENTS
========================================================= */

const contactForm =
    document.querySelector("#contactForm");

const contactFullName =
    document.querySelector("#contactFullName");

const contactEmail =
    document.querySelector("#contactEmail");

const contactPhone =
    document.querySelector("#contactPhone");

const contactTopic =
    document.querySelector("#contactTopic");

const contactSubject =
    document.querySelector("#contactSubject");

const contactMessage =
    document.querySelector("#contactMessage");

const contactCharacterCount =
    document.querySelector("#contactCharacterCount");

const contactFormMessage =
    document.querySelector("#contactFormMessage");

const contactPanelStatus =
    document.querySelector("#contactPanelStatus");

const resetContactButton =
    document.querySelector("#resetContactButton");

const submitContactButton =
    document.querySelector("#submitContactButton");

const submitContactButtonText =
    document.querySelector("#submitContactButtonText");

const contactLoader =
    document.querySelector("#contactLoader");

const faqQuestions =
    document.querySelectorAll(".contact-faq-question");


/* =========================================================
   3. ERROR ELEMENTS
========================================================= */

const contactErrors = {
    fullName:
        document.querySelector("#contactFullNameError"),

    email:
        document.querySelector("#contactEmailError"),

    phone:
        document.querySelector("#contactPhoneError"),

    topic:
        document.querySelector("#contactTopicError"),

    subject:
        document.querySelector("#contactSubjectError"),

    message:
        document.querySelector("#contactMessageError")
};


/* =========================================================
   4. HÀM TIỆN ÍCH
========================================================= */

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}


function isValidPhone(phone) {
    /*
        Không bắt buộc nhập số điện thoại.
        Nếu có nhập thì chỉ nhận 9–15 chữ số.
    */

    if (!phone) {
        return true;
    }

    const normalizedPhone =
        phone.replace(/[\s.-]/g, "");

    return /^\+?\d{9,15}$/.test(
        normalizedPhone
    );
}


function getSelectedPriority() {
    return document.querySelector(
        'input[name="contactPriority"]:checked'
    )?.value || "normal";
}


function generateRequestCode() {
    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    const randomPart =
        Math.random()
            .toString(36)
            .slice(2, 7)
            .toUpperCase();

    return `AVM-${year}${month}${day}-${randomPart}`;
}


/* =========================================================
   5. FORM MESSAGE
========================================================= */

function showContactMessage(
    type,
    message
) {
    if (!contactFormMessage) {
        return;
    }

    contactFormMessage.textContent =
        message;

    contactFormMessage.classList.remove(
        "hidden",
        "auth-message-success",
        "auth-message-error"
    );

    contactFormMessage.classList.add(
        type === "success"
            ? "auth-message-success"
            : "auth-message-error"
    );
}


function hideContactMessage() {
    contactFormMessage?.classList.add(
        "hidden"
    );
}


/* =========================================================
   6. PANEL STATUS
========================================================= */

function setContactStatus(
    type,
    text
) {
    if (!contactPanelStatus) {
        return;
    }

    contactPanelStatus.textContent =
        text;

    contactPanelStatus.classList.remove(
        "contact-status-ready",
        "contact-status-loading",
        "contact-status-success",
        "contact-status-error"
    );

    contactPanelStatus.classList.add(
        type
    );
}


/* =========================================================
   7. LOADING
========================================================= */

function setContactLoading(isLoading) {
    contactState.isSubmitting =
        isLoading;

    submitContactButton.disabled =
        isLoading;

    resetContactButton.disabled =
        isLoading;

    submitContactButtonText.textContent =
        isLoading
            ? "Đang gửi yêu cầu..."
            : "Gửi yêu cầu";

    contactLoader.classList.toggle(
        "hidden",
        !isLoading
    );

    if (isLoading) {
        setContactStatus(
            "contact-status-loading",
            "Đang gửi"
        );
    }
}


/* =========================================================
   8. CLEAR ERRORS
========================================================= */

function clearContactErrors() {
    Object.values(contactErrors)
        .forEach((element) => {
            if (element) {
                element.textContent = "";
            }
        });

    [
        contactFullName,
        contactEmail,
        contactPhone,
        contactTopic,
        contactSubject,
        contactMessage
    ].forEach((field) => {
        field?.classList.remove(
            "input-error"
        );
    });
}


function setContactError(
    field,
    message
) {
    const errorElement =
        contactErrors[field];

    if (errorElement) {
        errorElement.textContent =
            message;
    }

    const fieldMap = {
        fullName:
            contactFullName,

        email:
            contactEmail,

        phone:
            contactPhone,

        topic:
            contactTopic,

        subject:
            contactSubject,

        message:
            contactMessage
    };

    fieldMap[field]?.classList.add(
        "input-error"
    );
}


/* =========================================================
   9. VALIDATION
========================================================= */

function validateContactForm() {
    clearContactErrors();

    const fullName =
        contactFullName.value.trim();

    const email =
        contactEmail.value
            .trim()
            .toLowerCase();

    const phone =
        contactPhone.value.trim();

    const topic =
        contactTopic.value;

    const subject =
        contactSubject.value.trim();

    const message =
        contactMessage.value.trim();

    let isValid = true;


    if (fullName.length < 2) {
        setContactError(
            "fullName",
            "Vui lòng nhập họ tên hợp lệ."
        );

        isValid = false;
    }


    if (!isValidEmail(email)) {
        setContactError(
            "email",
            "Email không đúng định dạng."
        );

        isValid = false;
    }


    if (!isValidPhone(phone)) {
        setContactError(
            "phone",
            "Số điện thoại không hợp lệ."
        );

        isValid = false;
    }


    if (!topic) {
        setContactError(
            "topic",
            "Vui lòng chọn chủ đề liên hệ."
        );

        isValid = false;
    }


    if (
        subject.length < 5 ||
        subject.length > 120
    ) {
        setContactError(
            "subject",
            "Tiêu đề phải từ 5 đến 120 ký tự."
        );

        isValid = false;
    }


    if (
        message.length < 15 ||
        message.length > 800
    ) {
        setContactError(
            "message",
            "Nội dung phải từ 15 đến 800 ký tự."
        );

        isValid = false;
    }


    return isValid;
}


/* =========================================================
   10. ĐỌC HỒ SƠ NGƯỜI DÙNG
========================================================= */

async function getContactUserProfile(user) {
    try {
        const userReference =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnapshot =
            await getDoc(
                userReference
            );

        if (userSnapshot.exists()) {
            return {
                uid: user.uid,
                email:
                    user.email ||
                    userSnapshot.data().email ||
                    "",
                ...userSnapshot.data()
            };
        }

        return {
            uid: user.uid,
            fullName:
                user.displayName ||
                "Thành viên AVM",
            email:
                user.email || "",
            role: "user"
        };

    } catch (error) {
        console.error(
            "Không thể đọc hồ sơ liên hệ:",
            error
        );

        return {
            uid: user.uid,
            fullName:
                user.displayName ||
                "Thành viên AVM",
            email:
                user.email || "",
            role: "user"
        };
    }
}


/* =========================================================
   11. TỰ ĐIỀN THÔNG TIN NGƯỜI DÙNG
========================================================= */

function fillContactUserData(profile) {
    if (
        contactFullName &&
        !contactFullName.value.trim()
    ) {
        contactFullName.value =
            profile.fullName || "";
    }

    if (
        contactEmail &&
        !contactEmail.value.trim()
    ) {
        contactEmail.value =
            profile.email || "";
    }
}


/* =========================================================
   12. THEO DÕI AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            contactState.currentUser = null;
            contactState.currentProfile = null;

            return;
        }

        contactState.currentUser =
            user;

        const profile =
            await getContactUserProfile(
                user
            );

        contactState.currentProfile =
            profile;

        fillContactUserData(
            profile
        );
    }
);


/* =========================================================
   13. BUILD CONTACT DATA
========================================================= */

function buildContactRequest() {
    const requestCode =
        generateRequestCode();

    return {
        requestCode,

        userId:
            contactState.currentUser?.uid ||
            null,

        fullName:
            contactFullName.value.trim(),

        email:
            contactEmail.value
                .trim()
                .toLowerCase(),

        phone:
            contactPhone.value.trim(),

        topic:
            contactTopic.value,

        subject:
            contactSubject.value.trim(),

        message:
            contactMessage.value.trim(),

        priority:
            getSelectedPriority(),

        status:
            "new",

        statusName:
            "Mới tiếp nhận",

        source:
            "contact-page",

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()
    };
}


/* =========================================================
   14. GỬI YÊU CẦU
========================================================= */

async function submitContactRequest(
    event
) {
    event.preventDefault();

    hideContactMessage();

    if (
        contactState.isSubmitting
    ) {
        return;
    }

    if (!validateContactForm()) {
        showContactMessage(
            "error",
            "Vui lòng kiểm tra lại các thông tin chưa hợp lệ."
        );

        setContactStatus(
            "contact-status-error",
            "Chưa hợp lệ"
        );

        return;
    }

    if (
        !contactState.currentUser
    ) {
        showContactMessage(
            "error",
            "Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại."
        );

        setContactStatus(
            "contact-status-error",
            "Lỗi đăng nhập"
        );

        return;
    }


    setContactLoading(true);


    try {
        const contactRequest =
            buildContactRequest();


        const documentReference =
            await addDoc(
                collection(
                    db,
                    "contactRequests"
                ),
                contactRequest
            );


        console.log(
            "Đã lưu yêu cầu liên hệ:",
            documentReference.id
        );


        showContactMessage(
            "success",
            `Gửi yêu cầu thành công. Mã yêu cầu: ${contactRequest.requestCode}`
        );


        setContactStatus(
            "contact-status-success",
            "Đã tiếp nhận"
        );


        /*
            Giữ lại họ tên và email,
            xóa các nội dung còn lại.
        */

        contactPhone.value = "";
        contactTopic.value = "";
        contactSubject.value = "";
        contactMessage.value = "";

        document.querySelector(
            'input[name="contactPriority"][value="normal"]'
        ).checked = true;

        contactCharacterCount.textContent =
            "0";


        /*
            Lưu mã yêu cầu gần nhất
            để người dùng có thể kiểm tra.
        */

        localStorage.setItem(
            "avmLastContactRequest",
            JSON.stringify({
                id:
                    documentReference.id,

                requestCode:
                    contactRequest.requestCode,

                createdAt:
                    new Date().toISOString()
            })
        );

    } catch (error) {
        console.error(
            "Lỗi gửi yêu cầu liên hệ:",
            error
        );


        let errorMessage =
            "Không thể gửi yêu cầu. Vui lòng thử lại.";

        if (
            error.code ===
            "permission-denied"
        ) {
            errorMessage =
                "Firestore chưa cho phép lưu yêu cầu liên hệ.";
        }

        if (
            error.code ===
            "unavailable"
        ) {
            errorMessage =
                "Firebase đang tạm thời không khả dụng.";
        }


        showContactMessage(
            "error",
            errorMessage
        );


        setContactStatus(
            "contact-status-error",
            "Gửi thất bại"
        );

    } finally {
        setContactLoading(false);
    }
}


/* =========================================================
   15. RESET FORM
========================================================= */

function resetContactForm() {
    const savedFullName =
        contactState.currentProfile
            ?.fullName || "";

    const savedEmail =
        contactState.currentProfile
            ?.email || "";


    contactForm.reset();

    clearContactErrors();
    hideContactMessage();

    contactFullName.value =
        savedFullName;

    contactEmail.value =
        savedEmail;

    contactCharacterCount.textContent =
        "0";

    setContactStatus(
        "contact-status-ready",
        "Sẵn sàng"
    );

    contactTopic.focus();
}


/* =========================================================
   16. CHARACTER COUNT
========================================================= */

contactMessage?.addEventListener(
    "input",
    () => {
        let value =
            contactMessage.value;

        if (
            value.length > 800
        ) {
            value =
                value.slice(
                    0,
                    800
                );

            contactMessage.value =
                value;
        }

        contactCharacterCount.textContent =
            String(value.length);

        contactErrors.message.textContent =
            "";

        contactMessage.classList.remove(
            "input-error"
        );

        hideContactMessage();
    }
);


/* =========================================================
   17. XÓA LỖI KHI NHẬP
========================================================= */

const contactInputMap = [
    {
        element:
            contactFullName,
        error:
            contactErrors.fullName,
        eventName:
            "input"
    },
    {
        element:
            contactEmail,
        error:
            contactErrors.email,
        eventName:
            "input"
    },
    {
        element:
            contactPhone,
        error:
            contactErrors.phone,
        eventName:
            "input"
    },
    {
        element:
            contactTopic,
        error:
            contactErrors.topic,
        eventName:
            "change"
    },
    {
        element:
            contactSubject,
        error:
            contactErrors.subject,
        eventName:
            "input"
    }
];


contactInputMap.forEach((item) => {
    item.element?.addEventListener(
        item.eventName,
        () => {
            item.error.textContent =
                "";

            item.element.classList.remove(
                "input-error"
            );

            hideContactMessage();

            setContactStatus(
                "contact-status-ready",
                "Sẵn sàng"
            );
        }
    );
});


/* =========================================================
   18. FAQ
========================================================= */

faqQuestions.forEach((button) => {
    button.addEventListener(
        "click",
        () => {
            const faqItem =
                button.closest(
                    ".contact-faq-item"
                );

            if (!faqItem) {
                return;
            }

            const isOpen =
                faqItem.classList.contains(
                    "active"
                );


            /*
                Đóng các mục khác
            */

            document
                .querySelectorAll(
                    ".contact-faq-item"
                )
                .forEach((item) => {
                    item.classList.remove(
                        "active"
                    );

                    const itemButton =
                        item.querySelector(
                            ".contact-faq-question"
                        );

                    const itemToggle =
                        item.querySelector(
                            ".contact-faq-toggle"
                        );

                    itemButton?.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                    if (itemToggle) {
                        itemToggle.textContent =
                            "+";
                    }
                });


            /*
                Mở mục được chọn
            */

            if (!isOpen) {
                faqItem.classList.add(
                    "active"
                );

                button.setAttribute(
                    "aria-expanded",
                    "true"
                );

                const toggle =
                    faqItem.querySelector(
                        ".contact-faq-toggle"
                    );

                if (toggle) {
                    toggle.textContent =
                        "−";
                }
            }
        }
    );
});


/* =========================================================
   19. EVENTS
========================================================= */

contactForm?.addEventListener(
    "submit",
    submitContactRequest
);


resetContactButton?.addEventListener(
    "click",
    resetContactForm
);


/* =========================================================
   20. INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        setContactStatus(
            "contact-status-ready",
            "Sẵn sàng"
        );

        if (contactMessage) {
            contactCharacterCount.textContent =
                String(
                    contactMessage.value.length
                );
        }
    }
);