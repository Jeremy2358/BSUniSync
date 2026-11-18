
document.addEventListener("DOMContentLoaded", () => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  // --------------------------------------------------
  // API CONFIGURATION
  // --------------------------------------------------

  const API_URL = "https://bsunisync-api.onrender.com/predict-batch";

  let modelApiStatus = "connecting";
  let modelApiMessage = "Connecting to prediction service...";
  let modelApiLoading = false;

  // --------------------------------------------------
  // DEMONSTRATION DATA
  // --------------------------------------------------

  const students = [
    {id:"2022-001",name:"Angela Mae Reyes",program:"BSIT",year:"1st Year",gwa:1.75,attendance:96,progress:92,status:"Active"},
    {id:"2022-002",name:"John Michael Cruz",program:"BSIT",year:"2nd Year",gwa:2.10,attendance:91,progress:85,status:"Active"},
    {id:"2022-003",name:"Sofia Garcia",program:"BSIT",year:"3rd Year",gwa:1.50,attendance:98,progress:96,status:"Active"},
    {id:"2022-004",name:"Daniel Mendoza",program:"BSIT",year:"2nd Year",gwa:3.10,attendance:78,progress:61,status:"For Follow-up"},
    {id:"2022-005",name:"Isabella Torres",program:"BSIT",year:"4th Year",gwa:1.80,attendance:94,progress:90,status:"Active"},
    {id:"2022-006",name:"Gabriel Flores",program:"BSIT",year:"3rd Year",gwa:2.25,attendance:89,progress:82,status:"Active"},
    {id:"2022-007",name:"Nathaniel Ramos",program:"BSIT",year:"1st Year",gwa:3.20,attendance:74,progress:58,status:"For Follow-up"},
    {id:"2022-008",name:"Camille Bautista",program:"BSIT",year:"4th Year",gwa:1.90,attendance:97,progress:93,status:"Active"}
  ];

  const firstNames = [
    "Adrian","Alexandra","Andrea","Anthony","Ariana",
    "Benjamin","Bianca","Carl","Chloe","Christian",
    "Daniel","Danica","David","Diana","Dominic",
    "Ethan","Elaine","Elijah","Ella","Emmanuel",
    "Frances","Gabrielle","Hannah","Isaac","Jasmine",
    "Jerome","Jessica","Joshua","Julia","Karl",
    "Katherine","Kyle","Lance","Lauren","Liam",
    "Louise","Lucas","Mae","Marcus","Maria",
    "Mark","Matthew","Mikaela","Nathan","Nicole",
    "Paolo","Patricia","Patrick","Rafael","Rebecca",
    "Samuel","Samantha","Sean","Sophia","Therese",
    "Tristan","Vanessa","Vincent","Zachary"
  ];

  const lastNames = [
    "Aquino","Alvarez","Andrada","Bautista","Castillo",
    "Castro","Cruz","Dela Cruz","Domingo","Estrada",
    "Fernandez","Garcia","Gonzales","Hernandez","Lim",
    "Lopez","Manalo","Martinez","Mendoza","Morales",
    "Navarro","Ocampo","Pascual","Reyes","Rivera",
    "Ramos","Robles","Santos","Santiago","Soriano",
    "Torres","Valdez","Villanueva","Tan","Flores"
  ];

  const gwaGroups = [
    {count:41,min:1.00,max:1.50},
    {count:93,min:1.51,max:2.00},
    {count:116,min:2.01,max:2.25},
    {count:58,min:2.26,max:2.75},
    {count:26,min:2.76,max:3.50}
  ];

  const generatedGwaValues = [];

  gwaGroups.forEach(group => {
    for (let i = 0; i < group.count; i++) {
      const steps = Math.round((group.max - group.min) * 100);
      const value = group.min + ((i * 7) % (steps + 1)) / 100;
      generatedGwaValues.push(Number(Math.min(value, group.max).toFixed(2)));
    }
  });

  let generatedIndex = 0;

  for (let i = 0; i < firstNames.length && generatedIndex < 334; i++) {
    for (let j = 0; j < lastNames.length && generatedIndex < 334; j++) {
      const name = `${firstNames[i]} ${lastNames[j]}`;

      if (students.some(student => student.name === name)) continue;

      const gwa = generatedGwaValues[generatedIndex];
      const year = ["1st Year","2nd Year","3rd Year","4th Year"][generatedIndex % 4];

      let attendance;
      let progress;

      if (gwa <= 1.50) {
        attendance = 90 + ((generatedIndex * 3) % 11);
        progress = 90 + ((generatedIndex * 5) % 11);
      } else if (gwa <= 2.25) {
        attendance = 82 + ((generatedIndex * 7) % 18);
        progress = 78 + ((generatedIndex * 5) % 21);
      } else if (gwa <= 2.75) {
        attendance = 75 + ((generatedIndex * 3) % 16);
        progress = 65 + ((generatedIndex * 7) % 26);
      } else {
        attendance = 60 + ((generatedIndex * 5) % 25);
        progress = 45 + ((generatedIndex * 7) % 31);
      }

      students.push({
        id:`2022-${String(students.length + 1).padStart(3,"0")}`,
        name,
        program:"BSIT",
        year,
        gwa,
        attendance,
        progress,
        status:gwa > 2.75 || attendance < 80 ? "For Follow-up" : "Active"
      });

      generatedIndex++;
    }
  }

  // --------------------------------------------------
  // ACADEMIC PERIOD ASSIGNMENT
  // --------------------------------------------------

  students.forEach((student, index) => {
    if (index < 8) {
      student.academicYear = "2025-2026";
      student.semester = index % 2 === 0 ? "1" : "2";
    } else {
      const periodIndex = index % 3;

      student.academicYear = [
        "2023-2024",
        "2024-2025",
        "2025-2026"
      ][periodIndex];

      student.semester = index % 2 === 0 ? "1" : "2";
    }
  });

  // --------------------------------------------------
  // SYNTHETIC ML INPUT PREPARATION
  // --------------------------------------------------

  students.forEach((student, index) => {
    const previousVariation = ((index % 7) - 3) * 0.12;

    student.previousGwa = Number(
      Math.max(1, Math.min(5, student.gwa + previousVariation)).toFixed(2)
    );

    if (student.gwa <= 1.50) {
      student.failedSubjects = index % 5 === 0 ? 1 : 0;
    } else if (student.gwa <= 2.25) {
      student.failedSubjects = index % 6 === 0 ? 1 : 0;
    } else if (student.gwa <= 2.75) {
      student.failedSubjects = index % 3 === 0 ? 2 : 1;
    } else {
      student.failedSubjects = 2 + (index % 4);
    }

    student.mlPrediction = null;
    student.mlScore = null;
  });

  // --------------------------------------------------
  // CLASSES
  // --------------------------------------------------

  const classes = [
    {code:"IT 101",name:"Introduction to Computing",section:"BSIT 1A",students:32,schedule:"Mon / Wed · 8:00–9:30 AM",room:"Lab 1",status:"Ongoing"},
    {code:"IT 102",name:"Computer Programming 1",section:"BSIT 1B",students:30,schedule:"Tue / Thu · 9:00–10:30 AM",room:"Lab 2",status:"Ongoing"},
    {code:"IT 201",name:"Data Structures and Algorithms",section:"BSIT 2A",students:31,schedule:"Mon / Wed · 10:00–11:30 AM",room:"Lab 3",status:"Ongoing"},
    {code:"IT 202",name:"Database Management Systems",section:"BSIT 2B",students:29,schedule:"Tue / Thu · 1:00–2:30 PM",room:"Lab 2",status:"Ongoing"},
    {code:"IT 301",name:"Systems Analysis and Design",section:"BSIT 3A",students:34,schedule:"Wed / Fri · 1:00–2:30 PM",room:"Room 204",status:"Ongoing"},
    {code:"IT 401",name:"Capstone Project",section:"BSIT 4A",students:30,schedule:"Fri · 9:00–12:00 PM",room:"Room 305",status:"Ongoing"}
  ];

  const subjectPassingRates = [91,88,90,86,92,89];

  const schedule = [
    {day:"Monday",time:"8:00–9:30 AM",subject:"Introduction to Computing",section:"BSIT 1A",room:"Lab 1"},
    {day:"Monday",time:"10:00–11:30 AM",subject:"Data Structures and Algorithms",section:"BSIT 2A",room:"Lab 3"},
    {day:"Tuesday",time:"9:00–10:30 AM",subject:"Computer Programming 1",section:"BSIT 1B",room:"Lab 2"},
    {day:"Tuesday",time:"1:00–2:30 PM",subject:"Database Management Systems",section:"BSIT 2B",room:"Lab 2"},
    {day:"Wednesday",time:"8:00–9:30 AM",subject:"Introduction to Computing",section:"BSIT 1A",room:"Lab 1"},
    {day:"Wednesday",time:"10:00–11:30 AM",subject:"Data Structures and Algorithms",section:"BSIT 2A",room:"Lab 3"},
    {day:"Wednesday",time:"1:00–2:30 PM",subject:"Systems Analysis and Design",section:"BSIT 3A",room:"Room 204"},
    {day:"Thursday",time:"9:00–10:30 AM",subject:"Computer Programming 1",section:"BSIT 1B",room:"Lab 2"},
    {day:"Thursday",time:"1:00–2:30 PM",subject:"Database Management Systems",section:"BSIT 2B",room:"Lab 2"},
    {day:"Friday",time:"9:00 AM–12:00 PM",subject:"Capstone Project",section:"BSIT 4A",room:"Room 305"},
    {day:"Friday",time:"1:00–2:30 PM",subject:"Systems Analysis and Design",section:"BSIT 3A",room:"Room 204"}
  ];

  // --------------------------------------------------
  // ALERTS
  // --------------------------------------------------

  const atRiskStudents = students.filter(student => Number(student.gwa) > 2.75);
  const lowAttendanceStudents = students.filter(student => Number(student.attendance) < 80);

  let alerts = [
    {
      id:"risk",
      title:"Student Academic Risk",
      description:`${atRiskStudents.length} students currently have a GWA above 2.75 and may require academic intervention.`,
      type:"Urgent",
      date:"Based on demonstration student records",
      actionLabel:"Review At Risk Students",
      target:"students",
      filter:"At Risk",
      open:true
    },
    {
      id:"attendance",
      title:"Student Attendance Concern",
      description:`${lowAttendanceStudents.length} students currently have attendance below 80% and may need follow-up.`,
      type:"Student Concern",
      date:"Based on demonstration student records",
      actionLabel:"Review Student Records",
      target:"students",
      filter:"all",
      open:true
    },
    {
      id:"sete",
      title:"Teaching Evaluation Summary",
      description:"The demonstration SETE rating is 4.28 out of 5. Review the illustrative evaluation results and rating distribution.",
      type:"Reminder",
      date:"Illustrative evaluation summary",
      actionLabel:"View Teaching Evaluation",
      target:"evaluation",
      filter:"all",
      open:true
    }
  ];

  let notificationsRead = false;
  const chartInstances = {};

  // --------------------------------------------------
  // GENERAL HELPERS
  // --------------------------------------------------

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    })[char]);

  function showToast(message) {
    const container = $("#toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  function getStanding(gwa) {
    if (gwa === null || gwa === undefined || Number.isNaN(Number(gwa))) {
      return "No GWA";
    }

    const value = Number(gwa);

    if (value <= 1.50) return "Excellent";
    if (value <= 2.25) return "Good Standing";
    if (value <= 2.75) return "Needs Monitoring";

    return "At Risk";
  }

  function standingClass(standing) {
    return ({
      "Excellent":"standing-excellent",
      "Good Standing":"standing-good",
      "Needs Monitoring":"standing-monitoring",
      "At Risk":"standing-risk",
      "No GWA":"standing-none"
    })[standing] || "standing-none";
  }

  function getInitials(name) {
    return name.split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();
  }

  function getPercentage(part, total) {
    return total ? (part / total) * 100 : 0;
  }

  // --------------------------------------------------
  // DASHBOARD FILTER DATA
  // --------------------------------------------------

  function getDashboardStudents() {
    const year = $("#yearFilter")?.value || "all";
    const semester = $("#semesterFilter")?.value || "all";

    return students.filter(student =>
      (year === "all" || student.academicYear === year) &&
      (semester === "all" || student.semester === semester)
    );
  }

  function getDashboardSummary() {
    const records = getDashboardStudents();
    const total = records.length;

    const passing = records.filter(student => Number(student.gwa) <= 3.00).length;

    const averageProgress = total
      ? records.reduce((sum, student) => sum + Number(student.progress || 0), 0) / total
      : 0;

    const atRisk = records.filter(student => getStanding(student.gwa) === "At Risk").length;

    const averageAttendance = total
      ? records.reduce((sum, student) => sum + Number(student.attendance || 0), 0) / total
      : 0;

    return {
      records,
      total,
      passing,
      passingRate:getPercentage(passing,total),
      averageProgress,
      atRisk,
      averageAttendance
    };
  }

  function updateDashboardKPIs() {
    const summary = getDashboardSummary();

    if ($("#kpiStudents")) $("#kpiStudents").textContent = summary.total.toLocaleString();
    if ($("#kpiPassing")) $("#kpiPassing").textContent = `${summary.passingRate.toFixed(1)}%`;
    if ($("#kpiCompletion")) $("#kpiCompletion").textContent = `${summary.averageProgress.toFixed(1)}%`;
    if ($("#kpiAtRisk")) $("#kpiAtRisk").textContent = summary.atRisk.toLocaleString();

    if ($("#kpiAtRiskDetail")) {
      $("#kpiAtRiskDetail").textContent =
        `${summary.atRisk} students with GWA above 2.75 in this selection`;
    }

    if ($("#kpiSete") && !$("#kpiSete").textContent.trim()) {
      $("#kpiSete").textContent = "4.28";
    }
  }

  // --------------------------------------------------
  // OVERVIEW ML SUMMARY
  // --------------------------------------------------

  function updateMLOverview(status, total = null, risk = null, safe = null, message = "") {
    const statusElement = $("#mlOverviewStatus");
    const statusText = $("#mlOverviewStatusText");
    const totalElement = $("#mlOverviewTotal");
    const riskElement = $("#mlOverviewRisk");
    const safeElement = $("#mlOverviewSafe");
    const messageElement = $("#mlOverviewMessage");

    if (statusElement) statusElement.className = `ml-overview-status ${status}`;

    if (statusText) {
      statusText.textContent =
        status === "online" ? "Model Online" :
        status === "offline" ? "Service Offline" :
        "Connecting...";
    }

    if (totalElement) {
      totalElement.textContent = total === null ? "—" : Number(total).toLocaleString();
    }

    if (riskElement) {
      riskElement.textContent = risk === null ? "—" : Number(risk).toLocaleString();
    }

    if (safeElement) {
      safeElement.textContent = safe === null ? "—" : Number(safe).toLocaleString();
    }

    if (messageElement) messageElement.textContent = message;
  }

  // --------------------------------------------------
  // ML INTERFACE
  // --------------------------------------------------

  function addMLInterface() {
    const heading = $(".student-record-heading");

    if (heading && !$("#modelApiStatus")) {
      const status = document.createElement("div");
      status.id = "modelApiStatus";
      status.className = "model-api-status";

      status.innerHTML = `
        <div class="model-api-indicator">
          <span class="model-api-dot"></span>
          <span class="model-api-message">Connecting to prediction service...</span>
        </div>
        <button type="button" id="retryModelBtn" class="model-retry-button">Retry</button>
      `;

      heading.appendChild(status);
    }

    const tableHead = $(".student-table thead tr");

    if (tableHead && !$("#mlPredictionHeader")) {
      const header = document.createElement("th");
      header.id = "mlPredictionHeader";
      header.textContent = "ML Prediction";

      const actionHeader = tableHead.lastElementChild;

      if (actionHeader) {
        tableHead.insertBefore(header, actionHeader);
      } else {
        tableHead.appendChild(header);
      }
    }

    if (!$("#mlDisclaimer")) {
      const guide = $(".standing-guide");

      if (guide) {
        const disclaimer = document.createElement("div");
        disclaimer.id = "mlDisclaimer";
        disclaimer.className = "ml-disclaimer";
        disclaimer.textContent =
          "ML predictions use synthetic demonstration inputs. Model scores are not calibrated probabilities and should only support human review.";

        guide.insertAdjacentElement("afterend", disclaimer);
      }
    }

    if (!$("#mlDynamicStyles")) {
      const style = document.createElement("style");
      style.id = "mlDynamicStyles";

      style.textContent = `
        .model-api-status {
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
          margin-left:auto;
        }

        .model-api-indicator {
          display:flex;
          align-items:center;
          gap:7px;
          font-size:10px;
          color:var(--muted);
        }

        .model-api-dot {
          width:8px;
          height:8px;
          border-radius:50%;
          background:#d6a044;
          display:inline-block;
          flex-shrink:0;
        }

        .model-api-status.online .model-api-dot { background:#35bd7a; }
        .model-api-status.offline .model-api-dot { background:#e45b63; }

        .model-retry-button {
          background:rgba(22,143,160,.12);
          border:1px solid rgba(22,143,160,.35);
          color:#65cbd2;
          border-radius:6px;
          padding:6px 9px;
          font-size:9px;
          font-weight:700;
          cursor:pointer;
        }

        .model-retry-button:disabled { opacity:.5; cursor:wait; }

        .ml-disclaimer {
          padding:0 20px 14px;
          color:var(--muted);
          font-size:9px;
          line-height:1.6;
        }

        .ml-badge {
          display:inline-block;
          padding:5px 7px;
          border-radius:20px;
          font-size:8px;
          font-weight:700;
          line-height:1.4;
          white-space:nowrap;
        }

        .ml-risk { background:rgba(217,35,50,.16); color:#ff7e85; }
        .ml-safe { background:rgba(24,139,69,.16); color:#63d296; }
        .ml-pending { background:rgba(201,149,57,.16); color:#e8bc6d; }
        .ml-unavailable { background:rgba(150,160,165,.14); color:#b6c0c4; }

        .ml-score {
          display:block;
          color:var(--muted);
          font-size:8px;
          margin-top:4px;
        }

        /* ENLARGED ML RISK DISTRIBUTION */

        .ml-gauge-wrap {
          height:auto !important;
          min-height:320px;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:32px 30px;
          box-sizing:border-box;
          width:100%;
        }

        .ml-risk-distribution {
          width:100%;
          max-width:760px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          gap:32px;
          margin:auto;
        }

        .ml-risk-row {
          width:100%;
          display:flex;
          flex-direction:column;
          gap:13px;
        }

        .ml-risk-row-top {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
        }

        .ml-risk-label {
          display:flex;
          align-items:center;
          gap:12px;
          color:var(--text);
          font-size:15px;
          font-weight:700;
        }

        .ml-risk-dot {
          width:12px;
          height:12px;
          border-radius:50%;
          flex-shrink:0;
        }

        .ml-risk-dot.danger { background:#e34b55; }
        .ml-risk-dot.success { background:#2eb879; }

        .ml-risk-values {
          display:flex;
          align-items:baseline;
          gap:9px;
          white-space:nowrap;
        }

        .ml-risk-count {
          color:var(--text);
          font-size:25px;
          font-weight:800;
          font-variant-numeric:tabular-nums;
        }

        .ml-risk-percent {
          color:var(--muted);
          font-size:14px;
          font-weight:600;
        }

        .ml-risk-track {
          width:100%;
          height:21px;
          overflow:hidden;
          border-radius:20px;
          background:rgba(150,160,165,.13);
        }

        .ml-risk-fill {
          height:100%;
          width:0%;
          border-radius:20px;
          transition:width .65s ease;
        }

        .ml-risk-fill.danger {
          background:linear-gradient(90deg,#bd2634,#ef626b);
        }

        .ml-risk-fill.success {
          background:linear-gradient(90deg,#168b55,#43c78b);
        }

        .ml-risk-total {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          padding-top:17px;
          border-top:1px solid var(--border);
          color:var(--muted);
          font-size:13px;
        }

        .ml-risk-total strong {
          color:var(--text);
          font-size:16px;
        }

        .overview-insights-grid {
          display:grid !important;
          grid-template-columns:repeat(2,minmax(0,1fr));
          align-items:stretch;
          gap:18px;
          width:100%;
        }

        .overview-insights-grid > * {
          min-width:0;
          width:100%;
        }

        .overview-insight-panel {
          min-width:0;
          height:100%;
          display:flex;
          flex-direction:column;
        }

        .overview-insight-panel .chart-wrap {
          flex:1;
          min-width:0;
        }

        .overview-insights-grid > .ml-risk-panel {
          grid-column:1 / -1;
        }

        @media(max-width:760px) {
          .student-record-heading {
            align-items:flex-start;
            flex-direction:column;
          }

          .model-api-status { margin-left:0; }

          .ml-disclaimer {
            padding-left:14px;
            padding-right:14px;
          }

          .overview-insights-grid {
            grid-template-columns:minmax(0,1fr);
            gap:14px;
          }

          .overview-insights-grid > .ml-risk-panel {
            grid-column:auto;
          }

          .ml-gauge-wrap {
            min-height:260px;
            padding:24px 16px;
          }

          .ml-risk-distribution {
            gap:25px;
          }

          .ml-risk-label {
            font-size:13px;
          }

          .ml-risk-count {
            font-size:21px;
          }

          .ml-risk-percent {
            font-size:12px;
          }

          .ml-risk-track {
            height:17px;
          }

          .ml-risk-total {
            font-size:11px;
          }

          .ml-risk-total strong {
            font-size:14px;
          }
        }
      `;

      document.head.appendChild(style);
    }

    if (!document.body.dataset.mlRetryListener) {
      document.body.dataset.mlRetryListener = "true";

      document.addEventListener("click", event => {
        if (event.target.closest("#retryModelBtn")) {
          runBatchPredictions();
        }
      });
    }

    initializeMLRiskDistribution();
  }

  function updateModelApiStatus(status, message) {
    modelApiStatus = status;
    modelApiMessage = message;

    const container = $("#modelApiStatus");
    if (!container) return;

    container.classList.remove("online","offline");

    if (status === "online") container.classList.add("online");
    if (status === "offline") container.classList.add("offline");

    const messageElement = container.querySelector(".model-api-message");
    const retryButton = $("#retryModelBtn");

    if (messageElement) messageElement.textContent = message;

    if (retryButton) {
      retryButton.disabled = modelApiLoading;
      retryButton.textContent = modelApiLoading ? "Connecting..." : "Retry";
      retryButton.classList.toggle("hidden", status === "online");
    }
  }

  function getMLBadge(student) {
    if (!student.mlPrediction) {
      return modelApiStatus === "offline"
        ? `<span class="ml-badge ml-unavailable">Unavailable</span>`
        : `<span class="ml-badge ml-pending">Pending</span>`;
    }

    const isRisk = student.mlPrediction === "At Risk";

    return `
      <span class="ml-badge ${isRisk ? "ml-risk" : "ml-safe"}">
        ${escapeHTML(student.mlPrediction)}
      </span>
      ${
        Number.isFinite(student.mlScore)
          ? `<small class="ml-score">Model score: ${student.mlScore.toFixed(2)}%</small>`
          : `<small class="ml-score">Model score: Not provided</small>`
      }
    `;
  }

  // --------------------------------------------------
  // ML DISTRIBUTION DATA
  // --------------------------------------------------

  function getMLRiskDistribution() {
    const analyzed = students.filter(student =>
      student.mlPrediction === "At Risk" ||
      student.mlPrediction === "Not At Risk"
    );

    const risk = analyzed.filter(student =>
      student.mlPrediction === "At Risk"
    ).length;

    const safe = analyzed.filter(student =>
      student.mlPrediction === "Not At Risk"
    ).length;

    return {
      analyzed:analyzed.length,
      risk,
      safe
    };
  }

  // --------------------------------------------------
  // ML DISTRIBUTION INITIALIZATION
  // --------------------------------------------------

  function initializeMLRiskDistribution() {
    const gaugeWraps = $$(".ml-gauge-wrap");

    if (!gaugeWraps.length) {
      console.warn("ML distribution container .ml-gauge-wrap was not found.");
      return;
    }

    gaugeWraps.forEach(gaugeWrap => {
      const alreadyInitialized =
        gaugeWrap.dataset.mlDistributionInitialized === "true" &&
        gaugeWrap.querySelector("[data-ml-risk-row]") &&
        gaugeWrap.querySelector("[data-ml-safe-row]");

      if (alreadyInitialized) return;

      gaugeWrap.innerHTML = `
        <div class="ml-risk-distribution">

          <div class="ml-risk-row" data-ml-risk-row hidden>
            <div class="ml-risk-row-top">
              <div class="ml-risk-label">
                <span class="ml-risk-dot danger"></span>
                At Risk
              </div>
              <div class="ml-risk-values">
                <strong class="ml-risk-count" data-ml-risk-count>0</strong>
                <span class="ml-risk-percent" data-ml-risk-percent>0%</span>
              </div>
            </div>
            <div class="ml-risk-track">
              <div class="ml-risk-fill danger" data-ml-risk-bar></div>
            </div>
          </div>

          <div class="ml-risk-row" data-ml-safe-row hidden>
            <div class="ml-risk-row-top">
              <div class="ml-risk-label">
                <span class="ml-risk-dot success"></span>
                Not At Risk
              </div>
              <div class="ml-risk-values">
                <strong class="ml-risk-count" data-ml-safe-count>0</strong>
                <span class="ml-risk-percent" data-ml-safe-percent>0%</span>
              </div>
            </div>
            <div class="ml-risk-track">
              <div class="ml-risk-fill success" data-ml-safe-bar></div>
            </div>
          </div>

          <div class="ml-risk-total" data-ml-total hidden>
            <span>Total analyzed students</span>
            <strong data-ml-analyzed-count>0</strong>
          </div>

        </div>
      `;

      gaugeWrap.dataset.mlDistributionInitialized = "true";
    });

    updateMLRiskChart();
  }

  // --------------------------------------------------
  // ML DISTRIBUTION UPDATE
  // --------------------------------------------------

  function updateMLRiskChart() {
    const gaugeWraps = $$(".ml-gauge-wrap");
    if (!gaugeWraps.length) return;

    const needsInitialization = gaugeWraps.some(gaugeWrap =>
      gaugeWrap.dataset.mlDistributionInitialized !== "true" ||
      !gaugeWrap.querySelector("[data-ml-risk-row]") ||
      !gaugeWrap.querySelector("[data-ml-safe-row]")
    );

    if (needsInitialization) {
      initializeMLRiskDistribution();
      return;
    }

    const distribution = getMLRiskDistribution();
    const hasPredictions = distribution.analyzed > 0;

    const riskPercentage = hasPredictions
      ? getPercentage(distribution.risk, distribution.analyzed)
      : 0;

    const safePercentage = hasPredictions
      ? getPercentage(distribution.safe, distribution.analyzed)
      : 0;

    gaugeWraps.forEach(gaugeWrap => {
      const riskRow = gaugeWrap.querySelector("[data-ml-risk-row]");
      const safeRow = gaugeWrap.querySelector("[data-ml-safe-row]");
      const totalRow = gaugeWrap.querySelector("[data-ml-total]");

      const riskCount = gaugeWrap.querySelector("[data-ml-risk-count]");
      const riskPercent = gaugeWrap.querySelector("[data-ml-risk-percent]");
      const riskBar = gaugeWrap.querySelector("[data-ml-risk-bar]");

      const safeCount = gaugeWrap.querySelector("[data-ml-safe-count]");
      const safePercent = gaugeWrap.querySelector("[data-ml-safe-percent]");
      const safeBar = gaugeWrap.querySelector("[data-ml-safe-bar]");

      const analyzedCount = gaugeWrap.querySelector("[data-ml-analyzed-count]");

      if (!riskRow || !safeRow || !totalRow) return;

      if (!hasPredictions) {
        riskRow.hidden = true;
        safeRow.hidden = true;
        totalRow.hidden = true;

        if (riskBar) riskBar.style.width = "0%";
        if (safeBar) safeBar.style.width = "0%";

        return;
      }

      riskRow.hidden = false;
      safeRow.hidden = false;
      totalRow.hidden = false;

      if (riskCount) {
        riskCount.textContent = distribution.risk.toLocaleString();
      }

      if (riskPercent) {
        riskPercent.textContent = `${riskPercentage.toFixed(1)}%`;
      }

      if (riskBar) {
        riskBar.style.width = `${riskPercentage}%`;
      }

      if (safeCount) {
        safeCount.textContent = distribution.safe.toLocaleString();
      }

      if (safePercent) {
        safePercent.textContent = `${safePercentage.toFixed(1)}%`;
      }

      if (safeBar) {
        safeBar.style.width = `${safePercentage}%`;
      }

      if (analyzedCount) {
        analyzedCount.textContent = distribution.analyzed.toLocaleString();
      }
    });

    const note = $("#mlRiskChartNote");

    if (note) {
      note.textContent = hasPredictions
        ? `${distribution.analyzed} students analyzed. ${distribution.risk} classified At Risk (${riskPercentage.toFixed(1)}%) and ${distribution.safe} classified Not At Risk (${safePercentage.toFixed(1)}%).`
        : "";
    }
  }

  // --------------------------------------------------
  // API RESPONSE NORMALIZATION
  // --------------------------------------------------

  function normalizePredictionResponse(data) {
    let predictions =
      Array.isArray(data) ? data :
      Array.isArray(data?.predictions) ? data.predictions :
      Array.isArray(data?.results) ? data.results :
      Array.isArray(data?.data?.predictions) ? data.data.predictions :
      Array.isArray(data?.data?.results) ? data.data.results :
      Array.isArray(data?.data) ? data.data :
      null;

    if (!predictions) {
      throw new Error("The API response does not contain a recognizable predictions array.");
    }

    if (predictions.length !== students.length) {
      throw new Error(
        `Expected ${students.length} predictions, but received ${predictions.length}.`
      );
    }

    const validatedResults = new Array(students.length);
    const receivedIndexes = new Set();

    predictions.forEach((result, position) => {
      if (!result || typeof result !== "object") {
        throw new Error(`Prediction result ${position + 1} is invalid.`);
      }

      const rawIndex =
        result.index ??
        result.student_index ??
        result.studentIndex ??
        position;

      const index = Number(rawIndex);

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= students.length
      ) {
        throw new Error(`The API returned an invalid student index at result ${position + 1}.`);
      }

      if (receivedIndexes.has(index)) {
        throw new Error(`The API returned a duplicate student result for index ${index}.`);
      }

      const rawPrediction =
        result.prediction ??
        result.predicted_class ??
        result.predictedClass ??
        result.classification ??
        result.label ??
        result.result;

      const normalizedLabel = String(rawPrediction ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

      let prediction;

      if ([
        "at risk",
        "risk",
        "1",
        "true",
        "high risk"
      ].includes(normalizedLabel)) {
        prediction = "At Risk";
      } else if ([
        "not at risk",
        "not risk",
        "safe",
        "0",
        "false",
        "low risk",
        "no risk"
      ].includes(normalizedLabel)) {
        prediction = "Not At Risk";
      } else {
        throw new Error(
          `Unsupported prediction label at result ${position + 1}: ${rawPrediction}`
        );
      }

      let rawScore =
        result.at_risk_probability ??
        result.atRiskProbability ??
        result.risk_probability ??
        result.riskProbability ??
        result.risk_score ??
        result.riskScore ??
        result.probability ??
        result.confidence ??
        result.score;

      if (rawScore && typeof rawScore === "object") {
        rawScore =
          rawScore["At Risk"] ??
          rawScore["at_risk"] ??
          rawScore["1"] ??
          rawScore.risk ??
          rawScore.probability ??
          null;
      }

      let score = rawScore === null || rawScore === undefined
        ? null
        : Number(rawScore);

      if (score !== null && Number.isFinite(score)) {
        if (score >= 0 && score <= 1) {
          score *= 100;
        }

        if (score < 0 || score > 100) {
          score = null;
        }
      } else {
        score = null;
      }

      receivedIndexes.add(index);

      validatedResults[index] = {
        prediction,
        score
      };
    });

    if (receivedIndexes.size !== students.length) {
      throw new Error("The API did not return results for every student.");
    }

    return validatedResults;
  }

  // --------------------------------------------------
  // BATCH MACHINE LEARNING PREDICTION
  // --------------------------------------------------

  async function runBatchPredictions() {
    if (modelApiLoading) return;

    modelApiLoading = true;

    updateModelApiStatus("connecting", "Connecting to prediction service...");
    updateMLRiskChart();

    const existingDistribution = getMLRiskDistribution();

    if (existingDistribution.analyzed > 0) {
      updateMLOverview(
        "connecting",
        existingDistribution.analyzed,
        existingDistribution.risk,
        existingDistribution.safe,
        "Previously received Decision Tree classifications remain visible while the service reconnects."
      );
    } else {
      updateMLOverview(
        "connecting",
        null,
        null,
        null,
        "The Decision Tree model is being contacted. Please wait while student records are analyzed."
      );
    }

    const retryButton = $("#retryModelBtn");

    if (retryButton) {
      retryButton.disabled = true;
      retryButton.textContent = "Connecting...";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const payload = {
        students:students.map(student => ({
          Previous_GWA:student.previousGwa,
          Current_GWA:student.gwa,
          Attendance_Rate:student.attendance,
          Academic_Progress:student.progress,
          Failed_Subjects:student.failedSubjects
        }))
      };

      console.info("Sending ML prediction request.", {
        endpoint:API_URL,
        totalStudents:payload.students.length
      });

      const response = await fetch(API_URL, {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Accept":"application/json"
        },
        body:JSON.stringify(payload),
        signal:controller.signal
      });

      if (!response.ok) {
        let detail = "";

        try {
          const errorData = await response.json();
          detail = errorData.detail || errorData.message || "";
        } catch (_) {
          // The server may return a non-JSON error response.
        }

        throw new Error(
          `API returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`
        );
      }

      const data = await response.json();

      console.info("ML API response received.", data);

      // Validate the full batch before updating student records.
      const validatedResults = normalizePredictionResponse(data);

      validatedResults.forEach((result,index) => {
        students[index].mlPrediction = result.prediction;
        students[index].mlScore = result.score;
      });

      const distribution = getMLRiskDistribution();

      updateModelApiStatus(
        "online",
        `Prediction service online · ${distribution.analyzed} students analyzed`
      );

      updateMLOverview(
        "online",
        distribution.analyzed,
        distribution.risk,
        distribution.safe,
        `${distribution.analyzed} student records successfully classified by the Decision Tree model.`
      );

      renderStudents();
      updateMLRiskChart();
      renderDashboardCharts();

      showToast(`ML predictions received for ${distribution.analyzed} students.`);

      console.info("BSUniSync ML batch prediction completed.", {
        totalStudents:distribution.analyzed,
        atRiskPredictions:distribution.risk,
        notAtRiskPredictions:distribution.safe,
        model:data.model || data.model_name || "Decision Tree"
      });

    } catch (error) {
      console.error("BSUniSync prediction API error:", error);

      const existing = getMLRiskDistribution();

      const errorMessage = error.name === "AbortError"
        ? "Prediction request timed out after 120 seconds. The service may be unavailable or still starting."
        : error.message || "Prediction service unavailable.";

      updateModelApiStatus(
        "offline",
        `${errorMessage} Existing portal features remain active.`
      );

      if (existing.analyzed > 0) {
        updateMLOverview(
          "offline",
          existing.analyzed,
          existing.risk,
          existing.safe,
          "The latest connection attempt was unsuccessful. Previously received ML classifications are still displayed."
        );
      } else {
        updateMLOverview(
          "offline",
          null,
          null,
          null,
          `${errorMessage} Please retry the prediction service.`
        );
      }

      renderStudents();
      updateMLRiskChart();

    } finally {
      clearTimeout(timeout);
      modelApiLoading = false;

      const retryButtonAfter = $("#retryModelBtn");

      if (retryButtonAfter) {
        retryButtonAfter.disabled = false;
        retryButtonAfter.textContent = "Retry";
      }

      updateMLRiskChart();
    }
  }

  // --------------------------------------------------
  // STUDENT RECORDS
  // --------------------------------------------------

  function renderStudentSummary() {
    const counts = {
      total:students.length,
      excellent:0,
      good:0,
      monitoring:0,
      risk:0
    };

    students.forEach(student => {
      const standing = getStanding(student.gwa);

      if (standing === "Excellent") counts.excellent++;
      if (standing === "Good Standing") counts.good++;
      if (standing === "Needs Monitoring") counts.monitoring++;
      if (standing === "At Risk") counts.risk++;
    });

    if ($("#studentTotalCount")) $("#studentTotalCount").textContent = counts.total;
    if ($("#excellentCount")) $("#excellentCount").textContent = counts.excellent;
    if ($("#goodStandingCount")) $("#goodStandingCount").textContent = counts.good;
    if ($("#monitoringCount")) $("#monitoringCount").textContent = counts.monitoring;
    if ($("#studentRiskCount")) $("#studentRiskCount").textContent = counts.risk;
  }

  function renderStudents() {
    const query = ($("#studentSearch")?.value || "").trim().toLowerCase();
    const year = $("#studentYearFilter")?.value || "all";
    const standingFilter = $("#studentStandingFilter")?.value || "all";

    const filtered = students.filter(student => {
      const standing = getStanding(student.gwa);

      const matchesQuery = [
        student.id,
        student.name,
        student.program,
        student.year
      ].join(" ").toLowerCase().includes(query);

      return (
        matchesQuery &&
        (year === "all" || student.year === year) &&
        (standingFilter === "all" || standing === standingFilter)
      );
    });

    const tbody = $("#studentTable");
    if (!tbody) return;

    if ($("#studentResultCount")) {
      $("#studentResultCount").textContent =
        `${filtered.length} ${filtered.length === 1 ? "record" : "records"}`;
    }

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-row">
            No student records match your search or filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(student => {
      const standing = getStanding(student.gwa);
      const statusClass = student.status === "Active" ? "" : "follow-up";

      return `
        <tr>
          <td class="student-id">${escapeHTML(student.id)}</td>
          <td><span class="student-name">${escapeHTML(student.name)}</span></td>
          <td>${escapeHTML(student.program)}</td>
          <td>${escapeHTML(student.year)}</td>
          <td><strong>${Number(student.gwa).toFixed(2)}</strong></td>
          <td>
            <span class="standing-badge ${standingClass(standing)}">
              ${escapeHTML(standing)}
            </span>
          </td>
          <td>
            <span class="record-status ${statusClass}">
              ${escapeHTML(student.status)}
            </span>
          </td>
          <td>${getMLBadge(student)}</td>
          <td>
            <button class="view-record" data-student-id="${escapeHTML(student.id)}">
              View
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function openStudentRecord(studentId) {
    const student = students.find(item => item.id === studentId);
    if (!student) return;

    const standing = getStanding(student.gwa);

    const mlDetails = student.mlPrediction
      ? `
        <div class="detail-cell">
          <span>Machine Learning Prediction</span>
          <strong>
            <span class="ml-badge ${student.mlPrediction === "At Risk" ? "ml-risk" : "ml-safe"}">
              ${escapeHTML(student.mlPrediction)}
            </span>
          </strong>
        </div>
        <div class="detail-cell">
          <span>Model Risk Score</span>
          <strong>${Number.isFinite(student.mlScore) ? `${student.mlScore.toFixed(2)}%` : "Not provided"}</strong>
        </div>
      `
      : `
        <div class="detail-cell">
          <span>Machine Learning Prediction</span>
          <strong>${modelApiStatus === "offline" ? "Unavailable" : "Pending"}</strong>
        </div>
        <div class="detail-cell">
          <span>Model Risk Score</span>
          <strong>Not available</strong>
        </div>
      `;

    $("#modalTitle").textContent = "Student Academic Record";

    $("#modalBody").innerHTML = `
      <div class="student-detail-grid">
        <div class="detail-cell">
          <span>Student Name</span>
          <strong>${escapeHTML(student.name)}</strong>
        </div>
        <div class="detail-cell">
          <span>Student ID</span>
          <strong>${escapeHTML(student.id)}</strong>
        </div>
        <div class="detail-cell">
          <span>Program</span>
          <strong>${escapeHTML(student.program)}</strong>
        </div>
        <div class="detail-cell">
          <span>Year Level</span>
          <strong>${escapeHTML(student.year)}</strong>
        </div>
        <div class="detail-cell">
          <span>General Weighted Average</span>
          <strong>${Number(student.gwa).toFixed(2)}</strong>
        </div>
        <div class="detail-cell">
          <span>Academic Standing</span>
          <strong>
            <span class="standing-badge ${standingClass(standing)}">
              ${escapeHTML(standing)}
            </span>
          </strong>
        </div>
        <div class="detail-cell">
          <span>Attendance</span>
          <strong>${student.attendance}%</strong>
        </div>
        <div class="detail-cell">
          <span>Academic Progress</span>
          <strong>${student.progress}%</strong>
        </div>
        <div class="detail-cell">
          <span>Record Status</span>
          <strong>${escapeHTML(student.status)}</strong>
        </div>
        ${mlDetails}
      </div>

      <div class="detail-note">
        **GWA-based standing:** ${
          standing === "At Risk"
            ? "This student is classified as At Risk based on the current GWA. Academic consultation and follow-up are recommended."
            : standing === "Needs Monitoring"
              ? "This student's academic standing should be monitored. Consider checking progress and providing support when necessary."
              : standing === "Excellent"
                ? "This student is performing excellently based on the current GWA."
                : "This student is currently within the Good Standing range."
        }

        <br><br>

        **ML model inputs:** Previous GWA: ${student.previousGwa};
        Failed subjects: ${student.failedSubjects}.

        These two values are synthetic demonstration inputs,
        not actual student records.

        <br><br>

        The Decision Tree prediction is a decision-support
        indicator only. Its score is not a calibrated probability
        of future academic failure. It must not replace faculty
        assessment or institutional academic policies.
      </div>
    `;

    $("#modalBackdrop").classList.remove("hidden");
  }

  $("#studentTable")?.addEventListener("click", event => {
    const button = event.target.closest("[data-student-id]");
    if (button) openStudentRecord(button.dataset.studentId);
  });

  ["#studentSearch","#studentYearFilter","#studentStandingFilter"].forEach(selector => {
    $(selector)?.addEventListener("input", renderStudents);
    $(selector)?.addEventListener("change", renderStudents);
  });

  // --------------------------------------------------
  // CLASSES AND SCHEDULE
  // --------------------------------------------------

  function renderClasses() {
    const classTable = $("#classTable");

    if (classTable) {
      classTable.innerHTML = classes.map(item => `
        <tr>
          <td><strong>${escapeHTML(item.code)}</strong></td>
          <td>${escapeHTML(item.name)}</td>
          <td>${escapeHTML(item.section)}</td>
          <td>${item.students}</td>
          <td>${escapeHTML(item.schedule)}</td>
          <td><span class="status-pill success">${escapeHTML(item.status)}</span></td>
        </tr>
      `).join("");
    }

    const miniClassList = $("#miniClassList");

    if (miniClassList) {
      miniClassList.innerHTML = classes.map(item => `
        <div class="mini-class-item">
          <div>
            <strong>${escapeHTML(item.code)} · ${escapeHTML(item.name)}</strong>
            <small>${escapeHTML(item.section)} · ${item.students} students</small>
          </div>
          <b>${item.students}</b>
        </div>
      `).join("");
    }
  }

  function renderSchedule() {
    const table = $("#scheduleTable");
    if (!table) return;

    const dayOrder = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

    const ordered = [...schedule].sort((a,b) => {
      const dayDifference = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      return dayDifference || a.time.localeCompare(b.time);
    });

    table.innerHTML = ordered.map(item => `
      <tr>
        <td><strong>${escapeHTML(item.day)}</strong></td>
        <td>${escapeHTML(item.time)}</td>
        <td>${escapeHTML(item.subject)}</td>
        <td>${escapeHTML(item.section)}</td>
        <td>${escapeHTML(item.room)}</td>
      </tr>
    `).join("");
  }

  // --------------------------------------------------
  // ALERTS AND NOTIFICATIONS
  // --------------------------------------------------

  function renderAlerts() {
    const openAlerts = alerts.filter(alert => alert.open);

    if ($("#alertTotal")) $("#alertTotal").textContent = openAlerts.length;

    if ($("#alertNavCount")) {
      $("#alertNavCount").textContent = openAlerts.length;
      $("#alertNavCount").classList.toggle("hidden", openAlerts.length === 0);
    }

    const fullAlertList = $("#fullAlertList");

    if (fullAlertList) {
      fullAlertList.innerHTML = openAlerts.length
        ? openAlerts.map(alert => `
          <div class="alert-item">
            <div class="alert-content">
              <strong>${escapeHTML(alert.title)}</strong>
              <p>${escapeHTML(alert.description)}</p>
              <p>${escapeHTML(alert.date)}</p>
              <button
                class="text-button alert-action"
                data-alert-target="${escapeHTML(alert.target)}"
                data-alert-filter="${escapeHTML(alert.filter)}">
                ${escapeHTML(alert.actionLabel)} →
              </button>
            </div>
            <span class="status-pill ${
              alert.type === "Urgent" ? "danger" :
              alert.type === "Reminder" ? "info" : "warning"
            }">
              ${escapeHTML(alert.type)}
            </span>
          </div>
        `).join("")
        : `
          <div class="empty-alert-state">
            <strong>You're all caught up!</strong>
            <p>There are currently no open academic alerts.</p>
          </div>
        `;
    }

    renderNotifications();
  }

  function renderNotifications() {
    const openAlerts = alerts.filter(alert => alert.open);
    const notificationItems = $("#notificationItems");

    if (notificationItems) {
      notificationItems.innerHTML = openAlerts.length
        ? openAlerts.map(alert => `
          <div class="notification-item">
            <strong>${escapeHTML(alert.title)}</strong>
            ${escapeHTML(alert.description)}
          </div>
        `).join("")
        : `<div class="notification-item">No new notifications.</div>`;
    }

    const dot = $("#notificationDot");

    if (dot) {
      dot.classList.toggle("hidden", notificationsRead || !openAlerts.length);
      dot.textContent = openAlerts.length;
    }
  }

  $("#fullAlertList")?.addEventListener("click", event => {
    const button = event.target.closest("[data-alert-target]");
    if (!button) return;

    const target = button.dataset.alertTarget;
    const filter = button.dataset.alertFilter;

    if (target === "students") {
      $("#studentSearch").value = "";
      $("#studentYearFilter").value = "all";
      $("#studentStandingFilter").value = filter || "all";
      renderStudents();
    }

    showPage(target);
  });

  $("#clearAlertsBtn")?.addEventListener("click", () => {
    alerts = alerts.map(alert => ({...alert,open:false}));
    renderAlerts();
    showToast("All alerts marked as reviewed.");
  });

  $("#markReadBtn")?.addEventListener("click", () => {
    notificationsRead = true;
    renderNotifications();
    showToast("Notifications marked as read.");
  });

  $("#notificationBtn")?.addEventListener("click", () => {
    $("#notificationPopover")?.classList.toggle("hidden");
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".notification-wrap")) {
      $("#notificationPopover")?.classList.add("hidden");
    }
  });

  // --------------------------------------------------
  // MODAL CONTROLS
  // --------------------------------------------------

  function closeModal() {
    $("#modalBackdrop")?.classList.add("hidden");
  }

  $("#modalClose")?.addEventListener("click", closeModal);
  $("#modalCancel")?.addEventListener("click", closeModal);

  $("#modalBackdrop")?.addEventListener("click", event => {
    if (event.target === $("#modalBackdrop")) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
      $("#notificationPopover")?.classList.add("hidden");
    }
  });

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  function showPage(pageName) {
    const target = $(`#page-${pageName}`);
    if (!target) return;

    $$(".page").forEach(page => page.classList.remove("active"));
    target.classList.add("active");

    $$(".nav-link[data-page]").forEach(link => {
      link.classList.toggle("active", link.dataset.page === pageName);
    });

    $("#sidebar")?.classList.remove("open");

    const mainArea = $(".main-area");

    if (mainArea) {
      mainArea.scrollTo({top:0,left:0,behavior:"instant"});
    }

    if (pageName === "overview") {
      renderDashboardCharts();
      updateMLRiskChart();
    }

    if (pageName === "analytics") renderAnalyticsCharts();
    if (pageName === "evaluation") renderEvaluationCharts();
  }

  $$(".nav-link[data-page]").forEach(link => {
    link.addEventListener("click", () => showPage(link.dataset.page));
  });

  $$("[data-go]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.go));
  });

  $("#menuToggle")?.addEventListener("click", () => {
    $("#sidebar")?.classList.toggle("open");
  });

  $("#profileTrigger")?.addEventListener("click", () => showPage("profile"));

  $("#signOutBtn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to sign out?")) {
      showToast("You have signed out of the demo portal.");
    }
  });

  // --------------------------------------------------
  // GLOBAL SEARCH
  // --------------------------------------------------

  $("#globalSearch")?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    const query = event.target.value.trim();
    if (!query) return;

    $("#studentSearch").value = query;
    $("#studentYearFilter").value = "all";
    $("#studentStandingFilter").value = "all";

    renderStudents();
    showPage("students");
  });

  // --------------------------------------------------
  // DASHBOARD FILTERS
  // --------------------------------------------------

  function updateDashboardFilters() {
    const year = $("#yearFilter")?.value || "all";
    const semester = $("#semesterFilter")?.value || "all";

    const yearLabel = year === "all" ? "All Academic Years" : year;

    const semesterLabel =
      semester === "all" ? "Both Semesters" :
      semester === "1" ? "1st Semester" : "2nd Semester";

    if ($("#lastUpdated")) {
      $("#lastUpdated").textContent = `Showing ${yearLabel} · ${semesterLabel}`;
    }

    updateDashboardKPIs();
    renderDashboardCharts();
    updateMLRiskChart();
  }

  $("#yearFilter")?.addEventListener("change", updateDashboardFilters);
  $("#semesterFilter")?.addEventListener("change", updateDashboardFilters);

  $("#resetFilters")?.addEventListener("click", () => {
    if ($("#yearFilter")) $("#yearFilter").value = "2025-2026";
    if ($("#semesterFilter")) $("#semesterFilter").value = "all";

    updateDashboardFilters();
    showToast("Dashboard filters have been reset.");
  });

  // --------------------------------------------------
  // CHART HELPERS
  // --------------------------------------------------

  function chartAvailable() {
    return typeof Chart !== "undefined";
  }

  function baseChartOptions() {
    return {
      responsive:true,
      maintainAspectRatio:false,
      animation:{duration:450},

      plugins:{
        legend:{
          labels:{
            color:getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#a4b0b6",
            font:{family:"Inter",size:10}
          }
        }
      },

      scales:{
        x:{
          ticks:{color:"#9ba8ae",font:{family:"Inter",size:9}},
          grid:{color:"rgba(255,255,255,.06)"}
        },
        y:{
          ticks:{color:"#9ba8ae",font:{family:"Inter",size:9}},
          grid:{color:"rgba(255,255,255,.06)"}
        }
      }
    };
  }

  function createChart(id, config) {
    if (!chartAvailable()) {
      console.warn("Chart.js is not loaded.");
      return;
    }

    const canvas = document.getElementById(id);
    if (!canvas) return;

    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }

    const context = canvas.getContext("2d");
    if (!context) return;

    chartInstances[id] = new Chart(context, config);
  }

  function resizePageCharts(pageId) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const page = document.getElementById(`page-${pageId}`);
        if (!page) return;

        page.querySelectorAll("canvas").forEach(canvas => {
          const chart = chartInstances[canvas.id];

          if (chart) {
            chart.resize();
            chart.update("none");
          }
        });
      });
    });
  }

  // --------------------------------------------------
  // OVERVIEW CHART DATA
  // --------------------------------------------------

  function getGwaDistribution() {
    const records = getDashboardStudents();

    const categories = [
      "Excellent",
      "Good Standing",
      "Needs Monitoring",
      "At Risk"
    ];

    const counts = categories.map(category =>
      records.filter(student => getStanding(student.gwa) === category).length
    );

    return {categories,counts};
  }

  function getAttendanceDistribution() {
    const records = getDashboardStudents();

    const labels = ["Below 70%","70–79%","80–89%","90–100%"];

    const counts = [
      records.filter(student => Number(student.attendance) < 70).length,
      records.filter(student => Number(student.attendance) >= 70 && Number(student.attendance) < 80).length,
      records.filter(student => Number(student.attendance) >= 80 && Number(student.attendance) < 90).length,
      records.filter(student => Number(student.attendance) >= 90 && Number(student.attendance) <= 100).length
    ];

    return {labels,counts};
  }

  // --------------------------------------------------
  // OVERVIEW CHARTS
  // --------------------------------------------------

  function renderDashboardCharts() {
    updateMLRiskChart();

    if (!chartAvailable()) {
      console.warn("Chart.js is unavailable. ML distribution remains active.");
      return;
    }

    createChart("performanceChart", {
      type:"line",
      data:{
        labels:["2023–2024","1st Sem 2024–2025","2nd Sem 2024–2025","1st Sem 2025–2026"],
        datasets:[{
          label:"Illustrative Academic Performance",
          data:[84,86,88,91],
          borderColor:"#168fa0",
          backgroundColor:"rgba(22,143,160,.15)",
          fill:true,
          tension:.35,
          borderWidth:2.5,
          pointRadius:4,
          pointBackgroundColor:"#168fa0"
        }]
      },
      options:{
        ...baseChartOptions(),
        plugins:{legend:{display:false}},
        scales:{
          y:{
            min:70,
            max:100,
            ticks:{color:"#9ba8ae",callback:value => value + "%"},
            grid:{color:"rgba(255,255,255,.06)"}
          },
          x:{
            ticks:{color:"#9ba8ae"},
            grid:{display:false}
          }
        }
      }
    });

    createChart("seteChart", {
      type:"doughnut",
      data:{
        labels:["Very Satisfactory","Satisfactory","Needs Improvement"],
        datasets:[{
          data:[72,21,7],
          backgroundColor:["#188b45","#168fa0","#398bb6"],
          borderWidth:0,
          hoverOffset:5
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        cutout:"76%",
        plugins:{legend:{display:false}}
      }
    });

    const gwaDistribution = getGwaDistribution();

    createChart("gwaDistributionChart", {
      type:"doughnut",
      data:{
        labels:gwaDistribution.categories,
        datasets:[{
          label:"Number of Students",
          data:gwaDistribution.counts,
          backgroundColor:["#188b45","#168fa0","#c99539","#d92332"],
          borderColor:"#222b32",
          borderWidth:3,
          hoverOffset:9,
          spacing:2
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        cutout:"62%",
        animation:{animateRotate:true,animateScale:true,duration:650},
        plugins:{
          legend:{
            position:"bottom",
            labels:{
              color:getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#a4b0b6",
              padding:14,
              usePointStyle:true,
              pointStyle:"circle",
              font:{family:"Inter",size:9}
            }
          },
          tooltip:{
            callbacks:{
              label:context => {
                const total = context.dataset.data.reduce((sum,value) => sum + value,0);
                const percentage = total ? (context.raw / total * 100).toFixed(1) : "0.0";
                return ` ${context.label}: ${context.raw} students (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    const attendanceDistribution = getAttendanceDistribution();

    createChart("attendanceDistributionChart", {
      type:"polarArea",
      data:{
        labels:attendanceDistribution.labels,
        datasets:[{
          label:"Number of Students",
          data:attendanceDistribution.counts,
          backgroundColor:[
            "rgba(217,35,50,.78)",
            "rgba(201,149,57,.78)",
            "rgba(57,139,182,.78)",
            "rgba(24,139,69,.78)"
          ],
          borderColor:["#d92332","#c99539","#398bb6","#188b45"],
          borderWidth:2,
          hoverOffset:9
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        animation:{duration:650},
        scales:{
          r:{
            beginAtZero:true,
            ticks:{display:false,backdropColor:"transparent"},
            grid:{color:"rgba(255,255,255,.10)"},
            angleLines:{color:"rgba(255,255,255,.10)"},
            pointLabels:{
              color:"#a4b0b6",
              font:{family:"Inter",size:9}
            }
          }
        },
        plugins:{
          legend:{
            position:"bottom",
            labels:{
              color:getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#a4b0b6",
              padding:13,
              usePointStyle:true,
              pointStyle:"circle",
              font:{family:"Inter",size:9}
            }
          },
          tooltip:{
            callbacks:{
              label:context => {
                const total = context.dataset.data.reduce((sum,value) => sum + value,0);
                const percentage = total ? (context.raw / total * 100).toFixed(1) : "0.0";
                return ` ${context.label}: ${context.raw} students (${percentage}%)`;
              }
            }
          }
        }
      }
    });

    resizePageCharts("overview");
  }

  // --------------------------------------------------
  // ANALYTICS CHARTS
  // --------------------------------------------------

  function renderAnalyticsCharts() {
    if (!chartAvailable()) return;

    createChart("passingTrendChart", {
      type:"line",
      data:{
        labels:["2023–2024","1st Sem 2024–2025","2nd Sem 2024–2025","1st Sem 2025–2026"],
        datasets:[{
          label:"Illustrative Passing Rate",
          data:[84,86,88,89.2],
          borderColor:"#168fa0",
          backgroundColor:"rgba(22,143,160,.13)",
          fill:true,
          tension:.35,
          borderWidth:2.5,
          pointRadius:4
        }]
      },
      options:{
        ...baseChartOptions(),
        scales:{
          y:{
            min:70,
            max:100,
            ticks:{color:"#9ba8ae",callback:value => value + "%"},
            grid:{color:"rgba(255,255,255,.06)"}
          },
          x:{
            ticks:{color:"#9ba8ae"},
            grid:{display:false}
          }
        }
      }
    });

    const gwaDistribution = getGwaDistribution();

    createChart("gradeChart", {
      type:"bar",
      data:{
        labels:["1.00–1.50","1.51–2.00","2.01–2.25","2.26–2.75","Above 2.75"],
        datasets:[{
          label:"Students",
          data:[
            ...gwaDistribution.counts.slice(0,1),
            students.filter(student => student.gwa > 1.50 && student.gwa <= 2.00).length,
            students.filter(student => student.gwa > 2.00 && student.gwa <= 2.25).length,
            students.filter(student => student.gwa > 2.25 && student.gwa <= 2.75).length,
            students.filter(student => student.gwa > 2.75).length
          ],
          backgroundColor:["#188b45","#168fa0","#398bb6","#c99539","#d92332"],
          borderRadius:5,
          maxBarThickness:42
        }]
      },
      options:{
        ...baseChartOptions(),
        plugins:{legend:{display:false}},
        scales:{
          y:{
            beginAtZero:true,
            ticks:{color:"#9ba8ae",precision:0},
            grid:{color:"rgba(255,255,255,.06)"}
          },
          x:{
            ticks:{color:"#9ba8ae",maxRotation:0,minRotation:0},
            grid:{display:false}
          }
        }
      }
    });

    createChart("subjectChart", {
      type:"bar",
      data:{
        labels:classes.map(item => item.code),
        datasets:[{
          label:"Illustrative Passing Rate",
          data:subjectPassingRates,
          backgroundColor:["#168fa0","#398bb6","#188b45","#d1a34c","#168fa0","#398bb6"],
          borderRadius:6,
          borderSkipped:false,
          barThickness:24
        }]
      },
      options:{
        indexAxis:"y",
        responsive:true,
        maintainAspectRatio:false,
        animation:{duration:500},
        plugins:{
          legend:{display:false},
          tooltip:{
            callbacks:{
              label:context => ` Illustrative Passing Rate: ${context.raw}%`
            }
          }
        },
        scales:{
          x:{
            min:0,
            max:100,
            ticks:{color:"#a4b0b6",callback:value => value + "%",stepSize:20},
            grid:{color:"rgba(255,255,255,.07)"}
          },
          y:{
            beginAtZero:true,
            ticks:{
              color:"#e0e7e9",
              font:{family:"Inter",size:11,weight:"600"}
            },
            grid:{display:false}
          }
        }
      }
    });

    resizePageCharts("analytics");
  }

  // --------------------------------------------------
  // EVALUATION CHARTS
  // --------------------------------------------------

  function renderEvaluationCharts() {
    if (!chartAvailable()) return;

    createChart("dimensionChart", {
      type:"bar",
      data:{
        labels:["Subject Knowledge","Communication","Class Management","Learning Support","Professionalism"],
        datasets:[{
          label:"Illustrative Average Rating",
          data:[4.4,4.3,4.2,4.25,4.35],
          backgroundColor:["#168fa0","#398bb6","#188b45","#168fa0","#398bb6"],
          borderRadius:5,
          maxBarThickness:38
        }]
      },
      options:{
        ...baseChartOptions(),
        plugins:{legend:{display:false}},
        scales:{
          y:{
            min:0,
            max:5,
            ticks:{color:"#9ba8ae",stepSize:1},
            grid:{color:"rgba(255,255,255,.06)"}
          },
          x:{
            ticks:{color:"#9ba8ae",font:{size:8}},
            grid:{display:false}
          }
        }
      }
    });

    createChart("evaluationChart", {
      type:"doughnut",
      data:{
        labels:["Very Satisfactory","Satisfactory","Needs Improvement"],
        datasets:[{
          data:[72,21,7],
          backgroundColor:["#188b45","#168fa0","#398bb6"],
          borderWidth:0
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        cutout:"65%",
        plugins:{
          legend:{
            position:"bottom",
            labels:{color:"#a4b0b6",padding:15,font:{size:9}}
          }
        }
      }
    });

    resizePageCharts("evaluation");
  }

  // --------------------------------------------------
  // PROFILE AND SETTINGS
  // --------------------------------------------------

  let savedProfile = {};

  try {
    savedProfile = JSON.parse(localStorage.getItem("bsunisyncProfile") || "{}");
  } catch (error) {
    console.warn("Unable to read saved profile settings.", error);
    savedProfile = {};
  }

  const initialName = savedProfile.name || "Faculty Member";

  function updateFacultyName(name) {
    const cleanName = name.trim() || "Faculty Member";

    if ($("#welcomeName")) $("#welcomeName").textContent = cleanName;
    if ($("#topFacultyName")) $("#topFacultyName").textContent = cleanName;
    if ($("#profileNameHeading")) $("#profileNameHeading").textContent = cleanName;

    if ($(".profile-trigger .avatar")) {
      $(".profile-trigger .avatar").textContent = getInitials(cleanName);
    }

    if ($(".profile-large .avatar")) {
      $(".profile-large .avatar").textContent = getInitials(cleanName);
    }
  }

  if ($("#facultyName")) $("#facultyName").value = initialName;
  updateFacultyName(initialName);

  if (savedProfile.theme === "light") {
    document.body.classList.add("light-theme");
    if ($("#themeSelect")) $("#themeSelect").value = "light";
  }

  $("#profileForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#facultyName").value.trim() || "Faculty Member";
    const theme = $("#themeSelect").value;

    localStorage.setItem("bsunisyncProfile",JSON.stringify({name,theme}));

    updateFacultyName(name);
    document.body.classList.toggle("light-theme",theme === "light");

    Object.keys(chartInstances).forEach(id => {
      const chart = chartInstances[id];

      if (
        chart &&
        chart.options.plugins &&
        chart.options.plugins.legend &&
        chart.options.plugins.legend.labels
      ) {
        chart.options.plugins.legend.labels.color =
          getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#a4b0b6";

        chart.update();
      }
    });

    showToast("Profile and settings saved successfully.");
  });

  $("#themeSelect")?.addEventListener("change", event => {
    document.body.classList.toggle("light-theme",event.target.value === "light");

    Object.values(chartInstances).forEach(chart => {
      if (chart) chart.update();
    });
  });

  // --------------------------------------------------
  // PRINT
  // --------------------------------------------------

  $("#printSchedule")?.addEventListener("click", () => {
    window.print();
  });

  // --------------------------------------------------
  // INITIAL RENDER
  // --------------------------------------------------

  addMLInterface();

  updateMLOverview(
    "connecting",
    null,
    null,
    null,
    "Connecting to the Decision Tree prediction service..."
  );

  renderStudentSummary();
  renderStudents();
  renderClasses();
  renderSchedule();
  renderAlerts();
  renderNotifications();

  // Start the API request before chart rendering.
  // A chart rendering issue should not prevent ML analysis.
  runBatchPredictions();

  updateDashboardFilters();
  renderDashboardCharts();

  // --------------------------------------------------
  // WINDOW RESIZE AND TAB VISIBILITY
  // --------------------------------------------------

  window.addEventListener("resize", () => {
    Object.values(chartInstances).forEach(chart => {
      if (chart) chart.resize();
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;

    const activePage = $(".page.active");
    if (!activePage) return;

    const pageName = activePage.id.replace("page-","");

    if (pageName === "overview") {
      renderDashboardCharts();
      updateMLRiskChart();
    }

    if (pageName === "analytics") renderAnalyticsCharts();
    if (pageName === "evaluation") renderEvaluationCharts();
  });

});
