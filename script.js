
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

  // The frontend demo records do not contain Previous_GWA
  // or Failed_Subjects. These are generated deterministically
  // for demonstration and are NOT actual student records.

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

        @media(max-width:1050px) {
          .student-table { min-width:1050px; }
        }

        @media(max-width:760px) {
          .student-record-heading {
            align-items:flex-start;
            flex-direction:column;
          }

          .model-api-status { margin-left:0; }
          .ml-disclaimer { padding-left:14px; padding-right:14px; }
        }
      `;

      document.head.appendChild(style);
    }

    $("#retryModelBtn")?.addEventListener("click", runBatchPredictions);
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
    updateModelApiStatus("connecting","Connecting to prediction service...");

    const retryButton = $("#retryModelBtn");
    if (retryButton) retryButton.disabled = true;

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

      data.predictions.forEach(result => {
        const student = students[result.index];

        if (!student) return;

        student.mlPrediction = result.prediction;
        student.mlScore = Number(result.at_risk_probability);
      });

      const riskCount = students.filter(
        student => student.mlPrediction === "At Risk"
      ).length;

      updateModelApiStatus(
        "online",
        `Prediction service online · ${students.length} students analyzed`
      );

      renderStudents();

      showToast(`ML predictions received for ${students.length} students.`);

      console.info("BSUniSync ML batch prediction completed.", {
        totalStudents:students.length,
        atRiskPredictions:riskCount,
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

      renderStudents();

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
  // OVERVIEW CHARTS
  // --------------------------------------------------

  function renderDashboardCharts() {
    if (!chartAvailable()) return;

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
        chart.options.plugins.legend.labels.color =
          getComputedStyle(document.body).getPropertyValue("--muted").trim() || "#a4b0b6";

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
