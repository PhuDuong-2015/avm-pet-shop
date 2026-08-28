"use strict";

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   PRODUCT STATE
========================================================= */

const productState = {
    products: [],
    filteredProducts: [],

    currentCategory: "all",
    currentAnimal: "all",

    searchKeyword: "",
    sortType: "default",

    currentPage: 1,
    itemsPerPage: 8
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) => [
    ...document.querySelectorAll(selector)
];


/* =========================================================
   DOM ELEMENTS
========================================================= */

const productsGrid =
    $("#productsGrid");

const productLoading =
    $("#productLoading");

const productError =
    $("#productError");

const productEmpty =
    $("#productEmpty");

const productCount =
    $("#productCount");

const productSearch =
    $("#productSearch");

const animalFilter =
    $("#animalFilter");

const productSort =
    $("#productSort");

const categoryButtons =
    $$(".product-category-button");

const previousPageButton =
    $("#previousPageButton");

const nextPageButton =
    $("#nextPageButton");

const paginationPages =
    $("#paginationPages");

const productPagination =
    $("#productPagination");

const retryProductsButton =
    $("#retryProductsButton");

const resetFilterButton =
    $("#resetFilterButton");


/* =========================================================
   PRODUCT MODAL
========================================================= */

const productModal =
    $("#productModal");

const closeProductModalButton =
    $("#closeProductModalButton");

const closeProductDetailButton =
    $("#closeProductDetailButton");

const addToConsultationButton =
    $("#addToConsultationButton");


/* =========================================================
   SHOW / HIDE
========================================================= */

const show = (element) => {
    element?.classList.remove("hidden");
};

const hide = (element) => {
    element?.classList.add("hidden");
};


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "vi-VN",
        {
            style: "currency",
            currency: "VND"
        }
    ).format(
        Number(value) || 0
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   NORMALIZE STRING
========================================================= */

function normalizeString(value) {

    return String(value ?? "")
        .trim();

}


/* =========================================================
   NORMALIZE ARRAY
========================================================= */

function normalizeArray(value) {

    if (Array.isArray(value)) {

        return value
            .map(
                (item) =>
                    String(item).trim()
            )
            .filter(Boolean);

    }


    if (typeof value === "string") {

        return value
            .split(",")
            .map(
                (item) =>
                    item.trim()
            )
            .filter(Boolean);

    }


    return [];

}


/* =========================================================
   ANIMAL DISPLAY NAME
========================================================= */

function getAnimalDisplayName(animals) {

    if (!animals.length) {
        return "Nhiều vật nuôi";
    }


    const animalNames = {

        dog:
            "Chó",

        cat:
            "Mèo",

        poultry:
            "Gia cầm",

        pig:
            "Heo",

        aquaculture:
            "Thủy sản"

    };


    return animals
        .map(
            (animal) =>
                animalNames[animal] ||
                animal
        )
        .join(", ");

}


/* =========================================================
   CATEGORY DISPLAY NAME
========================================================= */

function getCategoryDisplayName(category) {

    const categoryNames = {

        nutrition:
            "Dinh dưỡng",

        digestive:
            "Tiêu hóa",

        respiratory:
            "Hô hấp",

        skin:
            "Da & lông",

        environment:
            "Môi trường",

        joint:
            "Xương khớp",

        medicine:
            "Thuốc thú y",

        supplement:
            "Dinh dưỡng",

        vitamin:
            "Vitamin",

        hygiene:
            "Vệ sinh",

        care:
            "Chăm sóc"

    };


    return (
        categoryNames[category] ||
        category ||
        "Khác"
    );

}


/* =========================================================
   DEFAULT SYMBOL
========================================================= */

function getDefaultSymbol(product) {

    if (product.symbol) {

        return product.symbol;

    }


    const name =
        normalizeString(
            product.name
        );


    if (!name) {

        return "AVM";

    }


    const words =
        name
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 1) {

        return words[0]
            .slice(0, 3)
            .toUpperCase();

    }


    return words
        .slice(0, 2)
        .map(
            (word) =>
                word.charAt(0)
        )
        .join("")
        .toUpperCase();

}


/* =========================================================
   DEFAULT ACCENT
========================================================= */

function getDefaultAccent(product, index) {

    const allowed = [
        "blue",
        "yellow",
        "green"
    ];


    if (
        allowed.includes(
            product.accent
        )
    ) {

        return product.accent;

    }


    return allowed[
        index % allowed.length
    ];

}


