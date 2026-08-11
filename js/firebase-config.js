/* =========================================================
   AVM PET SHOP
   FILE: js/firebase-config.js
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


const firebaseConfig = {
    apiKey:
        "AIzaSyCplqefeMQ4PQhYnB3XMBn9oMrHDLryhKU",

    authDomain:
        "avm-pet-shop.firebaseapp.com",

    projectId:
        "avm-pet-shop",

    storageBucket:
        "avm-pet-shop.firebasestorage.app",

    messagingSenderId:
        "339832856771",

    appId:
        "1:339832856771:web:859e75b96aedcadc7d4276",

    measurementId:
        "G-G9D5C0XRX1"
};


/* Khởi tạo Firebase */

const firebaseApp = initializeApp(
    firebaseConfig
);


/* Firebase Authentication */

const auth = getAuth(
    firebaseApp
);


/* Cloud Firestore */

const db = getFirestore(
    firebaseApp
);


/* Xuất ra để các file khác sử dụng */

export {
    firebaseApp,
    auth,
    db
};