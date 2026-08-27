const mainElement = document.getElementsByTagName("main")[0];
if (mainElement) {
    mainElement.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        alert("Right-click is disabled");
    });
}

// =====================================
// HELPER FUNCTIONS
// =====================================

// Converts hyphenated filenames into clean, Title-Cased headings
function toTitleCase(str) {
    if (!str) return "";
    return str
        .replaceAll("-", " ")
        .replace(/&/g, " & ")
        .replace(/\s+/g, " ")
        .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1));
}

// Safely compare relative URLs across local dev servers and production
function normalizePath(path) {
    return path
        .toLowerCase()
        .replace(".html", "")
        .replace(/\/$/, ""); // Remove trailing slash
}

// Get correct data object (fallback to advancedTallyCourse or acourseData if globally defined)
function getCourseData() {
    return window.acourseData || window.advancedTallyCourseData || window.advancedTallyCourse || null;
}

// =====================================
// HEADER & FOOTER ASYNC FETCH
// =====================================

fetch("/TallyPrime/assets/aheader.html")
    .then(res => res.text())
    .then(data => {
        const header = document.getElementById("header");
        if (header) header.innerHTML = data;
    })
    .catch(err => console.error("Error loading header:", err));

fetch("/TallyPrime/assets/footer.html")
    .then(res => res.text())
    .then(data => {
        const footer = document.getElementById("footer");
        if (footer) footer.innerHTML = data;
    })
    .catch(err => console.error("Error loading footer:", err));

// =====================================
// SIDEBAR RENDERER
// =====================================

const sidebar = document.getElementById("sidebar");

function renderSidebar() {
    const courseData = getCourseData();
    if (!sidebar || !courseData) return;

    let html = "";

    courseData.forEach(module => {
        html += `
            <details>
                <summary>${module.module}</summary>
                <ul>
        `;

        module.topics.forEach(topic => {
            const title = toTitleCase(topic);

            html += `
                <li>
                    <a href="/TallyPrime/advance-tally/${module.folder}/${topic}.html">
                        ${title}
                    </a>
                </li>
            `;
        });

        html += `
                </ul>
            </details>
        `;
    });

    sidebar.innerHTML = html;
    highlightCurrentPage();
}

// =====================================
// ACTIVE PAGE HIGHLIGHTER
// =====================================

function highlightCurrentPage() {
    const currentPath = normalizePath(location.pathname);

    document.querySelectorAll("#sidebar a").forEach(link => {
        const url = new URL(link.href);

        if (normalizePath(url.pathname) === currentPath) {
            link.classList.add("active");

            const details = link.closest("details");
            if (details) {
                details.open = true;
            }
        }
    });
}

// =====================================
// TOPIC TITLE & DOCUMENT TITLE
// =====================================

function setTopicTitle() {
    const h1 = document.getElementById("topicTitle");
    
    // Extract filename from path
    const rawFileName = location.pathname
        .split("/")
        .pop()
        .replace(".html", "");

    if (!rawFileName) return;

    const formattedTitle = toTitleCase(rawFileName);

    if (h1) h1.textContent = formattedTitle;
    document.title = formattedTitle;
}

// =====================================
// DATA LOOKUP HELPER
// =====================================

function getCurrentTopicData() {
    const courseData = getCourseData();
    if (!courseData) return null;
    
    const currentPath = normalizePath(location.pathname);

    for (const module of courseData) {
        for (let i = 0; i < module.topics.length; i++) {
            const topic = module.topics[i];
            const url = `/TallyPrime/advance-tally/${module.folder}/${topic}.html`;

            if (normalizePath(url) === currentPath) {
                return {
                    module,
                    topic,
                    index: i
                };
            }
        }
    }
    return null;
}

// =====================================
// BREADCRUMBS
// =====================================

function renderBreadcrumbs() {
    const container = document.getElementById("breadcrumbs");
    if (!container) return;

    const current = getCurrentTopicData();
    if (!current) return;

    container.innerHTML = `
        <a href="/index.html">Home</a>
        <span>›</span>
        <a href="/Pages/advanced-tally.html">Advanced Tally</a>
        <span>›</span>
        <span>${current.module.module}</span>
        <span>›</span>
        <strong>${toTitleCase(current.topic)}</strong>
    `;
}

// =====================================
// MODULE PROGRESS LIST WITH PERCENTAGE BAR
// =====================================