/* =========================================================
   NORMALIZE PRODUCT FROM FIRESTORE
========================================================= */

function normalizeProduct(
    docSnapshot,
    index
) {

    const data =
        docSnapshot.data();


    const animals =
        normalizeArray(
            data.animals ??
            data.animal
        );


    let status =
        data.status;


    if (!status) {

        if (
            typeof data.inStock
            === "boolean"
        ) {

            status =
                data.inStock
                    ? "in-stock"
                    : "out-of-stock";

        } else if (
            data.stock !==
            undefined
        ) {

            status =
                Number(data.stock) > 0
                    ? "in-stock"
                    : "out-of-stock";

        } else {

            status =
                "in-stock";

        }

    }


    const statusName =
        data.statusName ||
        (
            status === "in-stock"
                ? "Còn hàng"
                : "Tạm hết hàng"
        );


    const category =
        normalizeString(
            data.category ||
            data.categoryId ||
            "other"
        );


    const categoryName =
        normalizeString(
            data.categoryName
        ) ||
        getCategoryDisplayName(
            category
        );


    const animalName =
        normalizeString(
            data.animalName
        ) ||
        getAnimalDisplayName(
            animals
        );


    return {

        id:
            docSnapshot.id,

        name:
            normalizeString(
                data.name
            ) ||
            "Sản phẩm AVM",

        category,

        categoryName,

        animals,

        animal:
            animals,

        animalName,

        description:
            normalizeString(
                data.description
            ),

        price:
            Number(
                data.price
            ) || 0,

        status,

        statusName,

        stock:
            Number(
                data.stock
            ) || 0,

        accent:
            getDefaultAccent(
                data,
                index
            ),

        symbol:
            getDefaultSymbol(
                data
            ),

        supportTags:
            normalizeArray(
                data.supportTags
            ),

        /*
            Ảnh được lấy trực tiếp
            từ field image trong Firestore.
        */

        image:
            normalizeString(
                data.image ||
                data.imageUrl
            ),

        createdAt:
            data.createdAt ??
            null,

        updatedAt:
            data.updatedAt ??
            null

    };

}


/* =========================================================
   LOAD PRODUCTS FROM FIRESTORE
========================================================= */

async function loadProducts() {

    show(productLoading);

    hide(productError);
    hide(productEmpty);


    if (productsGrid) {

        productsGrid.innerHTML =
            "";

    }


    if (productCount) {

        productCount.textContent =
            "Đang tải...";

    }


    try {

        const productsSnapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        productState.products =
            productsSnapshot.docs.map(
                (
                    docSnapshot,
                    index
                ) =>
                    normalizeProduct(
                        docSnapshot,
                        index
                    )
            );


        productState.products.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name,
                    "vi"
                )
        );


        console.log(
            "Sản phẩm Firestore:",
            productState.products
        );


        productState.currentPage =
            1;


        applyFilters();


        openProductFromURL();


    } catch (error) {

        console.error(
            "Không thể tải sản phẩm từ Firestore:",
            error
        );


        hide(productLoading);

        show(productError);


        if (productsGrid) {

            productsGrid.innerHTML =
                "";

        }


        if (productCount) {

            productCount.textContent =
                "0 sản phẩm";

        }


        hide(
            productPagination
        );

    }

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    let result =
        [
            ...productState.products
        ];


    /* CATEGORY */

    if (
        productState.currentCategory
        !== "all"
    ) {

        result =
            result.filter(
                (product) =>
                    product.category ===
                    productState.currentCategory
            );

    }


    /* ANIMAL */

    if (
        productState.currentAnimal
        !== "all"
    ) {

        result =
            result.filter(
                (product) =>
                    product.animals.includes(
                        productState.currentAnimal
                    )
            );

    }


    /* SEARCH */

    const keyword =
        productState
            .searchKeyword
            .trim()
            .toLowerCase();


    if (keyword) {

        result =
            result.filter(
                (product) => {

                    const searchableText = [

                        product.name,
                        product.description,
                        product.category,
                        product.categoryName,
                        product.animalName,

                        ...product.animals,

                        ...product.supportTags

                    ]
                        .join(" ")
                        .toLowerCase();


                    return searchableText
                        .includes(
                            keyword
                        );

                }
            );

    }


    /* SORT */

    switch (
        productState.sortType
    ) {

        case "name-asc":

            result.sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name,
                        "vi"
                    )
            );

            break;


        case "name-desc":

            result.sort(
                (a, b) =>
                    b.name.localeCompare(
                        a.name,
                        "vi"
                    )
            );

            break;


        case "price-asc":

            result.sort(
                (a, b) =>
                    a.price -
                    b.price
            );

            break;


        case "price-desc":

            result.sort(
                (a, b) =>
                    b.price -
                    a.price
            );

            break;


        default:
            break;

    }


    productState.filteredProducts =
        result;


    productState.currentPage =
        Math.min(
            productState.currentPage,
            Math.max(
                1,
                getTotalPages()
            )
        );


    renderProducts();

}


