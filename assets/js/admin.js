"use strict";

/* =========================================================
   NexProxy Admin
   Sprint 17 — Authentication Foundation
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const ADMIN_SUPABASE_URL =
    "https://fzvxuhumtebqlpwqpkvt.supabase.co";

const ADMIN_LOGIN_VIEW_ID =
    "admin-login-view";

const ADMIN_ACCESS_DENIED_VIEW_ID =
    "admin-access-denied-view";

const ADMIN_DASHBOARD_VIEW_ID =
    "admin-dashboard-view";


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const adminState = {
    supabase: null,
    session: null,
    user: null,
    isAdmin: false,
    initialized: false,
    loading: false
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

/**
 * Return an element by ID.
 */
function adminElement(id) {
    return document.getElementById(id);
}


/**
 * Show an element.
 */
function showAdminElement(element) {
    if (!element) {
        return;
    }

    element.classList.remove("is-hidden");
}


/**
 * Hide an element.
 */
function hideAdminElement(element) {
    if (!element) {
        return;
    }

    element.classList.add("is-hidden");
}


/**
 * Set an element message.
 */
function setAdminMessage(
    element,
    message,
    type = ""
) {
    if (!element) {
        return;
    }

    element.textContent = message || "";

    element.classList.remove(
        "is-error",
        "is-success"
    );

    if (type === "error") {
        element.classList.add("is-error");
    }

    if (type === "success") {
        element.classList.add("is-success");
    }
}


/* =========================================================
   VIEW MANAGEMENT
   ========================================================= */

/**
 * Hide every primary admin view.
 */
function hideAdminViews() {
    hideAdminElement(
        adminElement(ADMIN_LOGIN_VIEW_ID)
    );

    hideAdminElement(
        adminElement(ADMIN_ACCESS_DENIED_VIEW_ID)
    );

    hideAdminElement(
        adminElement(ADMIN_DASHBOARD_VIEW_ID)
    );
}


/**
 * Show login view.
 */
function showAdminLogin() {
    hideAdminViews();

    showAdminElement(
        adminElement(ADMIN_LOGIN_VIEW_ID)
    );

    setAdminLoadingState(false);
}


/**
 * Show access denied view.
 */
function showAdminAccessDenied() {
    hideAdminViews();

    showAdminElement(
        adminElement(ADMIN_ACCESS_DENIED_VIEW_ID)
    );

    setAdminLoadingState(false);
}


/**
 * Show dashboard.
 */
function showAdminDashboard() {
    hideAdminViews();

    showAdminElement(
        adminElement(ADMIN_DASHBOARD_VIEW_ID)
    );

    setAdminLoadingState(false);
}


/* =========================================================
   LOADING STATE
   ========================================================= */

/**
 * Update login button loading state.
 */
function setAdminLoadingState(isLoading) {
    adminState.loading = Boolean(isLoading);

    const loginButton =
        adminElement("admin-login-submit");

    if (!loginButton) {
        return;
    }

    loginButton.disabled =
        adminState.loading;

    loginButton.setAttribute(
        "aria-busy",
        String(adminState.loading)
    );

    loginButton.textContent =
        adminState.loading
            ? "Signing in..."
            : "Login";
}


/* =========================================================
   SUPABASE INITIALIZATION
   ========================================================= */

/**
 * Return the configured Supabase publishable key.
 */
function getAdminSupabasePublishableKey() {
    const key =
        window.NEXPROXY_SUPABASE_PUBLISHABLE_KEY;

    if (
        typeof key !== "string" ||
        !key.trim()
    ) {
        throw new Error(
            "Supabase configuration is unavailable."
        );
    }

    return key.trim();
}


/**
 * Initialize Supabase client.
 */
function initializeAdminSupabase() {
    if (adminState.supabase) {
        return adminState.supabase;
    }

    if (
        typeof window.supabase === "undefined" ||
        typeof window.supabase.createClient !== "function"
    ) {
        throw new Error(
            "Supabase library failed to load."
        );
    }

    const publishableKey =
        getAdminSupabasePublishableKey();

    adminState.supabase =
        window.supabase.createClient(
            ADMIN_SUPABASE_URL,
            publishableKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

    return adminState.supabase;
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

/**
 * Return the current Supabase session.
 */
async function getCurrentAdminSession() {
    const supabase =
        initializeAdminSupabase();

    const {
        data,
        error
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    return data?.session || null;
}


/**
 * Sign in administrator.
 */
async function signInAdmin(
    email,
    password
) {
    const supabase =
        initializeAdminSupabase();

    const {
        data,
        error
    } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw error;
    }

    return data?.session || null;
}


/**
 * Sign out administrator.
 */
async function signOutAdmin() {
    const supabase =
        initializeAdminSupabase();

    const {
        error
    } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }

    adminState.session = null;
    adminState.user = null;
    adminState.isAdmin = false;
}


/* =========================================================
   ADMIN AUTHORIZATION
   ========================================================= */

/**
 * Check whether the authenticated user
 * is registered as an administrator.
 *
 * The actual authorization decision is made
 * server-side by public.is_admin().
 */
async function checkAdminAuthorization() {
    const supabase =
        initializeAdminSupabase();

    if (!adminState.session) {
        adminState.isAdmin = false;

        return false;
    }

    const {
        data,
        error
    } = await supabase.rpc(
        "is_admin"
    );

    if (error) {
        throw error;
    }

    adminState.isAdmin =
        data === true;

    return adminState.isAdmin;
}


/* =========================================================
   CURRENT USER DISPLAY
   ========================================================= */

/**
 * Update the current administrator display.
 */
function updateCurrentAdminDisplay() {
    const element =
        adminElement("admin-current-user");

    if (!element) {
        return;
    }

    const email =
        adminState.user?.email;

    element.textContent =
        email
            ? email
            : "";
}


/* =========================================================
   LOGIN FORM
   ========================================================= */

/**
 * Initialize login form.
 */
function initAdminLoginForm() {
    const form =
        adminElement("admin-login-form");

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            if (adminState.loading) {
                return;
            }

            const emailInput =
                adminElement(
                    "admin-login-email"
                );

            const passwordInput =
                adminElement(
                    "admin-login-password"
                );

            const message =
                adminElement(
                    "admin-login-message"
                );

            const submitButton =
                adminElement(
                    "admin-login-submit"
                );

            const email =
                emailInput?.value
                    ?.trim() || "";

            const password =
                passwordInput?.value || "";

            setAdminMessage(
                message,
                ""
            );

            if (!email) {
                setAdminMessage(
                    message,
                    "Please enter your email.",
                    "error"
                );

                emailInput?.focus();

                return;
            }

            if (!password) {
                setAdminMessage(
                    message,
                    "Please enter your password.",
                    "error"
                );

                passwordInput?.focus();

                return;
            }

            setAdminLoadingState(true);

            if (submitButton) {
                submitButton.disabled = true;
            }

            try {
                const session =
                    await signInAdmin(
                        email,
                        password
                    );

                adminState.session =
                    session;

                adminState.user =
                    session?.user || null;

                /*
                 * Authentication alone does not grant
                 * admin access.
                 *
                 * The database-side is_admin()
                 * function remains the authority.
                 */

                const isAdmin =
                    await checkAdminAuthorization();

                if (!isAdmin) {
                    setAdminMessage(
                        message,
                        "Your account is not authorized to access the admin panel.",
                        "error"
                    );

                    await signOutAdmin();

                    showAdminAccessDenied();

                    return;
                }

                updateCurrentAdminDisplay();

                showAdminDashboard();

                await initializeAdminDashboard();

            } catch (error) {
                console.error(
                    "NexProxy admin login error:",
                    error
                );

                const errorMessage =
                    getFriendlyAuthErrorMessage(
                        error
                    );

                setAdminMessage(
                    message,
                    errorMessage,
                    "error"
                );

            } finally {
                setAdminLoadingState(false);
            }
        }
    );
}


