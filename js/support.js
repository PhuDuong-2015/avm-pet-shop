/* =========================================================
   AVM PET SHOP
   FILE: js/support.js

   CHỨC NĂNG:
   - Kiểm tra form Pet Support
   - Phân tích tình trạng theo nhóm vấn đề
   - Phát hiện dấu hiệu nguy hiểm
   - Đọc sản phẩm thật từ Firestore
   - Ghép sản phẩm theo vấn đề + vật nuôi
   - Hiển thị sản phẩm phù hợp
   - Chuyển tới đúng sản phẩm trên products.html
========================================================= */

"use strict";


/* =========================================================
   FIREBASE
========================================================= */

import {
    db
} from "./firebase-config.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   1. DOM ELEMENTS
========================================================= */

const supportForm =
    document.querySelector("#supportForm");

const supportAnimal =
    document.querySelector("#supportAnimal");

const supportAge =
    document.querySelector("#supportAge");

const supportProblem =
    document.querySelector("#supportProblem");

const supportSymptoms =
    document.querySelector("#supportSymptoms");

const supportCharacterCount =
    document.querySelector("#supportCharacterCount");

const supportFormMessage =
    document.querySelector("#supportFormMessage");

const resetSupportButton =
    document.querySelector("#resetSupportButton");

const analyzeSupportButton =
    document.querySelector("#analyzeSupportButton");

const analyzeSupportButtonText =
    document.querySelector("#analyzeSupportButtonText");

const supportLoader =
    document.querySelector("#supportLoader");

const supportResultStatus =
    document.querySelector("#supportResultStatus");

const supportResultEmpty =
    document.querySelector("#supportResultEmpty");

const supportResultContent =
    document.querySelector("#supportResultContent");

const supportResultIcon =
    document.querySelector("#supportResultIcon");

const supportResultTitle =
    document.querySelector("#supportResultTitle");

const supportResultDescription =
    document.querySelector("#supportResultDescription");

const supportAiAnalysis =
    document.querySelector("#supportAiAnalysis");

const supportSuggestionList =
    document.querySelector("#supportSuggestionList");

const supportAdviceList =
    document.querySelector("#supportAdviceList");

const supportEmergencyWarning =
    document.querySelector("#supportEmergencyWarning");

const newSupportAnalysisButton =
    document.querySelector("#newSupportAnalysisButton");


/* =========================================================
   2. ERROR ELEMENTS
========================================================= */

const supportErrors = {

    animal:
        document.querySelector(
            "#supportAnimalError"
        ),

    age:
        document.querySelector(
            "#supportAgeError"
        ),

    problem:
        document.querySelector(
            "#supportProblemError"
        ),

    symptoms:
        document.querySelector(
            "#supportSymptomsError"
        )

};


/* =========================================================
   3. STATE
========================================================= */

const supportState = {

    products: [],

    productsLoaded: false,

    lastResult: null

};


/* =========================================================
   4. LABELS
========================================================= */

