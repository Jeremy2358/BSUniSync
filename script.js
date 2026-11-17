
document.addEventListener("DOMContentLoaded", () => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

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

  // Generate 334 additional records, bringing the total to 342.
  // The GWA distribution matches the Academic Analytics chart.

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

  // Exact additional student counts for each GWA range:
  // Excellent: 41
  // Good Standing: 209
  // Needs Monitoring: 58
  // At Risk: 26

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
      const range = group.max - group.min;
      const steps = Math.round(range * 100);
      const value = group.min + ((i * 7) % (steps + 1)) / 100;

      generatedGwaValues.push(
        Number(Math.min(value, group.max).toFixed(2))
      );
    }
  });

  let generatedIndex = 0;

  for (let i = 0; i < firstNames.length; i++) {
    for (let j = 0; j < lastNames.length; j++) {
      if (generatedIndex >= 334) break;

      const name = `${firstNames[i]} ${lastNames[j]}`;

      if (students.some(student => student.name === name)) continue;

      const gwa = generatedGwaValues[generatedIndex];
      const yearIndex = generatedIndex % 4;
      const year = ["1st Year","2nd Year","3rd Year","4th Year"][yearIndex];

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

      const status =
        gwa > 2.75 || attendance < 80
          ? "For Follow-up"
          : "Active";

      students.push({
        id:`2022-${String(students.length + 1).padStart(3,"0")}`,
        name,
        program:"BSIT",
        year,
        gwa,
        attendance,
        progress,
        status
      });

      generatedIndex++;
    }

    if (generatedIndex >= 334) break;
  }

  console.log(`Generated ${students.length} student records.`);

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

  let alerts = [
    {id:1,title:"Pending Grade Submission",description:"Grade entries for two assigned classes still need to be submitted.",type:"Urgent",date:"November 17, 2026",open:true},
    {id:2,title:"Student Academic Concern",description:"Several students may need academic consultation and follow-up.",type:"Student Concern",date:"November 16, 2026",open:true},
    {id:3,title:"SETE Evaluation Reminder",description:"One assigned section has not completed the teaching evaluation.",type:"Reminder",date:"November 15, 2026",open:true}
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

    $("#kpiAtRisk").textContent = counts.risk;
    $("#kpiAtRiskDetail").textContent =
      `${counts.risk} students require academic attention`;

    // Keep the dashboard KPI synchronized with the actual records.
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
      tbody.innerHTML = `<tr><td colspan="8" class="empty-row">No student records match your search or filters.</td></tr>`;
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
          <td><button class="view-record" data-student-id="${escapeHTML(student.id)}">View</button></td>
        </tr>`;
    }).join("");
  }

  function openStudentRecord(studentId) {
    const student = students.find(item => item.id === studentId);
    if (!student) return;

    const standing = getStanding(student.gwa);

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
      </div>

      <div class="detail-note">
        ${standing === "At Risk"
          ? "This student is classified as At Risk based on the current GWA. Academic consultation and follow-up are recommended."
          : standing === "Needs Monitoring"
            ? "This student's academic standing should be monitored. Consider checking progress and providing support when necessary."
            : standing === "Excellent"
              ? "This student is performing excellently based on the current GWA."
              : "This student is currently within the Good Standing range."}
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

    $("#fullAlertList").innerHTML = openAlerts.length ? openAlerts.map(alert => `
      <div class="alert-item">
        <div>
          <strong>${escapeHTML(alert.title)}</strong>
          <p>${escapeHTML(alert.description)}</p>
          <p>${escapeHTML(alert.date)}</p>
        </div>
        <span class="status-pill ${alert.type === "Urgent" ? "danger" : alert.type === "Reminder" ? "info" : "warning"}">${escapeHTML(alert.type)}</span>
      </div>`).join("") : `<p>No open alerts. You're all caught up.</p>`;

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

  renderStudentSummary();
  renderStudents();
  renderClasses();
  renderSchedule();
  renderAlerts();
  renderNotifications();
  updateDashboardFilters();

  renderDashboardCharts();

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