/* =========================================================
   AUTH ERROR HANDLING
   ========================================================= */

/**
 * Convert Supabase authentication errors
 * into user-friendly messages.
 */
function getFriendlyAuthErrorMessage(
    error
) {
    const message =
        error?.message
            ?.trim() || "";

    const normalized =
        message.toLowerCase();

    if (
        normalized.includes(
            "invalid login credentials"
        )
    ) {
        return "Invalid email or password.";
    }

    if (
        normalized.includes(
            "email not confirmed"
        )
    ) {
        return "Your email address has not been confirmed.";
    }

    if (
        normalized.includes(
            "too many requests"
        )
    ) {
        return "Too many login attempts. Please try again later.";
    }

    if (
        normalized.includes(
            "failed to fetch"
        )
    ) {
        return "Unable to connect to the authentication service.";
    }

    if (
        normalized.includes(
            "supabase library failed"
        )
    ) {
        return "The authentication service could not be initialized.";
    }

    if (
        normalized.includes(
            "configuration is unavailable"
        )
    ) {
        return "Supabase configuration is unavailable.";
    }

    return (
        message ||
        "Unable to sign in. Please try again."
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

/**
 * Initialize logout controls.
 */
function initAdminLogout() {
    const logoutButtons = [
        adminElement("admin-logout"),
        adminElement("admin-access-denied-logout")
    ].filter(Boolean);

    logoutButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                async () => {
                    button.disabled = true;

                    try {
                        await signOutAdmin();

                        showAdminLogin();

                        const form =
                            adminElement(
                                "admin-login-form"
                            );

                        form?.reset();

                        setAdminMessage(
                            adminElement(
                                "admin-login-message"
                            ),
                            ""
                        );

                    } catch (error) {
                        console.error(
                            "NexProxy admin logout error:",
                            error
                        );

                        button.disabled = false;

                        showAdminToast(
                            "Unable to sign out. Please try again.",
                            "error"
                        );
                    }
                }
            );
        }
    );
}


/* =========================================================
   AUTH STATE CHANGES
   ========================================================= */

/**
 * Listen for Supabase authentication state changes.
 */
function initAdminAuthListener() {
    const supabase =
        initializeAdminSupabase();

    supabase.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {
            console.log(
                "NexProxy admin auth event:",
                event
            );

            /*
             * SIGNED_OUT
             */

            if (
                event === "SIGNED_OUT"
            ) {
                adminState.session = null;
                adminState.user = null;
                adminState.isAdmin = false;

                showAdminLogin();

                return;
            }

            /*
             * SIGNED_IN / INITIAL_SESSION
             *
             * The initial bootstrap handles
             * the normal authorization flow.
             *
             * Avoid duplicating the entire dashboard
             * initialization during TOKEN_REFRESHED.
             */

            if (
                event === "SIGNED_IN" &&
                session
            ) {
                adminState.session =
                    session;

                adminState.user =
                    session.user;

                try {
                    const isAdmin =
                        await checkAdminAuthorization();

                    if (!isAdmin) {
                        await signOutAdmin();

                        showAdminAccessDenied();

                        return;
                    }

                    updateCurrentAdminDisplay();

                    showAdminDashboard();

                } catch (error) {
                    console.error(
                        "NexProxy admin authorization error:",
                        error
                    );

                    showAdminToast(
                        "Unable to verify administrator access.",
                        "error"
                    );
                }
            }

            /*
             * TOKEN_REFRESHED
             */

            if (
                event === "TOKEN_REFRESHED" &&
                session
            ) {
                adminState.session =
                    session;

                adminState.user =
                    session.user;

                updateCurrentAdminDisplay();
            }
        }
    );
}


/* =========================================================
   DASHBOARD FOUNDATION
   ========================================================= */

/**
 * Initialize dashboard foundation.
 *
 * Data modules will be added in later Sprint 17 stages.
 */
async function initializeAdminDashboard() {
    updateCurrentAdminDisplay();

    try {
        await loadAdminDashboardData();
    } catch (error) {
        console.error(
            "NexProxy admin dashboard load error:",
            error
        );

        showAdminToast(
            "Unable to load dashboard data.",
            "error"
        );

        setCustomerTableMessage(
            "Unable to load customer data."
        );
    }
}

/* =========================================================
   ADMIN DATA LAYER — SPRINT 17
   ========================================================= */

/**
 * Runtime dashboard data.
 */
const adminDashboardState = {
    orders: [],
    assignments: [],
    customers: [],
    customerFilter: "ALL",
    customerSearch: ""
};


/**
 * Load all dashboard data required by the
 * customer overview.
 */