function renderModuleProgress() {
    const container = document.getElementById("moduleProgress");
    if (!container) return;

    const current = getCurrentTopicData();
    if (!current) return;

    const totalTopics = current.module.topics.length;
    const currentIndex = current.index; // 0-based index

    // Calculate percentage based on current progress
    const progressPercent = Math.round(((currentIndex + 1) / totalTopics) * 100);

    let html = `
        <div class="module-progress-card">
            <h3>${current.module.module}</h3>
            <p>Completed (${currentIndex + 1} of ${totalTopics})</p>
            
            <div class="thin-progress-wrapper">
                <div class="progress-tooltip" style="left: ${progressPercent}%">
                    ${progressPercent}%
                </div>
                <div class="percentage-bar-container">
                    <div class="percentage-bar-fill" style="width: ${progressPercent}%;"></div>
                </div>
            </div>

            <ol>
    `;

    current.module.topics.forEach((topic, index) => {
        const active = index === current.index ? "current-topic" : "";

        html += `
            <li class="${active}">
                <a href="/TallyPrime/advance-tally/${current.module.folder}/${topic}.html">
                    ${toTitleCase(topic)}
                </a>
            </li>
        `;
    });

    html += `
            </ol>
        </div>
    `;

    container.innerHTML = html;
}

// =====================================
// STEP NAVIGATION BAR
// =====================================

function renderTopicProgress() {
    const container = document.getElementById("topicProgress");
    if (!container) return;

    const current = getCurrentTopicData();
    if (!current) return;

    const topics = current.module.topics;
    let html = "";

    html += `
        <a class="step-control" href="/TallyPrime/advance-tally/${current.module.folder}/${topics[0]}.html" title="First Topic">«</a>
    `;

    if (current.index > 0) {
        html += `
            <a class="step-control" href="/TallyPrime/advance-tally/${current.module.folder}/${topics[current.index - 1]}.html" title="Previous Topic">‹</a>
        `;
    }

    topics.forEach((topic, index) => {
        const active = index === current.index ? "active" : "";

        html += `
            <a class="topic-step ${active}" 
               title="${toTitleCase(topic)}" 
               href="/TallyPrime/advance-tally/${current.module.folder}/${topic}.html">
                ${index + 1}
            </a>
        `;
    });

    if (current.index < topics.length - 1) {
        html += `
            <a class="step-control" href="/TallyPrime/advance-tally/${current.module.folder}/${topics[current.index + 1]}.html" title="Next Topic">›</a>
        `;
    }

    html += `
        <a class="step-control" href="/TallyPrime/advance-tally/${current.module.folder}/${topics[topics.length - 1]}.html" title="Last Topic">»</a>
    `;

    container.innerHTML = html;
}

// =====================================
// PREVIOUS / NEXT BUTTONS
// =====================================

function renderPrevNext() {
    const containers = document.querySelectorAll("#prev-next");
    if (!containers.length) return;

    const current = getCurrentTopicData();
    if (!current) return;

    let html = "";

    if (current.index > 0) {
        const prev = current.module.topics[current.index - 1];
        html += `
            <a class="prev-topic" href="/TallyPrime/advance-tally/${current.module.folder}/${prev}.html">
                ← ${toTitleCase(prev)}
            </a>
        `;
    }

    if (current.index < current.module.topics.length - 1) {
        const next = current.module.topics[current.index + 1];
        html += `
            <a class="next-topic" href="/TallyPrime/advance-tally/${current.module.folder}/${next}.html">
                ${toTitleCase(next)} →
            </a>
        `;
    }

    containers.forEach(container => {
        container.innerHTML = html;
    });
}

// =====================================
// MOBILE NAVIGATION & OVERLAY TOGGLE
// =====================================

function initMobileNavigation() {
    const nav = document.getElementById("sidebar");
    if (!nav) return;

    let overlay = document.querySelector(".nav-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "nav-overlay";
        document.body.appendChild(overlay);
    }

    function toggleMobileMenu(open) {
        if (open) {
            nav.classList.add("active");
            overlay.classList.add("active");
        } else {
            nav.classList.remove("active");
            overlay.classList.remove("active");
        }
    }

    document.addEventListener("click", e => {
        const navToggle = e.target.closest("#navToggle");
        const insideNav = nav.contains(e.target);
        const isOverlay = e.target.classList.contains("nav-overlay");

        if (navToggle) {
            e.stopPropagation();
            const isCurrentlyActive = nav.classList.contains("active");
            toggleMobileMenu(!isCurrentlyActive);
        } else if (isOverlay || !insideNav) {
            toggleMobileMenu(false);
        }
    });
}

// =====================================
// DOM INITIALIZATION
// =====================================

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar();
    setTopicTitle();
    renderBreadcrumbs();
    renderModuleProgress();
    renderTopicProgress();
    renderPrevNext();
    initMobileNavigation();
});