/* =========================================================
   TOTAL PAGES
========================================================= */

function getTotalPages() {

    return Math.ceil(

        productState
            .filteredProducts
            .length
        /
        productState
            .itemsPerPage

    );

}


/* =========================================================
   CURRENT PAGE PRODUCTS
========================================================= */

function getPageProducts() {

    const start =
        (
            productState.currentPage - 1
        )
        *
        productState.itemsPerPage;


    return productState
        .filteredProducts
        .slice(
            start,
            start +
            productState.itemsPerPage
        );

}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts() {

    hide(productLoading);

    hide(productError);


    if (!productsGrid) {
        return;
    }


    productsGrid.innerHTML =
        "";


    if (productCount) {

        productCount.textContent =
            `${productState.filteredProducts.length} sản phẩm`;

    }


    if (
        !productState
            .filteredProducts
            .length
    ) {

        show(productEmpty);

        hide(
            productPagination
        );

        return;

    }


    hide(productEmpty);

    show(
        productPagination
    );


    const pageProducts =
        getPageProducts();


    pageProducts.forEach(
        (product) => {

            productsGrid.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );


    renderPagination();

}


/* =========================================================
   CREATE PRODUCT VISUAL
========================================================= */

function createProductVisual(
    product
) {

    /*
        Nếu có image:
        hiển thị ảnh thật.

        Nếu Firestore chưa có image:
        fallback về symbol.
    */

    if (product.image) {

        return `

            <div class="product-card-image-wrapper">

                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    class="product-card-image"
                    loading="lazy"
                >

                <div
                    class="product-card-image-fallback hidden"
                >
                    ${escapeHTML(product.symbol)}
                </div>

            </div>

        `;

    }


    return `

        <div
            class="product-card-symbol"
        >
            ${escapeHTML(
                product.symbol
            )}
        </div>

    `;

}


/* =========================================================
   CREATE PRODUCT CARD
========================================================= */

function createProductCard(
    product
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    const stockClass =
        product.status ===
        "in-stock"
            ? "status-in-stock"
            : "status-out-of-stock";


    card.innerHTML = `

        <div
            class="
                product-card-visual
                product-accent-${escapeHTML(
                    product.accent
                )}
            "
        >

            <span
                class="product-card-category"
            >
                ${escapeHTML(
                    product.categoryName
                )}
            </span>


            ${createProductVisual(
                product
            )}


            <span
                class="
                    product-card-status
                    ${stockClass}
                "
            >
                ${escapeHTML(
                    product.statusName
                )}
            </span>

        </div>


        <div
            class="product-card-content"
        >

            <div
                class="product-card-heading"
            >

                <h3>
                    ${escapeHTML(
                        product.name
                    )}
                </h3>


                <p
                    class="product-card-animal"
                >
                    ${escapeHTML(
                        product.animalName
                    )}
                </p>

            </div>


            <p
                class="product-card-description"
            >
                ${escapeHTML(
                    product.description
                )}
            </p>


            <div
                class="product-card-footer"
            >

                <div
                    class="product-card-price"
                >

                    <span>
                        Giá tham khảo
                    </span>


                    <strong>
                        ${formatCurrency(
                            product.price
                        )}
                    </strong>

                </div>


                <button
                    type="button"
                    class="product-detail-button"
                    data-product-id="${escapeHTML(
                        product.id
                    )}"
                    aria-label="Xem chi tiết ${escapeHTML(
                        product.name
                    )}"
                >
                    →
                </button>

            </div>

        </div>

    `;


    /* =====================================================
       IMAGE ERROR FALLBACK
    ===================================================== */

    const image =
        card.querySelector(
            ".product-card-image"
        );


    const fallback =
        card.querySelector(
            ".product-card-image-fallback"
        );


    image?.addEventListener(
        "error",
        () => {

            image.classList.add(
                "hidden"
            );


            fallback?.classList.remove(
                "hidden"
            );

        }
    );


    /* =====================================================
       DETAIL BUTTON
    ===================================================== */

    const detailButton =
        card.querySelector(
            ".product-detail-button"
        );


    detailButton?.addEventListener(
        "click",
        () => {

            openProductModal(
                product.id
            );

        }
    );


    return card;

}


/* =========================================================
   RENDER PAGINATION
========================================================= */

function renderPagination() {

    if (
        !paginationPages ||
        !previousPageButton ||
        !nextPageButton
    ) {
        return;
    }


    const totalPages =
        getTotalPages();


    paginationPages.innerHTML =
        "";


    previousPageButton.disabled =
        productState.currentPage <= 1;


    nextPageButton.disabled =
        productState.currentPage
        >= totalPages;


    for (
        let page = 1;
        page <= totalPages;
        page += 1
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.textContent =
            page;


        if (
            page ===
            productState.currentPage
        ) {

            button.classList.add(
                "active"
            );

        }


        button.addEventListener(
            "click",
            () => {

                changePage(
                    page
                );

            }
        );


        paginationPages.appendChild(
            button
        );

    }

}


/* =========================================================
   CHANGE PAGE
========================================================= */

function changePage(page) {

    const totalPages =
        getTotalPages();


    if (
        page < 1 ||
        page > totalPages
    ) {
        return;
    }


    productState.currentPage =
        page;


    renderProducts();


    $("#productSection")
        ?.scrollIntoView(
            {
                behavior:
                    "smooth",

                block:
                    "start"
            }
        );

}


/* =========================================================
   FIND PRODUCT
========================================================= */

function findProductById(
    productId
) {

    return productState
        .products
        .find(
            (item) =>
                String(item.id)
                ===
                String(productId)
        );

}


/* =========================================================
   OPEN PRODUCT MODAL
========================================================= */

function openProductModal(
    productId
) {

    const product =
        findProductById(
            productId
        );


    if (
        !product ||
        !productModal
    ) {
        return;
    }


    const modalImage =
        $("#productModalImage");

    const modalCategory =
        $("#productModalCategory");

    const modalTitle =
        $("#productModalTitle");

    const modalDescription =
        $("#productModalDescription");

    const modalAnimal =
        $("#productModalAnimal");

    const modalStatus =
        $("#productModalStatus");

    const modalPrice =
        $("#productModalPrice");


    /* =====================================================
       MODAL IMAGE
    ===================================================== */

    if (modalImage) {

        modalImage.className =
            `product-modal-image product-accent-${product.accent}`;


        if (product.image) {

            modalImage.innerHTML = `

                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    class="product-modal-real-image"
                >

                <div
                    class="product-modal-symbol-fallback hidden"
                >
                    ${escapeHTML(
                        product.symbol
                    )}
                </div>

            `;


            const modalRealImage =
                modalImage.querySelector(
                    ".product-modal-real-image"
                );


            const modalFallback =
                modalImage.querySelector(
                    ".product-modal-symbol-fallback"
                );


            modalRealImage
                ?.addEventListener(
                    "error",
                    () => {

                        modalRealImage
                            .classList
                            .add(
                                "hidden"
                            );


                        modalFallback
                            ?.classList
                            .remove(
                                "hidden"
                            );

                    }
                );

        } else {

            modalImage.textContent =
                product.symbol;

        }

    }


    if (modalCategory) {

        modalCategory.textContent =
            product.categoryName;

    }


    if (modalTitle) {

        modalTitle.textContent =
            product.name;

    }


    if (modalDescription) {

        modalDescription.textContent =
            product.description;

    }


    if (modalAnimal) {

        modalAnimal.textContent =
            product.animalName;

    }


    if (modalStatus) {

        modalStatus.textContent =
            product.statusName;

    }


    if (modalPrice) {

        modalPrice.textContent =
            formatCurrency(
                product.price
            );

    }


    if (
        addToConsultationButton
    ) {

        addToConsultationButton
            .dataset
            .productId =
            String(
                product.id
            );

    }


    show(productModal);


    document.body
        .classList
        .add(
            "modal-open"
        );

}


/* =========================================================
   CLOSE PRODUCT MODAL
========================================================= */

function closeProductModal() {

    hide(
        productModal
    );


    document.body
        .classList
        .remove(
            "modal-open"
        );

}


/* =========================================================
   OPEN PRODUCT FROM URL
========================================================= */

function openProductFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const productId =
        params.get(
            "product"
        );


    if (!productId) {
        return;
    }


    const product =
        findProductById(
            productId
        );


    if (!product) {
        return;
    }


    setTimeout(
        () => {

            openProductModal(
                product.id
            );

        },
        100
    );

}