async function loadAdminDashboardData() {
    const supabase =
        initializeAdminSupabase();

    const [
        ordersResult,
        assignmentsResult
    ] = await Promise.all([
        supabase
            .from("orders")
            .select("*")
            .order("created_at", {
                ascending: false
            }),

        supabase
            .from("proxy_assignments")
            .select("*")
            .order("created_at", {
                ascending: false
            })
    ]);

    if (ordersResult.error) {
        throw ordersResult.error;
    }

    if (assignmentsResult.error) {
        throw assignmentsResult.error;
    }

    adminDashboardState.orders =
        Array.isArray(ordersResult.data)
            ? ordersResult.data
            : [];

    adminDashboardState.assignments =
        Array.isArray(assignmentsResult.data)
            ? assignmentsResult.data
            : [];

    adminDashboardState.customers =
        buildAdminCustomerRecords(
            adminDashboardState.orders,
            adminDashboardState.assignments
        );

    renderAdminDashboardStats();

    renderAdminCustomerTable();

    initAdminCustomerControls();

    renderAdminPaymentTable();

    initAdminPaymentControls();
}


/**
 * Build customer-facing records from orders
 * and proxy assignments.
 *
 * One customer row represents one order.
 */
function buildAdminCustomerRecords(
    orders,
    assignments
) {
    return orders.map(
        (order) => {
            const orderAssignments =
                assignments.filter(
                    (assignment) =>
                        assignment.order_id ===
                        order.order_id
                );

            /*
             * The latest assignment is the active
             * operational record when one exists.
             */
            const activeAssignment =
                orderAssignments.find(
                    (assignment) =>
                        assignment.status === "ACTIVE"
                ) ||
                orderAssignments[0] ||
                null;

            return {
                order,
                assignments: orderAssignments,
                assignment: activeAssignment,
                state: getAdminCustomerState(
                    order,
                    activeAssignment
                )
            };
        }
    );
}


/**
 * Determine the display/filter state of a customer.
 *
 * State priority:
 *
 * REPLACED
 * EXPIRED
 * EXPIRING_SOON
 * TRIAL
 * ASSIGNED
 * ACTIVE
 */
function getAdminCustomerState(
    order,
    assignment
) {
    if (!assignment) {
        return "UNASSIGNED";
    }

    if (assignment.status === "REPLACED") {
        return "REPLACED";
    }

    if (assignment.status === "EXPIRED") {
        return "EXPIRED";
    }

    if (assignment.status === "ACTIVE") {

        if (
            assignment.assignment_type ===
            "TRIAL"
        ) {
            return "TRIAL";
        }

        if (
            isAdminAssignmentExpiringSoon(
                assignment.expires_at
            )
        ) {
            return "EXPIRING_SOON";
        }

        if (
            assignment.assignment_type ===
            "ASSIGNED"
        ) {
            return "ASSIGNED";
        }

        return "ACTIVE";
    }

    return "ACTIVE";
}


/**
 * Return true when an active assignment
 * expires within the next 24 hours.
 */
function isAdminAssignmentExpiringSoon(
    expiresAt
) {
    if (!expiresAt) {
        return false;
    }

    const expiry =
        new Date(expiresAt).getTime();

    const now =
        Date.now();

    const twentyFourHours =
        24 * 60 * 60 * 1000;

    return (
        expiry > now &&
        expiry - now <= twentyFourHours
    );
}


/**
 * Calculate dashboard statistics.
 */
function calculateAdminDashboardStats() {
    const customers =
        adminDashboardState.customers;

    const assignments =
        adminDashboardState.assignments;

    return {
        active:
            customers.filter(
                (customer) =>
                    customer.state === "ACTIVE"
            ).length,

        expiringSoon:
            customers.filter(
                (customer) =>
                    customer.state ===
                    "EXPIRING_SOON"
            ).length,

        trials:
            assignments.filter(
                (assignment) =>
                    assignment.status === "ACTIVE" &&
                    assignment.assignment_type ===
                        "TRIAL"
            ).length,

        assigned:
            assignments.filter(
                (assignment) =>
                    assignment.status === "ACTIVE" &&
                    assignment.assignment_type ===
                        "ASSIGNED"
            ).length,

        expired:
            assignments.filter(
                (assignment) =>
                    assignment.status === "EXPIRED"
            ).length,

        replaced:
            assignments.filter(
                (assignment) =>
                    assignment.status === "REPLACED"
            ).length,

        pendingPayments:
            adminDashboardState.orders.filter(
                (order) =>
                    order.payment_status ===
                    "PAYMENT_SUBMITTED"
            ).length
    };
}


/**
 * Render dashboard statistics.
 */
function renderAdminDashboardStats() {
    const stats =
        calculateAdminDashboardStats();

    setAdminStatValue(
        "stat-active",
        stats.active
    );

    setAdminStatValue(
        "stat-expiring-soon",
        stats.expiringSoon
    );

    setAdminStatValue(
        "stat-trials",
        stats.trials
    );

    setAdminStatValue(
        "stat-expired",
        stats.expired
    );

    setAdminStatValue(
        "stat-replaced",
        stats.replaced
    );

    setAdminStatValue(
        "stat-pending-payments",
        stats.pendingPayments
    );
}


/**
 * Safely update a dashboard statistic.
 */
function setAdminStatValue(
    elementId,
    value
) {
    const element =
        adminElement(elementId);

    if (!element) {
        return;
    }

    element.textContent =
        String(
            Number.isFinite(value)
                ? value
                : 0
        );
}


/**
 * Initialize customer search/filter controls.
 */
function initAdminCustomerControls() {
    const filter =
        adminElement("customer-filter");

    const search =
        adminElement("customer-search");

    if (
        filter &&
        !filter.dataset.initialized
    ) {
        filter.addEventListener(
            "change",
            () => {
                adminDashboardState.customerFilter =
                    filter.value || "ALL";

                renderAdminCustomerTable();
            }
        );

        filter.dataset.initialized =
            "true";
    }

    if (
        search &&
        !search.dataset.initialized
    ) {
        search.addEventListener(
            "input",
            () => {
                adminDashboardState.customerSearch =
                    search.value.trim();

                renderAdminCustomerTable();
            }
        );

        search.dataset.initialized =
            "true";
    }
}


/**
 * Return filtered customer records.
 */
