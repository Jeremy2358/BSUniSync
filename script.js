
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
  // DEMO STUDENT DATA
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
  // SYNTHETIC ML INPUT PREPARATION
  // --------------------------------------------------

  // Previous_GWA and Failed_Subjects are generated
  // synthetic demonstration inputs.
  // They are NOT actual student academic records.

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
      date:"Based on current student records",
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
      date:"Based on current student records",
      actionLabel:"Review Student Records",
      target:"students",
      filter:"all",
      open:true
    },
    {
      id:"sete",
      title:"Teaching Evaluation Summary",
      description:"Your current SETE rating is 4.28 out of 5. Review the evaluation results and rating distribution for your assigned classes.",
      type:"Reminder",
      date:"Current evaluation summary",
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

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
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

    if (!statusElement || !statusText || !totalElement ||
        !riskElement || !safeElement || !messageElement) {
      return;
    }

    statusElement.className = `ml-overview-status ${status}`;

    if (status === "online") {
      statusText.textContent = "Model Online";
    } else if (status === "offline") {
      statusText.textContent = "Service Offline";
    } else {
      statusText.textContent = "Connecting...";
    }

    totalElement.textContent =
      total === null ? "—" : Number(total).toLocaleString();

    riskElement.textContent =
      risk === null ? "—" : Number(risk).toLocaleString();

    safeElement.textContent =
      safe === null ? "—" : Number(safe).toLocaleString();

    messageElement.textContent = message;
  }

  // --------------------------------------------------
  // DYNAMIC ML INTERFACE
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
        <button type="button" id="retryModelBtn" class="model-retry-button">
          Retry
        </button>
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

        .model-api-status.online .model-api-dot {
          background:#35bd7a;
        }

        .model-api-status.offline .model-api-dot {
          background:#e45b63;
        }

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

        .model-retry-button:disabled {
          opacity:.5;
          cursor:wait;
        }

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

        .ml-risk {
          background:rgba(217,35,50,.16);
          color:#ff7e85;
        }

        .ml-safe {
          background:rgba(24,139,69,.16);
          color:#63d296;
        }

        .ml-pending {
          background:rgba(201,149,57,.16);
          color:#e8bc6d;
        }

        .ml-unavailable {
          background:rgba(150,160,165,.14);
          color:#b6c0c4;
        }

        .ml-score {
          display:block;
          color:var(--muted);
          font-size:8px;
          margin-top:4px;
        }

        .student-table th:nth-child(1) { width:10%; }
        .student-table th:nth-child(2) { width:15%; }
        .student-table th:nth-child(3) { width:8%; }
        .student-table th:nth-child(4) { width:8%; }
        .student-table th:nth-child(5) { width:6%; }
        .student-table th:nth-child(6) { width:14%; }
        .student-table th:nth-child(7) { width:11%; }
        .student-table th:nth-child(8) { width:13%; }
        .student-table th:nth-child(9) { width:8%; }

        /* ML distribution visualization */

        .ml-gauge-wrap {
          height:auto !important;
          min-height:245px;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:24px 20px;
          box-sizing:border-box;
        }

        .ml-risk-distribution {
          width:100%;
          max-width:560px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          gap:25px;
          margin:auto;
        }

        .ml-risk-row {
          width:100%;
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .ml-risk-row-top {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
        }

        .ml-risk-label {
          display:flex;
          align-items:center;
          gap:9px;
          color:var(--text);
          font-size:12px;
          font-weight:700;
        }

        .ml-risk-dot {
          width:9px;
          height:9px;
          border-radius:50%;
          flex-shrink:0;
        }

        .ml-risk-dot.danger {
          background:#e34b55;
          box-shadow:0 0 10px rgba(227,75,85,.3);
        }

        .ml-risk-dot.success {
          background:#2eb879;
          box-shadow:0 0 10px rgba(46,184,121,.3);
        }

        .ml-risk-values {
          display:flex;
          align-items:baseline;
          gap:7px;
          white-space:nowrap;
        }

        .ml-risk-count {
          color:var(--text);
          font-size:17px;
          font-weight:800;
          font-variant-numeric:tabular-nums;
        }

        .ml-risk-percent {
          color:var(--muted);
          font-size:10px;
          font-weight:600;
        }

        .ml-risk-track {
          width:100%;
          height:13px;
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

        .ml-risk-empty {
          display:flex;
          min-height:150px;
          align-items:center;
          justify-content:center;
          flex-direction:column;
          gap:9px;
          text-align:center;
          color:var(--muted);
        }

        .ml-risk-empty strong {
          color:var(--text);
          font-size:13px;
        }

        .ml-risk-empty span {
          max-width:320px;
          font-size:10px;
          line-height:1.6;
        }

        .ml-risk-total {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          padding-top:13px;
          border-top:1px solid var(--border);
          color:var(--muted);
          font-size:10px;
        }

        .ml-risk-total strong {
          color:var(--text);
          font-size:12px;
        }

        .overview-insights-grid {
          display:grid !important;
          grid-template-columns:repeat(3,minmax(0,1fr));
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

        @media(max-width:1050px) {
          .overview-insights-grid {
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
        }

        @media(max-width:760px) {
          .student-record-heading {
            align-items:flex-start;
            flex-direction:column;
          }

          .model-api-status {
            margin-left:0;
          }

          .ml-disclaimer {
            padding-left:14px;
            padding-right:14px;
          }

          .overview-insights-grid {
            grid-template-columns:minmax(0,1fr);
            gap:14px;
          }

          .ml-gauge-wrap {
            min-height:220px;
            padding:20px 14px;
          }

          .ml-risk-distribution {
            gap:21px;
          }
        }
      `;

      document.head.appendChild(style);
    }

    $("#retryModelBtn")?.addEventListener("click", runBatchPredictions);

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

    if (messageElement) {
      messageElement.textContent = message;
    }

    if (retryButton) {
      retryButton.disabled = modelApiLoading;
      retryButton.textContent = modelApiLoading ? "Connecting..." : "Retry";
      retryButton.classList.toggle("hidden", status === "online");
    }
  }

  function getMLBadge(student) {
    if (!student.mlPrediction) {
      if (modelApiStatus === "offline") {
        return `<span class="ml-badge ml-unavailable">Unavailable</span>`;
      }

      return `<span class="ml-badge ml-pending">Pending</span>`;
    }

    const isRisk = student.mlPrediction === "At Risk";

    return `
      <span class="ml-badge ${isRisk ? "ml-risk" : "ml-safe"}">
        ${escapeHTML(student.mlPrediction)}
      </span>
      <small class="ml-score">Model score: ${Number(student.mlScore).toFixed(2)}%</small>
    `;
  }

  // --------------------------------------------------
  // BATCH MACHINE LEARNING PREDICTION
  // --------------------------------------------------

  async function runBatchPredictions() {
    if (modelApiLoading) return;

    modelApiLoading = true;

    updateModelApiStatus(
      "connecting",
      "Connecting to prediction service..."
    );

    updateMLOverview(
      "connecting",
      null,
      null,
      null,
      "The Decision Tree model is being contacted. Please wait while student records are analyzed."
    );

    updateMLRiskChart("connecting");

    const retryButton = $("#retryModelBtn");

    if (retryButton) {
      retryButton.disabled = true;
      retryButton.textContent = "Connecting...";
    }

    try {
      const payload = {
        students: students.map(student => ({
          Previous_GWA: student.previousGwa,
          Current_GWA: student.gwa,
          Attendance_Rate: student.attendance,
          Academic_Progress: student.progress,
          Failed_Subjects: student.failedSubjects
        }))
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);

      let response;

      try {
        response = await fetch(API_URL, {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            "Accept":"application/json"
          },
          body:JSON.stringify(payload),
          signal:controller.signal
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.predictions) ||
          data.predictions.length !== students.length) {
        throw new Error("The API returned an unexpected prediction result.");
      }

      if (data.total_students !== students.length) {
        throw new Error("The API returned an incorrect student count.");
      }

      const validatedResults = new Array(students.length);
      const receivedIndexes = new Set();

      data.predictions.forEach(result => {
        if (!Number.isInteger(result.index) ||
            result.index < 0 ||
            result.index >= students.length) {
          throw new Error("The API returned an invalid student index.");
        }

        if (receivedIndexes.has(result.index)) {
          throw new Error("The API returned a duplicate student result.");
        }

        if (
          result.prediction !== "At Risk" &&
          result.prediction !== "Not At Risk"
        ) {
          throw new Error("The API returned an invalid prediction label.");
        }

        const score = Number(result.at_risk_probability);

        if (!Number.isFinite(score) || score < 0 || score > 100) {
          throw new Error("The API returned an invalid model score.");
        }

        receivedIndexes.add(result.index);

        validatedResults[result.index] = {
          prediction:result.prediction,
          score
        };
      });

      if (receivedIndexes.size !== students.length) {
        throw new Error("The API did not return results for every student.");
      }

      // Apply predictions only after the entire response
      // has passed validation.

      validatedResults.forEach((result, index) => {
        students[index].mlPrediction = result.prediction;
        students[index].mlScore = result.score;
      });

      const totalAnalyzed = students.filter(student =>
        student.mlPrediction === "At Risk" ||
        student.mlPrediction === "Not At Risk"
      ).length;

      const riskCount = students.filter(
        student => student.mlPrediction === "At Risk"
      ).length;

      const safeCount = students.filter(
        student => student.mlPrediction === "Not At Risk"
      ).length;

      updateMLOverview(
        "online",
        totalAnalyzed,
        riskCount,
        safeCount,
        `${totalAnalyzed} student records successfully classified by the Decision Tree model.`
      );

      updateModelApiStatus(
        "online",
        `Prediction service online · ${totalAnalyzed} students analyzed`
      );

      renderStudents();
      renderDashboardCharts();
      updateMLRiskChart("online");

      showToast(`ML predictions received for ${totalAnalyzed} students.`);

      console.info("BSUniSync ML batch prediction completed.", {
        totalStudents:totalAnalyzed,
        atRiskPredictions:riskCount,
        notAtRiskPredictions:safeCount,
        model:data.model
      });

    } catch (error) {
      console.error("BSUniSync prediction API error:",error);

      students.forEach(student => {
        student.mlPrediction = null;
        student.mlScore = null;
      });

      updateModelApiStatus(
        "offline",
        error.name === "AbortError"
          ? "Prediction request timed out. The service may be waking up."
          : "Prediction service unavailable. Existing portal features remain active."
      );

      updateMLOverview(
        "offline",
        null,
        null,
        null,
        error.name === "AbortError"
          ? "The prediction request timed out. The service may be waking up. Please retry."
          : "The prediction service is currently unavailable. Student records and other portal features remain accessible."
      );

      renderStudents();
      updateMLRiskChart("offline");

    } finally {
      modelApiLoading = false;

      const retryButtonAfter = $("#retryModelBtn");

      if (retryButtonAfter) {
        retryButtonAfter.disabled = false;
        retryButtonAfter.textContent = "Retry";
      }
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

    $("#studentTotalCount").textContent = counts.total;
    $("#excellentCount").textContent = counts.excellent;
    $("#goodStandingCount").textContent = counts.good;
    $("#monitoringCount").textContent = counts.monitoring;
    $("#studentRiskCount").textContent = counts.risk;

    // This KPI intentionally remains GWA-based.
    $("#kpiAtRisk").textContent = counts.risk;
    $("#kpiAtRiskDetail").textContent = `${counts.risk} students require academic attention`;
    $("#kpiStudents").textContent = counts.total;
  }

  function renderStudents() {
    const query = ($("#studentSearch")?.value || "").trim().toLowerCase();
    const year = $("#studentYearFilter")?.value || "all";
    const standingFilter = $("#studentStandingFilter")?.value || "all";

    const filtered = students.filter(student => {
      const standing = getStanding(student.gwa);

      const matchesQuery = [
        student.id,student.name,student.program,student.year
      ].join(" ").toLowerCase().includes(query);

      return matchesQuery &&
        (year === "all" || student.year === year) &&
        (standingFilter === "all" || standing === standingFilter);
    });

    const tbody = $("#studentTable");
    if (!tbody) return;

    $("#studentResultCount").textContent =
      `${filtered.length} ${filtered.length === 1 ? "record" : "records"}`;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-row">No student records match your search or filters.</td></tr>`;
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
          <td><span class="standing-badge ${standingClass(standing)}">${escapeHTML(standing)}</span></td>
          <td><span class="record-status ${statusClass}">${escapeHTML(student.status)}</span></td>
          <td>${getMLBadge(student)}</td>
          <td><button class="view-record" data-student-id="${escapeHTML(student.id)}">View</button></td>
        </tr>`;
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
          <strong>${Number(student.mlScore).toFixed(2)}%</strong>
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
        <div class="detail-cell"><span>Student Name</span><strong>${escapeHTML(student.name)}</strong></div>
        <div class="detail-cell"><span>Student ID</span><strong>${escapeHTML(student.id)}</strong></div>
        <div class="detail-cell"><span>Program</span><strong>${escapeHTML(student.program)}</strong></div>
        <div class="detail-cell"><span>Year Level</span><strong>${escapeHTML(student.year)}</strong></div>
        <div class="detail-cell"><span>General Weighted Average</span><strong>${Number(student.gwa).toFixed(2)}</strong></div>
        <div class="detail-cell"><span>Academic Standing</span><strong><span class="standing-badge ${standingClass(standing)}">${escapeHTML(standing)}</span></strong></div>
        <div class="detail-cell"><span>Attendance</span><strong>${student.attendance}%</strong></div>
        <div class="detail-cell"><span>Academic Progress</span><strong>${student.progress}%</strong></div>
        <div class="detail-cell"><span>Record Status</span><strong>${escapeHTML(student.status)}</strong></div>
        ${mlDetails}
      </div>

      <div class="detail-note">
        **GWA-based standing:** ${standing === "At Risk"
          ? "This student is classified as At Risk based on the current GWA. Academic consultation and follow-up are recommended."
          : standing === "Needs Monitoring"
            ? "This student's academic standing should be monitored. Consider checking progress and providing support when necessary."
            : standing === "Excellent"
              ? "This student is performing excellently based on the current GWA."
              : "This student is currently within the Good Standing range."}

        <br><br>
        **ML model inputs:** Previous GWA: ${student.previousGwa}; Failed subjects: ${student.failedSubjects}.
        These two values are synthetic demonstration inputs, not actual student records.

        <br><br>
        The Decision Tree prediction is a decision-support indicator only. Its score is not a calibrated probability of future academic failure. It must not replace faculty assessment or institutional academic policies.
      </div>`;

    $("#modalBackdrop").classList.remove("hidden");
  }

  $("#studentTable").addEventListener("click", event => {
    const button = event.target.closest("[data-student-id]");
    if (button) openStudentRecord(button.dataset.studentId);
  });

  ["#studentSearch","#studentYearFilter","#studentStandingFilter"].forEach(selector => {
    $(selector).addEventListener("input", renderStudents);
    $(selector).addEventListener("change", renderStudents);
  });

  // --------------------------------------------------
  // CLASSES AND SCHEDULE
  // --------------------------------------------------

  function renderClasses() {
    $("#classTable").innerHTML = classes.map(item => `
      <tr>
        <td><strong>${escapeHTML(item.code)}</strong></td>
        <td>${escapeHTML(item.name)}</td>
        <td>${escapeHTML(item.section)}</td>
        <td>${item.students}</td>
        <td>${escapeHTML(item.schedule)}</td>
        <td><span class="status-pill success">${escapeHTML(item.status)}</span></td>
      </tr>`).join("");

    $("#miniClassList").innerHTML = classes.map(item => `
      <div class="mini-class-item">
        <div><strong>${escapeHTML(item.code)} · ${escapeHTML(item.name)}</strong><small>${escapeHTML(item.section)} · ${item.students} students</small></div>
        <b>${item.students}</b>
      </div>`).join("");
  }

  function renderSchedule() {
    const dayOrder = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

    const ordered = [...schedule].sort((a,b) => {
      const dayDifference = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      return dayDifference || a.time.localeCompare(b.time);
    });

    $("#scheduleTable").innerHTML = ordered.map(item => `
      <tr>
        <td><strong>${escapeHTML(item.day)}</strong></td>
        <td>${escapeHTML(item.time)}</td>
        <td>${escapeHTML(item.subject)}</td>
        <td>${escapeHTML(item.section)}</td>
        <td>${escapeHTML(item.room)}</td>
      </tr>`).join("");
  }

  // --------------------------------------------------
  // ALERTS AND NOTIFICATIONS
  // --------------------------------------------------

  function renderAlerts() {
    const openAlerts = alerts.filter(alert => alert.open);

    $("#alertTotal").textContent = openAlerts.length;
    $("#alertNavCount").textContent = openAlerts.length;

    $("#alertNavCount").classList.toggle("hidden", openAlerts.length === 0);

    $("#fullAlertList").innerHTML = openAlerts.length
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
          }">${escapeHTML(alert.type)}</span>
        </div>`).join("")
      : `<div class="empty-alert-state">
          <strong>You're all caught up!</strong>
          <p>There are currently no open academic alerts.</p>
        </div>`;

    renderNotifications();
  }

  function renderNotifications() {
    const openAlerts = alerts.filter(alert => alert.open);

    $("#notificationItems").innerHTML = openAlerts.length
      ? openAlerts.map(alert => `
        <div class="notification-item">
          <strong>${escapeHTML(alert.title)}</strong>
          ${escapeHTML(alert.description)}
        </div>`).join("")
      : `<div class="notification-item">No new notifications.</div>`;

    $("#notificationDot").classList.toggle("hidden", notificationsRead || !openAlerts.length);
    $("#notificationDot").textContent = openAlerts.length;
  }

  $("#fullAlertList").addEventListener("click", event => {
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

  $("#clearAlertsBtn").addEventListener("click", () => {
    alerts = alerts.map(alert => ({...alert,open:false}));
    renderAlerts();
    showToast("All alerts marked as reviewed.");
  });

  $("#markReadBtn").addEventListener("click", () => {
    notificationsRead = true;
    renderNotifications();
    showToast("Notifications marked as read.");
  });

  $("#notificationBtn").addEventListener("click", () => {
    $("#notificationPopover").classList.toggle("hidden");
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".notification-wrap")) {
      $("#notificationPopover").classList.add("hidden");
    }
  });

  // --------------------------------------------------
  // MODAL CONTROLS
  // --------------------------------------------------

  function closeModal() {
    $("#modalBackdrop").classList.add("hidden");
  }

  $("#modalClose").addEventListener("click", closeModal);
  $("#modalCancel").addEventListener("click", closeModal);

  $("#modalBackdrop").addEventListener("click", event => {
    if (event.target === $("#modalBackdrop")) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
      $("#notificationPopover").classList.add("hidden");
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

    $("#sidebar").classList.remove("open");

    const mainArea = $(".main-area");

    if (mainArea) {
      mainArea.scrollTo({
        top:0,
        left:0,
        behavior:"instant"
      });
    }

    if (pageName === "overview") renderDashboardCharts();
    if (pageName === "analytics") renderAnalyticsCharts();
    if (pageName === "evaluation") renderEvaluationCharts();
  }

  $$(".nav-link[data-page]").forEach(link => {
    link.addEventListener("click", () => showPage(link.dataset.page));
  });

  $$("[data-go]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.go));
  });

  $("#menuToggle").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
  });

  $("#profileTrigger").addEventListener("click", () => showPage("profile"));

  $("#signOutBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to sign out?")) {
      showToast("You have signed out of the demo portal.");
    }
  });

  // --------------------------------------------------
  // GLOBAL SEARCH
  // --------------------------------------------------

  $("#globalSearch").addEventListener("keydown", event => {
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
    const year = $("#yearFilter").value;
    const semester = $("#semesterFilter").value;

    $("#lastUpdated").textContent =
      `Showing ${year} · ${semester === "all" ? "Both Semesters" : semester === "1" ? "1st Semester" : "2nd Semester"}`;
  }

  $("#yearFilter").addEventListener("change", updateDashboardFilters);
  $("#semesterFilter").addEventListener("change", updateDashboardFilters);

  $("#resetFilters").addEventListener("click", () => {
    $("#yearFilter").value = "2025-2026";
    $("#semesterFilter").value = "all";
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
  // ADDITIONAL OVERVIEW CHART DATA
  // --------------------------------------------------

  function getGwaDistribution() {
    const categories = [
      "Excellent",
      "Good Standing",
      "Needs Monitoring",
      "At Risk"
    ];

    const counts = categories.map(category =>
      students.filter(student => getStanding(student.gwa) === category).length
    );

    return {categories,counts};
  }

  function getAttendanceDistribution() {
    const labels = [
      "Below 70%",
      "70–79%",
      "80–89%",
      "90–100%"
    ];

    const counts = [
      students.filter(student => Number(student.attendance) < 70).length,
      students.filter(student => Number(student.attendance) >= 70 && Number(student.attendance) < 80).length,
      students.filter(student => Number(student.attendance) >= 80 && Number(student.attendance) < 90).length,
      students.filter(student => Number(student.attendance) >= 90 && Number(student.attendance) <= 100).length
    ];

    return {labels,counts};
  }

  function getMLRiskDistribution() {
    const analyzed = students.filter(student =>
      student.mlPrediction === "At Risk" ||
      student.mlPrediction === "Not At Risk"
    );

    return {
      analyzed:analyzed.length,
      risk:analyzed.filter(student => student.mlPrediction === "At Risk").length,
      safe:analyzed.filter(student => student.mlPrediction === "Not At Risk").length
    };
  }

  // --------------------------------------------------
  // ML RISK DISTRIBUTION
  // Replaces the old semicircular gauge completely.
  // --------------------------------------------------

  function initializeMLRiskDistribution() {
    const gaugeWrap = $(".ml-gauge-wrap");

    if (!gaugeWrap) {
      console.warn("ML distribution container .ml-gauge-wrap was not found.");
      return;
    }

    gaugeWrap.innerHTML = `
      <div class="ml-risk-distribution" id="mlRiskDistribution">

        <div class="ml-risk-empty" id="mlRiskEmpty">
          <strong>Waiting for ML analysis</strong>
          <span>The student classifications will appear here after the prediction service responds.</span>
        </div>

        <div class="ml-risk-row" id="mlRiskRow" hidden>
          <div class="ml-risk-row-top">
            <div class="ml-risk-label">
              <span class="ml-risk-dot danger"></span>
              At Risk
            </div>

            <div class="ml-risk-values">
              <strong class="ml-risk-count" id="mlRiskCount">0</strong>
              <span class="ml-risk-percent" id="mlRiskPercent">0%</span>
            </div>
          </div>

          <div class="ml-risk-track">
            <div class="ml-risk-fill danger" id="mlRiskBar"></div>
          </div>
        </div>

        <div class="ml-risk-row" id="mlSafeRow" hidden>
          <div class="ml-risk-row-top">
            <div class="ml-risk-label">
              <span class="ml-risk-dot success"></span>
              Not At Risk
            </div>

            <div class="ml-risk-values">
              <strong class="ml-risk-count" id="mlSafeCount">0</strong>
              <span class="ml-risk-percent" id="mlSafePercent">0%</span>
            </div>
          </div>

          <div class="ml-risk-track">
            <div class="ml-risk-fill success" id="mlSafeBar"></div>
          </div>
        </div>

        <div class="ml-risk-total" id="mlRiskTotal" hidden>
          <span>Total analyzed students</span>
          <strong id="mlAnalyzedCount">0</strong>
        </div>

      </div>
    `;

    updateMLRiskChart("connecting");
  }

  function updateMLRiskChart(status) {
    const emptyState = $("#mlRiskEmpty");
    const riskRow = $("#mlRiskRow");
    const safeRow = $("#mlSafeRow");
    const totalRow = $("#mlRiskTotal");
    const note = $("#mlRiskChartNote");

    if (!emptyState || !riskRow || !safeRow || !totalRow) return;

    // Reset the visualization before applying a new state.

    riskRow.hidden = true;
    safeRow.hidden = true;
    totalRow.hidden = true;

    if (status === "connecting") {
      emptyState.hidden = false;

      emptyState.innerHTML = `
        <strong>Connecting to prediction service...</strong>
        <span>Waiting for the Decision Tree model. No classifications or percentages are displayed yet.</span>
      `;

      if (note) {
        note.textContent =
          "The distribution will be populated using actual API classifications after analysis is complete.";
      }

      return;
    }

    if (status === "offline") {
      emptyState.hidden = false;

      emptyState.innerHTML = `
        <strong>Prediction service unavailable</strong>
        <span>ML classifications cannot currently be displayed. Use Retry in Student Records to reconnect.</span>
      `;

      if (note) {
        note.textContent =
          "No ML distribution is available because the prediction service did not return a valid result.";
      }

      return;
    }

    const distribution = getMLRiskDistribution();

    if (!distribution.analyzed) {
      emptyState.hidden = false;

      emptyState.innerHTML = `
        <strong>No analyzed records</strong>
        <span>The prediction service did not return any classified student records.</span>
      `;

      return;
    }

    const riskPercent =
      (distribution.risk / distribution.analyzed) * 100;

    const safePercent =
      (distribution.safe / distribution.analyzed) * 100;

    emptyState.hidden = true;
    riskRow.hidden = false;
    safeRow.hidden = false;
    totalRow.hidden = false;

    $("#mlRiskCount").textContent =
      distribution.risk.toLocaleString();

    $("#mlRiskPercent").textContent =
      `${riskPercent.toFixed(1)}%`;

    $("#mlRiskBar").style.width =
      `${riskPercent}%`;

    $("#mlSafeCount").textContent =
      distribution.safe.toLocaleString();

    $("#mlSafePercent").textContent =
      `${safePercent.toFixed(1)}%`;

    $("#mlSafeBar").style.width =
      `${safePercent}%`;

    $("#mlAnalyzedCount").textContent =
      distribution.analyzed.toLocaleString();

    if (note) {
      note.textContent =
        `${distribution.analyzed} students analyzed. The bars show the proportion classified into each model category.`;
    }
  }

  // --------------------------------------------------
  // OVERVIEW CHARTS
  // --------------------------------------------------

  function renderDashboardCharts() {
    if (!chartAvailable()) return;

    // Existing chart: Academic Performance

    createChart("performanceChart", {
      type:"line",
      data:{
        labels:["2023–2024","1st Sem 2024–2025","2nd Sem 2024–2025","1st Sem 2025–2026"],
        datasets:[{
          label:"Academic Performance",
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
            ticks:{color:"#9ba8ae",callback:value=>value+"%"},
            grid:{color:"rgba(255,255,255,.06)"}
          },
          x:{
            ticks:{color:"#9ba8ae"},
            grid:{display:false}
          }
        }
      }
    });

    // Existing chart: Teaching Effectiveness

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

    // CHART 1: STUDENT GWA DISTRIBUTION

    const gwaDistribution = getGwaDistribution();

    createChart("gwaDistributionChart", {
      type:"doughnut",
      data:{
        labels:gwaDistribution.categories,
        datasets:[{
          label:"Number of Students",
          data:gwaDistribution.counts,
          backgroundColor:[
            "#188b45",
            "#168fa0",
            "#c99539",
            "#d92332"
          ],
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

    // CHART 2: ATTENDANCE DISTRIBUTION

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
          borderColor:[
            "#d92332",
            "#c99539",
            "#398bb6",
            "#188b45"
          ],
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
            ticks:{
              display:false,
              backdropColor:"transparent"
            },
            grid:{
              color:"rgba(255,255,255,.10)"
            },
            angleLines:{
              color:"rgba(255,255,255,.10)"
            },
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

    // CHART 3: ML RISK DISTRIBUTION
    // This is now HTML-based, not a Chart.js gauge.

    updateMLRiskChart(modelApiStatus);

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
          label:"Passing Rate",
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
            ticks:{color:"#9ba8ae",callback:value=>value+"%"},
            grid:{color:"rgba(255,255,255,.06)"}
          },
          x:{
            ticks:{color:"#9ba8ae"},
            grid:{display:false}
          }
        }
      }
    });

    createChart("gradeChart", {
      type:"bar",
      data:{
        labels:["1.00–1.50","1.51–2.00","2.01–2.25","2.26–2.75","Above 2.75"],
        datasets:[{
          label:"Students",
          data:[42,96,118,58,28],
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
          label:"Passing Rate",
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
              label:context => ` Passing Rate: ${context.raw}%`
            }
          }
        },
        scales:{
          x:{
            min:0,
            max:100,
            ticks:{color:"#a4b0b6",callback:value=>value+"%",stepSize:20},
            grid:{color:"rgba(255,255,255,.07)"}
          },
          y:{
            beginAtZero:true,
            ticks:{color:"#e0e7e9",font:{family:"Inter",size:11,weight:"600"}},
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
          label:"Average Rating",
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

  const savedProfile = JSON.parse(localStorage.getItem("bsunisyncProfile") || "{}");
  const initialName = savedProfile.name || "Faculty Member";

  function updateFacultyName(name) {
    const cleanName = name.trim() || "Faculty Member";

    $("#welcomeName").textContent = cleanName;
    $("#topFacultyName").textContent = cleanName;
    $("#profileNameHeading").textContent = cleanName;
    $(".profile-trigger .avatar").textContent = getInitials(cleanName);
    $(".profile-large .avatar").textContent = getInitials(cleanName);
  }

  $("#facultyName").value = initialName;
  updateFacultyName(initialName);

  if (savedProfile.theme === "light") {
    document.body.classList.add("light-theme");
    $("#themeSelect").value = "light";
  }

  $("#profileForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#facultyName").value.trim() || "Faculty Member";
    const theme = $("#themeSelect").value;

    localStorage.setItem("bsunisyncProfile", JSON.stringify({name,theme}));
    updateFacultyName(name);

    document.body.classList.toggle("light-theme", theme === "light");

    Object.keys(chartInstances).forEach(id => {
      const chart = chartInstances[id];

      if (chart) {
        if (chart.options.plugins.legend.labels) {
          chart.options.plugins.legend.labels.color =
            getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#a4b0b6";
        }

        chart.update();
      }
    });

    showToast("Profile and settings saved successfully.");
  });

  $("#themeSelect").addEventListener("change", event => {
    document.body.classList.toggle("light-theme", event.target.value === "light");
  });

  // --------------------------------------------------
  // PRINT
  // --------------------------------------------------

  $("#printSchedule").addEventListener("click", () => window.print());

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
  updateDashboardFilters();

  renderDashboardCharts();

  // Start the batch prediction request after the portal
  // has rendered. The rest of the interface remains usable.

  runBatchPredictions();

  window.addEventListener("resize", () => {
    Object.values(chartInstances).forEach(chart => {
      if (chart) chart.resize();
    });
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const activePage = $(".page.active");
      if (!activePage) return;

      const pageName = activePage.id.replace("page-","");

      if (pageName === "overview") renderDashboardCharts();
      if (pageName === "analytics") renderAnalyticsCharts();
      if (pageName === "evaluation") renderEvaluationCharts();
    }
  });
});