/* =========================================================
   RESET FILTERS
========================================================= */

function resetFilters() {

    productState.currentCategory =
        "all";

    productState.currentAnimal =
        "all";

    productState.searchKeyword =
        "";

    productState.sortType =
        "default";

    productState.currentPage =
        1;


    if (productSearch) {

        productSearch.value =
            "";

    }


    if (animalFilter) {

        animalFilter.value =
            "all";

    }


    if (productSort) {

        productSort.value =
            "default";

    }


    categoryButtons.forEach(
        (button) => {

            button.classList.toggle(
                "active",

                button.dataset.category
                ===
                "all"
            );

        }
    );


    applyFilters();

}


/* =========================================================
   SEARCH
========================================================= */

let searchTimer;


productSearch
    ?.addEventListener(
        "input",
        (event) => {

            clearTimeout(
                searchTimer
            );


            searchTimer =
                setTimeout(
                    () => {

                        productState
                            .searchKeyword =
                            event.target.value;


                        productState
                            .currentPage =
                            1;


                        applyFilters();

                    },
                    220
                );

        }
    );


/* =========================================================
   CATEGORY FILTER
========================================================= */

categoryButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                categoryButtons
                    .forEach(
                        (item) =>

                            item.classList.remove(
                                "active"
                            )

                    );


                button.classList.add(
                    "active"
                );


                productState
                    .currentCategory =
                    button.dataset.category
                    ||
                    "all";


                productState
                    .currentPage =
                    1;


                applyFilters();

            }
        );

    }
);