function getFilteredAdminCustomers() {
    const filter =
        adminDashboardState.customerFilter;

    const search =
        adminDashboardState.customerSearch
            .toLowerCase();

    return adminDashboardState.customers.filter(
        (customer) => {

            /*
             * Filter.
             */
            if (
                filter !== "ALL" &&
                customer.state !== filter
            ) {
                return false;
            }

            /*
             * Search.
             */
            if (!search) {
                return true;
            }

            const order =
                customer.order;

            const assignment =
                customer.assignment;

            const searchableText = [
                order.order_id,
                order.full_name,
                order.email,
                order.telegram,
                order.plan_name,
                assignment
                    ? assignment.proxy_nickname
                    : "",
                assignment
                    ? assignment.proxy_number
                    : "",
                assignment
                    ? assignment.host
                    : "",
                assignment
                    ? assignment.port
                    : ""
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                search
            );
        }
    );
}


/**
 * Render customer table.
 */
function renderAdminCustomerTable() {
    const tableBody =
        adminElement(
            "customer-table-body"
        );

    if (!tableBody) {
        return;
    }

    const customers =
        getFilteredAdminCustomers();

    tableBody.innerHTML = "";

    if (!customers.length) {
        setCustomerTableMessage(
            adminDashboardState.customers.length
                ? "No customers match the current filter."
                : "No customer records found."
        );

        return;
    }

    setCustomerTableMessage("");

    const fragment =
        document.createDocumentFragment();

    customers.forEach(
        (customer) => {
            fragment.appendChild(
                createAdminCustomerRow(
                    customer
                )
            );
        }
    );

    tableBody.appendChild(
        fragment
    );
}


/**
 * Create one customer table row.
 */
function createAdminCustomerRow(
    customer
) {
    const row =
        document.createElement("tr");

    const order =
        customer.order;

    const assignment =
        customer.assignment;

    const state =
        customer.state;

    const cells = [
        createAdminTableCell(
            formatAdminCustomer(
                order.full_name
            )
        ),

        createAdminTableCell(
            formatAdminContact(
                order.email,
                order.telegram
            )
        ),

        createAdminTableCell(
            formatAdminOrder(
                order.order_id,
                order.plan_name
            )
        ),

        createAdminTableCell(
            assignment
                ? formatAdminProxy(
                    assignment
                )
                : "—"
        ),

        createAdminTableCell(
            formatAdminAssignmentType(
                assignment
            )
        ),

        createAdminTableCell(
            assignment
                ? formatAdminDate(
                    assignment.start_at
                )
                : "—"
        ),

        createAdminTableCell(
            assignment
                ? formatAdminDate(
                    assignment.expires_at
                )
                : "—"
        ),

        createAdminTableCell(
            formatAdminStatus(
                state
            )
        ),

        createAdminActionCell(
            customer
        )
    ];

    cells.forEach(
        (cell) => {
            row.appendChild(cell);
        }
    );

    return row;
}


/**
 * Create safe table cell.
 */
function createAdminTableCell(
    text
) {
    const cell =
        document.createElement("td");

    cell.textContent =
        text || "—";

    return cell;
}


/**
 * Create customer action cell.
 *
 * Detailed customer actions will be wired
 * in the next operational stage.
 */
/**
 * Create customer action cell.
 */
function createAdminActionCell(
    customer
) {
    const cell =
        document.createElement("td");

    const viewButton =
        document.createElement("button");

    viewButton.type = "button";

    viewButton.className =
        "admin-btn admin-btn-secondary admin-btn-small";

    viewButton.textContent =
        "View";

    viewButton.dataset.orderId =
        customer.order.order_id;

    viewButton.addEventListener(
        "click",
        () => {
            openAdminCustomerDetailModal(
                customer
            );
        }
    );

    cell.appendChild(viewButton);

    /*
     * --------------------------------------------------
     * ASSIGN PROXY
     * --------------------------------------------------
     *
     * Only payment-verified orders without an active
     * assignment should expose the Assign action.
     */

    const canAssignProxy =
        customer.order.payment_status ===
            "PAYMENT_VERIFIED" &&
        !customer.assignment;

    if (canAssignProxy) {
        const assignButton =
            document.createElement("button");

        assignButton.type = "button";

        assignButton.className =
            "admin-btn admin-btn-primary admin-btn-small";

        assignButton.textContent =
            "Assign";

        assignButton.dataset.orderId =
            customer.order.order_id;

        assignButton.addEventListener(
            "click",
            () => {
                openAdminAssignProxyModal(
                    customer.order
                );
            }
        );

        cell.appendChild(assignButton);
    }

    return cell;
}

/* =========================================================
   CUSTOMER DETAIL OPERATIONS
   ========================================================= */

/**
 * Open Customer Detail modal.
 */
function openAdminCustomerDetailModal(
    customer
) {
    const modal =
        adminElement(
            "customer-detail-modal"
        );

    const content =
        adminElement(
            "customer-detail-content"
        );

    if (!modal || !content || !customer) {
        return;
    }

    const order =
        customer.order || null;

    const assignment =
        customer.assignment || null;

    if (!order) {
        return;
    }

    content.innerHTML = "";

    const details = [
        [
            "Customer",
            formatAdminCustomer(
                order.full_name
            )
        ],
        [
            "Email",
            order.email || "—"
        ],
        [
            "Telegram",
            order.telegram || "—"
        ],
        [
            "Order ID",
            order.order_id || "—"
        ],
        [
            "Plan",
            order.plan_name || "—"
        ],
        [
            "Price",
            order.plan_price !== null &&
            order.plan_price !== undefined
                ? `$${order.plan_price}`
                : "—"
        ],
        [
            "Payment Status",
            order.payment_status || "—"
        ],
        [
            "Payment Method",
            order.payment_method || "—"
        ],
        [
            "Payment Reference",
            order.payment_reference || "—"
        ],
        [
            "Order Status",
            order.order_status || "—"
        ],
        [
            "Proxy",
            assignment
                ? formatAdminProxy(
                    assignment
                )
                : "Unassigned"
        ],
        [
            "Assignment Type",
            formatAdminAssignmentType(
                assignment
            )
        ],
        [
            "Proxy Status",
            assignment?.status || "—"
        ],
        [
            "Start",
            assignment
                ? formatAdminDate(
                    assignment.start_at
                )
                : "—"
        ],
        [
            "Expiry",
            assignment
                ? formatAdminDate(
                    assignment.expires_at
                )
                : "—"
        ],
        [
            "Duration",
            assignment
                ? `${assignment.duration_days} days`
                : "—"
        ],
        [
            "Extension Days",
            assignment
                ? String(
                    assignment.extension_days || 0
                )
                : "—"
        ]
    ];

    const grid =
        document.createElement("div");

    grid.className =
        "admin-detail-grid";

    details.forEach(
        ([label, value]) => {
            const item =
                document.createElement("div");

            item.className =
                "admin-detail-item";

            const labelElement =
                document.createElement("div");

            labelElement.className =
                "admin-detail-label";

            labelElement.textContent =
                label;

            const valueElement =
                document.createElement("div");

            valueElement.className =
                "admin-detail-value";

            valueElement.textContent =
                value;

            item.appendChild(
                labelElement
            );

            item.appendChild(
                valueElement
            );

            grid.appendChild(
                item
            );
        }
    );

    content.appendChild(grid);


    /*
    * --------------------------------------------------
    * EXTEND SUBSCRIPTION
    * --------------------------------------------------
    *
    * Only active proxy assignments can be extended.
    */
    if (
        assignment &&
        assignment.status === "ACTIVE"
    ) {
        const actions =
            document.createElement("div");

        actions.className =
            "admin-modal-actions";

        const extendButton =
            document.createElement("button");

        extendButton.type =
            "button";

        extendButton.className =
            "admin-btn admin-btn-primary";

        extendButton.textContent =
            "Extend Subscription";

        extendButton.addEventListener(
            "click",
            () => {
                modal.classList.add(
                    "is-hidden"
                );

                openAdminExtensionModal(
                    assignment
                );
            }
        );

        actions.appendChild(
            extendButton
        );

        content.appendChild(
            actions
        );
    }


    modal.classList.remove(
        "is-hidden"
    );
}

