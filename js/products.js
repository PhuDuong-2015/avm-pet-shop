"use strict";

const PRODUCT_API_URL = "./data/products.json";

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

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const productsGrid = $("#productsGrid");
const productLoading = $("#productLoading");
const productError = $("#productError");
const productEmpty = $("#productEmpty");
const productCount = $("#productCount");
const productSearch = $("#productSearch");
const animalFilter = $("#animalFilter");
const productSort = $("#productSort");
const categoryButtons = $$(".product-category-button");
const previousPageButton = $("#previousPageButton");
const nextPageButton = $("#nextPageButton");
const paginationPages = $("#paginationPages");
const productPagination = $("#productPagination");
const retryProductsButton = $("#retryProductsButton");
const resetFilterButton = $("#resetFilterButton");

const productModal = $("#productModal");
const closeProductModalButton = $("#closeProductModalButton");
const closeProductDetailButton = $("#closeProductDetailButton");
const addToConsultationButton = $("#addToConsultationButton");

const show = (element) => element?.classList.remove("hidden");
const hide = (element) => element?.classList.add("hidden");

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(Number(value) || 0);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function loadProducts() {
    show(productLoading);
    hide(productError);
    hide(productEmpty);

    try {
        const response = await fetch(PRODUCT_API_URL);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const apiProducts = await response.json();

        productState.products = apiProducts.map((product) => ({
            ...product,
            id: Number(product.id),
            price: Number(product.price),
            animal: Array.isArray(product.animal) ? product.animal : []
        }));

        applyFilters();
    } catch (error) {
        console.error(error);
        hide(productLoading);
        show(productError);
        productsGrid.innerHTML = "";
        productCount.textContent = "0 sản phẩm";
    }
}

function applyFilters() {
    let result = [...productState.products];

    if (productState.currentCategory !== "all") {
        result = result.filter(
            (product) => product.category === productState.currentCategory
        );
    }

    if (productState.currentAnimal !== "all") {
        result = result.filter(
            (product) => product.animal.includes(productState.currentAnimal)
        );
    }

    const keyword = productState.searchKeyword.trim().toLowerCase();

    if (keyword) {
        result = result.filter((product) =>
            [
                product.name,
                product.description,
                product.categoryName,
                product.animalName
            ].join(" ").toLowerCase().includes(keyword)
        );
    }

    switch (productState.sortType) {
        case "name-asc":
            result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
            break;
        case "name-desc":
            result.sort((a, b) => b.name.localeCompare(a.name, "vi"));
            break;
        case "price-asc":
            result.sort((a, b) => a.price - b.price);
            break;
        case "price-desc":
            result.sort((a, b) => b.price - a.price);
            break;
    }

    productState.filteredProducts = result;
    productState.currentPage = Math.min(
        productState.currentPage,
        Math.max(1, getTotalPages())
    );

    renderProducts();
}

function getTotalPages() {
    return Math.ceil(
        productState.filteredProducts.length / productState.itemsPerPage
    );
}

function getPageProducts() {
    const start = (productState.currentPage - 1) * productState.itemsPerPage;
    return productState.filteredProducts.slice(
        start,
        start + productState.itemsPerPage
    );
}

function renderProducts() {
    hide(productLoading);
    hide(productError);
    productsGrid.innerHTML = "";
    productCount.textContent = `${productState.filteredProducts.length} sản phẩm`;

    if (!productState.filteredProducts.length) {
        show(productEmpty);
        hide(productPagination);
        return;
    }

    hide(productEmpty);
    show(productPagination);

    getPageProducts().forEach((product) => {
        productsGrid.appendChild(createProductCard(product));
    });

    renderPagination();
}

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const stockClass =
        product.status === "in-stock"
            ? "status-in-stock"
            : "status-out-of-stock";

    card.innerHTML = `
        <div class="product-card-visual product-accent-${escapeHTML(product.accent)}">
            <span class="product-card-category">${escapeHTML(product.categoryName)}</span>
            <div class="product-card-symbol">${escapeHTML(product.symbol)}</div>
            <span class="product-card-status ${stockClass}">
                ${escapeHTML(product.statusName)}
            </span>
        </div>

        <div class="product-card-content">
            <div class="product-card-heading">
                <h3>${escapeHTML(product.name)}</h3>
                <p class="product-card-animal">${escapeHTML(product.animalName)}</p>
            </div>

            <p class="product-card-description">
                ${escapeHTML(product.description)}
            </p>

            <div class="product-card-footer">
                <div class="product-card-price">
                    <span>Giá tham khảo</span>
                    <strong>${formatCurrency(product.price)}</strong>
                </div>

                <button
                    type="button"
                    class="product-detail-button"
                    data-product-id="${product.id}"
                    aria-label="Xem chi tiết ${escapeHTML(product.name)}"
                >
                    →
                </button>
            </div>
        </div>
    `;

    card.querySelector(".product-detail-button")
        .addEventListener("click", () => openProductModal(product.id));

    return card;
}

