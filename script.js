document.addEventListener("DOMContentLoaded", () => {
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const API_URL = "https://bsunisync-api.onrender.com/predict-batch";
const API_TIMEOUT = 120000;
let modelApiStatus = "connecting";
let modelApiMessage = "Connecting to prediction service...";
let modelApiLoading = false;
let individualPredictionLoading = false;
let predictionHistory = [];
let predictionSequence = 0;

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
    generatedGwaValues.push(
      Number(Math.min(value,group.max).toFixed(2))
    );
  }
});

let generatedIndex = 0;

for (let i = 0; i < firstNames.length && generatedIndex < 334; i++) {
  for (let j = 0; j < lastNames.length && generatedIndex < 334; j++) {
    const name = `${firstNames[i]} ${lastNames[j]}`;

    if (students.some(student => student.name === name)) {
      continue;
    }

    const gwa = generatedGwaValues[generatedIndex];

    const year = [
      "1st Year","2nd Year","3rd Year","4th Year"
    ][generatedIndex % 4];

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
      status: gwa > 2.75 || attendance < 80
        ? "For Follow-up"
        : "Active"
    });

    generatedIndex++;
  }
}

students.forEach((student,index) => {
    // DEMONSTRATION SECTION ASSIGNMENT
    // Example sections only, not official BSU assignments.
    const demoSectionBlock = Math.floor(index / 4) % 2 === 0 ? "101" : "201";
    student.section = "BSIT-BA " + Number.parseInt(student.year, 10) + demoSectionBlock;

  student.academicYear = index < 8
    ? "2025-2026"
    : ["2023-2024","2024-2025","2025-2026"][index % 3];

  student.semester = index % 2 === 0 ? "1" : "2";

  const previousVariation = ((index % 7) - 3) * 0.12;

  student.previousGwa = Number(
    Math.max(1,Math.min(5,student.gwa + previousVariation)).toFixed(2)
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
  student.mlScoreLabel = "Model Score";
  student.source = "demonstration";
});

const facultyStudents = [];
let recordMode = "demonstration";

function getActiveStudents() {
  return recordMode === "faculty" ? facultyStudents : students;
}

const classes = [
  {
    code:"IT 101",
    name:"Introduction to Computing",
    section:"BSIT 1A",
    students:32,
    schedule:"Mon / Wed · 8:00–9:30 AM",
    room:"Lab 1",
    status:"Ongoing"
  },
  {
    code:"IT 102",
    name:"Computer Programming 1",
    section:"BSIT 1B",
    students:30,
    schedule:"Tue / Thu · 9:00–10:30 AM",
    room:"Lab 2",
    status:"Ongoing"
  },
  {
    code:"IT 201",
    name:"Data Structures and Algorithms",
    section:"BSIT 2A",
    students:31,
    schedule:"Mon / Wed · 10:00–11:30 AM",
    room:"Lab 3",
    status:"Ongoing"
  },
  {
    code:"IT 202",
    name:"Database Management Systems",
    section:"BSIT 2B",
    students:29,
    schedule:"Tue / Thu · 1:00–2:30 PM",
    room:"Lab 2",
    status:"Ongoing"
  },
  {
    code:"IT 301",
    name:"Systems Analysis and Design",
    section:"BSIT 3A",
    students:34,
    schedule:"Wed / Fri · 1:00–2:30 PM",
    room:"Room 204",
    status:"Ongoing"
  },
  {
    code:"IT 401",
    name:"Capstone Project",
    section:"BSIT 4A",
    students:30,
    schedule:"Fri · 9:00–12:00 PM",
    room:"Room 305",
    status:"Ongoing"
  }
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

const colors = {
  teal:"#139eac",
  tealBright:"#45c4d0",
  green:"#39b879",
  greenDark:"#188b45",
  red:"#dc293d",
  redSoft:"#e96774",
  gold:"#d6a13d",
  blue:"#398bb6",
  blueBright:"#65b8e8",
  muted:"#8799ac",
  grid:"rgba(150,170,190,.12)"
};

const chartInstances = {};
let notificationsRead = false;

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g,char => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[char]);

function setText(selector,value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function setHTML(selector,value) {
  const element = $(selector);
  if (element) element.innerHTML = value;
}

function showToast(message) {
  const container = $("#toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role","status");
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(),3500);
}

function getStanding(gwa) {
  if (
    gwa === null ||
    gwa === undefined ||
    gwa === "" ||
    !Number.isFinite(Number(gwa))
  ) {
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
  return String(name || "Faculty Member")
    .trim()
    .split(/\s+/)
    .slice(0,2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function getPercentage(part,total) {
  return total ? part / total * 100 : 0;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-PH",{
    year:"numeric",
    month:"short",
    day:"numeric",
    hour:"numeric",
    minute:"2-digit"
  });
}

function formatScore(score) {
  return Number.isFinite(score)
    ? `${score.toFixed(2)}%`
    : "Not provided";
}

function formatAverage(number,total,decimals = 1) {
  return total ? `${number.toFixed(decimals)}%` : "—";
}

function getSourceLabel() {
  return recordMode === "faculty"
    ? "Faculty-entered records"
    : "Sample student records";
}

function createIcon(name) {
  return `
    <svg class="ui-icon" aria-hidden="true">
      <use href="#icon-${name}"></use>
    </svg>
  `;
}

function normalizeStudentId(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeStudentName(value) {
  return String(value ?? "").trim().replace(/\s+/g," ").toLowerCase();
}

function cleanStudentName(value) {
  return String(value ?? "").trim().replace(/\s+/g," ");
}

function findFacultyStudent(studentId) {
  const normalizedId = normalizeStudentId(studentId);

  return facultyStudents.find(student =>
    normalizeStudentId(student.id) === normalizedId
  ) || null;
}

function getDashboardStudents() {
  const records = getActiveStudents();

  if (recordMode === "faculty") return records;

  const year = $("#yearFilter")?.value || "all";
  const semester = $("#semesterFilter")?.value || "all";

  return records.filter(student =>
    (year === "all" || student.academicYear === year) &&
    (semester === "all" || student.semester === semester)
  );
}

function getDashboardSummary() {
  const records = getDashboardStudents();
  const total = records.length;

  const passing = records.filter(student =>
    Number(student.gwa) <= 3.00
  ).length;

  const averageProgress = total
    ? records.reduce((sum,student) =>
        sum + Number(student.progress || 0),0
      ) / total
    : 0;

  const averageAttendance = total
    ? records.reduce((sum,student) =>
        sum + Number(student.attendance || 0),0
      ) / total
    : 0;

  const averageGwa = total
    ? records.reduce((sum,student) =>
        sum + Number(student.gwa || 0),0
      ) / total
    : 0;

  const gwaRisk = records.filter(student =>
    getStanding(student.gwa) === "At Risk"
  ).length;

  const mlRisk = records.filter(student =>
    student.mlPrediction === "At Risk"
  ).length;

  const mlSafe = records.filter(student =>
    student.mlPrediction === "Not At Risk"
  ).length;

  const attendanceRisk = records.filter(student =>
    student.attendance < 80
  ).length;

  return {
    records,
    total,
    passing,
    passingRate:getPercentage(passing,total),
    averageProgress,
    averageAttendance,
    averageGwa,
    gwaRisk,
    mlRisk,
    mlSafe,
    attendanceRisk
  };
}

function updateDashboardKPIs() {
  const summary = getDashboardSummary();

  setText("#kpiStudents",summary.total.toLocaleString());
  setText("#kpiPassing",formatAverage(summary.passingRate,summary.total));
  setText("#kpiCompletion",formatAverage(summary.averageProgress,summary.total));

  const riskCount = recordMode === "faculty"
    ? summary.mlRisk
    : summary.gwaRisk;

  setText("#kpiAtRisk",riskCount.toLocaleString());

  setText("#kpiAtRiskDetail",
    recordMode === "faculty"
      ? "Classified At Risk by the prediction model"
      : "Students with GWA above 2.75"
  );

  const totalLabel = $("#kpiStudents")
    ?.closest(".kpi-info")?.querySelector("small");

  if (totalLabel) {
    totalLabel.textContent = getSourceLabel();
  }

  const passingCard = $("#kpiPassing")?.closest(".kpi-info");

  if (passingCard) {
    const label = passingCard.querySelector("span");
    const note = passingCard.querySelector("small");

    if (label) label.textContent = "GWA Passing Indicator";
    if (note) note.textContent = "Students with GWA of 3.00 or better";
  }

  const progressCard = $("#kpiCompletion")?.closest(".kpi-info");

  if (progressCard) {
    const label = progressCard.querySelector("span");
    const note = progressCard.querySelector("small");

    if (label) label.textContent = "Average Academic Progress";
    if (note) note.textContent = "Based on current student records";
  }
}

let lastModalFocus = null;
let modalAction = null;

function openModal(title,content,actionLabel = "",action = null) {
  const backdrop = $("#modalBackdrop");
  const confirmButton = $("#modalConfirm");

  if (!backdrop) return;

  lastModalFocus = document.activeElement;
  modalAction = typeof action === "function" ? action : null;

  setText("#modalTitle",title);
  setHTML("#modalBody",content);

  if (confirmButton) {
    confirmButton.textContent = actionLabel || "Confirm";
    confirmButton.classList.toggle("hidden",!modalAction);
  }

  setText("#modalCancel",modalAction ? "Cancel" : "Close");

  backdrop.classList.remove("hidden");
  $("#modalClose")?.focus();
}

function closeModal() {
  $("#modalBackdrop")?.classList.add("hidden");
  $("#modalConfirm")?.classList.add("hidden");

  modalAction = null;

  if (
    lastModalFocus instanceof HTMLElement &&
    document.contains(lastModalFocus)
  ) {
    lastModalFocus.focus();
  }

  lastModalFocus = null;
}

$("#modalConfirm")?.addEventListener("click",() => {
  const action = modalAction;
  closeModal();
  if (action) action();
});

$("#modalClose")?.addEventListener("click",closeModal);
$("#modalCancel")?.addEventListener("click",closeModal);

$("#modalBackdrop")?.addEventListener("click",event => {
  if (event.target === $("#modalBackdrop")) closeModal();
});

document.addEventListener("keydown",event => {
  const backdrop = $("#modalBackdrop");

  const modalOpen =
    backdrop && !backdrop.classList.contains("hidden");

  if (event.key === "Escape") {
    if (modalOpen) closeModal();

    $("#notificationPopover")?.classList.add("hidden");
    $("#sidebar")?.classList.remove("open");
    $("#menuToggle")?.setAttribute("aria-expanded","false");
  }

  if (event.key === "Tab" && modalOpen) {
    const focusable = [
      ...backdrop.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]'
      )
    ].filter(element => element.getClientRects().length > 0);

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      (document.activeElement === first ||
      !backdrop.contains(document.activeElement))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (document.activeElement === last ||
      !backdrop.contains(document.activeElement))
    ) {
      event.preventDefault();
      first.focus();
    }
  }
});

function detailCell(label,value) {
  return `
    <div class="detail-cell">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

function initializeKPIInteractions() {
  const cards = [
    [".students-kpi","students"],
    [".passing-kpi","passing"],
    [".sete-kpi","sete"],
    [".progress-kpi","progress"],
    [".risk-card","risk"]
  ];

  cards.forEach(([selector,type]) => {
    const card = $(`#page-overview ${selector}`);

    if (!card) return;

    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    card.setAttribute("aria-label",
      `View ${type === "sete" ? "SETE" : type} KPI details`
    );

    card.style.cursor = "pointer";

    card.addEventListener("click",() => openKPIDetails(type));

    card.addEventListener("keydown",event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openKPIDetails(type);
      }
    });
  });
}