/* =========================================================
   EXTENSION OPERATIONS
   ========================================================= */

const adminExtensionState = {
    submitting: false
};


/**
 * Open Extension modal.
 */
function openAdminExtensionModal(
    assignment
) {
    const modal =
        adminElement(
            "extension-modal"
        );

    if (!modal || !assignment) {
        return;
    }

    const form =
        adminElement(
            "extension-form"
        );

    const assignmentIdInput =
        adminElement(
            "extension-assignment-id"
        );

    const currentExpiry =
        adminElement(
            "extension-current-expiry"
        );

    const message =
        adminElement(
            "extension-message"
        );

    if (form) {
        form.reset();
    }

    if (assignmentIdInput) {
        assignmentIdInput.value =
            assignment.id || "";
    }

    if (currentExpiry) {
        currentExpiry.textContent =
            `Current expiry: ${
                assignment.expires_at
                    ? formatAdminDate(
                        assignment.expires_at
                    )
                    : "—"
            }`;
    }

    if (message) {
        setAdminMessage(
            message,
            ""
        );
    }

    modal.classList.remove(
        "is-hidden"
    );
}


/**
 * Close Extension modal.
 */
function closeAdminExtensionModal() {
    const modal =
        adminElement(
            "extension-modal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add(
        "is-hidden"
    );

    const form =
        adminElement(
            "extension-form"
        );

    if (form) {
        form.reset();
    }

    const message =
        adminElement(
            "extension-message"
        );

    if (message) {
        setAdminMessage(
            message,
            ""
        );
    }
}


/**
 * Initialize Extension controls.
 */
function initAdminExtensionControls() {
    const form =
        adminElement(
            "extension-form"
        );

    if (
        form &&
        !form.dataset.initialized
    ) {
        form.addEventListener(
            "submit",
            handleAdminExtensionSubmit
        );

        form.dataset.initialized =
            "true";
    }

    const cancelButton =
        adminElement(
            "extension-cancel"
        );

    if (
        cancelButton &&
        !cancelButton.dataset.initialized
    ) {
        cancelButton.addEventListener(
            "click",
            closeAdminExtensionModal
        );

        cancelButton.dataset.initialized =
            "true";
    }
}


/**
 * Submit Extension.
 */
async function handleAdminExtensionSubmit(
    event
) {
    event.preventDefault();

    if (
        adminExtensionState.submitting
    ) {
        return;
    }

    const assignmentId =
        adminElement(
            "extension-assignment-id"
        )?.value.trim() || "";

    const extensionDays =
        Number(
            adminElement(
                "extension-days"
            )?.value
        );

    const reason =
        adminElement(
            "extension-reason"
        )?.value.trim() || "";

    const message =
        adminElement(
            "extension-message"
        );

    const submitButton =
        adminElement(
            "extension-submit"
        );

    if (!assignmentId) {
        setAdminMessage(
            message,
            "Assignment ID is required.",
            "error"
        );

        return;
    }

    if (
        !Number.isInteger(
            extensionDays
        ) ||
        extensionDays <= 0 ||
        extensionDays > 365
    ) {
        setAdminMessage(
            message,
            "Extension days must be between 1 and 365.",
            "error"
        );

        return;
    }

    adminExtensionState.submitting =
        true;

    if (submitButton) {
        submitButton.disabled =
            true;

        submitButton.textContent =
            "Adding...";
    }

    setAdminMessage(
        message,
        "Adding extension..."
    );

    try {
        const supabase =
            initializeAdminSupabase();

        const {
            data,
            error
        } = await supabase.rpc(
            "extend_proxy_assignment",
            {
                p_assignment_id:
                    assignmentId,
                p_extension_days:
                    extensionDays,
                p_reason:
                    reason || null
            }
        );

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error(
                "Extension was not completed."
            );
        }

        showAdminToast(
            "Subscription extended successfully.",
            "success"
        );

        closeAdminExtensionModal();

        await loadAdminDashboardData();

    } catch (error) {
        console.error(
            "NexProxy admin extension error:",
            error
        );

        setAdminMessage(
            message,
            getFriendlyAdminOperationError(
                error,
                "Unable to extend subscription."
            ),
            "error"
        );

    } finally {
        adminExtensionState.submitting =
            false;

        if (submitButton) {
            submitButton.disabled =
                false;

            submitButton.textContent =
                "Add Extension";
        }
    }
}

/* =========================================================
   PROXY ASSIGNMENT OPERATIONS
   ========================================================= */

const adminAssignmentState = {
    submitting: false
};


/**
 * Open Assign Proxy modal.
 */
function openAdminAssignProxyModal(order) {
    const modal =
        adminElement("assign-proxy-modal");

    if (!modal || !order) {
        return;
    }

    const form =
        adminElement("assign-proxy-form");

    const orderIdInput =
        adminElement("assign-proxy-order-id");

    const message =
        adminElement("assign-proxy-message");

    if (form) {
        form.reset();
    }

    if (orderIdInput) {
        orderIdInput.value =
            order.order_id || "";
    }

    if (message) {
        setAdminMessage(message, "");
    }

    modal.classList.remove("is-hidden");
}


