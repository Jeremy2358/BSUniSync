
// =========================================================
// BSUniSync - FACULTY PORTAL DEMONSTRATION
// Original functionality preserved.
// Interactive analytics added using the existing modal system.
// Fixed sample data; no random KPI generation.
// Saved demo actions use browser localStorage.
// =========================================================


// 1. LIVE DATE AND TIME

function updateClock() {
    const now = new Date();

    document.getElementById("date").textContent =
        now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "2-digit"
        });

    document.getElementById("clock").textContent =
        now.toLocaleTimeString("en-US");
}

updateClock();
setInterval(updateClock, 1000);


// 2. DEMONSTRATION DATA

const baseData = {
    it: {
        name: "Information Technology",
        units: 18,
        classes: 6,
        students: 186,
        sete: 4.42,
        pending: 3,
        responded: 145,
        completion: 94,
        standing: {
            good: 115,
            satisfactory: 41,
            atRisk: 20,
            probation: 10
        },
        dimensions: {
            Knowledge: 4.50,
            Communication: 4.35,
            Management: 4.25,
            Assessment: 4.15,
            "Learning Support": 4.30
        }
    },

    ba: {
        name: "Business Analytics",
        units: 18,
        classes: 6,
        students: 164,
        sete: 4.48,
        pending: 2,
        responded: 137,
        completion: 96,
        standing: {
            good: 110,
            satisfactory: 36,
            atRisk: 12,
            probation: 6
        },
        dimensions: {
            Knowledge: 4.60,
            Communication: 4.45,
            Management: 4.40,
            Assessment: 4.35,
            "Learning Support": 4.60
        }
    },

    cs: {
        name: "Computer Science",
        units: 18,
        classes: 6,
        students: 172,
        sete: 4.31,
        pending: 4,
        responded: 127,
        completion: 91,
        standing: {
            good: 100,
            satisfactory: 42,
            atRisk: 20,
            probation: 10
        },
        dimensions: {
            Knowledge: 4.40,
            Communication: 4.25,
            Management: 4.20,
            Assessment: 4.15,
            "Learning Support": 4.30
        }
    }
};

const yearAdjustment = {
    "2026-2027": 0,
    "2025-2026": -2
};

const semesterAdjustment = {
    first: 0,
    second: 1,
    summer: -4
};


// 3. UTILITY FUNCTIONS

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function percentage(part, total) {
    if (!total) return 0;
    return Math.round((part / total) * 100);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function getStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function saveStoredArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}


// 4. CREATE FILTERED DATA

function getDepartmentRecord(department, year, semester) {
    const base = baseData[department];

    const yearChange = yearAdjustment[year] ?? 0;
    const semesterChange = semesterAdjustment[semester] ?? 0;

    const adjustment = yearChange + semesterChange;

    const students = Math.max(
        20,
        base.students + adjustment * 3
    );

    const responded = clamp(
        base.responded + adjustment * 2,
        0,
        students
    );

    const completion = clamp(
        base.completion + adjustment,
        70,
        100
    );

    const good = Math.max(
        0,
        base.standing.good + adjustment * 2
    );

    const satisfactory = Math.max(
        0,
        base.standing.satisfactory + adjustment
    );

    const atRisk = Math.max(
        0,
        base.standing.atRisk - adjustment
    );

    const probation = Math.max(
        0,
        students - good - satisfactory - atRisk
    );

    const dimensions = {};

    Object.entries(base.dimensions).forEach(([name, score]) => {
        dimensions[name] = Number(
            clamp(score + adjustment * 0.01, 3.5, 5).toFixed(2)
        );
    });

    return {
        name: base.name,
        units: base.units,
        classes: base.classes,
        students,
        responded,
        response: percentage(responded, students),
        sete: Number(
            clamp(base.sete + adjustment * 0.01, 3.5, 5).toFixed(2)
        ),
        pending: Math.max(0, base.pending + Math.max(0, adjustment)),
        completion,
        standing: {
            good,
            satisfactory,
            atRisk,
            probation
        },
        dimensions
    };
}


// 5. AGGREGATE DEPARTMENTS

function getDashboardData() {
    const year = document.getElementById("year").value;
    const semester = document.getElementById("semester").value;
    const selectedDepartment = document.getElementById("department").value;

    const departments = Object.keys(baseData).map(key => ({
        key,
        ...getDepartmentRecord(key, year, semester)
    }));

    if (selectedDepartment !== "all") {
        const selected = departments.find(
            department => department.key === selectedDepartment
        );

        return {
            ...selected,
            departments: [selected]
        };
    }

    const totalStudents = departments.reduce(
        (sum, department) => sum + department.students, 0
    );

    const totalResponded = departments.reduce(
        (sum, department) => sum + department.responded, 0
    );

    const totalUnits = departments.reduce(
        (sum, department) => sum + department.units, 0
    );

    const totalClasses = departments.reduce(
        (sum, department) => sum + department.classes, 0
    );

    const totalPending = departments.reduce(
        (sum, department) => sum + department.pending, 0
    );

    const weightedSete = departments.reduce(
        (sum, department) => sum + department.sete * department.responded, 0
    ) / Math.max(totalResponded, 1);

    const weightedCompletion = departments.reduce(
        (sum, department) => sum + department.completion * department.students, 0
    ) / Math.max(totalStudents, 1);

    const standing = {
        good: 0,
        satisfactory: 0,
        atRisk: 0,
        probation: 0
    };

    Object.keys(standing).forEach(key => {
        standing[key] = departments.reduce(
            (sum, department) => sum + department.standing[key], 0
        );
    });

    const dimensionNames = Object.keys(baseData.it.dimensions);
    const dimensions = {};

    dimensionNames.forEach(name => {
        const weightedScore = departments.reduce(
            (sum, department) =>
                sum + department.dimensions[name] * department.responded,
            0
        );

        dimensions[name] = Number(
            (weightedScore / Math.max(totalResponded, 1)).toFixed(2)
        );
    });

    return {
        key: "all",
        name: "All Departments",
        units: totalUnits,
        classes: totalClasses,
        students: totalStudents,
        responded: totalResponded,
        response: percentage(totalResponded, totalStudents),
        sete: Number(weightedSete.toFixed(2)),
        pending: totalPending,
        completion: Number(weightedCompletion.toFixed(1)),
        standing,
        dimensions,
        departments
    };
}


// 6. UPDATE KPI CARDS