function openKPIDetails(type) {
  const summary = getDashboardSummary();

  let title = "";
  let details = [];
  let explanation = "";
  let actionLabel = "View Student Records";

  let action = () => {
    clearStudentFilters();
    showPage("students");
  };

  const source = getSourceLabel();

  if (type === "students") {
    title = "Total Students";

    details = [
      ["Total Students",summary.total],
      ["Average GWA",summary.total ? summary.averageGwa.toFixed(2) : "—"],
      ["Average Attendance",formatAverage(summary.averageAttendance,summary.total)],
      ["Data Source",source]
    ];

    explanation =
      "The total number of students included in the current academic selection.";

  } else if (type === "passing") {
    title = "GWA Passing Indicator";

    details = [
      ["GWA Passing Indicator",formatAverage(summary.passingRate,summary.total)],
      ["Students with GWA of 3.00 or Better",summary.passing],
      ["Total Students",summary.total],
      ["Students Above 3.00",summary.total - summary.passing]
    ];

    explanation =
      "Formula: Students with GWA of 3.00 or better divided by total students, multiplied by 100. This indicator measures GWA-based standing rather than individual subject passing rates.";

  } else if (type === "sete") {
    title = "Student Evaluation of Teaching Effectiveness";

    details = [
      ["Overall SETE Rating","4.28 / 5"],
      ["Response Rate","68%"],
      ["Evaluated Sections","5 / 6"],
      ["Data Source","Sample SETE data"]
    ];

    explanation =
      "Review SETE ratings alongside response rates, evaluation criteria, academic context, and other teaching performance evidence. Values shown are sample evaluation data.";

    actionLabel = "View Teaching Evaluation";
    action = () => showPage("evaluation");

  } else if (type === "progress") {
    title = "Average Academic Progress";

    details = [
      ["Average Academic Progress",formatAverage(summary.averageProgress,summary.total)],
      ["Total Students",summary.total],
      ["Average Attendance",formatAverage(summary.averageAttendance,summary.total)],
      ["Data Source",source]
    ];

    explanation =
      "Formula: Sum of academic progress percentages divided by the total number of selected students.";

    actionLabel = "View Academic Analytics";
    action = () => showPage("analytics");

  } else if (type === "risk") {
    const riskCount = recordMode === "faculty"
      ? summary.mlRisk
      : summary.gwaRisk;

    title = "At Risk Students";

    details = [
      ["At Risk Students",riskCount],
      ["Total Students",summary.total],
      ["GWA-Based Risk",summary.gwaRisk],
      ["ML Classified At Risk",summary.mlRisk],
      ["ML Classified Not At Risk",summary.mlSafe],
      ["Attendance Below 80%",summary.attendanceRisk]
    ];

    explanation = recordMode === "faculty"
      ? "Students identified by the Decision Tree model as potentially requiring academic support."
      : "Students with a GWA above 2.75. Machine learning classifications are presented separately.";

    explanation +=
      " Review these indicators alongside individual student circumstances.";

    actionLabel = "Review At Risk Students";

    action = () => {
      clearStudentFilters();

      if (recordMode === "faculty") {
        const filter = $("#studentConcernFilter");
        if (filter) filter.value = "ml-risk";
      } else if ($("#studentStandingFilter")) {
        $("#studentStandingFilter").value = "At Risk";
      }

      showPage("students");
    };
  }

  const content = `
    <div class="student-detail-grid">
      ${details.map(([label,value]) => detailCell(label,value)).join("")}
    </div>

    <div class="detail-note">
      <strong>Indicator Overview</strong>
      <p>${escapeHTML(explanation)}</p>

      ${type !== "sete" ? `
        <p>Dashboard results reflect the current academic selection. Student Records may include other records from the selected data source.</p>
      ` : ""}
    </div>
  `;

  openModal(title,content,actionLabel,action);
}

function initializeRecordMode() {
  const filterRow = $(".filter-row");

  if (filterRow && !$("#recordModeSelect")) {
    const label = document.createElement("label");

    label.innerHTML = `
      <span class="filter-label">
        ${createIcon("layers")}
        Data Source
      </span>

      <select id="recordModeSelect">
        <option value="demonstration">Sample Academic Records</option>
        <option value="faculty">Faculty-entered Records</option>
      </select>
    `;

    filterRow.prepend(label);
  }

  $("#recordModeSelect")?.addEventListener("change",event => {
    setRecordMode(event.target.value);
  });

  const studentToolbar = $(".student-toolbar");

  if (studentToolbar && !$("#studentRecordModeSelect")) {
    const select = document.createElement("select");

    select.id = "studentRecordModeSelect";
    select.setAttribute("aria-label","Student data source");

    select.innerHTML = `
      <option value="demonstration">Sample Student Records</option>
      <option value="faculty">Faculty-entered Records</option>
    `;

    studentToolbar.appendChild(select);
  }

  $("#studentRecordModeSelect")?.addEventListener("change",event => {
    setRecordMode(event.target.value);
  });
}


  // SHARED ACADEMIC FILTERS FOR STUDENT RECORDS

  function initializeStudentAcademicFilters() {
    const toolbar = $(".student-toolbar");
    const overviewYear = $("#yearFilter");
    const overviewSemester = $("#semesterFilter");

    if (!toolbar || !overviewYear || !overviewSemester) return;

    if (![...overviewYear.options].some(option => option.value === "all")) {
      const option = document.createElement("option");

      option.value = "all";
      option.textContent = "All Academic Years";

      overviewYear.prepend(option);
    }

    function createLinkedFilter(id, originalSelect, title) {
      if (document.getElementById(id)) return;

      const select = document.createElement("select");

      select.id = id;
      select.title = title;
      select.setAttribute("aria-label", title);
      select.innerHTML = originalSelect.innerHTML;
      select.value = originalSelect.value;
      select.disabled = recordMode === "faculty";

      const yearLevel = $("#studentYearFilter");

      if (yearLevel && yearLevel.parentElement === toolbar) {
        toolbar.insertBefore(select, yearLevel);
      } else {
        toolbar.appendChild(select);
      }

      select.addEventListener("change", () => {
        originalSelect.value = select.value;
        updateDashboardFilters();
      });
    }

    createLinkedFilter(
      "studentAcademicYearFilter",
      overviewYear,
      "Academic Year"
    );

    createLinkedFilter(
      "studentSemesterFilter",
      overviewSemester,
      "Semester"
    );
  }

function initializeStudentConcernFilter() {
  const toolbar = $(".student-toolbar");

  if (!toolbar || $("#studentConcernFilter")) return;

  const select = document.createElement("select");

  select.id = "studentConcernFilter";
  select.setAttribute("aria-label","Filter student risk indicators");

  select.innerHTML = `
    <option value="all">All Risk Indicators</option>
    <option value="ml-risk">ML: At Risk</option>
    <option value="ml-safe">ML: Not At Risk</option>
    <option value="ml-pending">ML: Not Yet Analyzed</option>
    <option value="attendance">Attendance Below 80%</option>
    <option value="gwa-risk">GWA Above 2.75</option>
  `;

  toolbar.appendChild(select);
  select.addEventListener("change",renderStudents);
}

function clearStudentFilters() {
  if ($("#studentSearch")) $("#studentSearch").value = "";
  if ($("#studentYearFilter")) $("#studentYearFilter").value = "all";
  if ($("#studentStandingFilter")) $("#studentStandingFilter").value = "all";
  if ($("#studentConcernFilter")) $("#studentConcernFilter").value = "all";
}

function setRecordMode(mode) {
  recordMode = mode === "faculty" ? "faculty" : "demonstration";

  ["#recordModeSelect","#studentRecordModeSelect"].forEach(selector => {
    const element = $(selector);
    if (element) element.value = recordMode;
  });

  ["#yearFilter","#semesterFilter","#studentYearFilter","#studentAcademicYearFilter","#studentSemesterFilter"].forEach(selector => {
    const element = $(selector);
    if (element) element.disabled = recordMode === "faculty";
  });

  clearStudentFilters();

  setText("#mlDisclaimer",
    recordMode === "faculty"
      ? "Faculty-entered records are available during the current session. Review risk indicators alongside academic performance."
      : "Sample academic records are provided for risk assessment. Model scores support faculty review and are not calibrated forecasts."
  );

  const overviewDisclaimer = $(".ml-overview-disclaimer");

  if (overviewDisclaimer) {
    overviewDisclaimer.innerHTML = `
      <strong>Academic Guidance:</strong>
      ${recordMode === "faculty"
        ? "Review student risk indicators alongside academic performance and faculty judgment. Session records are not stored permanently."
        : "Sample records illustrate academic risk assessment. Use model results to guide academic monitoring and appropriate intervention."
      }
    `;
  }

  refreshAcademicViews();
}

function createModelInput(student) {
  return {
    Previous_GWA:Number(student.previousGwa),
    Current_GWA:Number(student.gwa),
    Attendance_Rate:Number(student.attendance),
    Academic_Progress:Number(student.progress),
    Failed_Subjects:Number(student.failedSubjects)
  };
}

async function requestPredictions(records) {
  if (!Array.isArray(records) || !records.length) {
    throw new Error("No student records were provided.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),API_TIMEOUT);

  try {
    const response = await fetch(API_URL,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Accept":"application/json"
      },
      body:JSON.stringify({
        students:records.map(createModelInput)
      }),
      signal:controller.signal
    });

    if (!response.ok) {
      let detail = "";

      try {
        const errorData = await response.json();
        const rawDetail =
          errorData.detail || errorData.message || "";

        detail = typeof rawDetail === "string"
          ? rawDetail
          : JSON.stringify(rawDetail);
      } catch (_) {
        detail = "";
      }

      throw new Error(
        `API returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`
      );
    }

    const data = await response.json();

    return normalizePredictionResponse(data,records.length);

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "The prediction service is taking longer than expected. Please try again."
      );
    }

    throw error;

  } finally {
    clearTimeout(timeout);
  }
}

function normalizePercent(value,scale = "auto") {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "boolean"
  ) {
    return null;
  }

  const explicitPercent =
    typeof value === "string" && value.trim().endsWith("%");

  let number = explicitPercent
    ? Number(value.trim().slice(0,-1))
    : Number(value);

  if (!Number.isFinite(number)) return null;

  if (!explicitPercent) {
    if (scale === "fraction") {
      if (number < 0 || number > 1) return null;
      number *= 100;
    } else if (scale === "auto" && number >= 0 && number <= 1) {
      number *= 100;
    }
  }

  return number >= 0 && number <= 100 ? number : null;
}