/**
 * Close Assign Proxy modal.
 */
function closeAdminAssignProxyModal() {
    const modal =
        adminElement("assign-proxy-modal");

    if (!modal) {
        return;
    }

    modal.classList.add("is-hidden");

    const form =
        adminElement("assign-proxy-form");

    if (form) {
        form.reset();
    }

    const message =
        adminElement("assign-proxy-message");

    if (message) {
        setAdminMessage(message, "");
    }
}


/**
 * Initialize Proxy Assignment controls.
 */
function initAdminAssignmentControls() {
    const form =
        adminElement("assign-proxy-form");

    if (
        form &&
        !form.dataset.initialized
    ) {
        form.addEventListener(
            "submit",
            handleAdminAssignProxySubmit
        );

        form.dataset.initialized = "true";
    }

    const cancelButton =
        adminElement("assign-proxy-cancel");

    if (
        cancelButton &&
        !cancelButton.dataset.initialized
    ) {
        cancelButton.addEventListener(
            "click",
            closeAdminAssignProxyModal
        );

        cancelButton.dataset.initialized = "true";
    }
}


/**
 * Submit Proxy Assignment.
 */
async function handleAdminAssignProxySubmit(event) {
    event.preventDefault();

    if (adminAssignmentState.submitting) {
        return;
    }

    const orderId =
        adminElement(
            "assign-proxy-order-id"
        )?.value.trim() || "";

    const nickname =
        adminElement(
            "assign-proxy-nickname"
        )?.value.trim() || "";

    const proxyNumber =
        adminElement(
            "assign-proxy-number"
        )?.value.trim() || "";

    const host =
        adminElement(
            "assign-proxy-host"
        )?.value.trim() || "";

    const port =
        adminElement(
            "assign-proxy-port"
        )?.value.trim() || "";

    const assignmentType =
        adminElement(
            "assign-proxy-type"
        )?.value || "ASSIGNED";

    const durationDays =
        Number(
            adminElement(
                "assign-proxy-duration"
            )?.value
        );

    const message =
        adminElement(
            "assign-proxy-message"
        );

    const submitButton =
        adminElement(
            "assign-proxy-submit"
        );


    /* --------------------------------------------------
       VALIDATION
       -------------------------------------------------- */

    if (!orderId) {
        setAdminMessage(
            message,
            "Order ID is required.",
            "error"
        );

        return;
    }

    if (!nickname) {
        setAdminMessage(
            message,
            "Proxy nickname is required.",
            "error"
        );

        return;
    }

    if (!proxyNumber) {
        setAdminMessage(
            message,
            "Proxy number is required.",
            "error"
        );

        return;
    }

    if (
        !["ASSIGNED", "TRIAL"].includes(
            assignmentType
        )
    ) {
        setAdminMessage(
            message,
            "Invalid assignment type.",
            "error"
        );

        return;
    }

    if (
        !Number.isInteger(durationDays) ||
        durationDays <= 0
    ) {
        setAdminMessage(
            message,
            "Duration must be greater than zero.",
            "error"
        );

        return;
    }


    /* --------------------------------------------------
       RPC
       -------------------------------------------------- */

    adminAssignmentState.submitting = true;

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Assigning...";
    }

    setAdminMessage(
        message,
        "Creating proxy assignment..."
    );

    try {
        const supabase =
            initializeAdminSupabase();

        const {
            data,
            error
        } = await supabase.rpc(
            "create_proxy_assignment",
            {
                p_order_id: orderId,
                p_proxy_nickname: nickname,
                p_proxy_number: proxyNumber,
                p_host: host || null,
                p_port: port || null,
                p_assignment_type: assignmentType,
                p_duration_days: durationDays
            }
        );

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error(
                "Proxy assignment was not created."
            );
        }

        closeAdminAssignProxyModal();

        showAdminToast(
            "Proxy assigned successfully.",
            "success"
        );

        await loadAdminDashboardData();

    } catch (error) {
        console.error(
            "NexProxy proxy assignment error:",
            error
        );

        setAdminMessage(
            message,
            getFriendlyAdminOperationError(
                error,
                "Unable to assign proxy."
            ),
            "error"
        );

        showAdminToast(
            "Unable to assign proxy.",
            "error"
        );

    } finally {
        adminAssignmentState.submitting = false;

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Assign Proxy";
        }
    }
}


/**
 * Convert admin operation errors into safe UI messages.
 */
function getFriendlyAdminOperationError(
    error,
    fallback
) {
    const message =
        error?.message || "";

    if (
        message.includes(
            "Admin access required"
        )
    ) {
        return "You do not have permission to perform this action.";
    }

    if (
        message.includes(
            "Payment must be verified"
        )
    ) {
        return "Payment must be verified before assigning a proxy.";
    }

    if (
        message.includes(
            "already has an active proxy"
        )
    ) {
        return "This order already has an active proxy assignment.";
    }

    if (
        message.includes(
            "Order not found"
        )
    ) {
        return "The selected order could not be found.";
    }

    return message || fallback;
}

/**
 * Format customer name.
 */
function formatAdminCustomer(
    value
) {
    return value || "Unknown";
}


/**
 * Format contact information.
 */
function formatAdminContact(
    email,
    telegram
) {
    const parts = [];

    if (email) {
        parts.push(email);
    }

    if (telegram) {
        parts.push(telegram);
    }

    return parts.length
        ? parts.join(" · ")
        : "—";
}


/**
 * Format order information.
 */
function formatAdminOrder(
    orderId,
    planName
) {
    if (!orderId) {
        return planName || "—";
    }

    return planName
        ? `${orderId} · ${planName}`
        : orderId;
}


/**
 * Format proxy information.
 */
function formatAdminProxy(
    assignment
) {
    const parts = [];

    if (assignment.proxy_nickname) {
        parts.push(
            assignment.proxy_nickname
        );
    }

    if (assignment.proxy_number) {
        parts.push(
            `#${assignment.proxy_number}`
        );
    }

    return parts.length
        ? parts.join(" · ")
        : "—";
}


/**
 * Format assignment type.
 */