function updateKPIs(data) {
    document.getElementById("teachingLoad").textContent =
        data.units + " Units";

    document.getElementById("classes").textContent =
        data.classes + " assigned classes";

    document.getElementById("students").textContent =
        data.students.toLocaleString();

    document.getElementById("sete").textContent =
        data.sete.toFixed(2) + " / 5";

    document.getElementById("pending").textContent =
        data.pending;

    document.getElementById("response").textContent =
        data.response + "%";

    document.getElementById("responseDetail").textContent =
        data.responded + " of " + data.students + " responses";
}


// 7. ENROLLMENT CHART

function updateEnrollmentChart(data) {
    const svg = document.getElementById("enrollmentChart");

    const labels = [
        "S1 '24",
        "S2 '24",
        "S1 '25",
        "S2 '25",
        "S1 '26",
        "S2 '26"
    ];

    const offset = data.key === "it" ? 0 :
        data.key === "ba" ? 2 :
        data.key === "cs" ? -2 : 1;

    const values = [
        82 + offset,
        85 + offset,
        84 + offset,
        89 + offset,
        91 + offset,
        data.completion
    ].map(value => clamp(value, 60, 100));

    const xPositions = [50, 150, 250, 350, 450, 550];

    function yPosition(value) {
        return 190 - ((value - 60) / 40) * 160;
    }

    const gridLines = [100, 90, 80, 70, 60].map(value => {
        const y = yPosition(value);

        return `
            <path d="M40 ${y} H580" stroke="#e8edf2"/>
            <text x="3" y="${y + 4}" fill="#788590" font-size="11">${value}%</text>
        `;
    }).join("");

    const points = values.map((value, index) =>
        `${xPositions[index]},${yPosition(value)}`
    ).join(" ");

    const circles = values.map((value, index) => `
        <circle
            cx="${xPositions[index]}"
            cy="${yPosition(value)}"
            r="5"
            fill="white"
            stroke="#4263eb"
            stroke-width="3"
            tabindex="0"
            role="button"
            aria-label="${labels[index]} enrollment completion: ${value}%"
            style="cursor:pointer"
        />
        <title>${labels[index]}: ${value}%</title>
    `).join("");

    const xLabels = labels.map((label, index) => `
        <text
            x="${xPositions[index] - 5}"
            y="210"
            fill="#788590"
            font-size="11"
        >${label}</text>
    `).join("");

    svg.innerHTML = `
        ${gridLines}
        <polyline
            points="${points}"
            fill="none"
            stroke="#4263eb"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
        />
        ${circles}
        ${xLabels}
    `;
}


// 8. SETE DIMENSION CHART

function updateSeteChart(data) {
    const container = document.getElementById("seteBars");

    container.innerHTML = Object.entries(data.dimensions).map(
        ([name, score]) => `
            <div class="bar-row"
                 tabindex="0"
                 role="button"
                 aria-label="View ${escapeHTML(name)} evaluation details">

                <span>${escapeHTML(name)}</span>

                <div class="track">
                    <div class="fill"
                         style="width:${(score / 5) * 100}%">
                    </div>
                </div>

                <b>${score.toFixed(2)}</b>
            </div>
        `
    ).join("");
}


// 9. ACADEMIC STANDING

function updateStanding(data) {
    const standing = data.standing;
    const total = data.students;

    const good = percentage(standing.good, total);
    const satisfactory = percentage(standing.satisfactory, total);
    const atRisk = percentage(standing.atRisk, total);
    const probation = Math.max(0, 100 - good - satisfactory - atRisk);

    const goodEnd = good;
    const satisfactoryEnd = goodEnd + satisfactory;
    const riskEnd = satisfactoryEnd + atRisk;

    document.getElementById("standingDonut").style.background = `
        conic-gradient(
            #4263eb 0 ${goodEnd}%,
            #20a7c6 ${goodEnd}% ${satisfactoryEnd}%,
            #f2b84b ${satisfactoryEnd}% ${riskEnd}%,
            #e6ebf3 ${riskEnd}% 100%
        )
    `;

    document.getElementById("standingTotal").textContent =
        total.toLocaleString();

    const categories = [
        {
            label: "🔵 Good standing",
            key: "good",
            count: standing.good,
            rate: good
        },
        {
            label: "🟦 Satisfactory",
            key: "satisfactory",
            count: standing.satisfactory,
            rate: satisfactory
        },
        {
            label: "🟡 At risk",
            key: "atRisk",
            count: standing.atRisk,
            rate: atRisk
        },
        {
            label: "⬜ Probation",
            key: "probation",
            count: standing.probation,
            rate: probation
        }
    ];

    document.getElementById("standingLegend").innerHTML =
        categories.map(item => `
            <div tabindex="0"
                 role="button"
                 data-standing="${item.key}"
                 aria-label="View ${item.key} academic standing details">
                ${item.label} ${item.rate}%
            </div>
        `).join("");
}


// 10. ACADEMIC ALERTS

function updateAlerts(data) {
    const container = document.getElementById("academicAlerts");

    const riskRate = percentage(
        data.standing.atRisk + data.standing.probation,
        data.students
    );

    const alerts = [];

    if (riskRate >= 10) {
        alerts.push(`
            <div class="alert red" tabindex="0" role="button">
                <b>⚠ Students Requiring Review</b>
                ${riskRate}% of students are in the at-risk or probation categories.
                Review academic performance and provide appropriate support.
            </div>
        `);
    } else {
        alerts.push(`
            <div class="alert green" tabindex="0" role="button">
                <b>✓ Academic Standing</b>
                ${riskRate}% of students are in the at-risk or probation categories.
                Continue monitoring student progress.
            </div>
        `);
    }

    if (data.response < 80) {
        alerts.push(`
            <div class="alert" tabindex="0" role="button">
                <b>⚠ SETE Response Rate</b>
                Current response rate is ${data.response}%, below the illustrative 80% target.
                Encourage eligible students to participate.
            </div>
        `);
    } else {
        alerts.push(`
            <div class="alert green" tabindex="0" role="button">
                <b>✓ SETE Response Rate</b>
                Current response rate is ${data.response}%, meeting the illustrative 80% target.
            </div>
        `);
    }

    if (data.pending > 0) {
        alerts.push(`
            <div class="alert" tabindex="0" role="button">
                <b>◷ Pending Academic Tasks</b>
                There are ${data.pending} pending grade or academic submission tasks in the selected data.
            </div>
        `);
    }

    container.innerHTML = alerts.join("");
}