function normalizePredictionResponse(data,expectedCount) {
  const predictions =
    Array.isArray(data) ? data :
    Array.isArray(data?.predictions) ? data.predictions :
    Array.isArray(data?.results) ? data.results :
    Array.isArray(data?.data?.predictions) ? data.data.predictions :
    Array.isArray(data?.data?.results) ? data.data.results :
    Array.isArray(data?.data) ? data.data :
    null;

  if (!predictions) {
    throw new Error("The API returned an unrecognized prediction response.");
  }

  if (predictions.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} predictions but received ${predictions.length}.`
    );
  }

  const validatedResults = new Array(expectedCount);
  const receivedIndexes = new Set();

  predictions.forEach((result,position) => {
    if (!result || typeof result !== "object") {
      throw new Error(`Prediction result ${position + 1} is invalid.`);
    }

    const index = Number(
      result.index ??
      result.student_index ??
      result.studentIndex ??
      position
    );

    if (!Number.isInteger(index) || index < 0 || index >= expectedCount) {
      throw new Error("Invalid student prediction index.");
    }

    if (receivedIndexes.has(index)) {
      throw new Error("Duplicate student prediction index.");
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
      .replace(/[_-]+/g," ")
      .replace(/\s+/g," ");

    let prediction;

    if (
      ["at risk","risk","1","true","high risk"].includes(normalizedLabel)
    ) {
      prediction = "At Risk";
    } else if (
      ["not at risk","not risk","safe","0","false","low risk","no risk"]
        .includes(normalizedLabel)
    ) {
      prediction = "Not At Risk";
    } else {
      throw new Error(`Unsupported prediction label: ${String(rawPrediction)}`);
    }

    let scoreLabel = "At-risk Probability";

    let rawScore =
      result.at_risk_probability ??
      result.atRiskProbability ??
      result.risk_probability ??
      result.riskProbability ??
      null;

    let score = null;

    if (
      result.at_risk_probability_percent !== null &&
      result.at_risk_probability_percent !== undefined
    ) {
      score = normalizePercent(result.at_risk_probability_percent,"percent");
    }

    if (score === null && rawScore !== null) {
      const scale = data?.probability_scale === "0_to_1"
        ? "fraction"
        : "auto";

      score = normalizePercent(rawScore,scale);
    }

    if (score === null && rawScore === null) {
      rawScore = result.risk_score ?? result.riskScore ?? null;

      if (rawScore !== null) {
        scoreLabel = "Model Risk Score";
        score = normalizePercent(rawScore);
      }
    }

    if (score === null && rawScore === null) {
      rawScore =
        result.probabilities ??
        result.probability ??
        result.confidence ??
        result.score ??
        null;

      scoreLabel = "Reported Model Score";
    }

    if (score === null && rawScore && typeof rawScore === "object") {
      const explicitRisk =
        rawScore["At Risk"] ??
        rawScore["at_risk"] ??
        rawScore.risk ??
        (Array.isArray(rawScore) ? null : rawScore["1"]) ??
        null;

      if (explicitRisk !== null) {
        score = normalizePercent(explicitRisk);
        scoreLabel = "At-risk Probability";
      }
    } else if (score === null) {
      const scale =
        scoreLabel === "At-risk Probability" &&
        data?.probability_scale === "0_to_1"
          ? "fraction"
          : "auto";

      score = normalizePercent(rawScore,scale);
    }

    receivedIndexes.add(index);

    validatedResults[index] = {
      prediction,
      score,
      scoreLabel
    };
  });

  if (receivedIndexes.size !== expectedCount) {
    throw new Error("The prediction service returned incomplete results.");
  }

  return validatedResults;
}

function updateModelApiStatus(status,message) {
  modelApiStatus = status;
  modelApiMessage = message;

  const container = $("#modelApiStatus");

  if (container) {
    container.classList.remove("online","offline","connecting");
    container.classList.add(status);

    const messageElement = container.querySelector(".model-api-message");

    if (messageElement) messageElement.textContent = message;
  }

  const retryButton = $("#retryModelBtn");

  if (retryButton) {
    retryButton.disabled = modelApiLoading || individualPredictionLoading;
    retryButton.textContent = modelApiLoading ? "Connecting..." : "Retry";
    retryButton.classList.toggle("hidden",status === "online");
  }

  refreshMLOverview();
}

function getMLRiskDistribution() {
  const analyzed = getDashboardStudents().filter(student =>
    student.mlPrediction === "At Risk" ||
    student.mlPrediction === "Not At Risk"
  );

  return {
    analyzed:analyzed.length,
    risk:analyzed.filter(student => student.mlPrediction === "At Risk").length,
    safe:analyzed.filter(student => student.mlPrediction === "Not At Risk").length
  };
}

function refreshMLOverview() {
  const distribution = getMLRiskDistribution();
  const statusElement = $("#mlOverviewStatus");

  if (statusElement) {
    statusElement.className = `ml-overview-status ${modelApiStatus}`;
  }

  setText("#mlOverviewStatusText",
    modelApiStatus === "online"
      ? "Model Online"
      : modelApiStatus === "offline"
        ? "Service Unavailable"
        : "Connecting..."
  );

  setText("#mlOverviewTotal",distribution.analyzed.toLocaleString());
  setText("#mlOverviewRisk",distribution.risk.toLocaleString());
  setText("#mlOverviewSafe",distribution.safe.toLocaleString());

  setText("#mlOverviewMessage",
    `${getSourceLabel()} · ${distribution.analyzed} students analyzed. ${modelApiMessage}`
  );
}

function addMLInterface() {
  const heading = $(".student-record-heading");

  if (heading && !$("#modelApiStatus")) {
    const status = document.createElement("div");

    status.id = "modelApiStatus";
    status.className = "model-api-status connecting";

    status.innerHTML = `
      <div class="model-api-indicator">
        <span class="model-api-dot"></span>
        <span class="model-api-message">
          Connecting to prediction service...
        </span>
      </div>

      <button type="button" id="retryModelBtn" class="model-retry-button">
        Retry
      </button>
    `;

    heading.appendChild(status);
  }

  const tableHead = $("#page-students .student-table thead tr");

  if (tableHead && !$("#mlPredictionHeader")) {
    const header = document.createElement("th");

    header.id = "mlPredictionHeader";
    header.textContent = "ML Prediction";

    tableHead.insertBefore(header,tableHead.lastElementChild);
  }

  const guide = $(".standing-guide");

  if (guide && !$("#mlDisclaimer")) {
    const disclaimer = document.createElement("div");

    disclaimer.id = "mlDisclaimer";
    disclaimer.className = "ml-disclaimer";
    disclaimer.textContent =
      "Review risk classifications alongside academic performance and faculty judgment.";

    guide.insertAdjacentElement("afterend",disclaimer);
  }

  $("#retryModelBtn")?.addEventListener("click",() => {
    if (recordMode === "faculty") {
      showPage("prediction");
      showToast("Submit the student information to retry the assessment.");
    } else {
      runBatchPredictions();
    }
  });

  initializeMLRiskDistribution();
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

    <small class="ml-score">
      ${escapeHTML(student.mlScoreLabel || "Model Score")}:
      ${formatScore(student.mlScore)}
    </small>
  `;
}