function formatAdminAssignmentType(
    assignment
) {
    if (!assignment) {
        return "Unassigned";
    }

    if (
        assignment.assignment_type ===
        "TRIAL"
    ) {
        return "Trial";
    }

    return "Assigned";
}


/**
 * Format status label.
 */
function formatAdminStatus(
    state
) {
    const labels = {
        ACTIVE: "Active",
        EXPIRING_SOON: "Expiring Soon",
        ASSIGNED: "Assigned",
        UNASSIGNED: "Awaiting Assignment",
        TRIAL: "Trial",
        EXPIRED: "Expired",
        REPLACED: "Replaced"
    };

    return (
        labels[state] ||
        state ||
        "Unknown"
    );
}


/**
 * Format dates for the admin UI.
 */
function formatAdminDate(
    value
) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(date);
}

/* =========================================================
   PAYMENT OPERATIONS
   ========================================================= */

/**
 * Runtime state for Payment Review.
 */
const adminPaymentState = {
    filter: "SUBMITTED"
};


/**
 * Initialize Payment Review controls.
 */
function initAdminPaymentControls() {
    const filter =
        adminElement("payment-filter");

    if (
        filter &&
        !filter.dataset.initialized
    ) {
        filter.addEventListener(
            "change",
            () => {
                adminPaymentState.filter =
                    filter.value || "SUBMITTED";

                renderAdminPaymentTable();
            }
        );

        filter.dataset.initialized =
            "true";
    }
}


/**
 * Return orders relevant to Payment Review.
 */
function getAdminPaymentRecords() {
    const filter =
        adminPaymentState.filter;

    return adminDashboardState.orders.filter(
        (order) => {
            if (filter === "SUBMITTED") {
                return (
                    order.payment_status ===
                    "PAYMENT_SUBMITTED"
                );
            }

            if (filter === "VERIFIED") {
                return (
                    order.payment_status ===
                    "PAYMENT_VERIFIED"
                );
            }

            return Boolean(
                order.payment_status
            );
        }
    );
}


/**
 * Render Payment Review table.
 */
function renderAdminPaymentTable() {
    const tableBody =
        adminElement(
            "payment-table-body"
        );

    if (!tableBody) {
        return;
    }

    const records =
        getAdminPaymentRecords();

    tableBody.innerHTML = "";

    if (!records.length) {
        setPaymentTableMessage(
            "No payment records found."
        );

        return;
    }

    setPaymentTableMessage("");

    records.forEach(
        (order) => {
            tableBody.appendChild(
                createAdminPaymentRow(order)
            );
        }
    );
}


/**
 * Create one Payment Review row.
 */
function createAdminPaymentRow(order) {
    const row =
        document.createElement("tr");

    const customerCell =
        createAdminTableCell(
            formatAdminPaymentCustomer(order)
        );

    const orderCell =
        createAdminTableCell(
            formatAdminPaymentOrder(order)
        );

    const amountCell =
        createAdminTableCell(
            formatAdminPaymentAmount(
                order.plan_price
            )
        );

    const methodCell =
        createAdminTableCell(
            formatAdminPaymentMethod(
                order.payment_method
            )
        );

    const txidCell =
        createAdminTableCell(
            order.payment_reference
                ? order.payment_reference
                : "—"
        );

    const proofCell =
        createAdminPaymentProofCell(order);

    const statusCell =
        createAdminTableCell(
            formatAdminPaymentStatus(
                order.payment_status
            )
        );

    const actionCell =
        createAdminPaymentActionCell(order);

    row.appendChild(customerCell);
    row.appendChild(orderCell);
    row.appendChild(amountCell);
    row.appendChild(methodCell);
    row.appendChild(txidCell);
    row.appendChild(proofCell);
    row.appendChild(statusCell);
    row.appendChild(actionCell);

    return row;
}


/**
 * Create payment proof cell.
 */
function createAdminPaymentProofCell(order) {
    const cell =
        document.createElement("td");

    /*
     * Payment proof records are stored separately.
     * Until proof lookup/storage integration is added,
     * display a neutral state rather than exposing
     * internal storage paths.
     */

    const proofButton =
        document.createElement("button");

    proofButton.type =
        "button";

    proofButton.className =
        "admin-btn admin-btn-secondary admin-btn-small";

    proofButton.textContent =
        "View";

    proofButton.disabled = true;

    proofButton.title =
        "Payment proof viewer will be enabled in the next payment-proof stage.";

    cell.appendChild(proofButton);

    return cell;
}


/**
 * Create payment action cell.
 */
function createAdminPaymentActionCell(order) {
    const cell =
        document.createElement("td");

    if (
        order.payment_status ===
        "PAYMENT_SUBMITTED"
    ) {
        const button =
            document.createElement("button");

        button.type =
            "button";

        button.className =
            "admin-btn admin-btn-primary admin-btn-small";

        button.textContent =
            "Verify";

        button.dataset.orderId =
            order.order_id;

        button.addEventListener(
            "click",
            () => {
                handleAdminVerifyPayment(
                    order.order_id
                );
            }
        );

        cell.appendChild(button);

        return cell;
    }

    const statusText =
        document.createElement("span");

    statusText.className =
        "admin-action-muted";

    statusText.textContent =
        "—";

    cell.appendChild(statusText);

    return cell;
}


/**
 * Verify one submitted payment.
 */
async function handleAdminVerifyPayment(
    orderId
) {
    if (!orderId) {
        showAdminToast(
            "Order ID is missing.",
            "error"
        );

        return;
    }

    const confirmed =
        window.confirm(
            "Verify payment for order " +
            orderId +
            "?"
        );

    if (!confirmed) {
        return;
    }

    try {
        const supabase =
            initializeAdminSupabase();

        showAdminToast(
            "Verifying payment..."
        );

        const {
            data,
            error
        } = await supabase.rpc(
            "verify_payment",
            {
                p_order_id:
                    orderId
            }
        );

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error(
                "Payment verification returned no data."
            );
        }

        showAdminToast(
            "Payment verified successfully.",
            "success"
        );

        await loadAdminDashboardData();

    } catch (error) {
        console.error(
            "NexProxy payment verification error:",
            error
        );

        showAdminToast(
            getFriendlyPaymentErrorMessage(
                error
            ),
            "error"
        );
    }
}


/**
 * Convert payment verification errors
 * into admin-friendly messages.
 */
