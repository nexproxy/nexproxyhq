"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initOrderReview();
});

/**
 * Initialize the order review page.
 */
function initOrderReview() {
    const orderData = getStoredOrder();

    if (!orderData) {
        redirectToOrderForm();
        return;
    }

    populateOrderDetails(orderData);
    populateCustomerDetails(orderData);
    initReviewActions();
}

/**
 * Retrieve the saved order from sessionStorage.
 */
function getStoredOrder() {
    const storedOrder = sessionStorage.getItem("nexproxyOrder");

    if (!storedOrder) {
        return null;
    }

    try {
        return JSON.parse(storedOrder);
    } catch (error) {
        console.error("Unable to read stored order data.", error);
        sessionStorage.removeItem("nexproxyOrder");
        return null;
    }
}

/**
 * Redirect visitors back to the order form when no order exists.
 */
function redirectToOrderForm() {
    window.location.href = "../";
}

/**
 * Populate plan and pricing information.
 */
function populateOrderDetails(orderData) {
    const reviewPlan = document.querySelector("#review-plan");
    const reviewDuration = document.querySelector("#review-duration");
    const reviewPrice = document.querySelector("#review-price");
    const summaryPlan = document.querySelector("#summary-plan");
    const summaryPrice = document.querySelector("#summary-price");
    const trialCreditNote = document.querySelector("#trial-credit-note");

    const planName = orderData.planName || "—";
    const planPrice = orderData.planPrice || "";
    const duration = getPlanDuration(orderData.plan);

    if (reviewPlan) {
        reviewPlan.textContent = planName;
    }

    if (reviewDuration) {
        reviewDuration.textContent = duration;
    }

    if (reviewPrice) {
        reviewPrice.textContent = formatPrice(planPrice);
    }

    if (summaryPlan) {
        summaryPlan.textContent = planName;
    }

    if (summaryPrice) {
        summaryPrice.textContent = formatPrice(planPrice);
    }

    if (trialCreditNote) {
        trialCreditNote.hidden = orderData.plan !== "trial";
    }
}

/**
 * Populate customer information.
 */
function populateCustomerDetails(orderData) {
    const fields = {
        "#review-name": orderData.fullName,
        "#review-email": orderData.email,
        "#review-telegram": orderData.telegram,
        "#review-intended-use": orderData.intendedUse,
        "#review-requirements": orderData.requirements || "None"
    };

    Object.entries(fields).forEach(([selector, value]) => {
        const element = document.querySelector(selector);

        if (!element) {
            return;
        }

        element.textContent = value || "—";
    });
}

/**
 * Initialize review page actions.
 */

/**
 * Initialize review page actions.
 */
function initReviewActions() {
    const confirmButton = document.querySelector("#confirm-order");

    if (!confirmButton) {
        return;
    }

    confirmButton.addEventListener("click", async () => {
        const orderData = getStoredOrder();

        if (!orderData) {
            redirectToOrderForm();
            return;
        }

        const orderId = createLocalOrderId();

        const updatedOrder = {
            ...orderData,
            orderId,
            orderStatus: "PENDING_PAYMENT",
            paymentStatus: "UNPAID"
        };

        confirmButton.disabled = true;
        confirmButton.setAttribute("aria-busy", "true");

        try {
            const supabasePublishableKey =
                window.NEXPROXY_SUPABASE_PUBLISHABLE_KEY;

            if (!supabasePublishableKey) {
                throw new Error(
                    "Supabase configuration is unavailable."
                );
            }

            const response = await fetch(
                "https://fzvxuhumtebqlpwqpkvt.supabase.co/functions/v1/dynamic-action",
                {
                    method: "POST",
                    headers: {
                        "apikey": supabasePublishableKey,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        orderId: updatedOrder.orderId,
                        plan: updatedOrder.plan,
                        planName: updatedOrder.planName,
                        planPrice: updatedOrder.planPrice,
                        fullName: updatedOrder.fullName,
                        email: updatedOrder.email,
                        telegram: updatedOrder.telegram,
                        intendedUse: updatedOrder.intendedUse,
                        requirements: updatedOrder.requirements,
                        termsConsent: updatedOrder.termsConsent
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result?.error ||
                    "Unable to create your order."
                );
            }

            sessionStorage.setItem(
                "nexproxyOrder",
                JSON.stringify(updatedOrder)
            );

            window.location.href = "../../payment/";
        } catch (error) {
            console.error(
                "Unable to create order in Supabase.",
                error
            );

            confirmButton.disabled = false;
            confirmButton.removeAttribute("aria-busy");

            alert(
                "We could not create your order right now. Please try again."
            );
        }
    });
}

/**
 * Return the duration associated with a plan.
 */
function getPlanDuration(plan) {
    switch (plan) {
        case "trial":
            return "3 days";

        case "monthly":
            return "30 days";

        case "bulk":
            return "Custom";

        default:
            return "—";
    }
}

/**
 * Format a stored plan price for display.
 */
function formatPrice(price) {
    if (!price) {
        return "Custom";
    }

    if (price === "custom") {
        return "Custom";
    }

    return `$${price}`;
}


/**
 * Generate a temporary order ID for the launch-stage frontend flow.
 */
function createLocalOrderId() {
    const timestamp = Date.now();
    const randomPart = Math.floor(
        1000 + Math.random() * 9000
    );

    return `NP-${timestamp}-${randomPart}`;
}