/* =========================================================
   ANIMAL FILTER
========================================================= */

animalFilter
    ?.addEventListener(
        "change",
        (event) => {

            productState
                .currentAnimal =
                event.target.value;


            productState
                .currentPage =
                1;


            applyFilters();

        }
    );


/* =========================================================
   SORT
========================================================= */

productSort
    ?.addEventListener(
        "change",
        (event) => {

            productState
                .sortType =
                event.target.value;


            productState
                .currentPage =
                1;


            applyFilters();

        }
    );


/* =========================================================
   PREVIOUS PAGE
========================================================= */

previousPageButton
    ?.addEventListener(
        "click",
        () => {

            changePage(
                productState
                    .currentPage - 1
            );

        }
    );


/* =========================================================
   NEXT PAGE
========================================================= */

nextPageButton
    ?.addEventListener(
        "click",
        () => {

            changePage(
                productState
                    .currentPage + 1
            );

        }
    );


/* =========================================================
   RETRY
========================================================= */

retryProductsButton
    ?.addEventListener(
        "click",
        () => {

            loadProducts();

        }
    );


/* =========================================================
   RESET FILTER BUTTON
========================================================= */

resetFilterButton
    ?.addEventListener(
        "click",
        () => {

            resetFilters();

        }
    );


/* =========================================================
   CLOSE MODAL BUTTONS
========================================================= */

closeProductModalButton
    ?.addEventListener(
        "click",
        closeProductModal
    );


closeProductDetailButton
    ?.addEventListener(
        "click",
        closeProductModal
    );


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

productModal
    ?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                productModal
            ) {

                closeProductModal();

            }

        }
    );


/* =========================================================
   ESC CLOSE MODAL
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key ===
            "Escape"
        ) {

            closeProductModal();

        }

    }
);


/* =========================================================
   ADD PRODUCT TO PET SUPPORT
========================================================= */

addToConsultationButton
    ?.addEventListener(
        "click",
        () => {

            const productId =
                addToConsultationButton
                    .dataset
                    .productId;


            const product =
                findProductById(
                    productId
                );


            if (!product) {
                return;
            }


            localStorage.setItem(
                "avmConsultationProduct",

                JSON.stringify(
                    {

                        id:
                            product.id,

                        name:
                            product.name,

                        image:
                            product.image

                    }
                )
            );


            window.location.href =
                "./support.html";

        }
    );


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProducts();

    }
);