function getFriendlyPaymentErrorMessage(
    error
) {
    const message =
        error &&
        typeof error.message === "string"
            ? error.message
            : "";

    if (
        message.includes(
            "Admin access required"
        )
    ) {
        return (
            "Administrator access is required."
        );
    }

    if (
        message.includes(
            "Order not found"
        )
    ) {
        return (
            "Order could not be found."
        );
    }

    if (
        message.includes(
            "Only submitted payments"
        )
    ) {
        return (
            "Only submitted payments can be verified."
        );
    }

    if (
        message.includes(
            "Payment reference is missing"
        )
    ) {
        return (
            "Payment reference is missing."
        );
    }

    if (
        error &&
        error.code === "42501"
    ) {
        return (
            "You do not have permission to verify payments."
        );
    }

    return (
        "Unable to verify payment. Please try again."
    );
}


/**
 * Format customer information for Payment Review.
 */
function formatAdminPaymentCustomer(order) {
    if (!order) {
        return "—";
    }

    return (
        order.full_name ||
        order.email ||
        "—"
    );
}


/**
 * Format order information for Payment Review.
 */
function formatAdminPaymentOrder(order) {
    if (!order) {
        return "—";
    }

    return (
        order.order_id ||
        "—"
    );
}

/**
 * Payment amount formatter.
 */
function formatAdminPaymentAmount(
    amount
) {
    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {
        return "—";
    }

    const numericAmount =
        Number(amount);

    if (
        !Number.isFinite(
            numericAmount
        )
    ) {
        return String(amount);
    }

    return (
        "$" +
        numericAmount.toFixed(2)
    );
}


/**
 * Payment method formatter.
 */
function formatAdminPaymentMethod(
    method
) {
    const labels = {
        USDT: "USDT",
        ACH: "ACH",
        PENDING: "Pending"
    };

    return (
        labels[method] ||
        method ||
        "—"
    );
}


/**
 * Payment status formatter.
 */
function formatAdminPaymentStatus(
    status
) {
    const labels = {
        UNPAID: "Unpaid",
        PAYMENT_SUBMITTED:
            "Payment Submitted",
        PAYMENT_VERIFIED:
            "Payment Verified"
    };

    return (
        labels[status] ||
        status ||
        "Unknown"
    );
}


/**
 * Set Payment Review table message.
 */
function setPaymentTableMessage(
    message
) {
    const element =
        adminElement(
            "payment-table-message"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";
}

/**
 * Update customer table message.
 */
function setCustomerTableMessage(
    message
) {
    const element =
        adminElement(
            "customer-table-message"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message || "";
}


/* =========================================================
   TOAST
   ========================================================= */

/**
 * Show global admin toast.
 */
function showAdminToast(
    message,
    type = ""
) {
    const toast =
        adminElement("admin-toast");

    if (!toast) {
        return;
    }

    toast.textContent =
        message || "";

    toast.classList.remove(
        "is-hidden",
        "is-error",
        "is-success"
    );

    if (type === "error") {
        toast.classList.add(
            "is-error"
        );
    }

    if (type === "success") {
        toast.classList.add(
            "is-success"
        );
    }

    window.clearTimeout(
        showAdminToast.timeoutId
    );

    showAdminToast.timeoutId =
        window.setTimeout(
            () => {
                toast.classList.add(
                    "is-hidden"
                );
            },
            4000
        );
}


/* =========================================================
   MODAL FOUNDATION
   ========================================================= */

/**
 * Close all currently open admin modals.
 */
function closeAllAdminModals() {
    const modals =
        document.querySelectorAll(
            ".admin-modal"
        );

    modals.forEach(
        (modal) => {
            modal.classList.add(
                "is-hidden"
            );
        }
    );
}


/**
 * Initialize generic modal close behavior.
 */
function initAdminModalBehavior() {
    const closeButtons =
        document.querySelectorAll(
            ".admin-modal-close"
        );

    closeButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    const modal =
                        button.closest(
                            ".admin-modal"
                        );

                    if (modal) {
                        modal.classList.add(
                            "is-hidden"
                        );
                    }
                }
            );
        }
    );

    const backdrops =
        document.querySelectorAll(
            ".admin-modal-backdrop"
        );

    backdrops.forEach(
        (backdrop) => {
            backdrop.addEventListener(
                "click",
                () => {
                    const modal =
                        backdrop.closest(
                            ".admin-modal"
                        );

                    if (modal) {
                        modal.classList.add(
                            "is-hidden"
                        );
                    }
                }
            );
        }
    );

    document.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Escape"
            ) {
                closeAllAdminModals();
            }
        }
    );
}


/* =========================================================
   GLOBAL ERROR HANDLING
   ========================================================= */

window.addEventListener(
    "error",
    (event) => {
        console.error(
            "NexProxy admin runtime error:",
            event.error || event.message
        );
    }
);


window.addEventListener(
    "unhandledrejection",
    (event) => {
        console.error(
            "NexProxy admin promise error:",
            event.reason
        );
    }
);


/* =========================================================
   INITIAL APPLICATION BOOTSTRAP
   ========================================================= */

/**
 * Bootstrap the admin application.
 */
async function initializeAdminApplication() {
    if (adminState.initialized) {
        return;
    }

    adminState.initialized = true;

    try {
        /*
         * Supabase CDN is loaded with defer.
         * This script is also deferred, therefore
         * the library should already be available.
         */

        initializeAdminSupabase();

        initAdminLoginForm();

        initAdminLogout();

        initAdminModalBehavior();

        initAdminAssignmentControls();

        initAdminExtensionControls();

        initAdminAuthListener();

        /*
         * Check whether a session already exists.
         */

        const session =
            await getCurrentAdminSession();

        if (!session) {
            showAdminLogin();

            return;
        }

        adminState.session =
            session;

        adminState.user =
            session.user;

        /*
         * Authentication is not enough.
         * Verify database-side admin membership.
         */

        const isAdmin =
            await checkAdminAuthorization();

        if (!isAdmin) {
            showAdminAccessDenied();

            return;
        }

        updateCurrentAdminDisplay();

        showAdminDashboard();

        await initializeAdminDashboard();

    } catch (error) {
        console.error(
            "NexProxy admin initialization error:",
            error
        );

        showAdminLogin();

        setAdminMessage(
            adminElement(
                "admin-login-message"
            ),
            getFriendlyAuthErrorMessage(
                error
            ),
            "error"
        );
    }
}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializeAdminApplication();
    }
);