// 11. PRIORITY FOLLOW-UP

function updateFollowUp(data) {
    const tbody = document.getElementById("followUpTable");

    tbody.innerHTML = data.departments.map(department => {
        const riskRate = percentage(
            department.standing.atRisk + department.standing.probation,
            department.students
        );

        let indicator;
        let status;
        let statusClass;

        if (riskRate >= 10) {
            indicator = riskRate + "% at risk";
            status = "Review";
            statusClass = "warn";
        } else if (department.response < 80) {
            indicator = department.response + "% response";
            status = "Follow up";
            statusClass = "warn";
        } else {
            indicator = department.sete.toFixed(2) + " SETE";
            status = "On track";
            statusClass = "";
        }

        return `
            <tr tabindex="0"
                role="button"
                aria-label="View ${escapeHTML(department.name)} follow-up details">

                <td>${escapeHTML(department.name)}</td>
                <td>${indicator}</td>
                <td>
                    <span class="status ${statusClass}">${status}</span>
                </td>
            </tr>
        `;
    }).join("");
}


// 12. REFRESH DASHBOARD

function refreshDashboard() {
    const data = getDashboardData();

    updateKPIs(data);
    updateEnrollmentChart(data);
    updateSeteChart(data);
    updateStanding(data);
    updateAlerts(data);
    updateFollowUp(data);

    const year = document.getElementById("year").value;
    const semester = document.getElementById("semester").selectedOptions[0].textContent;

    document.getElementById("profileSemester").textContent =
        "› " + semester.toUpperCase() + " AY " + year.replace("-", "–");
}

["year", "semester", "department"].forEach(id => {
    document.getElementById(id).addEventListener("change", refreshDashboard);
});

document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("year").value = "2026-2027";
    document.getElementById("semester").value = "first";
    document.getElementById("department").value = "all";

    refreshDashboard();
});

refreshDashboard();


// 13. MODAL SYSTEM

let activeModal = null;

