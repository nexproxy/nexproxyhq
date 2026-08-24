"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initOrderForm();
    restoreSavedOrder();
});

/**
 * Initialize order form behavior.
 */
function initOrderForm() {
    const form = document.querySelector("#order-form");

    if (!form) {
        return;
    }

    const planInputs = form.querySelectorAll('input[name="plan"]');
    const summaryPlan = document.querySelector("#summary-plan");
    const summaryPrice = document.querySelector("#summary-price");

    planInputs.forEach((input) => {
        input.addEventListener("change", () => {
            updateOrderSummary(input, summaryPlan, summaryPrice);
            clearFormError("plan-error");
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const isValid = validateOrderForm(form);

        if (!isValid) {
            return;
        }

        prepareOrderReview(form);
    });
}

/**
 * Update the visible order summary.
 */
function updateOrderSummary(input, summaryPlan, summaryPrice) {
    const planName = input.dataset.planName || "Select a plan";
    const planPrice = input.dataset.planPrice || "";

    summaryPlan.textContent = planName;

    if (planPrice === "custom") {
        summaryPrice.textContent = "Custom";
        return;
    }

    if (planPrice) {
        summaryPrice.textContent = `$${planPrice}`;
        return;
    }

    summaryPrice.textContent = "—";
}

/**
 * Validate the order form.
 */
function validateOrderForm(form) {
    let isValid = true;

    const selectedPlan = form.querySelector(
        'input[name="plan"]:checked'
    );

    const planError = document.querySelector("#plan-error");

    if (!selectedPlan) {
        showFormError(
            planError,
            "Please select a plan before continuing."
        );

        isValid = false;
    } else {
        clearFormError("plan-error");
    }

    const requiredFields = form.querySelectorAll(
        "input[required], select[required], textarea[required]"
    );

    requiredFields.forEach((field) => {
        if (field.name === "plan") {
            return;
        }

        const fieldError = getFieldErrorElement(field);

        if (!field.checkValidity()) {
            field.setAttribute("aria-invalid", "true");

            if (fieldError) {
                fieldError.textContent = getFieldErrorMessage(field);
            }

            isValid = false;
        } else {
            field.removeAttribute("aria-invalid");

            if (fieldError) {
                fieldError.textContent = "";
            }
        }

        field.addEventListener(
            "input",
            () => {
                if (field.checkValidity()) {
                    field.removeAttribute("aria-invalid");

                    if (fieldError) {
                        fieldError.textContent = "";
                    }
                }
            },
            { once: true }
        );
    });

    const consent = form.querySelector("#terms-consent");
    const consentError = document.querySelector("#consent-error");

    if (!consent.checked) {
        showFormError(
            consentError,
            "Please agree to the Terms of Service and Acceptable Use Policy."
        );

        isValid = false;
    } else {
        clearFormError("consent-error");
    }

    if (!isValid) {
        focusFirstInvalidField(form);
    }

    return isValid;
}

/**
 * Prepare the submitted order data for the review step.
 *
 * The actual payment process will be implemented in Sprint 16.
 */
function prepareOrderReview(form) {
    const selectedPlan = form.querySelector(
        'input[name="plan"]:checked'
    );

    if (!selectedPlan) {
        return;
    }

    const orderData = {
        plan: selectedPlan.value,
        planName: selectedPlan.dataset.planName,
        planPrice: selectedPlan.dataset.planPrice,
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        telegram: form.telegram.value.trim(),
        intendedUse: form.intendedUse.value,
        requirements: form.requirements.value.trim(),
        termsConsent: form.termsConsent.checked
    };

    sessionStorage.setItem(
        "nexproxyOrder",
        JSON.stringify(orderData)
    );

    /*
    * Continue to the Order Review page.
    */
    window.location.href = "review/";
}

/**
 * Display a form error message.
 */
function showFormError(element, message) {
    if (!element) {
        return;
    }

    element.textContent = message;
}

/**
 * Clear a form error message.
 */
function clearFormError(id) {
    const element = document.querySelector(`#${id}`);

    if (!element) {
        return;
    }

    element.textContent = "";
}

/**
 * Focus the first invalid field.
 */
function focusFirstInvalidField(form) {
    const invalidField = form.querySelector(
        ":invalid"
    );

    if (invalidField) {
        invalidField.focus();
    }
}


/**
 * Find or create the error element for a form field.
 */
function getFieldErrorElement(field) {
    let errorElement = document.querySelector(
        `#${field.id}-error`
    );

    if (!errorElement) {
        errorElement = document.createElement("p");
        errorElement.className = "form-error";
        errorElement.id = `${field.id}-error`;
        errorElement.setAttribute("role", "alert");

        field.closest(".form-field")?.appendChild(errorElement);
    }

    return errorElement;
}


/**
 * Return a user-friendly validation message.
 */
function getFieldErrorMessage(field) {
    switch (field.id) {
        case "full-name":
            return "Please enter your full name.";

        case "email":
            return "Please enter a valid email address.";

        case "telegram":
            return "Please enter your Telegram username.";

        case "intended-use":
            return "Please select your intended use.";

        default:
            return "Please complete this field.";
    }
}


/**
 * Restore previously entered order information.
 */
function restoreSavedOrder() {
    const storedOrder = sessionStorage.getItem("nexproxyOrder");

    if (!storedOrder) {
        return;
    }

    let orderData;

    try {
        orderData = JSON.parse(storedOrder);
    } catch (error) {
        console.error("Unable to restore saved order data.", error);
        return;
    }

    const form = document.querySelector("#order-form");

    if (!form) {
        return;
    }

    const planInput = form.querySelector(
        `input[name="plan"][value="${orderData.plan}"]`
    );

    if (planInput) {
        planInput.checked = true;

        const summaryPlan = document.querySelector("#summary-plan");
        const summaryPrice = document.querySelector("#summary-price");

        updateOrderSummary(
            planInput,
            summaryPlan,
            summaryPrice
        );
    }

    if (form.fullName && orderData.fullName) {
        form.fullName.value = orderData.fullName;
    }

    if (form.email && orderData.email) {
        form.email.value = orderData.email;
    }

    if (form.telegram && orderData.telegram) {
        form.telegram.value = orderData.telegram;
    }

    if (form.intendedUse && orderData.intendedUse) {
        form.intendedUse.value = orderData.intendedUse;
    }

    if (form.requirements && orderData.requirements) {
        form.requirements.value = orderData.requirements;
    }

    if (form.termsConsent) {
        form.termsConsent.checked = Boolean(
            orderData.termsConsent
        );
    }
}