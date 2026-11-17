
// =========================================================
// 34. INTERACTIVE ANALYTICS DETAILS
// Makes KPI cards, charts, alerts, and follow-up rows clickable.
// Uses the currently selected dashboard filters.
// =========================================================

(function enableAnalyticsInteractions() {
    const style = document.createElement("style");

    style.textContent = `
        .kpi,
        #enrollmentChart circle,
        .bar-row,
        #standingLegend > div,
        .alert,
        #followUpTable tr {
            cursor: pointer;
        }

        .kpi:hover,
        .bar-row:hover,
        #standingLegend > div:hover,
        #followUpTable tr:hover {
            background-color: #f5f7f9;
        }

        #enrollmentChart circle:hover {
            stroke: #d92332;
            stroke-width: 5;
        }

        .kpi:focus-visible,
        .bar-row:focus-visible,
        #standingLegend > div:focus-visible,
        .alert:focus-visible,
        #followUpTable tr:focus-visible,
        #enrollmentChart circle:focus-visible {
            outline: 3px solid #75b9ed;
            outline-offset: 3px;
        }
    `;

    document.head.appendChild(style);

    function makeInteractive() {
        document.querySelectorAll(
            ".kpi, .bar-row, #standingLegend > div, .alert, #followUpTable tr"
        ).forEach(element => {
            element.setAttribute("tabindex", "0");
            element.setAttribute("role", "button");
        });

        document.querySelectorAll("#enrollmentChart circle").forEach(circle => {
            circle.setAttribute("tabindex", "0");
            circle.setAttribute("role", "button");
            circle.style.cursor = "pointer";
        });
    }

    // Reapply accessibility attributes whenever dashboard content changes.
    const observer = new MutationObserver(makeInteractive);

    [
        "enrollmentChart",
        "seteBars",
        "standingLegend",
        "academicAlerts",
        "followUpTable"
    ].forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            observer.observe(element, {
                childList: true,
                subtree: true
            });
        }
    });

    makeInteractive();

    function showKpiDetails(index) {
        const data = getDashboardData();

        const details = [
            {
                title: "Teaching Load Details",
                content: `
                    <p><b>Teaching units:</b> ${data.units}</p>
                    <p><b>Assigned classes:</b> ${data.classes}</p>
                    <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>
                    <p>This section summarizes the teaching workload under the selected filters.</p>
                `
            },
            {
                title: "Enrolled Students Details",
                content: `
                    <p><b>Total enrolled students:</b> ${data.students}</p>
                    <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>
                    <p><b>Academic year:</b> ${escapeHTML(document.getElementById("year").value)}</p>
                    <p><b>Semester:</b> ${escapeHTML(document.getElementById("semester").selectedOptions[0].textContent)}</p>
                    <p>This figure represents the illustrative enrollment count for the selected filters.</p>
                `
            },
            {
                title: "SETE Average Details",
                content: `
                    <p><b>Overall SETE average:</b> ${data.sete.toFixed(2)} / 5.00</p>
                    <h3>Evaluation Dimensions</h3>
                    <table class="modal-table">
                        <tbody>
                            ${Object.entries(data.dimensions).map(([name, score]) => `
                                <tr>
                                    <td>${escapeHTML(name)}</td>
                                    <td><b>${score.toFixed(2)} / 5.00</b></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                    <p>Scores are illustrative and should be considered together with the response rate and other teaching evidence.</p>
                `
            },
            {
                title: "Pending Academic Tasks",
                content: `
                    <p><b>Pending tasks:</b> ${data.pending}</p>
                    <p>These represent illustrative grade or academic submission tasks that may require attention.</p>
                    <p>Use the Grade Submission service to view and save demonstration submissions.</p>
                `
            },
            {
                title: "SETE Response Rate Details",
                content: `
                    <p><b>Responses received:</b> ${data.responded}</p>
                    <p><b>Total students:</b> ${data.students}</p>
                    <p><b>Response rate:</b> ${data.response}%</p>
                    <p><b>Illustrative target:</b> 80%</p>
                    <p>${data.response >= 80
                        ? "The current response rate meets the illustrative target."
                        : "The current response rate is below the illustrative target. Eligible students may be encouraged to participate."
                    }</p>
                `
            }
        ];

        const item = details[index];

        if (item) {
            openModal(item.title, item.content);
        }
    }

    function showEnrollmentDetails(index) {
        const data = getDashboardData();

        const labels = [
            "First Semester AY 2023–2024",
            "Second Semester AY 2023–2024",
            "First Semester AY 2024–2025",
            "Second Semester AY 2024–2025",
            "First Semester AY 2025–2026",
            "Selected Semester"
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
            <p><b>Completion rate:</b> ${values[index]}%</p>
            <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>
            <p><b>Selected academic year:</b> ${escapeHTML(document.getElementById("year").value)}</p>
            <p><b>Selected semester:</b> ${escapeHTML(document.getElementById("semester").selectedOptions[0].textContent)}</p>
            <div class="demo-note">
                Historical chart values are illustrative demonstration figures. The final point uses the current filtered completion rate.
            </div>
        `);
    }

    function showSeteDimensionDetails(element) {
        const data = getDashboardData();
        const name = element.querySelector("span")?.textContent?.trim();

        if (!name || data.dimensions[name] === undefined) return;

        const score = data.dimensions[name];

        openModal("SETE Evaluation Dimension", `
            <h3>${escapeHTML(name)}</h3>
            <p><b>Average score:</b> ${score.toFixed(2)} / 5.00</p>
            <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>
            <p><b>Student responses:</b> ${data.responded}</p>
            <div class="demo-note">
                This is an illustrative average score for the selected filters. It is not an individual student's evaluation.
            </div>
        `);
    }

    function showStandingDetails(index) {
        const data = getDashboardData();

        const categories = [
            {
                name: "Good Standing",
                key: "good"
            },
            {
                name: "Satisfactory",
                key: "satisfactory"
            },
            {
                name: "At Risk",
                key: "atRisk"
            },
            {
                name: "Probation",
                key: "probation"
            }
        ];

        const item = categories[index];

        if (!item) return;

        const count = data.standing[item.key];
        const rate = percentage(count, data.students);

        openModal("Student Academic Standing", `
            <h3>${item.name}</h3>
            <p><b>Number of students:</b> ${count}</p>
            <p><b>Percentage:</b> ${rate}%</p>
            <p><b>Total students:</b> ${data.students}</p>
            <p><b>Selected department:</b> ${escapeHTML(data.name)}</p>
            <div class="demo-note">
                This category summarizes the illustrative academic standing distribution.
            </div>
        `);
    }

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
                description: `
                    <p><b>At-risk and probation rate:</b> ${riskRate}%</p>
                    <p><b>Students requiring review:</b> ${data.standing.atRisk + data.standing.probation}</p>
                    <p>Possible action: review academic performance and identify students who may need additional academic support.</p>
                `
            });
        } else {
            alerts.push({
                title: "Academic Standing",
                description: `
                    <p><b>At-risk and probation rate:</b> ${riskRate}%</p>
                    <p>Possible action: continue monitoring student progress and provide support when necessary.</p>
                `
            });
        }

        if (data.response < 80) {
            alerts.push({
                title: "SETE Response Rate",
                description: `
                    <p><b>Current response rate:</b> ${data.response}%</p>
                    <p><b>Illustrative target:</b> 80%</p>
                    <p>Possible action: remind eligible students to participate in the evaluation.</p>
                `
            });
        } else {
            alerts.push({
                title: "SETE Response Rate",
                description: `
                    <p><b>Current response rate:</b> ${data.response}%</p>
                    <p>The current response rate meets the illustrative 80% target.</p>
                `
            });
        }

        if (data.pending > 0) {
            alerts.push({
                title: "Pending Academic Tasks",
                description: `
                    <p><b>Pending tasks:</b> ${data.pending}</p>
                    <p>Possible action: review outstanding grade or academic submission tasks.</p>
                `
            });
        }

        const item = alerts[index];

        if (item) {
            openModal(item.title, item.description);
        }
    }

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
            recommendation = "Review students in the at-risk and probation categories and consider appropriate academic support.";
        } else if (department.response < 80) {
            indicator = department.response + "% response";
            status = "Follow up";
            recommendation = "Encourage eligible students to complete the SETE evaluation.";
        } else {
            indicator = department.sete.toFixed(2) + " SETE";
            status = "On track";
            recommendation = "Continue monitoring academic and evaluation indicators.";
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
                This is an illustrative department-level summary, not an official university report.
            </div>
        `);
    }

    function handleAnalyticsClick(event) {
        const target = event.target;

        // KPI cards
        const kpi = target.closest(".kpi");

        if (kpi) {
            const cards = Array.from(document.querySelectorAll(".kpi"));
            showKpiDetails(cards.indexOf(kpi));
            return;
        }

        // Enrollment chart points
        const circle = target.closest("#enrollmentChart circle");

        if (circle) {
            const circles = Array.from(
                document.querySelectorAll("#enrollmentChart circle")
            );

            showEnrollmentDetails(circles.indexOf(circle));
            return;
        }

        // SETE dimension bars
        const bar = target.closest(".bar-row");

        if (bar) {
            showSeteDimensionDetails(bar);
            return;
        }

        // Academic standing legend
        const legendItem = target.closest("#standingLegend > div");

        if (legendItem) {
            const items = Array.from(
                document.querySelectorAll("#standingLegend > div")
            );

            showStandingDetails(items.indexOf(legendItem));
            return;
        }

        // Academic alerts
        const alert = target.closest(".alert");

        if (alert) {
            const alerts = Array.from(
                document.querySelectorAll("#academicAlerts .alert")
            );

            showAlertDetails(alerts.indexOf(alert));
            return;
        }

        // Priority follow-up table
        const row = target.closest("#followUpTable tr");

        if (row) {
            const rows = Array.from(
                document.querySelectorAll("#followUpTable tr")
            );

            showFollowUpDetails(rows.indexOf(row));
        }
    }

    document.addEventListener("click", handleAnalyticsClick);

    // Allow keyboard users to open the same details.
    document.addEventListener("keydown", event => {
        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }

        const target = event.target;

        if (!target.matches(
            ".kpi, .bar-row, #standingLegend > div, .alert, #followUpTable tr, #enrollmentChart circle"
        )) {
            return;
        }

        event.preventDefault();
        target.click();
    });

    console.log("BSUniSync analytics interactions enabled.");
})();