function renderPagination() {
    const totalPages = getTotalPages();
    paginationPages.innerHTML = "";

    previousPageButton.disabled = productState.currentPage <= 1;
    nextPageButton.disabled = productState.currentPage >= totalPages;

    for (let page = 1; page <= totalPages; page += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = page;

        if (page === productState.currentPage) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => changePage(page));
        paginationPages.appendChild(button);
    }
}

function changePage(page) {
    if (page < 1 || page > getTotalPages()) return;

    productState.currentPage = page;
    renderProducts();

    $("#productSection")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function openProductModal(productId) {
    const product = productState.products.find(
        (item) => item.id === Number(productId)
    );

    if (!product || !productModal) return;

    $("#productModalImage").textContent = product.symbol;
    $("#productModalImage").className =
        `product-modal-image product-accent-${product.accent}`;
    $("#productModalCategory").textContent = product.categoryName;
    $("#productModalTitle").textContent = product.name;
    $("#productModalDescription").textContent = product.description;
    $("#productModalAnimal").textContent = product.animalName;
    $("#productModalStatus").textContent = product.statusName;
    $("#productModalPrice").textContent = formatCurrency(product.price);

    addToConsultationButton.dataset.productId = String(product.id);
    show(productModal);
    document.body.classList.add("modal-open");
}

function closeProductModal() {
    hide(productModal);
    document.body.classList.remove("modal-open");
}

function resetFilters() {
    productState.currentCategory = "all";
    productState.currentAnimal = "all";
    productState.searchKeyword = "";
    productState.sortType = "default";
    productState.currentPage = 1;

    productSearch.value = "";
    animalFilter.value = "all";
    productSort.value = "default";

    categoryButtons.forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.category === "all"
        );
    });

    applyFilters();
}

let searchTimer;

productSearch?.addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        productState.searchKeyword = event.target.value;
        productState.currentPage = 1;
        applyFilters();
    }, 220);
});

categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        categoryButtons.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");

        productState.currentCategory = button.dataset.category || "all";
        productState.currentPage = 1;
        applyFilters();
    });
});

animalFilter?.addEventListener("change", (event) => {
    productState.currentAnimal = event.target.value;
    productState.currentPage = 1;
    applyFilters();
});

productSort?.addEventListener("change", (event) => {
    productState.sortType = event.target.value;
    productState.currentPage = 1;
    applyFilters();
});

previousPageButton?.addEventListener(
    "click",
    () => changePage(productState.currentPage - 1)
);

nextPageButton?.addEventListener(
    "click",
    () => changePage(productState.currentPage + 1)
);

retryProductsButton?.addEventListener("click", loadProducts);
resetFilterButton?.addEventListener("click", resetFilters);
closeProductModalButton?.addEventListener("click", closeProductModal);
closeProductDetailButton?.addEventListener("click", closeProductModal);

productModal?.addEventListener("click", (event) => {
    if (event.target === productModal) closeProductModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
});

addToConsultationButton?.addEventListener("click", () => {
    const productId = Number(addToConsultationButton.dataset.productId);
    const product = productState.products.find((item) => item.id === productId);

    if (!product) return;

    localStorage.setItem(
        "avmConsultationProduct",
        JSON.stringify({ id: product.id, name: product.name })
    );

    window.location.href = "./support.html";
});

document.addEventListener("DOMContentLoaded", loadProducts);