const animalLabels = {

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


const problemLabels = {

    digestive:
        "Tiêu hóa và hấp thu",

    nutrition:
        "Dinh dưỡng và thể trạng",

    respiratory:
        "Hô hấp",

    skin:
        "Da và lông",

    environment:
        "Môi trường và nguồn nước",

    joint:
        "Xương và khớp",

    other:
        "Vấn đề khác"

};


/* =========================================================
   5. KNOWLEDGE BASE
========================================================= */

const supportKnowledgeBase = {

    digestive: {

        title:
            "Hỗ trợ tiêu hóa và hấp thu",

        description:
            "Các biểu hiện liên quan đến tiêu hóa có thể xuất hiện khi vật nuôi thay đổi thức ăn, mất cân bằng hệ vi sinh, giảm khả năng hấp thu hoặc gặp vấn đề về nguồn nước.",

        advice: [
            "Theo dõi lượng thức ăn và nước uống.",
            "Theo dõi tình trạng phân và tần suất bài tiết.",
            "Không thay đổi khẩu phần quá đột ngột.",
            "Kiểm tra chất lượng thức ăn và nguồn nước.",
            "Liên hệ bác sĩ thú y nếu vật nuôi bỏ ăn hoặc tình trạng kéo dài."
        ]

    },


    nutrition: {

        title:
            "Hỗ trợ dinh dưỡng và thể trạng",

        description:
            "Thể trạng giảm, chậm lớn hoặc kém ăn có thể liên quan đến khẩu phần, khả năng hấp thu, stress hoặc nhu cầu dinh dưỡng theo từng giai đoạn.",

        advice: [
            "Theo dõi lượng thức ăn tiêu thụ mỗi ngày.",
            "Đánh giá cân nặng và thể trạng định kỳ.",
            "Đảm bảo vật nuôi được cung cấp đủ nước sạch.",
            "Không bổ sung nhiều sản phẩm cùng lúc khi chưa xác định nhu cầu."
        ]

    },


    respiratory: {

        title:
            "Hỗ trợ theo dõi đường hô hấp",

        description:
            "Ho, thở nhanh, khò khè, chảy nước mũi hoặc khó thở là những dấu hiệu cần được theo dõi cẩn thận.",

        advice: [
            "Giữ môi trường thông thoáng và hạn chế bụi.",
            "Tránh để vật nuôi tiếp xúc trực tiếp với gió lạnh.",
            "Theo dõi nhịp thở và mức độ ăn uống.",
            "Cách ly vật nuôi có dấu hiệu nghi ngờ bệnh truyền nhiễm khi cần.",
            "Liên hệ bác sĩ thú y nếu xuất hiện khó thở hoặc tình trạng nặng dần."
        ]

    },


    skin: {

        title:
            "Hỗ trợ chăm sóc da và lông",

        description:
            "Ngứa, rụng lông, tổn thương da hoặc thay đổi chất lượng lông có thể liên quan đến vệ sinh, ký sinh trùng, dị ứng hoặc dinh dưỡng.",

        advice: [
            "Kiểm tra vùng da bị ảnh hưởng.",
            "Theo dõi mức độ ngứa và rụng lông.",
            "Giữ nơi ở sạch và khô.",
            "Không tự ý sử dụng thuốc của người trên vật nuôi.",
            "Khám thú y nếu có loét, mủ hoặc tổn thương lan rộng."
        ]

    },


    environment: {

        title:
            "Hỗ trợ môi trường và nguồn nước",

        description:
            "Nguồn nước, chất thải, độ ẩm, khí độc và điều kiện vệ sinh có ảnh hưởng trực tiếp đến sức khỏe vật nuôi.",

        advice: [
            "Kiểm tra màu, mùi và chất lượng nguồn nước.",
            "Vệ sinh khu vực nuôi định kỳ.",
            "Kiểm soát chất thải và độ ẩm.",
            "Hạn chế mật độ nuôi quá cao.",
            "Không pha trộn nhiều hóa chất khi chưa xác định tính tương thích."
        ]

    },


    joint: {

        title:
            "Hỗ trợ xương và khớp",

        description:
            "Giảm vận động, khó đứng, cứng khớp hoặc đau khi di chuyển có thể liên quan đến chấn thương, trọng lượng cơ thể, tuổi hoặc dinh dưỡng.",

        advice: [
            "Hạn chế vận động mạnh khi đang đau.",
            "Theo dõi tình trạng sưng hoặc đau.",
            "Kiểm soát cân nặng phù hợp.",
            "Hạn chế nhảy cao hoặc vận động quá sức.",
            "Khám thú y nếu vật nuôi không thể đứng hoặc đi lại bình thường."
        ]

    },


    other: {

        title:
            "Cần đánh giá thêm",

        description:
            "Thông tin hiện tại chưa thuộc nhóm hỗ trợ cụ thể. Cần theo dõi thêm các dấu hiệu để đưa ra đánh giá phù hợp hơn.",

        advice: [
            "Ghi nhận thời điểm bắt đầu xuất hiện dấu hiệu.",
            "Theo dõi ăn uống và vận động.",
            "Theo dõi tình trạng bài tiết.",
            "Không tự ý sử dụng thuốc kê đơn.",
            "Liên hệ bác sĩ thú y nếu tình trạng kéo dài hoặc nặng hơn."
        ]

    }

};


/* =========================================================
   6. TỪ KHÓA NGUY HIỂM
========================================================= */

const emergencyKeywords = [

    "khó thở",
    "không thở",
    "thở gấp",
    "tím tái",
    "co giật",
    "hôn mê",
    "bất tỉnh",
    "chảy máu nhiều",
    "nôn ra máu",
    "đi ngoài ra máu",
    "tiêu chảy ra máu",
    "không đứng được",
    "liệt",
    "ngộ độc",
    "sốt cao"

];


/* =========================================================
   7. PRODUCT MATCH CONFIG
========================================================= */

/*
    Những từ khóa này dùng để tìm sản phẩm thật trong Firestore.

    Ví dụ:
    respiratory:
    - sản phẩm có category / supportTags / description
      chứa respiratory / ho hap / immunity...
*/

const productMatchKeywords = {

    digestive: [
        "digestive",
        "digestion",
        "gut",
        "intestinal",
        "enzyme",
        "probiotic",
        "tieu hoa",
        "tiêu hóa",
        "duong ruot",
        "đường ruột",
        "hap thu",
        "hấp thu"
    ],

    nutrition: [
        "nutrition",
        "vitamin",
        "mineral",
        "growth",
        "electrolyte",
        "dinh duong",
        "dinh dưỡng",
        "tang trong",
        "tăng trọng",
        "dien giai",
        "điện giải"
    ],

    respiratory: [
        "respiratory",
        "breathing",
        "immunity",
        "immune",
        "ho hap",
        "hô hấp",
        "ho",
        "phoi",
        "phổi"
    ],

    skin: [
        "skin",
        "coat",
        "fur",
        "shampoo",
        "da",
        "long",
        "lông"
    ],

    environment: [
        "environment",
        "water",
        "clean",
        "disinfect",
        "clo2",
        "moi truong",
        "môi trường",
        "nguon nuoc",
        "nguồn nước",
        "sat trung",
        "sát trùng"
    ],

    joint: [
        "joint",
        "bone",
        "calcium",
        "d3",
        "khop",
        "khớp",
        "xuong",
        "xương",
        "canxi"
    ],

    other: [
        "vitamin",
        "immunity",
        "nutrition"
    ]

};


/* =========================================================
   8. GENERAL UTILITIES
========================================================= */

function normalizeText(value) {

    return String(
        value ?? ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function showElement(element) {

    element?.classList.remove(
        "hidden"
    );

}


function hideElement(element) {

    element?.classList.add(
        "hidden"
    );

}


function formatCurrency(value) {

    const number =
        Number(value);

    if (
        Number.isNaN(number) ||
        number <= 0
    ) {
        return "Liên hệ";
    }

    return new Intl.NumberFormat(
        "vi-VN",
        {
            style: "currency",
            currency: "VND"
        }
    ).format(number);

}


function getSelectedSeverity() {

    return document.querySelector(
        'input[name="supportSeverity"]:checked'
    )?.value || "mild";

}


/* =========================================================
   9. VALIDATION
========================================================= */

function clearSupportErrors() {

    Object.values(
        supportErrors
    ).forEach(
        (element) => {

            if (element) {
                element.textContent = "";
            }

        }
    );


    [
        supportAnimal,
        supportAge,
        supportProblem,
        supportSymptoms
    ].forEach(
        (field) => {

            field?.classList.remove(
                "input-error"
            );

        }
    );

}


function setSupportError(
    field,
    message
) {

    if (
        supportErrors[field]
    ) {

        supportErrors[field]
            .textContent =
            message;

    }


    const fieldMap = {

        animal:
            supportAnimal,

        age:
            supportAge,

        problem:
            supportProblem,

        symptoms:
            supportSymptoms

    };


    fieldMap[field]
        ?.classList.add(
            "input-error"
        );

}


function validateSupportForm() {

    clearSupportErrors();


    const animal =
        supportAnimal.value;

    const age =
        supportAge.value;

    const problem =
        supportProblem.value;

    const symptoms =
        supportSymptoms
            .value
            .trim();


    let isValid =
        true;


    if (!animal) {

        setSupportError(
            "animal",
            "Vui lòng chọn loại vật nuôi."
        );

        isValid =
            false;

    }


    if (!age) {

        setSupportError(
            "age",
            "Vui lòng chọn độ tuổi."
        );

        isValid =
            false;

    }


    if (!problem) {

        setSupportError(
            "problem",
            "Vui lòng chọn vấn đề cần hỗ trợ."
        );

        isValid =
            false;

    }


    if (
        symptoms.length < 10
    ) {

        setSupportError(
            "symptoms",
            "Vui lòng mô tả rõ hơn, tối thiểu 10 ký tự."
        );

        isValid =
            false;

    }


    return isValid;

}


/* =========================================================
   10. MESSAGE
========================================================= */

function showSupportMessage(
    type,
    message
) {

    if (
        !supportFormMessage
    ) {
        return;
    }


    supportFormMessage.textContent =
        message;


    supportFormMessage.classList.remove(
        "hidden",
        "auth-message-success",
        "auth-message-error"
    );


    supportFormMessage.classList.add(
        type === "success"
            ? "auth-message-success"
            : "auth-message-error"
    );

}


function hideSupportMessage() {

    supportFormMessage
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   11. LOADING
========================================================= */

function setSupportLoading(
    isLoading
) {

    if (
        analyzeSupportButton
    ) {

        analyzeSupportButton.disabled =
            isLoading;

    }


    if (
        analyzeSupportButtonText
    ) {

        analyzeSupportButtonText.textContent =
            isLoading
                ? "Đang phân tích..."
                : "Phân tích thông tin";

    }


    supportLoader
        ?.classList.toggle(
            "hidden",
            !isLoading
        );

}


/* =========================================================
   12. LOAD PRODUCTS FROM FIRESTORE
========================================================= */

async function loadProductsFromFirestore() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        supportState.products =
            snapshot.docs.map(
                (productDoc) => {

                    return {

                        id:
                            productDoc.id,

                        ...productDoc.data()

                    };

                }
            );


        supportState.productsLoaded =
            true;


        console.log(
            "Pet Support loaded products:",
            supportState.products.length
        );


        return supportState.products;

    } catch (error) {

        console.error(
            "Không thể tải sản phẩm từ Firestore:",
            error
        );


        supportState.products =
            [];

        supportState.productsLoaded =
            false;


        return [];

    }

}


/* =========================================================
   13. PRODUCT SEARCH TEXT
========================================================= */

function createProductSearchText(
    product
) {

    const tags =
        Array.isArray(
            product.supportTags
        )
            ? product.supportTags.join(
                " "
            )
            : "";


    const animals =
        Array.isArray(
            product.animals
        )
            ? product.animals.join(
                " "
            )
            : product.animal || "";


    return normalizeText(
        [
            product.name,
            product.category,
            product.description,
            product.shortDescription,
            product.benefit,
            product.usage,
            tags,
            animals
        ].join(" ")
    );

}


/* =========================================================
   14. CHECK PRODUCT STOCK
========================================================= */

function isProductAvailable(
    product
) {

    if (
        product.status ===
        "out-of-stock"
    ) {

        return false;

    }


    if (
        product.status ===
        "out"
    ) {

        return false;

    }


    if (
        product.inStock ===
        false
    ) {

        return false;

    }


    if (
        Number(product.stock) === 0 &&
        product.stock !== undefined
    ) {

        return false;

    }


    return true;

}


/* =========================================================
   15. PRODUCT MATCH SCORE
========================================================= */

function calculateProductScore(
    product,
    problem,
    animal
) {

    let score =
        0;


    const searchText =
        createProductSearchText(
            product
        );


    const keywords =
        productMatchKeywords[
            problem
        ] ||
        productMatchKeywords.other;


    /*
        Match vấn đề
    */

    keywords.forEach(
        (keyword) => {

            if (
                searchText.includes(
                    normalizeText(
                        keyword
                    )
                )
            ) {

                score +=
                    10;

            }

        }
    );


    /*
        Match supportTags
    */

    if (
        Array.isArray(
            product.supportTags
        )
    ) {

        const normalizedTags =
            product.supportTags.map(
                normalizeText
            );


        if (
            normalizedTags.includes(
                normalizeText(
                    problem
                )
            )
        ) {

            score +=
                30;

        }


        if (
            normalizedTags.includes(
                normalizeText(
                    animal
                )
            )
        ) {

            score +=
                20;

        }

    }


    /*
        Match animal field
    */

    const productAnimals =
        Array.isArray(
            product.animals
        )
            ? product.animals
            : [
                product.animal
            ];


    const normalizedAnimals =
        productAnimals
            .filter(Boolean)
            .map(
                normalizeText
            );


    if (
        normalizedAnimals.includes(
            normalizeText(
                animal
            )
        )
    ) {

        score +=
            15;

    }


    /*
        Ưu tiên còn hàng
    */

    if (
        isProductAvailable(
            product
        )
    ) {

        score +=
            5;

    } else {

        score -=
            15;

    }


    return score;

}


/* =========================================================
   16. FIND RECOMMENDED PRODUCTS
========================================================= */

function findRecommendedProducts(
    problem,
    animal
) {

    if (
        supportState.products.length ===
        0
    ) {

        return [];

    }


    const scoredProducts =
        supportState.products.map(
            (product) => {

                return {

                    product,

                    score:
                        calculateProductScore(
                            product,
                            problem,
                            animal
                        )

                };

            }
        );


    scoredProducts.sort(
        (a, b) =>
            b.score -
            a.score
    );


    /*
        Chỉ lấy sản phẩm
        có điểm match > 0
    */

    let recommended =
        scoredProducts
            .filter(
                (item) =>
                    item.score > 0
            )
            .slice(
                0,
                4
            )
            .map(
                (item) =>
                    item.product
            );


    /*
        Nếu chưa match được,
        lấy sản phẩm còn hàng làm dự phòng.
    */

    if (
        recommended.length ===
        0
    ) {

        recommended =
            supportState.products
                .filter(
                    isProductAvailable
                )
                .slice(
                    0,
                    3
                );

    }


    return recommended;

}


/* =========================================================
   17. EMERGENCY DETECTION
========================================================= */

function detectEmergency(
    symptoms,
    severity
) {

    const normalized =
        normalizeText(
            symptoms
        );


    const keywordDetected =
        emergencyKeywords.some(
            (keyword) => {

                return normalized.includes(
                    normalizeText(
                        keyword
                    )
                );

            }
        );


    return (
        severity === "serious" ||
        keywordDetected
    );

}


/* =========================================================
   18. SIMPLE DESCRIPTION ANALYSIS
========================================================= */

/*
    Đây vẫn là phân tích cục bộ.

    Sau này phần này sẽ được thay
    hoặc bổ sung bằng AI API thật.
*/

function analyzeSymptomsText(
    symptoms,
    problem,
    animalName,
    age,
    isEmergency
) {

    const normalized =
        normalizeText(
            symptoms
        );


    const detectedSymptoms =
        [];


    const symptomDictionary = [

        {
            keys: [
                "bo an",
                "biếng ăn",
                "bieng an",
                "khong an"
            ],

            label:
                "giảm hoặc bỏ ăn"
        },

        {
            keys: [
                "ho",
                "khò khè",
                "kho khe"
            ],

            label:
                "biểu hiện ho hoặc khò khè"
        },

        {
            keys: [
                "tho nhanh",
                "thở nhanh",
                "kho tho",
                "khó thở"
            ],

            label:
                "bất thường về nhịp thở"
        },

        {
            keys: [
                "chay nuoc mui",
                "chảy nước mũi"
            ],

            label:
                "chảy nước mũi"
        },

        {
            keys: [
                "tieu chay",
                "tiêu chảy",
                "phan long",
                "phân lỏng"
            ],

            label:
                "rối loạn tiêu hóa"
        },

        {
            keys: [
                "non",
                "nôn",
                "oi",
                "ói"
            ],

            label:
                "nôn hoặc ói"
        },

        {
            keys: [
                "ngua",
                "ngứa",
                "rụng lông",
                "rung long"
            ],

            label:
                "bất thường da hoặc lông"
        },

        {
            keys: [
                "met",
                "mệt",
                "yeu",
                "yếu"
            ],

            label:
                "giảm thể trạng"
        }

    ];


    symptomDictionary.forEach(
        (item) => {

            const matched =
                item.keys.some(
                    (keyword) =>
                        normalized.includes(
                            normalizeText(
                                keyword
                            )
                        )
                );


            if (matched) {

                detectedSymptoms.push(
                    item.label
                );

            }

        }
    );


    const problemName =
        problemLabels[
            problem
        ] ||
        "tình trạng hiện tại";


    let analysis =
        `${animalName} ${age} đang được đánh giá ở nhóm ${problemName.toLowerCase()}.`;


    if (
        detectedSymptoms.length >
        0
    ) {

        analysis +=
            ` Các dấu hiệu được nhận diện gồm ${detectedSymptoms.join(", ")}.`;

    } else {

        analysis +=
            ` Nội dung mô tả cho thấy cần tiếp tục theo dõi các thay đổi về ăn uống, vận động và tình trạng sức khỏe.`;

    }


    if (
        isEmergency
    ) {

        analysis +=
            " Có dấu hiệu hoặc mức độ được đánh dấu nghiêm trọng, vì vậy không nên chỉ dựa vào gợi ý trực tuyến.";

    }


    return analysis;

}


/* =========================================================
   19. BUILD ANALYSIS
========================================================= */

function buildAnalysisResult() {

    const animal =
        supportAnimal.value;

    const age =
        supportAge.value;

    const problem =
        supportProblem.value;

    const symptoms =
        supportSymptoms
            .value
            .trim();

    const severity =
        getSelectedSeverity();


    const knowledge =
        supportKnowledgeBase[
            problem
        ] ||
        supportKnowledgeBase.other;


    const animalName =
        animalLabels[
            animal
        ] ||
        "Vật nuôi";


    const isEmergency =
        detectEmergency(
            symptoms,
            severity
        );


    const recommendedProducts =
        findRecommendedProducts(
            problem,
            animal
        );


    const textAnalysis =
        analyzeSymptomsText(
            symptoms,
            problem,
            animalName,
            age,
            isEmergency
        );


    return {

        animal,

        animalName,

        age,

        problem,

        symptoms,

        severity,

        isEmergency,

        title:
            knowledge.title,

        description:
            `${knowledge.description} Đối tượng đang được đánh giá là ${animalName}, độ tuổi ${age}.`,

        aiAnalysis:
            textAnalysis,

        advice:
            knowledge.advice,

        products:
            recommendedProducts,

        createdAt:
            new Date()
                .toISOString()

    };

}


/* =========================================================
   20. PRODUCT CARD
========================================================= */

function createRecommendedProductCard(
    product
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "support-suggestion-card support-product-recommendation";


    const available =
        isProductAvailable(
            product
        );


    const statusText =
        available
            ? "Còn hàng"
            : "Hết hàng";


    const price =
        formatCurrency(
            product.price
        );


    const category =
        product.categoryName ||
        product.category ||
        "Sản phẩm thú y";


    const description =
        product.shortDescription ||
        product.description ||
        "Xem thông tin chi tiết của sản phẩm.";


    card.innerHTML = `

        <div class="support-product-image-wrapper">

            ${
                product.image
                    ? `
                        <img
                            src="${escapeHTML(product.image)}"
                            alt="${escapeHTML(product.name || "Sản phẩm AVM")}"
                            class="support-product-image"
                        >
                    `
                    : `
                        <div class="support-suggestion-symbol">
                            AVM
                        </div>
                    `
            }

        </div>


        <div class="support-product-information">

            <div class="support-product-top">

                <span class="support-suggestion-category">
                    ${escapeHTML(category)}
                </span>

                <span
                    class="
                        support-product-stock
                        ${
                            available
                                ? "in-stock"
                                : "out-of-stock"
                        }
                    "
                >
                    ${statusText}
                </span>

            </div>


            <h5>
                ${escapeHTML(
                    product.name ||
                    "Sản phẩm AVM"
                )}
            </h5>


            <p>
                ${escapeHTML(
                    description
                )}
            </p>


            <div class="support-product-bottom">

                <strong class="support-product-price">
                    ${price}
                </strong>


                <button
                    type="button"
                    class="support-product-view-button"
                    data-product-id="${escapeHTML(product.id)}"
                >
                    Xem sản phẩm
                </button>

            </div>

        </div>

    `;


    return card;

}


/* =========================================================
   21. RENDER PRODUCTS
========================================================= */

function renderRecommendedProducts(
    products
) {

    if (
        !supportSuggestionList
    ) {
        return;
    }


    supportSuggestionList.innerHTML =
        "";


    if (
        products.length ===
        0
    ) {

        supportSuggestionList.innerHTML = `

            <div class="support-no-product">

                <strong>
                    Chưa tìm thấy sản phẩm phù hợp
                </strong>

                <p>
                    Hệ thống chưa xác định được sản phẩm tương ứng
                    trong dữ liệu hiện tại.
                </p>

                <a
                    href="./products.html"
                    class="button button-outline"
                >
                    Xem tất cả sản phẩm
                </a>

            </div>

        `;

        return;

    }


    products.forEach(
        (product) => {

            supportSuggestionList.appendChild(
                createRecommendedProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   22. RENDER ADVICE
========================================================= */

function renderAdvice(
    adviceList
) {

    supportAdviceList.innerHTML =
        "";


    adviceList.forEach(
        (advice) => {

            const item =
                document.createElement(
                    "li"
                );


            item.textContent =
                advice;


            supportAdviceList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   23. RENDER RESULT
========================================================= */

function renderSupportResult(
    result
) {

    supportState.lastResult =
        result;


    hideElement(
        supportResultEmpty
    );

    showElement(
        supportResultContent
    );


    supportResultStatus.textContent =
        result.isEmergency
            ? "Cần kiểm tra sớm"
            : "Đã phân tích";


    supportResultStatus.classList.toggle(
        "support-status-warning",
        result.isEmergency
    );


    supportResultStatus.classList.toggle(
        "support-status-success",
        !result.isEmergency
    );


    supportResultIcon.textContent =
        result.isEmergency
            ? "!"
            : "✓";


    supportResultIcon.classList.toggle(
        "support-result-icon-warning",
        result.isEmergency
    );


    supportResultTitle.textContent =
        result.title;


    supportResultDescription.textContent =
        result.description;


    if (
        supportAiAnalysis
    ) {

        supportAiAnalysis.textContent =
            result.aiAnalysis;

    }


    renderRecommendedProducts(
        result.products
    );


    renderAdvice(
        result.advice
    );


    supportEmergencyWarning
        .classList.toggle(
            "hidden",
            !result.isEmergency
        );


    supportResultContent
        .scrollIntoView({
            behavior:
                "smooth",

            block:
                "nearest"
        });

}


/* =========================================================
   24. SAVE HISTORY
========================================================= */

function saveSupportHistory(
    result
) {

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    "avmSupportHistory"
                ) ||
                "[]"
            );


        const safeHistory =
            Array.isArray(
                history
            )
                ? history
                : [];


        /*
            Không lưu toàn bộ object product
            quá lớn.
        */

        const historyResult = {

            ...result,

            products:
                result.products.map(
                    (product) => ({
                        id:
                            product.id,

                        name:
                            product.name
                    })
                )

        };


        safeHistory.unshift(
            historyResult
        );


        localStorage.setItem(
            "avmSupportHistory",
            JSON.stringify(
                safeHistory.slice(
                    0,
                    10
                )
            )
        );

    } catch (error) {

        console.error(
            "Không thể lưu lịch sử:",
            error
        );

    }

}


/* =========================================================
   25. FORM SUBMIT
========================================================= */

async function analyzeSupportForm(
    event
) {

    event.preventDefault();


    hideSupportMessage();


    if (
        !validateSupportForm()
    ) {

        showSupportMessage(
            "error",
            "Vui lòng kiểm tra lại các thông tin chưa hợp lệ."
        );

        return;

    }


    setSupportLoading(
        true
    );


    try {

        /*
            Nếu chưa có dữ liệu sản phẩm
            thì tải Firestore.
        */

        if (
            !supportState.productsLoaded
        ) {

            await loadProductsFromFirestore();

        }


        /*
            Delay nhỏ tạo cảm giác xử lý.
        */

        await new Promise(
            (resolve) => {

                setTimeout(
                    resolve,
                    500
                );

            }
        );


        const result =
            buildAnalysisResult();


        renderSupportResult(
            result
        );


        saveSupportHistory(
            result
        );


        showSupportMessage(
            "success",
            result.products.length > 0
                ? `Đã phân tích và tìm thấy ${result.products.length} sản phẩm phù hợp.`
                : "Đã phân tích tình trạng."
        );

    } catch (error) {

        console.error(
            "Pet Support error:",
            error
        );


        showSupportMessage(
            "error",
            "Không thể phân tích thông tin. Vui lòng thử lại."
        );

    } finally {

        setSupportLoading(
            false
        );

    }

}


/* =========================================================
   26. CLICK RECOMMENDED PRODUCT
========================================================= */

supportSuggestionList
    ?.addEventListener(
        "click",
        (event) => {

            const button =
                event.target.closest(
                    ".support-product-view-button"
                );


            if (!button) {
                return;
            }


            const productId =
                button.dataset
                    .productId;


            if (!productId) {
                return;
            }


            /*
                Chuyển sang products.html
                và truyền ID sản phẩm.
            */

            window.location.href =
                `./products.html?product=${encodeURIComponent(productId)}`;

        }
    );


/* =========================================================
   27. CHARACTER COUNT
========================================================= */

supportSymptoms
    ?.addEventListener(
        "input",
        () => {

            let value =
                supportSymptoms.value;


            if (
                value.length >
                500
            ) {

                value =
                    value.slice(
                        0,
                        500
                    );


                supportSymptoms.value =
                    value;

            }


            supportCharacterCount.textContent =
                String(
                    value.length
                );


            supportErrors
                .symptoms
                .textContent =
                "";


            supportSymptoms
                .classList
                .remove(
                    "input-error"
                );


            hideSupportMessage();

        }
    );


/* =========================================================
   28. CLEAR FIELD ERRORS
========================================================= */

supportAnimal
    ?.addEventListener(
        "change",
        () => {

            supportErrors
                .animal
                .textContent =
                "";

            supportAnimal
                .classList
                .remove(
                    "input-error"
                );

            hideSupportMessage();

        }
    );


supportAge
    ?.addEventListener(
        "change",
        () => {

            supportErrors
                .age
                .textContent =
                "";

            supportAge
                .classList
                .remove(
                    "input-error"
                );

            hideSupportMessage();

        }
    );


supportProblem
    ?.addEventListener(
        "change",
        () => {

            supportErrors
                .problem
                .textContent =
                "";

            supportProblem
                .classList
                .remove(
                    "input-error"
                );

            hideSupportMessage();

        }
    );


/* =========================================================
   29. RESET
========================================================= */

function resetSupportForm() {

    supportForm.reset();


    clearSupportErrors();

    hideSupportMessage();


    supportCharacterCount.textContent =
        "0";


    supportResultStatus.textContent =
        "Chưa phân tích";


    supportResultStatus.classList.remove(
        "support-status-warning",
        "support-status-success"
    );


    showElement(
        supportResultEmpty
    );


    hideElement(
        supportResultContent
    );


    hideElement(
        supportEmergencyWarning
    );


    supportSuggestionList.innerHTML =
        "";


    supportState.lastResult =
        null;


    supportAnimal.focus();

}


/* =========================================================
   30. EVENTS
========================================================= */

supportForm
    ?.addEventListener(
        "submit",
        analyzeSupportForm
    );


resetSupportButton
    ?.addEventListener(
        "click",
        resetSupportForm
    );


newSupportAnalysisButton
    ?.addEventListener(
        "click",
        () => {

            resetSupportForm();


            document
                .querySelector(
                    "#supportTool"
                )
                ?.scrollIntoView({
                    behavior:
                        "smooth"
                });

        }
    );


/* =========================================================
   31. INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
            Tải trước sản phẩm Firestore.
        */

        await loadProductsFromFirestore();


        console.log(
            "AVM Pet Support ready."
        );

    }
);