function initializeMLRiskDistribution() {
  $$(".ml-gauge-wrap").forEach(container => {
    container.innerHTML = `
      <div class="ml-risk-distribution">

        <div class="ml-distribution-empty" data-ml-empty>
          Preparing academic risk analysis...
        </div>

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
  });

  updateMLRiskChart();
}

function updateMLRiskChart() {
  const distribution = getMLRiskDistribution();
  const hasPredictions = distribution.analyzed > 0;

  const riskPercentage = getPercentage(distribution.risk,distribution.analyzed);
  const safePercentage = getPercentage(distribution.safe,distribution.analyzed);

  $$(".ml-gauge-wrap").forEach(container => {
    const riskRow = container.querySelector("[data-ml-risk-row]");
    const safeRow = container.querySelector("[data-ml-safe-row]");
    const totalRow = container.querySelector("[data-ml-total]");
    const empty = container.querySelector("[data-ml-empty]");

    if (!riskRow || !safeRow || !totalRow) return;

    riskRow.hidden = !hasPredictions;
    safeRow.hidden = !hasPredictions;
    totalRow.hidden = !hasPredictions;

    if (empty) {
      empty.hidden = hasPredictions;

      if (recordMode === "faculty") {
        empty.textContent =
          "Create a student risk assessment to begin monitoring.";
      } else if (modelApiStatus === "offline") {
        empty.textContent =
          "The prediction service is currently unavailable.";
      } else if (modelApiStatus === "online") {
        empty.textContent =
          "No analyzed students match the current selection.";
      } else {
        empty.textContent =
          "Preparing risk assessments for sample records.";
      }
    }

    container.querySelector("[data-ml-risk-count]").textContent = distribution.risk;
    container.querySelector("[data-ml-safe-count]").textContent = distribution.safe;

    container.querySelector("[data-ml-risk-percent]").textContent =
      `${riskPercentage.toFixed(1)}%`;

    container.querySelector("[data-ml-safe-percent]").textContent =
      `${safePercentage.toFixed(1)}%`;

    container.querySelector("[data-ml-risk-bar]").style.width =
      `${riskPercentage}%`;

    container.querySelector("[data-ml-safe-bar]").style.width =
      `${safePercentage}%`;

    container.querySelector("[data-ml-analyzed-count]").textContent =
      distribution.analyzed;
  });

  setText("#mlRiskChartNote",
    hasPredictions
      ? `${distribution.analyzed} students analyzed. ${distribution.risk} classified At Risk (${riskPercentage.toFixed(1)}%) and ${distribution.safe} classified Not At Risk (${safePercentage.toFixed(1)}%).`
      : "Risk distribution will appear when student assessments are available."
  );

  refreshMLOverview();
}

async function runBatchPredictions() {
  if (modelApiLoading || individualPredictionLoading) return;

  modelApiLoading = true;

  updateModelApiStatus("connecting","Preparing academic risk analysis...");

  try {
    const results = await requestPredictions(students);

    results.forEach((result,index) => {
      students[index].mlPrediction = result.prediction;
      students[index].mlScore = result.score;
      students[index].mlScoreLabel = result.scoreLabel;
    });

    updateModelApiStatus("online","Academic risk analysis is ready.");

    refreshAcademicViews();
    showToast("Academic risk analysis completed.");

  } catch (error) {
    console.error("Sample record analysis failed:",error);

    updateModelApiStatus("offline",
      error.message || "Prediction service unavailable."
    );

    renderStudents();

  } finally {
    modelApiLoading = false;
    updateModelApiStatus(modelApiStatus,modelApiMessage);
    updateMLRiskChart();
  }
}const predictionForm = $("#studentPredictionForm");

const predictionRules = [
  {
    id:"predictionStudentId",
    label:"Student ID",
    maxLength:50
  },
  {
    id:"predictionStudentName",
    label:"Student name",
    maxLength:150
  },
  {
    id:"predictionProgram",
    label:"Program",
    maxLength:100
  },
  {
    id:"predictionYear",
    label:"Year Level",
    allowedValues:["1st Year","2nd Year","3rd Year","4th Year"]
  },
  {
      id:"predictionSection",
      label:"Section",
      maxLength:60
    },
    {
    id:"predictionPreviousGwa",
    label:"Previous GWA",
    min:1,
    max:5,
    decimals:2,
    format:true
  },
  {
    id:"predictionCurrentGwa",
    label:"Current GWA",
    min:1,
    max:5,
    decimals:2,
    format:true
  },
  {
    id:"predictionAttendance",
    label:"Attendance rate",
    min:0,
    max:100,
    decimals:2
  },
  {
    id:"predictionProgress",
    label:"Academic progress",
    min:0,
    max:100,
    decimals:2
  },
  {
    id:"predictionFailedSubjects",
    label:"Failed subjects",
    min:0,
    max:Number.MAX_SAFE_INTEGER,
    decimals:0
  }
];

const predictionFields = [];

function predictionRangeMessage(rule) {
  if (rule.decimals === 0) {
    return "Enter a valid non-negative whole number.";
  }

  return `Enter ${rule.min.toFixed(2)} to ${rule.max.toFixed(2)} with up to two decimal places.`;
}

function isAllowedPredictionEdit(value,rule) {
  if (value === "") return true;

  if (rule.allowedValues) {
    return rule.allowedValues.includes(value);
  }

  if (rule.decimals === undefined) {
    return value.length <= rule.maxLength;
  }

  const pattern = rule.decimals === 0
    ? /^(0|[1-9]\d*)$/
    : /^(0|[1-9]\d*)(\.\d{0,2})?$/;

  if (!pattern.test(value)) return false;

  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number >= rule.min &&
    number <= rule.max &&
    (rule.decimals !== 0 || Number.isSafeInteger(number))
  );
}

function getPredictionFieldError(field) {
  const {input,rule,rejected} = field;

  if (rejected) return rejected;

  const value = input.value;

  if (!value.trim()) {
    return `${rule.label} is required.`;
  }

  if (!isAllowedPredictionEdit(value,rule)) {
    if (rule.allowedValues) {
      return `Select a valid ${rule.label.toLowerCase()}.`;
    }

    return rule.decimals === undefined
      ? `Use at most ${rule.maxLength} characters.`
      : predictionRangeMessage(rule);
  }

  if (rule.decimals !== undefined && value.endsWith(".")) {
    return "Complete the decimal value.";
  }

  return "";
}

function updatePredictionValidation(showAll = false) {
  let valid = predictionFields.length === predictionRules.length;

  predictionFields.forEach(field => {
    const error = getPredictionFieldError(field);

    if (error) valid = false;

    field.input.setCustomValidity(error);

    const visible = Boolean(
      error && (showAll || field.touched || field.rejected)
    );

    field.input.setAttribute("aria-invalid",String(visible));

    field.message.textContent = visible ? error : "";
    field.message.hidden = !visible;
  });

  const submit = $("#submitPredictionBtn");

  if (submit) {
    submit.disabled = individualPredictionLoading || !valid;
  }

  return valid;
}

function resetPredictionValidation() {
  predictionFields.forEach(field => {
    field.last = isAllowedPredictionEdit(field.input.value,field.rule)
      ? field.input.value
      : "";

    field.touched = false;
    field.rejected = "";
  });

  updatePredictionValidation();
}

function initializePredictionValidation() {
  if (!predictionForm || predictionFields.length) return;

  predictionRules.forEach(rule => {
    const input = document.getElementById(rule.id);

    if (!input) return;

    input.required = true;

    if (rule.decimals !== undefined) {
      input.type = "text";
      input.inputMode = rule.decimals === 0 ? "numeric" : "decimal";
      input.autocomplete = "off";
      input.spellcheck = false;
    } else if (rule.maxLength !== undefined && input instanceof HTMLInputElement) {
      input.maxLength = rule.maxLength;
    }

    const message = document.createElement("span");

    message.id = `${rule.id}Error`;
    message.className = "prediction-field-error";
    message.setAttribute("aria-live","polite");
    message.hidden = true;

    input.insertAdjacentElement("afterend",message);

    const describedBy = input.getAttribute("aria-describedby") || "";

    input.setAttribute("aria-describedby",
      `${describedBy} ${message.id}`.trim()
    );

    const field = {
      rule,
      input,
      message,
      last:input.value,
      touched:false,
      rejected:""
    };

    predictionFields.push(field);

    function rejectEdit() {
      field.touched = true;
      field.rejected = `Invalid value. ${predictionRangeMessage(rule)}`;
      updatePredictionValidation();
    }

    function proposedValue(text) {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;

      return input.value.slice(0,start) + text + input.value.slice(end);
    }

    if (rule.decimals !== undefined) {
      input.addEventListener("beforeinput",event => {
        if (
          event.cancelable &&
          !event.isComposing &&
          event.inputType?.startsWith("insert") &&
          event.data !== null &&
          !isAllowedPredictionEdit(proposedValue(event.data),rule)
        ) {
          event.preventDefault();
          rejectEdit();
        }
      });

      input.addEventListener("paste",event => {
        const text = event.clipboardData?.getData("text");

        if (
          text !== undefined &&
          !isAllowedPredictionEdit(proposedValue(text),rule)
        ) {
          event.preventDefault();
          rejectEdit();
        }
      });
    }

    input.addEventListener("input",() => {
      field.touched = true;

      if (
        rule.decimals !== undefined &&
        !isAllowedPredictionEdit(input.value,rule)
      ) {
        input.value = field.last;
        rejectEdit();
        return;
      }

      field.last = input.value;
      field.rejected = "";

      updatePredictionValidation();
    });

    input.addEventListener("blur",() => {
      field.touched = true;

      if (
        !field.rejected &&
        rule.decimals > 0 &&
        input.value &&
        isAllowedPredictionEdit(input.value,rule)
      ) {
        if (rule.format) {
          input.value = Number(input.value).toFixed(2);
        } else if (input.value.endsWith(".")) {
          input.value = input.value.slice(0,-1);
        }

        field.last = input.value;
      }

      updatePredictionValidation();
    });
  });

  resetPredictionValidation();
}

function readPredictionForm() {
  const studentId = $("#predictionStudentId")?.value.trim() || "";

  const studentName = cleanStudentName(
    $("#predictionStudentName")?.value || ""
  );

  const program = String($("#predictionProgram")?.value || "")
    .trim().replace(/\s+/g," ");

  const year = $("#predictionYear")?.value || "";
    const section = String($("#predictionSection")?.value || "").trim().replace(/\s+/g," ");

  if (!studentId || studentId.length > 50) {
    throw new Error("Enter a valid Student ID.");
  }

  if (!studentName || studentName.length > 150) {
    throw new Error("Enter a valid student name.");
  }

  if (!program || program.length > 100) {
    throw new Error("Enter a valid program.");
  }

  if (!["1st Year","2nd Year","3rd Year","4th Year"].includes(year)) {
    throw new Error("Select a valid year level.");
  }

  if (!section || section.length > 60) throw new Error("Enter a valid section.");

    const numericFields = predictionRules.filter(rule =>
    rule.decimals !== undefined
  );

  const values = numericFields.map(rule => {
    const input = document.getElementById(rule.id);
    const rawValue = input?.value.trim() ?? "";
    const value = Number(rawValue);

    if (
      rawValue === "" ||
      rawValue.endsWith(".") ||
      !isAllowedPredictionEdit(rawValue,rule)
    ) {
      throw new Error(`${rule.label} contains an invalid value.`);
    }

    return value;
  });

  return {
    id:studentId,
    name:studentName,
    previousGwa:values[0],
    gwa:values[1],
    attendance:values[2],
    progress:values[3],
    failedSubjects:values[4],
    program,
    year,
      section,
    source:"faculty",
    academicYear:null,
    semester:null,
    status:"Active",
    mlPrediction:null,
    mlScore:null,
    mlScoreLabel:"Model Score"
  };
}

const academicComparisonFields = [
  {
    key:"program",
    label:"Program",
    format:value => String(value ?? "").trim(),
    isEqual:(a,b) => String(a ?? "").trim().toLowerCase() ===
      String(b ?? "").trim().toLowerCase()
  },
  {
    key:"year",
    label:"Year Level",
    format:value => String(value ?? "").trim(),
    isEqual:(a,b) => String(a ?? "").trim() === String(b ?? "").trim()
  },
  {
      key:"section",
      label:"Section",
      format:value => String(value ?? "").trim(),
      isEqual:(a,b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase()
    },
    {
    key:"previousGwa",
    label:"Previous GWA",
    format:value => Number(value).toFixed(2)
  },
  {
    key:"gwa",
    label:"Current GWA",
    format:value => Number(value).toFixed(2)
  },
  {
    key:"attendance",
    label:"Attendance Rate",
    format:value => `${Number(value)}%`
  },
  {
    key:"progress",
    label:"Academic Progress",
    format:value => `${Number(value)}%`
  },
  {
    key:"failedSubjects",
    label:"Failed Subjects",
    format:value => String(Number(value))
  }
];

function getAcademicChanges(existingStudent,newStudent) {
  return academicComparisonFields
    .filter(field => field.isEqual
      ? !field.isEqual(existingStudent[field.key],newStudent[field.key])
      : Number(existingStudent[field.key]) !== Number(newStudent[field.key])
    )
    .map(field => ({
      key:field.key,
      label:field.label,
      previous:field.format(existingStudent[field.key]),
      updated:field.format(newStudent[field.key])
    }));
}

function hasSameAcademicInformation(existingStudent,newStudent) {
  return getAcademicChanges(existingStudent,newStudent).length === 0;
}

function showDuplicateRecordWarning(existingStudent) {
  renderPredictionResult(existingStudent);

  const content = `
    <div class="demonstration-notice" style="margin-top:0">
      ${createIcon("alert")}
      <div>
        <strong>Existing assessment found</strong>
        <p>This student already has a prediction with the same academic information.</p>
      </div>
    </div>

    <div class="student-detail-grid" style="margin-top:18px">
      ${detailCell("Student ID",existingStudent.id)}
      ${detailCell("Student Name",existingStudent.name)}
        ${detailCell("Section",existingStudent.section || "Not specified")}
      ${detailCell("Existing Prediction",existingStudent.mlPrediction)}
      ${detailCell(existingStudent.mlScoreLabel || "Model Score",formatScore(existingStudent.mlScore))}
      ${detailCell("Current GWA",Number(existingStudent.gwa).toFixed(2))}
      ${detailCell("Previous Assessment",formatDate(existingStudent.predictionDate))}
    </div>

    <div class="detail-note">
      <strong>No changes required</strong>
      <p>The current student record and assessment history are unchanged.</p>
      <p>Change an academic value to generate a new assessment.</p>
    </div>
  `;

  openModal("Duplicate Record Detected",content);
  showToast("Existing assessment retained.");
}

function showStudentIdConflict(existingStudent,submittedStudent) {
  const content = `
    <div class="prediction-error" style="margin-bottom:18px">
      <strong>
        ${createIcon("alert")}
        Student ID already assigned
      </strong>
      <p>This ID is associated with a different student name in the current session.</p>
    </div>

    <div class="student-detail-grid">
      ${detailCell("Student ID",submittedStudent.id)}
      ${detailCell("Conflict","Student identity mismatch")}
      ${detailCell("Registered Student Name",existingStudent.name)}
      ${detailCell("Submitted Student Name",submittedStudent.name)}
    </div>

    <div class="detail-note">
      <strong>Verify Student Information</strong>
      <p>Check the student name and identification number before submitting another assessment.</p>
      <p>Each student must have a unique Student ID.</p>
      <p>No records or predictions were changed.</p>
    </div>
  `;

  openModal("Student ID Conflict",content);
  showToast("Student ID is already assigned. Review the student information.");
}

function showStudentUpdateConfirmation(existingStudent,submittedStudent,changes) {
  const content = `
    <div class="demonstration-notice" style="margin-top:0">
      ${createIcon("refresh")}
      <div>
        <strong>Academic information updated</strong>
        <p>An existing student record matches the submitted ID and name. Review the following changes.</p>
      </div>
    </div>

    <div class="student-detail-grid" style="margin-top:18px">
      ${detailCell("Student ID",existingStudent.id)}
      ${detailCell("Student Name",existingStudent.name)}
    </div>

    <div class="table-scroll" style="margin-top:18px">
      <table>
        <thead>
          <tr>
            <th>Academic Information</th>
            <th>Previous</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          ${changes.map(change => `
            <tr>
              <td><strong>${escapeHTML(change.label)}</strong></td>
              <td style="color:var(--muted)">
                ${escapeHTML(change.previous)}
              </td>
              <td style="color:var(--accent-text)">
                <strong>${escapeHTML(change.updated)}</strong>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="detail-note">
      <strong>Confirm Record Update</strong>
      <p>${changes.length} academic ${changes.length === 1 ? "field has" : "fields have"} changed.</p>
      <p>The record will update after a successful prediction. Previous assessments will remain in Prediction History.</p>
      <p>The total number of students will remain unchanged.</p>
    </div>
  `;

  const confirmedRecord = existingStudent;
  const confirmedStudent = {...submittedStudent};

  openModal("Update Existing Student",content,"Update & Predict",() => {
    handleStudentPrediction(confirmedStudent,confirmedRecord);
  });
}

async function handleStudentPrediction(student,confirmedRecord = null) {
  if (individualPredictionLoading) return;

  const existingStudent = findFacultyStudent(student.id);

  if (existingStudent) {
    const sameName =
      normalizeStudentName(existingStudent.name) ===
      normalizeStudentName(student.name);

    if (!sameName) {
      showStudentIdConflict(existingStudent,student);
      return;
    }

    if (hasSameAcademicInformation(existingStudent,student)) {
      showDuplicateRecordWarning(existingStudent);
      return;
    }

    if (confirmedRecord !== existingStudent) {
      const changes = getAcademicChanges(existingStudent,student);
      showStudentUpdateConfirmation(existingStudent,student,changes);
      return;
    }

    student = {
      ...student,
      id:existingStudent.id,
      name:existingStudent.name,
      academicYear:existingStudent.academicYear,
      semester:existingStudent.semester
    };

  } else if (confirmedRecord) {
    showToast("The student record is no longer available. Submit the form again.");
    return;
  }

  if (confirmedRecord) {
    let currentInput;

    try {
      currentInput = readPredictionForm();
    } catch (error) {
      showToast("Review the student information before submitting again.");
      return;
    }

    const sameSubmittedIdentity =
      normalizeStudentId(currentInput.id) === normalizeStudentId(student.id) &&
      normalizeStudentName(currentInput.name) === normalizeStudentName(student.name);

    const sameSubmittedValues =
      hasSameAcademicInformation(currentInput,student);

    if (
      !sameSubmittedIdentity ||
      !sameSubmittedValues ||
      !updatePredictionValidation(true)
    ) {
      showToast("Student information changed. Review the form and submit again.");
      return;
    }
  }

  await executeStudentPrediction(student,Boolean(existingStudent));
}

function setPredictionLoading(loading) {
  individualPredictionLoading = loading;

  predictionForm?.setAttribute("aria-busy",String(loading));

  predictionForm?.querySelectorAll("input,button,select").forEach(element => {
    element.disabled = loading;
  });

  const submit = $("#submitPredictionBtn");

  if (submit) {
    submit.innerHTML = loading
      ? "Analyzing Student..."
      : `${createIcon("prediction")} Predict Student Risk →`;
  }

  updatePredictionValidation();
  updateModelApiStatus(modelApiStatus,modelApiMessage);
}

function setPredictionResultStatus(label,type) {
  const status = $("#predictionResultStatus");

  if (!status) return;

  status.className = `status-pill ${type}`;
  status.textContent = label;
}

function renderPredictionLoading(isUpdate = false) {
  setPredictionResultStatus("Analyzing","warning");

  setHTML("#predictionResultContent",`
    <div class="prediction-loading">
      <div class="prediction-spinner"></div>

      <strong>
        ${isUpdate
          ? "Analyzing updated academic information..."
          : "Conducting academic risk assessment..."
        }
      </strong>

      <p>The Decision Tree model is evaluating the student's academic indicators.</p>

      ${isUpdate ? `
        <p>The existing student record will be retained until the updated assessment is complete.</p>
      ` : ""}

      <p>Analysis may take longer when the prediction service is starting.</p>
    </div>
  `);
}

function renderPredictionError(message,isUpdate = false) {
  setPredictionResultStatus("Assessment Unavailable","danger");

  setHTML("#predictionResultContent",`
    <div class="prediction-error">
      <strong>Unable to complete the assessment.</strong>
      <p>${escapeHTML(message)}</p>
      <p>Your information has been retained. Review the entered values or connection and try again.</p>

      <p>${isUpdate
        ? "The existing student record and previous assessments are unchanged."
        : "No student record or assessment was created."
      }</p>
    </div>
  `);
}

function resetPredictionResult() {
  setPredictionResultStatus("Awaiting Input","info");

  setHTML("#predictionResultContent",`
    <div class="prediction-result-placeholder">
      <div class="prediction-placeholder-icon">
        ${createIcon("prediction")}
      </div>
      <strong>No assessment available</strong>
      <p>Complete the student academic information and select Predict Student Risk to view the assessment.</p>
    </div>
  `);
}

predictionForm?.addEventListener("submit",event => {
  event.preventDefault();

  if (individualPredictionLoading) return;

  const backdrop = $("#modalBackdrop");

  if (backdrop && !backdrop.classList.contains("hidden")) return;

  if (!updatePredictionValidation(true) || !predictionForm.reportValidity()) {
    return;
  }

  let student;

  try {
    student = readPredictionForm();
  } catch (error) {
    renderPredictionError(error.message);
    return;
  }

  handleStudentPrediction(student);
});

async function executeStudentPrediction(student,isUpdate = false) {
  if (individualPredictionLoading) return;

  setPredictionLoading(true);
  renderPredictionLoading(isUpdate);

  let predictionRecord = null;

  try {
    const results = await requestPredictions([student]);
    const result = results[0];

    const normalizedId = normalizeStudentId(student.id);

    const existingIndex = facultyStudents.findIndex(item =>
      normalizeStudentId(item.id) === normalizedId
    );

    const existingStudent = existingIndex >= 0
      ? facultyStudents[existingIndex]
      : null;

    if (
      existingStudent &&
      normalizeStudentName(existingStudent.name) !== normalizeStudentName(student.name)
    ) {
      throw new Error("The Student ID belongs to a different student.");
    }

    if (isUpdate && !existingStudent) {
      throw new Error("The original student record is no longer available.");
    }

    if (
      existingStudent &&
      hasSameAcademicInformation(existingStudent,student)
    ) {
      renderPredictionResult(existingStudent);
      showToast("An existing assessment has been retained.");
      return;
    }

    const now = new Date().toISOString();

    const updatedStudent = {
      ...student,
      id:existingStudent ? existingStudent.id : student.id,
      name:existingStudent ? existingStudent.name : student.name,
      mlPrediction:result.prediction,
      mlScore:result.score,
      mlScoreLabel:result.scoreLabel,
      status:result.prediction === "At Risk"
        ? "For Follow-up"
        : "Active",
      predictionDate:now,
      createdAt:existingStudent?.createdAt || now,
      updatedAt:now,
      revision:existingStudent
        ? Number(existingStudent.revision || 1) + 1
        : 1
    };

    predictionRecord = {
      ...updatedStudent,
      predictionId:++predictionSequence,
      recordAction:existingStudent ? "Updated Record" : "New Record"
    };

    if (existingIndex >= 0) {
      facultyStudents[existingIndex] = {...predictionRecord};
    } else {
      facultyStudents.push({...predictionRecord});
    }

    predictionHistory.unshift({...predictionRecord});

  } catch (error) {
    console.error("Individual prediction failed:",error);

    updateModelApiStatus("offline",
      error.message || "Prediction service unavailable."
    );

    renderPredictionError(
      error.message || "Unable to connect to the prediction service.",
      isUpdate
    );

    showToast(isUpdate
      ? "Update unsuccessful. Existing student record retained."
      : "Assessment unsuccessful. Please try again."
    );

  } finally {
    setPredictionLoading(false);
  }

  if (!predictionRecord) return;

  updateModelApiStatus("online",
    predictionRecord.recordAction === "Updated Record"
      ? "Academic assessment updated."
      : "Academic assessment completed."
  );

  setRecordMode("faculty");

  renderPredictionResult(predictionRecord);
  renderPredictionHistory();

  showToast(
    predictionRecord.recordAction === "Updated Record"
      ? `Student record updated: ${predictionRecord.mlPrediction}.`
      : `Assessment completed: ${predictionRecord.mlPrediction}.`
  );
}

predictionForm?.addEventListener("reset",event => {
  if (individualPredictionLoading) {
    event.preventDefault();
    return;
  }

  resetPredictionResult();
  queueMicrotask(resetPredictionValidation);
});

function predictionDetail(label,value) {
  return `
    <div class="prediction-result-detail">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>
  `;
}

function renderPredictionResult(record) {
  const content = $("#predictionResultContent");

  if (!content) return;

  const isRisk = record.mlPrediction === "At Risk";
  const classificationClass = isRisk
    ? "prediction-risk-text"
    : "prediction-safe-text";

  const isRiskProbability =
    record.mlScoreLabel === "At-risk Probability";

  const hasScore = Number.isFinite(record.mlScore);
  const isUpdatedRecord = record.recordAction === "Updated Record";

  setPredictionResultStatus(
    isUpdatedRecord ? "Record Updated" : "Assessment Completed",
    "success"
  );

  content.innerHTML = `
    <div class="prediction-result-status">
      <div>
        <span class="eyebrow">ACADEMIC RISK CLASSIFICATION</span>
        <div class="prediction-result-classification ${classificationClass}">
          ${escapeHTML(record.mlPrediction)}
        </div>
      </div>

      <div>
        <div class="prediction-result-score ${classificationClass}">
          ${formatScore(record.mlScore)}
        </div>
        <span class="prediction-result-score-label">
          ${escapeHTML(record.mlScoreLabel)}
        </span>
      </div>
    </div>

    ${hasScore && isRiskProbability ? `
      <div style="margin:16px 0 20px">
        <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:9px;color:var(--muted);font-size:11px">
          <span>Model-estimated risk</span>
          <strong>${formatScore(record.mlScore)}</strong>
        </div>

        <div class="ml-risk-track">
          <div
            class="ml-risk-fill ${isRisk ? "danger" : "success"}"
            style="width:${Math.min(100,Math.max(0,record.mlScore))}%"
          ></div>
        </div>
      </div>
    ` : ""}

    ${isUpdatedRecord ? `
      <div class="detail-note" style="margin:0 0 17px">
        <strong style="color:var(--success-text)">
          ${createIcon("check")}
          Academic Record Updated
        </strong>

        <p>The student's latest assessment is now reflected in Student Records. Previous assessments remain in Prediction History.</p>
      </div>
    ` : ""}

    <div class="prediction-result-details">
      ${predictionDetail("Student ID",record.id)}
      ${predictionDetail("Student Name",record.name)}
      ${predictionDetail("Program",record.program)}
      ${predictionDetail("Year Level",record.year)}
        ${predictionDetail("Section",record.section || "Not specified")}
      ${predictionDetail("Previous GWA",Number(record.previousGwa).toFixed(2))}
      ${predictionDetail("Current GWA",Number(record.gwa).toFixed(2))}
      ${predictionDetail("Attendance Rate",`${record.attendance}%`)}
      ${predictionDetail("Academic Progress",`${record.progress}%`)}
      ${predictionDetail("Failed Subjects",record.failedSubjects)}
      ${predictionDetail("GWA-based Standing",getStanding(record.gwa))}
      ${predictionDetail("Assessment Date",formatDate(record.predictionDate))}
      ${predictionDetail("Assessment Method","Decision Tree")}
      ${predictionDetail("Record Action",record.recordAction || "New Record")}
      ${predictionDetail("Record Revision",record.revision || 1)}
    </div>

    <div class="prediction-result-note">
      <strong>Suggested Faculty Action</strong>
      <p>${isRisk
        ? "Review the student's academic performance and consider a consultation or appropriate academic support plan."
        : "Continue monitoring the student's academic performance and provide support when needed."
      }</p>

      <p>Model scores support academic review and are not calibrated forecasts of future academic failure. The model was trained on synthetic data.</p>
      <p>This assessment is available during the current session.</p>
    </div>

    <div class="prediction-result-actions">
      <button type="button" class="button button-outline" data-prediction-action="records">
        ${createIcon("users")}
        View Student Records
      </button>

      <button type="button" class="button button-primary" data-prediction-action="new">
        ${createIcon("prediction")}
        New Prediction
      </button>
    </div>
  `;
}

$("#predictionResultContent")?.addEventListener("click",event => {
  const button = event.target.closest("[data-prediction-action]");

  if (!button) return;

  if (button.dataset.predictionAction === "records") {
    setRecordMode("faculty");
    showPage("students");
  }

  if (button.dataset.predictionAction === "new") {
    predictionForm?.reset();
    $("#predictionStudentId")?.focus();

    predictionForm?.scrollIntoView({
      behavior:"smooth",
      block:"start"
    });
  }
});

function renderPredictionHistory() {
  const table = $("#predictionHistoryTable");

  setText("#predictionHistoryCount",
    `${predictionHistory.length} ${predictionHistory.length === 1 ? "assessment" : "assessments"}`
  );

  if (!table) return;

  if (!predictionHistory.length) {
    table.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="prediction-history-empty">
            ${createIcon("clock")}
            <p>No academic assessments yet.</p>
            <p>Create a student risk assessment to begin.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  table.innerHTML = predictionHistory.map(record => `
    <tr>
      <td class="student-id">${escapeHTML(record.id)}</td>

      <td>
        <span class="student-name">${escapeHTML(record.name)}</span>
        <small class="ml-score">
          ${escapeHTML(record.recordAction || "New Record")}
          · Revision ${Number(record.revision || 1)}
        </small>
      </td>
        <td>${escapeHTML(record.section || "Not specified")}</td>

      <td>
        <span class="ml-badge ${record.mlPrediction === "At Risk" ? "ml-risk" : "ml-safe"}">
          ${escapeHTML(record.mlPrediction)}
        </span>
      </td>

      <td>
        <strong>${formatScore(record.mlScore)}</strong>
        <small class="ml-score">${escapeHTML(record.mlScoreLabel)}</small>
      </td>

      <td>${escapeHTML(formatDate(record.predictionDate))}</td>

      <td>
        <button class="view-record" type="button" data-prediction-id="${record.predictionId}">
          View
        </button>
      </td>
    </tr>
  `).join("");
}

$("#predictionHistoryTable")?.addEventListener("click",event => {
  const button = event.target.closest("[data-prediction-id]");

  if (!button) return;

  const predictionId = Number(button.dataset.predictionId);

  const record = predictionHistory.find(item =>
    item.predictionId === predictionId
  );

  if (record) {
    openStudentRecordDetails(record,"Student Assessment History");
  }
});

function renderStudentSummary() {
  const records = getDashboardStudents();

  const counts = {
    total:records.length,
    excellent:0,
    good:0,
    monitoring:0,
    risk:0
  };

  records.forEach(student => {
    const standing = getStanding(student.gwa);

    if (standing === "Excellent") counts.excellent++;
    if (standing === "Good Standing") counts.good++;
    if (standing === "Needs Monitoring") counts.monitoring++;
    if (standing === "At Risk") counts.risk++;
  });

  setText("#studentTotalCount",counts.total);
  setText("#excellentCount",counts.excellent);
  setText("#goodStandingCount",counts.good);
  setText("#monitoringCount",counts.monitoring);
  setText("#studentRiskCount",counts.risk);
}

function matchesConcern(student,concern) {
  switch (concern) {
    case "ml-risk":
      return student.mlPrediction === "At Risk";

    case "ml-safe":
      return student.mlPrediction === "Not At Risk";

    case "ml-pending":
      return !student.mlPrediction;

    case "attendance":
      return student.attendance < 80;

    case "gwa-risk":
      return student.gwa > 2.75;

    default:
      return true;
  }
}

function renderStudents() {
  const query = ($("#studentSearch")?.value || "").trim().toLowerCase();
  const year = $("#studentYearFilter")?.value || "all";
  const standingFilter = $("#studentStandingFilter")?.value || "all";
  const concernFilter = $("#studentConcernFilter")?.value || "all";

  const filtered = getDashboardStudents().filter(student => {
    const standing = getStanding(student.gwa);

    const matchesQuery = [
      student.id,
      student.name,
      student.program,
      student.year,
        student.section || ""
    ].join(" ").toLowerCase().includes(query);

    return (
      matchesQuery &&
      (recordMode === "faculty" || year === "all" || student.year === year) &&
      (standingFilter === "all" || standing === standingFilter) &&
      matchesConcern(student,concernFilter)
    );
  });

  const tbody = $("#studentTable");

  if (!tbody) return;

  setText("#studentResultCount",
    `${filtered.length} ${filtered.length === 1 ? "record" : "records"} · ${getSourceLabel()}`
  );

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-row">
          ${recordMode === "faculty" && facultyStudents.length === 0
            ? "No faculty-entered records yet. Create a student risk assessment to begin."
            : "No student records match your search or filters."
          }
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
        <td>
          <span class="student-name">${escapeHTML(student.name)}</span>
        </td>
        <td>${escapeHTML(student.program)}</td>
        <td>${escapeHTML(student.year)}</td>
          <td>${escapeHTML(student.section || "Not specified")}</td>
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
          <button class="view-record" type="button" data-student-id="${escapeHTML(student.id)}">
            View
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function openStudentRecord(studentId) {
  const student = getActiveStudents().find(item =>
    normalizeStudentId(item.id) === normalizeStudentId(studentId)
  );

  if (student) {
    openStudentRecordDetails(student,"Student Academic Record");
  }
}

function openStudentRecordDetails(student,title = "Student Academic Record") {
  const standing = getStanding(student.gwa);

  const details = [
    ["Student Name",student.name],
    ["Student ID",student.id],
    ["Program",student.program],
    ["Year Level",student.year],
      ["Section",student.section || "Not specified"],
    ["Previous GWA",Number(student.previousGwa).toFixed(2)],
    ["Current GWA",Number(student.gwa).toFixed(2)],
    ["Academic Standing",standing],
    ["Attendance Rate",`${student.attendance}%`],
    ["Academic Progress",`${student.progress}%`],
    ["Failed Subjects",student.failedSubjects],
    ["Record Status",student.status],
    ["Data Source",student.source === "faculty" ? "Faculty-entered" : "Sample record"]
  ];

  if (student.predictionDate) {
    details.push(["Assessment Date",formatDate(student.predictionDate)]);
  }

  if (student.source === "faculty") {
    details.push(["Record Revision",student.revision || 1]);
    details.push(["Record Action",student.recordAction || "New Record"]);

    if (student.createdAt) {
      details.push(["First Created",formatDate(student.createdAt)]);
    }
  }

  const content = `
    <div class="student-detail-grid">
      ${details.map(([label,value]) => detailCell(label,value)).join("")}

      <div class="detail-cell">
        <span>Machine Learning Prediction</span>
        <strong>${getMLBadge(student)}</strong>
      </div>
    </div>

    <div class="detail-note">
      <strong>Academic Guidance</strong>
      <p>GWA-based academic standing and machine learning classification are separate indicators.</p>

      <p>${student.source === "demonstration"
        ? "This record contains sample academic information."
        : "This record is available during the current session."
      }</p>

      <p>Review all available academic indicators before determining an appropriate intervention.</p>

      ${student.source === "faculty" ? `
        <p>To update this record, select Use Student Data for Prediction and revise the appropriate academic values.</p>
      ` : ""}
    </div>
  `;

  openModal(title,content,"Use Student Data for Prediction",() => {
    if (individualPredictionLoading) {
      showToast("An academic assessment is currently in progress.");
      return;
    }

    fillPredictionForm(student);
    showPage("prediction");
  });
}

function fillPredictionForm(student) {
  const fields = {
    predictionStudentId:student.id,
    predictionStudentName:student.name,
    predictionProgram:student.program,
    predictionYear:student.year,
      predictionSection:student.section && student.section !== "Not specified" ? student.section : "",
    predictionPreviousGwa:Number(student.previousGwa).toFixed(2),
    predictionCurrentGwa:Number(student.gwa).toFixed(2),
    predictionAttendance:student.attendance,
    predictionProgress:student.progress,
    predictionFailedSubjects:student.failedSubjects
  };

  Object.entries(fields).forEach(([id,value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value ?? "";
  });

  resetPredictionValidation();
  resetPredictionResult();

  showToast(
    student.source === "demonstration"
      ? "Sample student information loaded."
      : "Student information loaded. Update the academic values as needed."
  );
}

$("#studentTable")?.addEventListener("click",event => {
  const button = event.target.closest("[data-student-id]");

  if (button) openStudentRecord(button.dataset.studentId);
});

[
  "#studentSearch",
  "#studentYearFilter",
  "#studentStandingFilter"
].forEach(selector => {
  $(selector)?.addEventListener("input",renderStudents);
  $(selector)?.addEventListener("change",renderStudents);
});

function initializeStudentSummaryCards() {
  const cards = [
    [".standing-summary-card:first-child","all"],
    [".excellent-summary","Excellent"],
    [".good-summary","Good Standing"],
    [".monitoring-summary","Needs Monitoring"],
    [".risk-summary","At Risk"]
  ];

  cards.forEach(([selector,filter]) => {
    const card = $(`#page-students ${selector}`);

    if (!card) return;

    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    card.style.cursor = "pointer";

    function applyFilter() {
      clearStudentFilters();

      const select = $("#studentStandingFilter");

      if (select) select.value = filter;

      renderStudents();
    }

    card.addEventListener("click",applyFilter);

    card.addEventListener("keydown",event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        applyFilter();
      }
    });
  });
}

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

        <td>
          <span class="status-pill success">${escapeHTML(item.status)}</span>
        </td>
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

  const dayOrder = [
    "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"
  ];

  const ordered = [...schedule].sort((a,b) =>
    dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  table.innerHTML = ordered.map(item => `
    <tr>
      <td><strong>${escapeHTML(item.day)}</strong></td>
      <td>${escapeHTML(item.time)}</td>
      <td>${escapeHTML(item.subject)}</td>
      <td>${escapeHTML(item.section)}</td>
      <td>${escapeHTML(item.room)}</td>
    </tr>
  `).join("");
}let alerts = [];
const reviewedAlerts = new Set();

function alertSignature(type,records,valueKey) {
  const signature = records
    .map(student => `${student.id}:${student[valueKey]}`)
    .sort()
    .join("|");

  return `${recordMode}-${type}-${signature}`;
}

function buildAlerts() {
  const records = getActiveStudents();

  const gwaRiskStudents = records.filter(student => student.gwa > 2.75);
  const attendanceStudents = records.filter(student => student.attendance < 80);
  const modelRiskStudents = records.filter(student =>
    student.mlPrediction === "At Risk"
  );

  const nextAlerts = [];

  if (gwaRiskStudents.length) {
    nextAlerts.push({
      id:alertSignature("gwa",gwaRiskStudents,"gwa"),
      title:"Academic Standing Review",
      description:
        `${gwaRiskStudents.length} students have a GWA above 2.75 and may require additional academic monitoring.`,
      type:"Student Concern",
      date:getSourceLabel(),
      actionLabel:"Review Academic Records",
      target:"students",
      filter:"gwa-risk"
    });
  }

  if (attendanceStudents.length) {
    nextAlerts.push({
      id:alertSignature("attendance",attendanceStudents,"attendance"),
      title:"Attendance Monitoring",
      description:
        `${attendanceStudents.length} students have attendance below 80% and may require faculty follow-up.`,
      type:"Student Concern",
      date:getSourceLabel(),
      actionLabel:"Review Attendance Records",
      target:"students",
      filter:"attendance"
    });
  }

  if (modelRiskStudents.length) {
    nextAlerts.push({
      id:alertSignature("ml-risk",modelRiskStudents,"mlPrediction"),
      title:"Academic Risk Assessment",
      description:
        `${modelRiskStudents.length} students have been classified At Risk. Review their academic information to determine appropriate support.`,
      type:"Urgent",
      date:getSourceLabel(),
      actionLabel:"Review Risk Assessments",
      target:"students",
      filter:"ml-risk"
    });
  }

  nextAlerts.push({
    id:"sete",
    title:"Teaching Evaluation Summary",
    description:
      "The sample SETE rating is 4.28 out of 5. Review the rating alongside response rates and other teaching performance indicators.",
    type:"Reminder",
    date:"Sample evaluation summary",
    actionLabel:"View Teaching Evaluation",
    target:"evaluation",
    filter:"all"
  });

  const previousOpenIds = alerts
    .filter(alert => alert.open)
    .map(alert => alert.id)
    .sort()
    .join("|");

  alerts = nextAlerts.map(alert => ({
    ...alert,
    open:!reviewedAlerts.has(alert.id)
  }));

  const nextOpenIds = alerts
    .filter(alert => alert.open)
    .map(alert => alert.id)
    .sort()
    .join("|");

  if (previousOpenIds !== nextOpenIds) {
    notificationsRead = false;
  }
}

function renderOverviewAlerts() {
  const container = $(".overview-alert-list");

  if (!container) return;

  const records = getActiveStudents();

  const gwaRisk = records.filter(student => student.gwa > 2.75).length;
  const attendanceRisk = records.filter(student => student.attendance < 80).length;

  const modelRisk = records.filter(student =>
    student.mlPrediction === "At Risk"
  ).length;

  const analyzed = records.filter(student =>
    student.mlPrediction === "At Risk" ||
    student.mlPrediction === "Not At Risk"
  ).length;

  const warnings = [
    {
      title:"GWA Above 2.75",
      description:
        `${gwaRisk} student${gwaRisk === 1 ? "" : "s"} requiring academic monitoring.`,
      icon:"alert",
      type:"warning"
    },
    {
      title:"Attendance Below 80%",
      description:
        `${attendanceRisk} student${attendanceRisk === 1 ? "" : "s"} with low attendance.`,
      icon:"users",
      type:"info"
    },
    {
      title:"At Risk — ML Classification",
      description:analyzed
        ? `${modelRisk} of ${analyzed} analyzed students classified At Risk.`
        : "No risk assessments available yet.",
      icon:"trend",
      type:"danger"
    }
  ];

  container.innerHTML = warnings.map(item => `
    <button type="button" class="overview-alert-item" data-go="alerts">
      <span class="overview-alert-icon ${item.type}">
        ${createIcon(item.icon)}
      </span>

      <span class="overview-alert-copy">
        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.description)}</small>
      </span>

      <span class="overview-alert-arrow">
        ${createIcon("chevron")}
      </span>
    </button>
  `).join("");

  const note = $(".overview-alerts-panel .overview-chart-note");

  if (note) {
    note.textContent =
      `Warnings cover all ${getSourceLabel().toLowerCase()}, regardless of academic year and semester filters.`;
  }
}

function renderAlerts() {
  const openAlerts = alerts.filter(alert => alert.open);

  setText("#alertTotal",openAlerts.length);

  const alertNavCount = $("#alertNavCount");

  if (alertNavCount) {
    alertNavCount.textContent = openAlerts.length;
    alertNavCount.classList.toggle("hidden",openAlerts.length === 0);
  }

  const summaryItems = $$(".alert-summary > div");

  if (summaryItems[1]) {
    const strong = summaryItems[1].querySelector("strong");
    const span = summaryItems[1].querySelector("span");

    if (strong) {
      strong.textContent = openAlerts.filter(alert => alert.type === "Urgent").length;
    }

    if (span) span.textContent = "Urgent alerts";
  }

  if (summaryItems[2]) {
    const strong = summaryItems[2].querySelector("strong");

    if (strong) {
      strong.textContent = openAlerts.filter(alert =>
        alert.type === "Student Concern"
      ).length;
    }
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
              type="button"
              class="text-button alert-action"
              data-alert-target="${escapeHTML(alert.target)}"
              data-alert-filter="${escapeHTML(alert.filter)}"
            >
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
          ${createIcon("check")}
          <strong>No pending alerts</strong>
          <p>All current academic alerts have been reviewed.</p>
        </div>
      `;
  }

  renderOverviewAlerts();
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
          <p>${escapeHTML(alert.description)}</p>

          <button
            type="button"
            class="text-button alert-action"
            data-alert-target="${escapeHTML(alert.target)}"
            data-alert-filter="${escapeHTML(alert.filter)}"
          >
            ${escapeHTML(alert.actionLabel)} →
          </button>
        </div>
      `).join("")
      : `<div class="notification-item">No new notifications.</div>`;
  }

  const dot = $("#notificationDot");

  if (dot) {
    dot.classList.toggle("hidden",notificationsRead || !openAlerts.length);
    dot.textContent = openAlerts.length;
  }
}

function handleAlertNavigation(event) {
  const button = event.target.closest("[data-alert-target]");

  if (!button) return;

  const target = button.dataset.alertTarget;
  const filter = button.dataset.alertFilter;

  if (target === "students") {
    clearStudentFilters();

    const concernFilter = $("#studentConcernFilter");

    if (concernFilter) concernFilter.value = filter || "all";
  }

  $("#notificationPopover")?.classList.add("hidden");
  showPage(target);
}

$("#fullAlertList")?.addEventListener("click",handleAlertNavigation);
$("#notificationItems")?.addEventListener("click",handleAlertNavigation);

$("#clearAlertsBtn")?.addEventListener("click",() => {
  alerts.forEach(alert => reviewedAlerts.add(alert.id));

  buildAlerts();
  notificationsRead = true;
  renderAlerts();

  showToast("All academic alerts marked as reviewed.");
});

$("#markReadBtn")?.addEventListener("click",() => {
  notificationsRead = true;
  renderNotifications();

  showToast("Notifications marked as read.");
});

$("#notificationBtn")?.addEventListener("click",() => {
  const popover = $("#notificationPopover");

  if (!popover) return;

  popover.classList.toggle("hidden");

  $("#notificationBtn")?.setAttribute("aria-expanded",
    String(!popover.classList.contains("hidden"))
  );
});

document.addEventListener("click",event => {
  if (!event.target.closest(".notification-wrap")) {
    $("#notificationPopover")?.classList.add("hidden");
    $("#notificationBtn")?.setAttribute("aria-expanded","false");
  }
});

function showPage(pageName) {
  const target = document.getElementById(`page-${pageName}`);

  if (!target) return;

  $$(".page").forEach(page => page.classList.remove("active"));

  target.classList.add("active");

  $$(".nav-link[data-page]").forEach(link => {
    const active = link.dataset.page === pageName;

    link.classList.toggle("active",active);

    if (active) {
      link.setAttribute("aria-current","page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  $("#sidebar")?.classList.remove("open");
  $("#menuToggle")?.setAttribute("aria-expanded","false");

  $(".main-area")?.scrollTo({
    top:0,
    left:0,
    behavior:"auto"
  });

  window.scrollTo({
    top:0,
    left:0,
    behavior:"auto"
  });

  if (pageName === "overview") {
    updateDashboardKPIs();
    renderDashboardCharts();
    renderOverviewAlerts();
    updateMLRiskChart();
  }

  if (pageName === "students") {
    renderStudentSummary();
    renderStudents();
  }

  if (pageName === "prediction") {
    renderPredictionHistory();
    updatePredictionValidation();
  }

  if (pageName === "analytics") renderAnalyticsCharts();
  if (pageName === "evaluation") renderEvaluationCharts();
  if (pageName === "alerts") renderAlerts();
}

$$(".nav-link[data-page]").forEach(link => {
  link.addEventListener("click",() => {
    showPage(link.dataset.page);
  });
});

document.addEventListener("click",event => {
  const button = event.target.closest("[data-go]");

  if (button) showPage(button.dataset.go);
});

$("#menuToggle")?.addEventListener("click",() => {
  const sidebar = $("#sidebar");

  if (!sidebar) return;

  sidebar.classList.toggle("open");

  $("#menuToggle")?.setAttribute("aria-expanded",
    String(sidebar.classList.contains("open"))
  );
});

document.addEventListener("click",event => {
  const sidebar = $("#sidebar");

  if (
    window.innerWidth <= 760 &&
    sidebar?.classList.contains("open") &&
    !event.target.closest("#sidebar") &&
    !event.target.closest("#menuToggle")
  ) {
    sidebar.classList.remove("open");
    $("#menuToggle")?.setAttribute("aria-expanded","false");
  }
});

$("#profileTrigger")?.addEventListener("click",() => {
  showPage("profile");
});

$("#signOutBtn")?.addEventListener("click",() => {
  if (individualPredictionLoading) {
    showToast("Please allow the current assessment to finish.");
    return;
  }

  openModal(
    "Sign Out",
    `
      <div class="detail-note">
        <strong>End your faculty workspace session?</strong>
        <p>Faculty-entered student records and prediction history will be cleared.</p>
        <p>Your saved display name and workspace preferences will be retained.</p>
        <p>This action resets the local workspace; it does not end an authenticated university account.</p>
      </div>
    `,
    "Sign Out",
    () => {
      if (individualPredictionLoading) {
        showToast("Please allow the current assessment to finish.");
        return;
      }

      facultyStudents.length = 0;
      predictionHistory = [];
      predictionSequence = 0;

      reviewedAlerts.clear();

      predictionForm?.reset();

      resetPredictionResult();
      renderPredictionHistory();

      setRecordMode("demonstration");
      showPage("overview");

      showToast("Session ended. Faculty-entered records cleared.");
    }
  );
});

$("#globalSearch")?.addEventListener("keydown",event => {
  if (event.key !== "Enter") return;

  event.preventDefault();

  const query = event.target.value.trim();

  if (!query) return;

  clearStudentFilters();

  if ($("#studentSearch")) {
    $("#studentSearch").value = query;
  }

  showPage("students");
});

function updateDashboardFilters() {
  const year = $("#yearFilter")?.value || "all";
  const semester = $("#semesterFilter")?.value || "all";
    const studentYear = $("#studentAcademicYearFilter");
    const studentSemester = $("#studentSemesterFilter");

    if (studentYear) studentYear.value = year;
    if (studentSemester) studentSemester.value = semester;

    renderStudentSummary();
    renderStudents();


  const yearLabel = year === "all" ? "All Academic Years" : year;

  const semesterLabel = semester === "all"
    ? "Both Semesters"
    : semester === "1"
      ? "1st Semester"
      : "2nd Semester";

  setText("#lastUpdated",
    recordMode === "faculty"
      ? "Faculty-entered session records"
      : `Sample records · ${yearLabel} · ${semesterLabel}`
  );

  updateDashboardKPIs();
  updateMLRiskChart();

  if ($("#page-overview")?.classList.contains("active")) {
    renderDashboardCharts();
  }

  if ($("#page-analytics")?.classList.contains("active")) {
    renderAnalyticsCharts();
  }
}

$("#yearFilter")?.addEventListener("change",updateDashboardFilters);
$("#semesterFilter")?.addEventListener("change",updateDashboardFilters);

$("#resetFilters")?.addEventListener("click",() => {
  if ($("#yearFilter")) $("#yearFilter").value = "2025-2026";
  if ($("#semesterFilter")) $("#semesterFilter").value = "all";

  updateDashboardFilters();

  showToast("Academic filters reset.");
});

function chartAvailable() {
  return typeof Chart !== "undefined";
}

function chartTextColor() {
  return getComputedStyle(document.body)
    .getPropertyValue("--muted").trim() || "#9daebe";
}

function chartSurfaceColor() {
  return getComputedStyle(document.body)
    .getPropertyValue("--surface").trim() || "#19222d";
}

function chartMainTextColor() {
  return getComputedStyle(document.body)
    .getPropertyValue("--text").trim() || "#f1f5f9";
}

function chartBorderColor() {
  return getComputedStyle(document.body)
    .getPropertyValue("--border").trim() || "rgba(179,199,219,.13)";
}

function tooltipOptions(callbacks = {}) {
  return {
    backgroundColor:chartSurfaceColor(),
    titleColor:chartMainTextColor(),
    bodyColor:chartMainTextColor(),
    borderColor:chartBorderColor(),
    borderWidth:1,
    padding:12,
    cornerRadius:8,
    displayColors:true,
    titleFont:{
      family:"Inter, Arial, sans-serif",
      size:11,
      weight:"700"
    },
    bodyFont:{
      family:"Inter, Arial, sans-serif",
      size:11
    },
    callbacks
  };
}

function legendOptions(position = "bottom") {
  return {
    position,
    labels:{
      color:chartTextColor(),
      padding:13,
      usePointStyle:true,
      pointStyle:"circle",
      boxWidth:8,
      boxHeight:8,
      font:{
        family:"Inter, Arial, sans-serif",
        size:10
      }
    }
  };
}

function baseChartOptions() {
  return {
    responsive:true,
    maintainAspectRatio:false,
    animation:{duration:500},
    interaction:{
      mode:"nearest",
      intersect:true
    },
    plugins:{
      legend:legendOptions(),
      tooltip:tooltipOptions()
    },
    scales:{
      x:{
        ticks:{
          color:chartTextColor(),
          font:{
            family:"Inter, Arial, sans-serif",
            size:10
          }
        },
        grid:{display:false},
        border:{color:chartBorderColor()}
      },
      y:{
        ticks:{
          color:chartTextColor(),
          font:{
            family:"Inter, Arial, sans-serif",
            size:10
          }
        },
        grid:{color:colors.grid},
        border:{display:false}
      }
    }
  };
}

function createChart(id,config) {
  if (!chartAvailable()) return;

  const canvas = document.getElementById(id);

  if (!canvas) return;

  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }

  const context = canvas.getContext("2d");

  if (!context) return;

  try {
    chartInstances[id] = new Chart(context,config);
  } catch (error) {
    console.error(`Unable to render chart: ${id}`,error);
  }
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

function chartGradient(context) {
  const chart = context.chart;
  const area = chart.chartArea;

  if (!area) return "rgba(19,158,172,.12)";

  const gradient = chart.ctx.createLinearGradient(
    0,area.top,0,area.bottom
  );

  gradient.addColorStop(0,"rgba(19,158,172,.26)");
  gradient.addColorStop(.55,"rgba(19,158,172,.09)");
  gradient.addColorStop(1,"rgba(19,158,172,0)");

  return gradient;
}

function getGwaDistribution() {
  const records = getDashboardStudents();

  const categories = [
    "Excellent",
    "Good Standing",
    "Needs Monitoring",
    "At Risk"
  ];

  return {
    categories,
    counts:categories.map(category =>
      records.filter(student => getStanding(student.gwa) === category).length
    )
  };
}

function getAttendanceDistribution() {
  const records = getDashboardStudents();

  return {
    labels:["Below 70%","70–79%","80–89%","90–100%"],
    counts:[
      records.filter(student => student.attendance < 70).length,
      records.filter(student =>
        student.attendance >= 70 && student.attendance < 80
      ).length,
      records.filter(student =>
        student.attendance >= 80 && student.attendance < 90
      ).length,
      records.filter(student =>
        student.attendance >= 90 && student.attendance <= 100
      ).length
    ]
  };
}

function distributionTooltip(context) {
  const total = context.dataset.data.reduce((sum,value) =>
    sum + Number(value),0
  );

  const percentage = getPercentage(Number(context.raw),total);

  return ` ${context.label}: ${context.raw} students (${percentage.toFixed(1)}%)`;
}

function renderTrendChart(id,label,data) {
  createChart(id,{
    type:"line",
    data:{
      labels:[
        "2023–2024",
        "1st Sem 2024–2025",
        "2nd Sem 2024–2025",
        "1st Sem 2025–2026"
      ],
      datasets:[{
        label,
        data,
        borderColor:colors.tealBright,
        backgroundColor:chartGradient,
        fill:true,
        tension:.38,
        borderWidth:2.5,
        pointRadius:3.5,
        pointHoverRadius:6,
        pointBackgroundColor:colors.tealBright,
        pointBorderColor:chartSurfaceColor(),
        pointBorderWidth:2
      }]
    },
    options:{
      ...baseChartOptions(),
      interaction:{
        mode:"index",
        intersect:false
      },
      plugins:{
        legend:{display:false},
        tooltip:tooltipOptions({
          label:context => ` ${context.dataset.label}: ${context.raw}%`
        })
      },
      scales:{
        x:{
          ticks:{
            color:chartTextColor(),
            maxRotation:0,
            font:{size:9}
          },
          grid:{display:false},
          border:{display:false}
        },
        y:{
          min:70,
          max:100,
          ticks:{
            color:chartTextColor(),
            stepSize:10,
            callback:value => `${value}%`
          },
          grid:{color:colors.grid},
          border:{display:false}
        }
      }
    }
  });
}

function renderDashboardCharts() {
  updateMLRiskChart();

  if (!chartAvailable()) return;

  renderTrendChart(
    "performanceChart",
    "Academic Performance (Sample)",
    [84,86,88,91]
  );

  createChart("seteChart",{
    type:"doughnut",
    data:{
      labels:[
        "Very Satisfactory",
        "Satisfactory",
        "Needs Improvement"
      ],
      datasets:[{
        data:[72,21,7],
        backgroundColor:[
          colors.greenDark,
          colors.teal,
          colors.blue
        ],
        borderWidth:2,
        borderColor:chartSurfaceColor(),
        borderRadius:3,
        hoverOffset:6
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:"76%",
      animation:{
        duration:650,
        animateRotate:true
      },
      plugins:{
        legend:{display:false},
        tooltip:tooltipOptions({
          label:context => ` ${context.label}: ${context.raw}%`
        })
      }
    }
  });

  const gwaDistribution = getGwaDistribution();

  createChart("gwaDistributionChart",{
    type:"doughnut",
    data:{
      labels:gwaDistribution.categories,
      datasets:[{
        label:"Number of Students",
        data:gwaDistribution.counts,
        backgroundColor:[
          colors.greenDark,
          colors.teal,
          colors.gold,
          colors.red
        ],
        borderColor:chartSurfaceColor(),
        borderWidth:3,
        borderRadius:3,
        hoverOffset:8,
        spacing:2
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:"63%",
      animation:{
        animateRotate:true,
        animateScale:true,
        duration:650
      },
      plugins:{
        legend:legendOptions(),
        tooltip:tooltipOptions({
          label:distributionTooltip
        })
      }
    }
  });

  const attendanceDistribution = getAttendanceDistribution();

  createChart("attendanceDistributionChart",{
    type:"polarArea",
    data:{
      labels:attendanceDistribution.labels,
      datasets:[{
        label:"Number of Students",
        data:attendanceDistribution.counts,
        backgroundColor:[
          "rgba(220,41,61,.75)",
          "rgba(214,161,61,.75)",
          "rgba(57,139,182,.76)",
          "rgba(24,139,69,.76)"
        ],
        borderColor:[
          colors.red,
          colors.gold,
          colors.blue,
          colors.greenDark
        ],
        borderWidth:2
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
          grid:{color:colors.grid},
          angleLines:{color:colors.grid}
        }
      },
      plugins:{
        legend:legendOptions(),
        tooltip:tooltipOptions({
          label:distributionTooltip
        })
      }
    }
  });

  const gwaNote = $("#gwaDistributionChart")
    ?.closest(".panel")?.querySelector(".overview-chart-note");

  if (gwaNote) {
    gwaNote.textContent =
      `Academic standing distribution for ${getDashboardStudents().length} students in the current selection.`;
  }

  const attendanceNote = $("#attendanceDistributionChart")
    ?.closest(".panel")?.querySelector(".overview-chart-note");

  if (attendanceNote) {
    attendanceNote.textContent =
      `Attendance distribution for ${getDashboardStudents().length} students in the current selection.`;
  }

  resizePageCharts("overview");
}

function renderAnalyticsCharts() {
  if (!chartAvailable()) return;

  renderTrendChart(
    "passingTrendChart",
    "Passing Rate (Sample)",
    [84,86,88,89.2]
  );

  const records = getDashboardStudents();

  createChart("gradeChart",{
    type:"bar",
    data:{
      labels:[
        "1.00–1.50",
        "1.51–2.00",
        "2.01–2.25",
        "2.26–2.75",
        "Above 2.75"
      ],
      datasets:[{
        label:"Students",
        data:[
          records.filter(student => student.gwa <= 1.50).length,
          records.filter(student =>
            student.gwa > 1.50 && student.gwa <= 2.00
          ).length,
          records.filter(student =>
            student.gwa > 2.00 && student.gwa <= 2.25
          ).length,
          records.filter(student =>
            student.gwa > 2.25 && student.gwa <= 2.75
          ).length,
          records.filter(student => student.gwa > 2.75).length
        ],
        backgroundColor:[
          colors.greenDark,
          colors.teal,
          colors.blue,
          colors.gold,
          colors.red
        ],
        borderRadius:6,
        borderSkipped:false,
        maxBarThickness:45
      }]
    },
    options:{
      ...baseChartOptions(),
      plugins:{
        legend:{display:false},
        tooltip:tooltipOptions({
          label:distributionTooltip
        })
      },
      scales:{
        x:{
          ticks:{
            color:chartTextColor(),
            maxRotation:0,
            font:{size:9}
          },
          grid:{display:false},
          border:{display:false}
        },
        y:{
          beginAtZero:true,
          ticks:{
            color:chartTextColor(),
            precision:0
          },
          grid:{color:colors.grid},
          border:{display:false}
        }
      }
    }
  });

  createChart("subjectChart",{
    type:"bar",
    data:{
      labels:classes.map(item => item.code),
      datasets:[{
        label:"Passing Rate (Sample)",
        data:subjectPassingRates,
        backgroundColor:[
          colors.teal,
          colors.blue,
          colors.greenDark,
          colors.gold,
          colors.teal,
          colors.blue
        ],
        borderRadius:6,
        borderSkipped:false,
        maxBarThickness:28
      }]
    },
    options:{
      indexAxis:"y",
      responsive:true,
      maintainAspectRatio:false,
      animation:{duration:500},
      plugins:{
        legend:{display:false},
        tooltip:tooltipOptions({
          title:items => {
            const item = classes[items[0]?.dataIndex];

            return item
              ? `${item.code} — ${item.name}`
              : "Subject Performance";
          },
          label:context => ` Passing Rate (Sample): ${context.raw}%`
        })
      },
      scales:{
        x:{
          min:0,
          max:100,
          ticks:{
            color:chartTextColor(),
            stepSize:20,
            callback:value => `${value}%`
          },
          grid:{color:colors.grid},
          border:{display:false}
        },
        y:{
          ticks:{
            color:chartTextColor(),
            font:{
              family:"Inter, Arial, sans-serif",
              size:11,
              weight:"600"
            }
          },
          grid:{display:false},
          border:{display:false}
        }
      }
    }
  });

  resizePageCharts("analytics");
}

function renderEvaluationCharts() {
  if (!chartAvailable()) return;

  createChart("dimensionChart",{
    type:"bar",
    data:{
      labels:[
        "Subject Knowledge",
        "Communication",
        "Class Management",
        "Learning Support",
        "Professionalism"
      ],
      datasets:[{
        label:"Average Rating (Sample)",
        data:[4.4,4.3,4.2,4.25,4.35],
        backgroundColor:[
          colors.teal,
          colors.blue,
          colors.greenDark,
          colors.teal,
          colors.blue
        ],
        borderRadius:5,
        borderSkipped:false,
        maxBarThickness:38
      }]
    },
    options:{
      ...baseChartOptions(),
      plugins:{
        legend:{display:false},
        tooltip:tooltipOptions({
          label:context => ` Rating: ${Number(context.raw).toFixed(2)} / 5`
        })
      },
      scales:{
        x:{
          ticks:{
            color:chartTextColor(),
            maxRotation:35,
            font:{size:9}
          },
          grid:{display:false},
          border:{display:false}
        },
        y:{
          min:0,
          max:5,
          ticks:{
            color:chartTextColor(),
            stepSize:1
          },
          grid:{color:colors.grid},
          border:{display:false}
        }
      }
    }
  });

  createChart("evaluationChart",{
    type:"doughnut",
    data:{
      labels:[
        "Very Satisfactory",
        "Satisfactory",
        "Needs Improvement"
      ],
      datasets:[{
        data:[72,21,7],
        backgroundColor:[
          colors.greenDark,
          colors.teal,
          colors.blue
        ],
        borderWidth:2,
        borderColor:chartSurfaceColor(),
        borderRadius:3,
        hoverOffset:8
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      cutout:"68%",
      animation:{duration:600},
      plugins:{
        legend:legendOptions(),
        tooltip:tooltipOptions({
          label:context => ` ${context.label}: ${context.raw}%`
        })
      }
    }
  });

  resizePageCharts("evaluation");
}

function refreshAcademicViews() {
  renderStudentSummary();
  renderStudents();
  buildAlerts();
  renderAlerts();
  updateDashboardFilters();
  updateMLRiskChart();
  refreshMLOverview();
}

function refreshActiveCharts() {
  const pageName = $(".page.active")?.id.replace("page-","");

  if (pageName === "overview") renderDashboardCharts();
  if (pageName === "analytics") renderAnalyticsCharts();
  if (pageName === "evaluation") renderEvaluationCharts();
}

let savedProfile = {};

try {
  savedProfile = JSON.parse(
    localStorage.getItem("bsunisyncProfile") || "{}"
  ) || {};
} catch (error) {
  savedProfile = {};
  console.warn("Unable to read profile settings.",error);
}

const initialName = typeof savedProfile.name === "string"
  ? savedProfile.name
  : "Faculty Member";

function updateFacultyName(name) {
  const cleanName = String(name || "").trim() || "Faculty Member";

  setText("#welcomeName",cleanName);
  setText("#topFacultyName",cleanName);
  setText("#profileNameHeading",cleanName);
  setText(".profile-trigger .avatar",getInitials(cleanName));
  setText(".profile-large .avatar",getInitials(cleanName));
}

if ($("#facultyName")) {
  $("#facultyName").value = initialName;
}

updateFacultyName(initialName);

if (savedProfile.theme === "light") {
  document.body.classList.add("light-theme");

  if ($("#themeSelect")) {
    $("#themeSelect").value = "light";
  }
}

$("#profileForm")?.addEventListener("submit",event => {
  event.preventDefault();

  const name = $("#facultyName")?.value.trim() || "Faculty Member";
  const theme = $("#themeSelect")?.value || "dark";

  let storageSaved = true;

  try {
    localStorage.setItem("bsunisyncProfile",JSON.stringify({
      name,
      theme
    }));
  } catch (error) {
    storageSaved = false;
  }

  updateFacultyName(name);

  document.body.classList.toggle("light-theme",theme === "light");

  refreshActiveCharts();

  showToast(
    storageSaved
      ? "Profile and workspace preferences saved."
      : "Workspace preferences applied for the current session."
  );
});

$("#themeSelect")?.addEventListener("change",event => {
  document.body.classList.toggle("light-theme",event.target.value === "light");
  refreshActiveCharts();
});

$("#printSchedule")?.addEventListener("click",() => {
  window.print();
});

function initializeAcademicNotes() {
  const predictionFormNote = $(".prediction-form-note");

  if (predictionFormNote) {
    predictionFormNote.innerHTML = `
      <strong>Student Information &amp; Privacy</strong>
      <p>Use fictional or non-identifiable student information, including the ID and name. Program, Year Level, and Section are for student identification; only the five academic indicators are submitted to the prediction service.</p>
      <p>Each student requires a unique ID. Identical submissions are prevented, and changes to existing records require confirmation.</p>
      <p>Records are retained during the current page session.</p>
    `;
  }

  const predictionHistoryNote = $(
    ".prediction-history-panel .overview-chart-note"
  );

  if (predictionHistoryNote) {
    predictionHistoryNote.textContent =
      "History includes new assessments and confirmed academic updates. Student Records retain the latest assessment per ID. Refreshing or closing the page clears session records.";
  }

  const performanceDescription = $("#performanceChart")
    ?.closest(".panel")?.querySelector(".panel-header p");

  if (performanceDescription) {
    performanceDescription.textContent =
      "Academic performance across recent terms (sample)";
  }

  const gradeDescription = $("#gradeChart")
    ?.closest(".panel")?.querySelector(".panel-header p");

  if (gradeDescription) {
    gradeDescription.textContent =
      "Distribution from the current academic selection";
  }
}

initializeRecordMode();
initializeStudentAcademicFilters();
initializeStudentConcernFilter();
addMLInterface();
initializePredictionValidation();
initializeKPIInteractions();
initializeStudentSummaryCards();
initializeAcademicNotes();
renderClasses();
renderSchedule();
renderPredictionHistory();
resetPredictionResult();
setRecordMode("demonstration");
showPage("overview");
runBatchPredictions();

window.addEventListener("resize",() => {
  const activePage = $(".page.active");

  if (!activePage) return;

  activePage.querySelectorAll("canvas").forEach(canvas => {
    const chart = chartInstances[canvas.id];

    if (chart) chart.resize();
  });

  if (window.innerWidth > 760) {
    $("#sidebar")?.classList.remove("open");
  }
});

document.addEventListener("visibilitychange",() => {
  if (document.hidden) return;

  const activePage = $(".page.active");

  if (activePage) {
    resizePageCharts(activePage.id.replace("page-",""));
  }

  updateMLRiskChart();
});

});