function openModal(title, content, footer = "") {
    closeModal();

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "activeModal";

    overlay.innerHTML = `
        <section class="modal"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="modalTitle">

            <div class="modal-header">
                <h2 id="modalTitle">${escapeHTML(title)}</h2>

                <button class="modal-close"
                        type="button"
                        aria-label="Close dialog">×</button>
            </div>

            <div class="modal-body">${content}</div>

            ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
        </section>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    activeModal = overlay;

    overlay.querySelector(".modal-close").addEventListener("click", closeModal);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
    });

    document.addEventListener("keydown", handleModalEscape);

    const firstControl = overlay.querySelector(
        "button, input, select, textarea"
    );

    if (firstControl) firstControl.focus();
}

function handleModalEscape(event) {
    if (event.key === "Escape") closeModal();
}

function closeModal() {
    const modal = document.getElementById("activeModal");

    if (modal) modal.remove();

    activeModal = null;
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", handleModalEscape);
}

function modalMessage(message) {
    const body = document.querySelector("#activeModal .modal-body");

    if (!body) return;

    const existing = body.querySelector(".success-message");

    if (existing) existing.remove();

    body.insertAdjacentHTML(
        "beforeend",
        `<div class="success-message">${escapeHTML(message)}</div>`
    );
}


// 14. ACCOUNT SETTINGS

function openSettings() {
    let saved = {};

    try {
        saved = JSON.parse(localStorage.getItem("bsuSettings") || "{}");
    } catch {
        saved = {};
    }

    openModal("Account Settings", `
        <form id="settingsForm">

            <div class="form-field">
                <label for="settingEmail">Email notification address</label>

                <input
                    id="settingEmail"
                    type="email"
                    value="${escapeHTML(saved.email || "faculty.demo@example.com")}"
                    required
                >
            </div>

            <div class="form-field">
                <label for="settingNotifications">Email notifications</label>

                <select id="settingNotifications">
                    <option value="enabled" ${saved.notifications !== "disabled" ? "selected" : ""}>Enabled</option>
                    <option value="disabled" ${saved.notifications === "disabled" ? "selected" : ""}>Disabled</option>
                </select>
            </div>

            <div class="form-field">
                <label for="settingTheme">Dashboard appearance</label>

                <select id="settingTheme">
                    <option value="light" ${saved.theme !== "system" ? "selected" : ""}>Light</option>
                    <option value="system" ${saved.theme === "system" ? "selected" : ""}>System default</option>
                </select>
            </div>

            <button type="submit">Save Settings</button>
        </form>
    `);

    document.getElementById("settingsForm").addEventListener("submit", event => {
        event.preventDefault();

        const settings = {
            email: document.getElementById("settingEmail").value,
            notifications: document.getElementById("settingNotifications").value,
            theme: document.getElementById("settingTheme").value
        };

        localStorage.setItem("bsuSettings", JSON.stringify(settings));

        modalMessage("Your demonstration settings have been saved.");
    });
}


// 15. SIGN OUT

function signOut() {
    openModal("Sign Out", `
        <p>Are you sure you want to sign out of the BSUniSync demonstration portal?</p>

        <div class="demo-note">
            This action will display the sample signed-out screen.
            No real account session is being terminated.
        </div>
    `, `
        <button type="button"
                class="secondary-button"
                id="cancelSignout">Cancel</button>

        <button type="button"
                id="confirmSignout">Sign Out</button>
    `);

    document.getElementById("cancelSignout").addEventListener("click", closeModal);

    document.getElementById("confirmSignout").addEventListener("click", () => {
        closeModal();

        const screen = document.createElement("div");
        screen.className = "signed-out";
        screen.id = "signedOutScreen";

        screen.innerHTML = `
            <div class="signed-out-card">

                <div class="seal" style="margin:0 auto 15px;">✺</div>

                <h2>You have signed out</h2>

                <p>You have exited the BSUniSync demonstration session.</p>

                <button type="button" id="returnPortal">
                    Return to Demo Portal
                </button>
            </div>
        `;

        document.body.appendChild(screen);

        document.getElementById("returnPortal").addEventListener("click", () => {
            screen.remove();
        });
    });
}


// 16. FACULTY PROFILE

function openProfileEditor() {
    let saved = {};

    try {
        saved = JSON.parse(localStorage.getItem("bsuProfile") || "{}");
    } catch {
        saved = {};
    }

    openModal("Edit Faculty Profile", `
        <form id="profileForm">

            <div class="form-field">
                <label for="facultyName">Faculty name</label>

                <input
                    id="facultyName"
                    value="${escapeHTML(saved.name || "FACULTY MEMBER")}"
                    required
                >
            </div>

            <div class="form-field">
                <label for="facultyProgram">Academic program</label>

                <select id="facultyProgram">
                    <option ${saved.program === "Business Analytics" ? "selected" : ""}>Business Analytics</option>
                    <option ${saved.program === "Information Technology" ? "selected" : ""}>Information Technology</option>
                    <option ${saved.program === "Computer Science" ? "selected" : ""}>Computer Science</option>
                </select>
            </div>

            <div class="form-field">
                <label for="facultyEmail">Email address</label>

                <input
                    id="facultyEmail"
                    type="email"
                    value="${escapeHTML(saved.email || "faculty.demo@example.com")}"
                    required
                >
            </div>

            <div class="demo-note">
                Profile changes are saved locally for demonstration purposes.
            </div>

            <button type="submit">Save Profile</button>
        </form>
    `);

    document.getElementById("profileForm").addEventListener("submit", event => {
        event.preventDefault();

        const profile = {
            name: document.getElementById("facultyName").value,
            program: document.getElementById("facultyProgram").value,
            email: document.getElementById("facultyEmail").value
        };

        localStorage.setItem("bsuProfile", JSON.stringify(profile));

        document.getElementById("profileName").textContent =
            profile.name.toUpperCase();

        modalMessage("Faculty profile updated in this browser.");
    });
}


// 17. CONTACT FACULTY

function openContact() {
    let saved = {};

    try {
        saved = JSON.parse(localStorage.getItem("bsuProfile") || "{}");
    } catch {
        saved = {};
    }

    openModal("Faculty Contact Information", `
        <h3>Faculty Member</h3>

        <p><b>Program:</b> ${escapeHTML(saved.program || "Business Analytics")}</p>

        <p><b>Email:</b> ${escapeHTML(saved.email || "faculty.demo@example.com")}</p>

        <p><b>Campus:</b> Batangas State University – ARASOF-Nasugbu</p>

        <div class="demo-note">
            Contact details shown here are sample information and are not verified university contact records.
        </div>
    `);
}


// 18. QUICK LINKS

const quickLinkContent = {
    mission: {
        title: "University Mission, Vision and Core Values",
        content: `
            <h3>University Mission</h3>
            <p>To develop a world-class university that produces leaders in various fields.</p>

            <h3>University Vision</h3>
            <p>A premier national university that develops leaders in the global knowledge economy.</p>

            <h3>Core Values</h3>
            <ul>
                <li>Patriotism</li>
                <li>Service</li>
                <li>Integrity</li>
                <li>Resilience</li>
                <li>Excellence</li>
            </ul>

            <div class="demo-note">
                This is sample portal content. Refer to official Batangas State University materials for the authoritative wording.
            </div>
        `
    },

    hymn: {
        title: "University Hymn",
        content: `
            <p><b>Batangas State University Hymn</b></p>

            <p>This section represents the university hymn resource.</p>

            <div class="demo-note">
                The official hymn audio or lyrics have not been embedded in this demonstration.
                This button currently opens the hymn information page.
            </div>
        `
    },

    handbook: {
        title: "Faculty Handbook",
        content: `
            <p>The faculty handbook section provides access to institutional guidelines and faculty references.</p>

            <h3>Sample handbook topics</h3>

            <ul>
                <li>Faculty responsibilities</li>
                <li>Academic policies and procedures</li>
                <li>Classroom and instructional guidelines</li>
                <li>Faculty attendance</li>
                <li>Student assessment and grading</li>
                <li>Research and extension activities</li>
            </ul>
        `
    }
};

function openQuickLink(key) {
    const item = quickLinkContent[key];

    if (!item) return;

    openModal(item.title, item.content);
}


// 19. SERVICE DATA

const serviceTitles = {
    schedule: "Class Schedule",
    students: "Class List / Student Records",
    grades: "Grade Submission",
    sete: "Student Evaluation of Teachers",
    profile: "Faculty Profile",
    attendance: "Faculty Attendance",
    consultation: "Consultation / Advising",
    research: "Research and Extension",
    development: "Faculty Development"
};


// 20. CLASS SCHEDULE

function openSchedule() {
    const rows = [
        ["Monday", "8:00–10:00 AM", "Business Analytics", "Room 301"],
        ["Monday", "1:00–3:00 PM", "Data Analytics", "Room 302"],
        ["Tuesday", "9:00–12:00 PM", "Information Systems", "Laboratory 2"],
        ["Wednesday", "8:00–10:00 AM", "Business Analytics", "Room 301"],
        ["Thursday", "1:00–4:00 PM", "Analytics Applications", "Laboratory 1"],
        ["Friday", "9:00–12:00 PM", "Consultation Hours", "Faculty Office"]
    ];

    openModal("Class Schedule", `
        <p>Illustrative weekly faculty timetable.</p>

        <div class="table-scroll">

            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Subject</th>
                        <th>Room</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows.map(row => `
                        <tr>${row.map(cell => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>
                    `).join("")}
                </tbody>
            </table>

        </div>
    `);
}


// 21. STUDENT RECORDS

function openStudents() {
    const students = [
        ["2026-00101", "Alex Santos", "BSIT", "Enrolled"],
        ["2026-00102", "Jamie Reyes", "BSIT", "Enrolled"],
        ["2026-00103", "Taylor Cruz", "BSBA-BA", "Enrolled"],
        ["2026-00104", "Morgan Garcia", "BSBA-BA", "For verification"],
        ["2026-00105", "Casey Mendoza", "BSCS", "Enrolled"]
    ];

    openModal("Class List / Student Records", `
        <p>Sample student roster for demonstration.</p>

        <div class="form-field">
            <label for="studentSearch">Search student</label>
            <input id="studentSearch" placeholder="Search name or student number">
        </div>

        <div class="table-scroll">

            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Student No.</th>
                        <th>Name</th>
                        <th>Program</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody id="studentRows">
                    ${students.map(student => `
                        <tr>${student.map(cell => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>
                    `).join("")}
                </tbody>
            </table>

        </div>
    `);

    document.getElementById("studentSearch").addEventListener("input", event => {
        const query = event.target.value.toLowerCase();

        const filtered = students.filter(student =>
            student.join(" ").toLowerCase().includes(query)
        );

        document.getElementById("studentRows").innerHTML =
            filtered.length
                ? filtered.map(student => `
                    <tr>${student.map(cell => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>
                `).join("")
                : `<tr><td colspan="4">No matching students found.</td></tr>`;
    });
}


// 22. GRADE SUBMISSION

function openGrades() {
    const submissions = getStoredArray("bsuGradeSubmissions");

    openModal("Grade Submission", `
        <p>Encode a sample grade submission.</p>

        <form id="gradeForm">

            <div class="form-field">
                <label for="gradeSubject">Subject</label>

                <select id="gradeSubject" required>
                    <option value="">Select subject</option>
                    <option>Business Analytics</option>
                    <option>Data Analytics</option>
                    <option>Information Systems</option>
                    <option>Analytics Applications</option>
                </select>
            </div>

            <div class="form-field">
                <label for="gradeSection">Section</label>
                <input id="gradeSection" placeholder="e.g. BSIT-BA 3201" required>
            </div>

            <div class="form-field">
                <label for="gradeCount">Number of students graded</label>
                <input id="gradeCount" type="number" min="1" max="100" required>
            </div>

            <button type="submit">Submit Demo Grades</button>

        </form>

        <h3>Saved demo submissions</h3>

        <div id="gradeSubmissionList">
            ${renderGradeSubmissions(submissions)}
        </div>
    `);

    document.getElementById("gradeForm").addEventListener("submit", event => {
        event.preventDefault();

        const submission = {
            subject: document.getElementById("gradeSubject").value,
            section: document.getElementById("gradeSection").value,
            count: Number(document.getElementById("gradeCount").value),
            date: new Date().toLocaleDateString()
        };

        const updated = getStoredArray("bsuGradeSubmissions");

        updated.push(submission);

        saveStoredArray("bsuGradeSubmissions", updated);

        document.getElementById("gradeSubmissionList").innerHTML =
            renderGradeSubmissions(updated);

        event.target.reset();

        modalMessage("Demo grade submission saved in this browser.");
    });
}

function renderGradeSubmissions(items) {
    if (!items.length) {
        return `<p class="empty-message">No demo submissions recorded yet.</p>`;
    }

    return `
        <div class="table-scroll">

            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Section</th>
                        <th>Students</th>
                        <th>Date</th>
                    </tr>
                </thead>

                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${escapeHTML(item.subject)}</td>
                            <td>${escapeHTML(item.section)}</td>
                            <td>${item.count}</td>
                            <td>${escapeHTML(item.date)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

        </div>
    `;
}


// 23. SETE RESULTS

function openSete() {
    const data = getDashboardData();

    openModal("Student Evaluation of Teachers", `
        <p>Summary of illustrative SETE results for the selected filters.</p>

        <h3>Overall SETE Average</h3>

        <p style="font-size:30px;color:#20a34a;font-weight:bold;">
            ${data.sete.toFixed(2)} / 5.00
        </p>

        <h3>Response Participation</h3>

        <p>${data.responded} out of ${data.students} students (${data.response}%)</p>

        <h3>Evaluation Dimensions</h3>

        <table class="modal-table">
            <tbody>
                ${Object.entries(data.dimensions).map(([name, score]) => `
                    <tr>
                        <td>${escapeHTML(name)}</td>
                        <td><b>${score.toFixed(2)} / 5</b></td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `);
}


// 24. FACULTY PROFILE VIEW

function openProfile() {
    let profile = {};

    try {
        profile = JSON.parse(localStorage.getItem("bsuProfile") || "{}");
    } catch {
        profile = {};
    }

    openModal("Faculty Profile", `
        <h3>${escapeHTML(profile.name || "FACULTY MEMBER")}</h3>

        <p><b>Program:</b> ${escapeHTML(profile.program || "Business Analytics")}</p>

        <p><b>Campus:</b> ARASOF-Nasugbu</p>

        <p><b>Faculty Status:</b> Active</p>

        <p><b>Email:</b> ${escapeHTML(profile.email || "faculty.demo@example.com")}</p>

        <button type="button" id="editProfileFromView">
            Edit Profile
        </button>
    `);

    document.getElementById("editProfileFromView").addEventListener(
        "click",
        openProfileEditor
    );
}


// 25. FACULTY ATTENDANCE

function openAttendance() {
    const records = [
        ["November 10, 2026", "Present", "7:45 AM", "4:30 PM"],
        ["November 11, 2026", "Present", "7:52 AM", "4:35 PM"],
        ["November 12, 2026", "Present", "7:48 AM", "4:28 PM"],
        ["November 13, 2026", "Present", "7:55 AM", "4:31 PM"],
        ["November 16, 2026", "Present", "7:50 AM", "—"]
    ];

    openModal("Faculty Attendance", `
        <p>Illustrative attendance record.</p>

        <table class="modal-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                </tr>
            </thead>

            <tbody>
                ${records.map(record => `
                    <tr>${record.map(cell => `<td>${escapeHTML(cell)}</td>`).join("")}</tr>
                `).join("")}
            </tbody>
        </table>
    `);
}


// 26. CONSULTATION / ADVISING

function openConsultation() {
    const appointments = getStoredArray("bsuConsultations");

    openModal("Consultation / Advising", `
        <p>Create a sample student consultation appointment.</p>

        <form id="consultationForm">

            <div class="form-field">
                <label for="consultStudent">Student name</label>
                <input id="consultStudent" required>
            </div>

            <div class="form-field">
                <label for="consultDate">Consultation date</label>
                <input id="consultDate" type="date" required>
            </div>

            <div class="form-field">
                <label for="consultTime">Consultation time</label>
                <input id="consultTime" type="time" required>
            </div>

            <div class="form-field">
                <label for="consultTopic">Consultation topic</label>
                <textarea id="consultTopic" required></textarea>
            </div>

            <button type="submit">Save Appointment</button>

        </form>

        <h3>Saved appointments</h3>

        <div id="consultationList">
            ${renderConsultations(appointments)}
        </div>
    `);

    document.getElementById("consultationForm").addEventListener("submit", event => {
        event.preventDefault();

        const appointment = {
            student: document.getElementById("consultStudent").value,
            date: document.getElementById("consultDate").value,
            time: document.getElementById("consultTime").value,
            topic: document.getElementById("consultTopic").value
        };

        const updated = getStoredArray("bsuConsultations");

        updated.push(appointment);

        saveStoredArray("bsuConsultations", updated);

        document.getElementById("consultationList").innerHTML =
            renderConsultations(updated);

        event.target.reset();

        modalMessage("Consultation appointment saved.");
    });
}

function renderConsultations(items) {
    if (!items.length) {
        return `<p class="empty-message">No appointments recorded yet.</p>`;
    }

    return `
        <table class="modal-table">
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Topic</th>
                </tr>
            </thead>

            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${escapeHTML(item.student)}</td>
                        <td>${escapeHTML(item.date)}</td>
                        <td>${escapeHTML(item.time)}</td>
                        <td>${escapeHTML(item.topic)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}


// 27. RESEARCH AND EXTENSION

function openResearch() {
    openModal("Research and Extension", `
        <p>Illustrative faculty research and extension activity tracker.</p>

        <table class="modal-table">
            <thead>
                <tr>
                    <th>Activity</th>
                    <th>Category</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>Data Analytics Research Proposal</td>
                    <td>Research</td>
                    <td><span class="status warn">In progress</span></td>
                </tr>

                <tr>
                    <td>Digital Literacy Seminar</td>
                    <td>Extension</td>
                    <td><span class="status">Completed</span></td>
                </tr>

                <tr>
                    <td>Student Research Mentoring</td>
                    <td>Research</td>
                    <td><span class="status warn">Ongoing</span></td>
                </tr>
            </tbody>
        </table>
    `);
}


// 28. FACULTY DEVELOPMENT

function openDevelopment() {
    openModal("Faculty Development", `
        <p>Sample faculty training and development opportunities.</p>

        <table class="modal-table">
            <thead>
                <tr>
                    <th>Activity</th>
                    <th>Schedule</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>Outcomes-Based Education Workshop</td>
                    <td>November 20, 2026</td>
                    <td><span class="status warn">Upcoming</span></td>
                </tr>

                <tr>
                    <td>Research Methods Seminar</td>
                    <td>December 4, 2026</td>
                    <td><span class="status warn">Upcoming</span></td>
                </tr>

                <tr>
                    <td>Digital Teaching Tools Training</td>
                    <td>October 15, 2026</td>
                    <td><span class="status">Completed</span></td>
                </tr>
            </tbody>
        </table>
    `);
}


// 29. SERVICE ROUTER

const serviceActions = {
    schedule: openSchedule,
    students: openStudents,
    grades: openGrades,
    sete: openSete,
    profile: openProfile,
    attendance: openAttendance,
    consultation: openConsultation,
    research: openResearch,
    development: openDevelopment
};

document.querySelectorAll("[data-service]").forEach(button => {
    button.addEventListener("click", () => {
        const service = button.dataset.service;

        if (serviceActions[service]) {
            serviceActions[service]();
        }
    });
});


// 30. ANNOUNCEMENTS

const announcements = {
    privacy: {
        title: "Student Data Privacy Advisory",
        body: `
            <p>Faculty members are reminded to protect student records and account credentials.</p>

            <ul>
                <li>Access student information only for authorized academic purposes.</li>
                <li>Do not share account credentials with other individuals.</li>
                <li>Keep printed and digital student records secure.</li>
                <li>Use approved channels when handling confidential academic information.</li>
            </ul>

            <div class="demo-note">
                This is a sample advisory for the portal demonstration.
            </div>
        `
    },

    meeting: {
        title: "Faculty Meeting and Academic Planning Notice",
        body: `
            <p><b>Office:</b> Office of the Dean</p>

            <p><b>Subject:</b> Faculty Meeting and Academic Planning</p>

            <p>Faculty members are reminded to prepare their academic updates, course progress, and items for departmental discussion.</p>

            <div class="demo-note">
                No actual meeting date or venue has been issued in this demonstration.
            </div>
        `
    },

    grades: {
        title: "Deadline for Grade Submission",
        body: `
            <p><b>Subject:</b> Grade Submission Reminder</p>

            <p>Faculty members should review their class records and ensure that grades are complete before the official submission deadline.</p>

            <div class="demo-note">
                This is a sample reminder. Consult the official academic calendar for actual deadlines.
            </div>
        `
    },

    development: {
        title: "Faculty Development Activities",
        body: `
            <p>Faculty members are encouraged to participate in professional development activities, workshops, seminars, and training programs.</p>

            <p>Participation can support instructional improvement and professional growth.</p>

            <div class="demo-note">
                Sample announcement only. Actual activity details should be confirmed through official university channels.
            </div>
        `
    }
};

function openAnnouncement(key) {
    const item = announcements[key];

    if (!item) return;

    openModal(item.title, item.body);
}

document.querySelectorAll("[data-announcement]").forEach(button => {
    button.addEventListener("click", () => {
        openAnnouncement(button.dataset.announcement);
    });
});


// 31. GENERAL ACTION ROUTER

const generalActions = {
    settings: openSettings,
    signout: signOut,
    "edit-profile": openProfileEditor,
    contact: openContact,
    mission: () => openQuickLink("mission"),
    hymn: () => openQuickLink("hymn"),
    handbook: () => openQuickLink("handbook")
};

document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;

        if (generalActions[action]) {
            generalActions[action]();
        }
    });
});


// 32. LOAD SAVED PROFILE

function loadSavedProfile() {
    try {
        const saved = JSON.parse(localStorage.getItem("bsuProfile") || "{}");

        if (saved.name) {
            document.getElementById("profileName").textContent =
                saved.name.toUpperCase();
        }
    } catch (error) {
        console.warn("Could not load saved profile.", error);
    }
}

loadSavedProfile();


// 33. INTERACTIVE ANALYTICS DETAILS
// Uses the existing openModal() function.
// Does not replace any existing action listeners.


// CURRENT FILTER INFORMATION

function getCurrentFilterDescription() {
    const year = document.getElementById("year");
    const semester = document.getElementById("semester");
    const department = document.getElementById("department");

    return {
        year: year.value.replace("-", "–"),
        semester: semester.selectedOptions[0].textContent,
        department: department.selectedOptions[0].textContent
    };
}

function getFilterHTML() {
    const filters = getCurrentFilterDescription();

    return `
        <div class="demo-note">
            <b>Current Dashboard Filters</b><br>
            Academic Year: ${escapeHTML(filters.year)}<br>
            Semester: ${escapeHTML(filters.semester)}<br>
            Department: ${escapeHTML(filters.department)}
        </div>
    `;
}


// KPI CARD DETAILS

function showKpiDetails(index) {
    const data = getDashboardData();

    const details = [
        {
            title: "Teaching Load Details",
            content: `
                <h3>Teaching Workload</h3>

                <p><b>Total teaching units:</b> ${data.units}</p>

                <p><b>Assigned classes:</b> ${data.classes}</p>

                <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>

                <p>This summarizes the teaching workload under the current dashboard filters.</p>
            `
        },

        {
            title: "Enrolled Students Details",
            content: `
                <h3>Student Enrollment</h3>

                <p><b>Total enrolled students:</b> ${data.students}</p>

                <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>

                <p>This figure represents the illustrative enrollment count under the selected filters.</p>
            `
        },

        {
            title: "SETE Average Details",
            content: `
                <h3>Overall SETE Average</h3>

                <p style="font-size:28px;font-weight:bold;color:#20a34a;">
                    ${data.sete.toFixed(2)} / 5.00
                </p>

                <h3>Evaluation Dimensions</h3>

                <table class="modal-table">
                    <thead>
                        <tr>
                            <th>Dimension</th>
                            <th>Average Score</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${Object.entries(data.dimensions).map(([name, score]) => `
                            <tr>
                                <td>${escapeHTML(name)}</td>
                                <td><b>${score.toFixed(2)} / 5.00</b></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>

                <p>Scores should be interpreted together with response rates and other teaching evidence.</p>
            `
        },

        {
            title: "Pending Academic Tasks",
            content: `
                <h3>Pending Tasks Summary</h3>

                <p><b>Number of pending tasks:</b> ${data.pending}</p>

                <p>These represent illustrative grade or academic submission tasks that may require attention.</p>

                <p>Use the Grade Submission service to view and save demonstration submissions.</p>
            `
        },

        {
            title: "SETE Response Rate Details",
            content: `
                <h3>Student Evaluation Participation</h3>

                <p><b>Responses received:</b> ${data.responded}</p>

                <p><b>Total students:</b> ${data.students}</p>

                <p><b>Response rate:</b> ${data.response}%</p>

                <p><b>Illustrative target:</b> 80%</p>

                <p>
                    ${data.response >= 80
                        ? "The current response rate meets the illustrative target."
                        : "The current response rate is below the illustrative target. Eligible students may be encouraged to participate."
                    }
                </p>
            `
        }
    ];

    const item = details[index];

    if (!item) return;

    openModal(
        item.title,
        item.content + getFilterHTML()
    );
}


// ENROLLMENT CHART POINT DETAILS

function showEnrollmentDetails(index) {
    const data = getDashboardData();

    const labels = [
        "First Semester AY 2023–2024",
        "Second Semester AY 2023–2024",
        "First Semester AY 2024–2025",
        "Second Semester AY 2024–2025",
        "First Semester AY 2025–2026",
        "Second Semester AY 2025–2026"
    ];

    const offset = data.key === "it" ? 0 :
        data.key === "ba" ? 2 :
        data.key === "cs" ? -2 : 1;

    const values = [
        82 + offset,
        85 + offset,
        84 + offset,
        89 + offset,
        91 + offset,
        data.completion
    ].map(value => clamp(value, 60, 100));

    if (index < 0 || index >= values.length) return;

    openModal("Enrollment Completion Details", `
        <h3>${labels[index]}</h3>

        <p style="font-size:28px;font-weight:bold;color:#4263eb;">
            ${values[index]}%
        </p>

        <p><b>Completion rate:</b> ${values[index]}%</p>

        <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>

        <p>
            This point represents the enrollment completion rate
            for the selected chart period.
        </p>

        <div class="demo-note">
            Historical chart values are illustrative demonstration figures.
            The final chart point uses the current filtered completion rate.
        </div>

        ${getFilterHTML()}
    `);
}


// SETE DIMENSION DETAILS

function showSeteDimensionDetails(element) {
    const data = getDashboardData();

    const name = element.querySelector("span")?.textContent?.trim();

    if (!name || data.dimensions[name] === undefined) return;

    const score = data.dimensions[name];

    openModal("SETE Evaluation Dimension", `
        <h3>${escapeHTML(name)}</h3>

        <p style="font-size:28px;font-weight:bold;color:#20a34a;">
            ${score.toFixed(2)} / 5.00
        </p>

        <p><b>Evaluation dimension:</b> ${escapeHTML(name)}</p>

        <p><b>Average score:</b> ${score.toFixed(2)} / 5.00</p>

        <p><b>Student responses:</b> ${data.responded}</p>

        <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>

        <div class="demo-note">
            This is an illustrative average score for the selected filters.
            It is not an individual student's evaluation.
        </div>

        ${getFilterHTML()}
    `);
}


// ACADEMIC STANDING DETAILS

function showStandingDetails(element) {
    const data = getDashboardData();

    const key = element.dataset.standing;

    const categories = {
        good: {
            name: "Good Standing",
            count: data.standing.good
        },

        satisfactory: {
            name: "Satisfactory",
            count: data.standing.satisfactory
        },

        atRisk: {
            name: "At Risk",
            count: data.standing.atRisk
        },

        probation: {
            name: "Probation",
            count: data.standing.probation
        }
    };

    const item = categories[key];

    if (!item) return;

    const rate = percentage(item.count, data.students);

    openModal("Student Academic Standing", `
        <h3>${item.name}</h3>

        <p><b>Number of students:</b> ${item.count}</p>

        <p><b>Percentage of enrolled students:</b> ${rate}%</p>

        <p><b>Total enrolled students:</b> ${data.students}</p>

        <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>

        <div class="demo-note">
            This category summarizes the illustrative academic standing distribution.
        </div>

        ${getFilterHTML()}
    `);
}


// ACADEMIC ALERT DETAILS

function showAlertDetails(index) {
    const data = getDashboardData();

    const riskRate = percentage(
        data.standing.atRisk + data.standing.probation,
        data.students
    );

    const alerts = [];

    if (riskRate >= 10) {
        alerts.push({
            title: "Students Requiring Review",
            content: `
                <p><b>At-risk and probation rate:</b> ${riskRate}%</p>

                <p><b>Students requiring review:</b> ${data.standing.atRisk + data.standing.probation}</p>

                <p>Possible action: review academic performance and identify students who may need additional academic support.
                </p>
            `
        });
    } else {
        alerts.push({
            title: "Academic Standing",
            content: `
                <p><b>At-risk and probation rate:</b> ${riskRate}%</p>

                <p>Possible action: continue monitoring student progress and provide support when necessary.</p>
            `
        });
    }

    if (data.response < 80) {
        alerts.push({
            title: "SETE Response Rate",
            content: `
                <p><b>Current response rate:</b> ${data.response}%</p>

                <p><b>Illustrative target:</b> 80%</p>

                <p>Possible action: remind eligible students to participate in the evaluation.</p>
            `
        });
    } else {
        alerts.push({
            title: "SETE Response Rate",
            content: `
                <p><b>Current response rate:</b> ${data.response}%</p>

                <p>The current response rate meets the illustrative 80% target.</p>
            `
        });
    }

    if (data.pending > 0) {
        alerts.push({
            title: "Pending Academic Tasks",
            content: `
                <p><b>Pending tasks:</b> ${data.pending}</p>

                <p>Possible action: review outstanding grade or academic submission tasks.</p>
            `
        });
    }

    const item = alerts[index];

    if (!item) return;

    openModal(
        item.title,
        item.content + getFilterHTML()
    );
}


// PRIORITY FOLLOW-UP DETAILS

function showFollowUpDetails(index) {
    const data = getDashboardData();

    const department = data.departments[index];

    if (!department) return;

    const riskRate = percentage(
        department.standing.atRisk + department.standing.probation,
        department.students
    );

    let indicator;
    let status;
    let recommendation;

    if (riskRate >= 10) {
        indicator = riskRate + "% at risk";
        status = "Review";

        recommendation =
            "Review students in the at-risk and probation categories and consider appropriate academic support.";

    } else if (department.response < 80) {
        indicator = department.response + "% response";
        status = "Follow up";

        recommendation =
            "Encourage eligible students to complete the SETE evaluation.";

    } else {
        indicator = department.sete.toFixed(2) + " SETE";
        status = "On track";

        recommendation =
            "Continue monitoring academic and evaluation indicators.";
    }

    openModal("Priority Follow-up Details", `
        <h3>${escapeHTML(department.name)}</h3>

        <p><b>Indicator:</b> ${indicator}</p>

        <p><b>Status:</b> ${status}</p>

        <p><b>Enrolled students:</b> ${department.students}</p>

        <p><b>SETE response rate:</b> ${department.response}%</p>

        <p><b>SETE average:</b> ${department.sete.toFixed(2)} / 5.00</p>

        <p><b>At-risk students:</b> ${department.standing.atRisk}</p>

        <p><b>Probation students:</b> ${department.standing.probation}</p>

        <h3>Suggested Follow-up</h3>

        <p>${recommendation}</p>

        <div class="demo-note">
            This is an illustrative department-level summary,
            not an official university report.
        </div>

        ${getFilterHTML()}
    `);
}


// 34. ANALYTICS CLICK HANDLER
// Uses event delegation so regenerated charts and rows
// remain interactive after changing dashboard filters.

function handleAnalyticsClick(event) {
    const target = event.target;

    // KPI CARDS

    const kpi = target.closest(".kpi");

    if (kpi) {
        const cards = Array.from(
            document.querySelectorAll(".kpi")
        );

        const index = cards.indexOf(kpi);

        showKpiDetails(index);
        return;
    }


    // ENROLLMENT CHART POINTS

    const circle = target.closest("#enrollmentChart circle");

    if (circle) {
        const circles = Array.from(
            document.querySelectorAll("#enrollmentChart circle")
        );

        const index = circles.indexOf(circle);

        showEnrollmentDetails(index);
        return;
    }


    // SETE DIMENSION BARS

    const bar = target.closest("#seteBars .bar-row");

    if (bar) {
        showSeteDimensionDetails(bar);
        return;
    }


    // ACADEMIC STANDING LEGEND

    const legendItem = target.closest(
        "#standingLegend > div"
    );

    if (legendItem) {
        showStandingDetails(legendItem);
        return;
    }


    // ACADEMIC ALERTS

    const alert = target.closest(
        "#academicAlerts .alert"
    );

    if (alert) {
        const alerts = Array.from(
            document.querySelectorAll("#academicAlerts .alert")
        );

        const index = alerts.indexOf(alert);

        showAlertDetails(index);
        return;
    }


    // PRIORITY FOLLOW-UP TABLE

    const row = target.closest(
        "#followUpTable tr"
    );

    if (row) {
        const rows = Array.from(
            document.querySelectorAll("#followUpTable tr")
        );

        const index = rows.indexOf(row);

        showFollowUpDetails(index);
    }
}


// REGISTER ONE DELEGATED CLICK LISTENER

document.addEventListener(
    "click",
    handleAnalyticsClick
);


// 35. ANALYTICS KEYBOARD ACCESSIBILITY

document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    const target = event.target;

    const isAnalyticsElement = target.matches(
        ".kpi, " +
        "#enrollmentChart circle, " +
        "#seteBars .bar-row, " +
        "#standingLegend > div, " +
        "#academicAlerts .alert, " +
        "#followUpTable tr"
    );

    if (!isAnalyticsElement) {
        return;
    }

    event.preventDefault();

    target.click();
});


// 36. INTERACTIVE ANALYTICS STYLING

(function addAnalyticsInteractionStyles() {
    const style = document.createElement("style");

    style.id = "analyticsInteractionStyles";

    style.textContent = `
        .kpi,
        #seteBars .bar-row,
        #standingLegend > div,
        #academicAlerts .alert,
        #followUpTable tr {
            cursor: pointer;
            transition: background-color 0.2s ease,
                        box-shadow 0.2s ease;
        }

        .kpi:hover,
        #seteBars .bar-row:hover,
        #standingLegend > div:hover,
        #followUpTable tr:hover {
            background-color: #f5f7f9;
        }

        #academicAlerts .alert:hover {
            filter: brightness(0.97);
        }

        #enrollmentChart circle {
            cursor: pointer;
            transition: stroke-width 0.15s ease;
        }

        #enrollmentChart circle:hover {
            stroke: #d92332;
            stroke-width: 5;
        }

        .kpi:focus-visible,
        #seteBars .bar-row:focus-visible,
        #standingLegend > div:focus-visible,
        #academicAlerts .alert:focus-visible,
        #followUpTable tr:focus-visible,
        #enrollmentChart circle:focus-visible {
            outline: 3px solid #75b9ed;
            outline-offset: 3px;
        }
    `;

    if (!document.getElementById("analyticsInteractionStyles")) {
        document.head.appendChild(style);
    }
})();


// 37. FINAL INITIALIZATION

console.log("BSUniSync demonstration portal initialized.");
console.log("All dashboard data is fictional and stored locally where applicable.");
console.log("Faculty Services and account actions are enabled.");
console.log("Interactive analytics details are enabled.");
