
document.addEventListener("DOMContentLoaded", () => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  // ==================================================
  // API CONFIGURATION
  // ==================================================

  const API_URL = "https://bsunisync-api.onrender.com/predict-batch";
  const API_TIMEOUT = 120000;

  let modelApiStatus = "connecting";
  let modelApiMessage = "Connecting to prediction service...";
  let modelApiLoading = false;
  let individualPredictionLoading = false;

  let predictionHistory = [];
  let predictionSequence = 0;

  // ==================================================
  // DEMONSTRATION STUDENT RECORDS
  // ==================================================

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
        Number(Math.min(value, group.max).toFixed(2))
      );
    }
  });

  let generatedIndex = 0;

  for (
    let i = 0;
    i < firstNames.length && generatedIndex < 334;
    i++
  ) {
    for (
      let j = 0;
      j < lastNames.length && generatedIndex < 334;
      j++
    ) {
      const name = `${firstNames[i]} ${lastNames[j]}`;

      if (students.some(student => student.name === name)) {
        continue;
      }

      const gwa = generatedGwaValues[generatedIndex];

      const year = [
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year"
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
        status:
          gwa > 2.75 || attendance < 80
            ? "For Follow-up"
            : "Active"
      });

      generatedIndex++;
    }
  }

  students.forEach((student, index) => {
    student.academicYear = index < 8
      ? "2025-2026"
      : [
          "2023-2024",
          "2024-2025",
          "2025-2026"
        ][index % 3];

    student.semester = index % 2 === 0 ? "1" : "2";

    const previousVariation = ((index % 7) - 3) * 0.12;

    student.previousGwa = Number(
      Math.max(
        1,
        Math.min(5, student.gwa + previousVariation)
      ).toFixed(2)
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

  // Faculty-entered records are kept separate from
  // demonstration student records.

  const facultyStudents = [];

  let recordMode = "demonstration";

  function getActiveStudents() {
    return recordMode === "faculty"
      ? facultyStudents
      : students;
  }

  // ==================================================
  // CLASSES AND TEACHING SCHEDULE
  // ==================================================

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

  // ==================================================
  // GENERAL UTILITIES
  // ==================================================

  let notificationsRead = false;

  const chartInstances = {};

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    })[char]);

  function setText(selector, value) {
    const element = $(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function showToast(message) {
    const container = $("#toastContainer");

    if (!container) return;

    const toast = document.createElement("div");

    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
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

  function getPercentage(part, total) {
    return total ? part / total * 100 : 0;
  }

  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString("en-PH", {
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

  function getSourceLabel() {
    return recordMode === "faculty"
      ? "Faculty-entered records"
      : "Demonstration records";
  }

  // ==================================================
  // DASHBOARD FILTERS AND KPI SUMMARY
  // ==================================================

  function getDashboardStudents() {
    const records = getActiveStudents();

    // Faculty form does not currently ask for academic
    // year or semester, so no invented values are used.

    if (recordMode === "faculty") {
      return records;
    }

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
      ? records.reduce(
          (sum, student) =>
            sum + Number(student.progress || 0),
          0
        ) / total
      : 0;

    const gwaRisk = records.filter(student =>
      getStanding(student.gwa) === "At Risk"
    ).length;

    const mlRisk = records.filter(student =>
      student.mlPrediction === "At Risk"
    ).length;

    const averageAttendance = total
      ? records.reduce(
          (sum, student) =>
            sum + Number(student.attendance || 0),
          0
        ) / total
      : 0;

    return {
      records,
      total,
      passing,
      passingRate:getPercentage(passing,total),
      averageProgress,
      gwaRisk,
      mlRisk,
      averageAttendance
    };
  }

  function updateDashboardKPIs() {
    const summary = getDashboardSummary();

    setText(
      "#kpiStudents",
      summary.total.toLocaleString()
    );

    setText(
      "#kpiPassing",
      summary.total
        ? `${summary.passingRate.toFixed(1)}%`
        : "—"
    );

    setText(
      "#kpiCompletion",
      summary.total
        ? `${summary.averageProgress.toFixed(1)}%`
        : "—"
    );

    const riskCount = recordMode === "faculty"
      ? summary.mlRisk
      : summary.gwaRisk;

    setText("#kpiAtRisk", riskCount.toLocaleString());

    setText(
      "#kpiAtRiskDetail",
      recordMode === "faculty"
        ? `${riskCount} students classified At Risk by the ML model`
        : `${riskCount} students with GWA above 2.75 in this selection`
    );

    const totalLabel =
      $("#kpiStudents")?.closest(".kpi-info")
        ?.querySelector("small");

    if (totalLabel) {
      totalLabel.textContent = getSourceLabel();
    }

    const passingCard =
      $("#kpiPassing")?.closest(".kpi-info");

    if (passingCard) {
      const title = passingCard.querySelector("span");
      const note = passingCard.querySelector("small");

      if (title) title.textContent = "GWA Passing Indicator";
      if (note) note.textContent = "Students with GWA of 3.00 or better";
    }

    const completionCard =
      $("#kpiCompletion")?.closest(".kpi-info");

    if (completionCard) {
      const title = completionCard.querySelector("span");
      const note = completionCard.querySelector("small");

      if (title) title.textContent = "Average Academic Progress";
      if (note) note.textContent = "Based on recorded academic progress";
    }
  }

  // ==================================================
  // DATA SOURCE SWITCHING
  // ==================================================

  function initializeRecordMode() {
    const filterRow = $(".filter-row");

    if (filterRow && !$("#recordModeSelect")) {
      const label = document.createElement("label");

      label.innerHTML = `
        Data Source
        <select id="recordModeSelect">
          <option value="demonstration">
            Demonstration Data
          </option>
          <option value="faculty">
            Faculty-entered Data
          </option>
        </select>
      `;

      filterRow.prepend(label);
    }

    $("#recordModeSelect")?.addEventListener("change", event => {
      setRecordMode(event.target.value);
    });

    const studentToolbar = $(".student-toolbar");

    if (studentToolbar && !$("#studentRecordModeSelect")) {
      const select = document.createElement("select");

      select.id = "studentRecordModeSelect";
      select.setAttribute("aria-label", "Student data source");

      select.innerHTML = `
        <option value="demonstration">
          Demonstration Records
        </option>
        <option value="faculty">
          Faculty-entered Records
        </option>
      `;

      studentToolbar.appendChild(select);

      select.addEventListener("change", event => {
        setRecordMode(event.target.value);
      });
    }
  }

  function setRecordMode(mode) {
    recordMode = mode === "faculty"
      ? "faculty"
      : "demonstration";

    if ($("#recordModeSelect")) {
      $("#recordModeSelect").value = recordMode;
    }

    if ($("#studentRecordModeSelect")) {
      $("#studentRecordModeSelect").value = recordMode;
    }

    if ($("#yearFilter")) {
      $("#yearFilter").disabled = recordMode === "faculty";
    }

    if ($("#semesterFilter")) {
      $("#semesterFilter").disabled = recordMode === "faculty";
    }

    if ($("#studentYearFilter")) {
      $("#studentYearFilter").value = "all";
      $("#studentYearFilter").disabled =
        recordMode === "faculty";
    }

    if ($("#studentSearch")) {
      $("#studentSearch").value = "";
    }

    if ($("#studentStandingFilter")) {
      $("#studentStandingFilter").value = "all";
    }

    const disclaimer = $("#mlDisclaimer");

    if (disclaimer) {
      disclaimer.textContent =
        recordMode === "faculty"
          ? "Predictions below use faculty-entered academic inputs. These records are temporary and must be reviewed by faculty."
          : "ML predictions use synthetic demonstration inputs. Model scores are not calibrated probabilities and should only support human review.";
    }

    const overviewDisclaimer = $(".ml-overview-disclaimer");

    if (overviewDisclaimer) {
      overviewDisclaimer.innerHTML =
        recordMode === "faculty"
          ? `
            <strong>Important:</strong>
            This view uses faculty-entered academic information.
            Predictions support academic review and are not
            definitive judgments. The model has not been
            validated against actual institutional outcomes.
            Records are temporary for this demonstration session.
          `
          : `
            <strong>Important:</strong>
            This view uses synthetic demonstration student
            records and simulated historical inputs.
            Predictions are decision-support indicators only.
            Faculty judgment and academic review remain necessary.
          `;
    }

    refreshAcademicViews();
  }

  // ==================================================
  // SHARED MODEL API REQUEST
  // ==================================================

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

    const timeout = setTimeout(
      () => controller.abort(),
      API_TIMEOUT
    );

    try {
      const payload = {
        students:records.map(createModelInput)
      };

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

          const rawDetail =
            errorData.detail || errorData.message || "";

          detail = typeof rawDetail === "string"
            ? rawDetail
            : JSON.stringify(rawDetail);

        } catch (_) {
          detail = "";
        }

        throw new Error(
          `API returned HTTP ${response.status}${
            detail ? `: ${detail}` : ""
          }`
        );
      }

      const data = await response.json();

      return normalizePredictionResponse(
        data,
        records.length
      );

    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(
          "The prediction request timed out after 120 seconds. The server may still be starting."
        );
      }

      throw error;

    } finally {
      clearTimeout(timeout);
    }
  }

  // ==================================================
  // MODEL RESPONSE NORMALIZATION
  // ==================================================

  function normalizePercent(value) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      typeof value === "boolean"
    ) {
      return null;
    }

    const explicitPercent =
      typeof value === "string" &&
      value.trim().endsWith("%");

    let number = explicitPercent
      ? Number(value.trim().slice(0,-1))
      : Number(value);

    if (!Number.isFinite(number)) {
      return null;
    }

    if (!explicitPercent && number >= 0 && number <= 1) {
      number *= 100;
    }

    if (number < 0 || number > 100) {
      return null;
    }

    return number;
  }

  function normalizePredictionResponse(data, expectedCount) {
    const predictions =
      Array.isArray(data) ? data :
      Array.isArray(data?.predictions) ? data.predictions :
      Array.isArray(data?.results) ? data.results :
      Array.isArray(data?.data?.predictions) ? data.data.predictions :
      Array.isArray(data?.data?.results) ? data.data.results :
      Array.isArray(data?.data) ? data.data :
      null;

    if (!predictions) {
      throw new Error(
        "The API response does not contain a recognizable predictions array."
      );
    }

    if (predictions.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} predictions, but received ${predictions.length}.`
      );
    }

    const validatedResults = new Array(expectedCount);
    const receivedIndexes = new Set();

    predictions.forEach((result, position) => {
      if (!result || typeof result !== "object") {
        throw new Error(
          `Prediction result ${position + 1} is invalid.`
        );
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
        index >= expectedCount
      ) {
        throw new Error(
          `Invalid student index at result ${position + 1}.`
        );
      }

      if (receivedIndexes.has(index)) {
        throw new Error(
          `Duplicate prediction result at index ${index}.`
        );
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
          `Unsupported prediction label: ${String(rawPrediction)}`
        );
      }

      // Explicit at-risk probabilities are distinguished
      // from generic model confidence or model scores.

      let rawScore =
        result.at_risk_probability ??
        result.atRiskProbability ??
        result.risk_probability ??
        result.riskProbability ??
        null;

      let scoreLabel = "At-risk Probability";

      if (rawScore === null) {
        rawScore =
          result.risk_score ??
          result.riskScore ??
          null;

        scoreLabel = "Model Risk Score";
      }

      if (rawScore === null) {
        rawScore =
          result.probabilities ??
          result.probability ??
          result.confidence ??
          result.score ??
          null;

        scoreLabel = "Reported Model Score";
      }

      if (rawScore && typeof rawScore === "object") {
        const explicitRisk =
          rawScore["At Risk"] ??
          rawScore["at_risk"] ??
          rawScore.risk ??
          (
            Array.isArray(rawScore)
              ? null
              : rawScore["1"]
          ) ??
          null;

        if (explicitRisk !== null) {
          rawScore = explicitRisk;
          scoreLabel = "At-risk Probability";
        } else {
          rawScore = null;
        }
      }

      const score = normalizePercent(rawScore);

      receivedIndexes.add(index);

      validatedResults[index] = {
        prediction,
        score,
        scoreLabel
      };
    });

    if (receivedIndexes.size !== expectedCount) {
      throw new Error(
        "The API did not return all required prediction results."
      );
    }

    return validatedResults;
  }

  // ==================================================
  // MODEL API STATUS
  // ==================================================

  function updateModelApiStatus(status, message) {
    modelApiStatus = status;
    modelApiMessage = message;

    const container = $("#modelApiStatus");

    if (container) {
      container.classList.remove(
        "online",
        "offline",
        "connecting"
      );

      container.classList.add(status);

      const messageElement =
        container.querySelector(".model-api-message");

      if (messageElement) {
        messageElement.textContent = message;
      }
    }

    const retryButton = $("#retryModelBtn");

    if (retryButton) {
      retryButton.disabled =
        modelApiLoading || individualPredictionLoading;

      retryButton.textContent =
        modelApiLoading ? "Connecting..." : "Retry";

      retryButton.classList.toggle(
        "hidden",
        status === "online"
      );
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
      risk:analyzed.filter(student =>
        student.mlPrediction === "At Risk"
      ).length,
      safe:analyzed.filter(student =>
        student.mlPrediction === "Not At Risk"
      ).length
    };
  }

  function refreshMLOverview() {
    const distribution = getMLRiskDistribution();

    const statusElement = $("#mlOverviewStatus");

    if (statusElement) {
      statusElement.className =
        `ml-overview-status ${modelApiStatus}`;
    }

    setText(
      "#mlOverviewStatusText",
      modelApiStatus === "online"
        ? "Model Online"
        : modelApiStatus === "offline"
          ? "Service Unavailable"
          : "Connecting..."
    );

    setText(
      "#mlOverviewTotal",
      distribution.analyzed.toLocaleString()
    );

    setText(
      "#mlOverviewRisk",
      distribution.risk.toLocaleString()
    );

    setText(
      "#mlOverviewSafe",
      distribution.safe.toLocaleString()
    );

    setText(
      "#mlOverviewMessage",
      `${getSourceLabel()} · ${distribution.analyzed} students analyzed. ${modelApiMessage}`
    );
  }

  // ==================================================
  // ML INTERFACE AND DYNAMIC STYLES
  // ==================================================

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

        <button
          type="button"
          id="retryModelBtn"
          class="model-retry-button"
        >
          Retry
        </button>
      `;

      heading.appendChild(status);
    }

    const tableHead =
      $("#page-students .student-table thead tr");

    if (tableHead && !$("#mlPredictionHeader")) {
      const header = document.createElement("th");

      header.id = "mlPredictionHeader";
      header.textContent = "ML Prediction";

      tableHead.insertBefore(
        header,
        tableHead.lastElementChild
      );
    }

    const guide = $(".standing-guide");

    if (guide && !$("#mlDisclaimer")) {
      const disclaimer = document.createElement("div");

      disclaimer.id = "mlDisclaimer";
      disclaimer.className = "ml-disclaimer";
      disclaimer.textContent =
        "ML predictions use synthetic demonstration inputs. Model scores are not calibrated probabilities and should only support human review.";

      guide.insertAdjacentElement(
        "afterend",
        disclaimer
      );
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
          color:var(--text);
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
          color:var(--muted);
        }

        .ml-score {
          display:block;
          color:var(--muted);
          font-size:8px;
          margin-top:4px;
        }

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
          display:flex;
          flex-direction:column;
          gap:13px;
          width:100%;
        }

        .ml-risk-row[hidden],
        .ml-risk-total[hidden],
        .ml-distribution-empty[hidden] {
          display:none !important;
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

        .ml-risk-dot.danger {
          background:#e34b55;
        }

        .ml-risk-dot.success {
          background:#2eb879;
        }

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

        .ml-distribution-empty {
          text-align:center;
          color:var(--muted);
          font-size:12px;
          line-height:1.7;
          padding:25px;
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

        .overview-insights-grid > .ml-risk-distribution-panel {
          grid-column:1 / -1;
        }

        .prediction-loading {
          padding:35px 15px;
          color:var(--muted);
          text-align:center;
          font-size:12px;
          line-height:1.8;
        }

        .prediction-spinner {
          width:30px;
          height:30px;
          margin:0 auto 16px;
          border:3px solid var(--border);
          border-top-color:#168fa0;
          border-radius:50%;
          animation:prediction-spin .8s linear infinite;
        }

        @keyframes prediction-spin {
          to {
            transform:rotate(360deg);
          }
        }

        .prediction-error {
          padding:18px;
          border:1px solid rgba(217,35,50,.35);
          background:rgba(217,35,50,.08);
          border-radius:10px;
          color:var(--text);
          font-size:12px;
          line-height:1.8;
        }

        .prediction-risk-text {
          color:#ed666f;
        }

        .prediction-safe-text {
          color:#40ba7c;
        }

        .prediction-result-score-label {
          display:block;
          font-size:10px;
          color:var(--muted);
          margin-top:5px;
        }

        .prediction-result-note {
          margin-top:20px;
          padding:14px;
          background:rgba(22,143,160,.06);
          border:1px solid var(--border);
          border-radius:8px;
          font-size:11px;
          line-height:1.7;
          color:var(--muted);
        }

        .prediction-result-actions {
          display:flex;
          flex-wrap:wrap;
          justify-content:flex-end;
          gap:10px;
          margin-top:18px;
        }

        #studentPredictionForm input {
          min-height:42px;
          padding:10px 12px;
          border:1px solid var(--border);
          border-radius:8px;
          background:var(--surface-soft);
          color:var(--text);
          font:inherit;
        }

        #studentPredictionForm input:focus {
          outline:2px solid rgba(22,143,160,.35);
          border-color:#168fa0;
        }

        #studentPredictionForm input:disabled,
        #studentPredictionForm button:disabled {
          opacity:.6;
          cursor:wait;
        }

        .prediction-source-note {
          color:var(--muted);
          font-size:10px;
          line-height:1.6;
          margin-top:10px;
        }

        @media(max-width:760px) {
          .student-record-heading {
            align-items:flex-start;
            flex-direction:column;
          }

          .model-api-status {
            margin-left:0;
          }

          .overview-insights-grid {
            grid-template-columns:minmax(0,1fr);
            gap:14px;
          }

          .overview-insights-grid > .ml-risk-distribution-panel {
            grid-column:auto;
          }

          .ml-gauge-wrap {
            min-height:250px;
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

          .prediction-result-actions {
            flex-direction:column;
          }
        }
      `;

      document.head.appendChild(style);
    }

    $("#retryModelBtn")?.addEventListener(
      "click",
      () => {
        if (recordMode === "faculty") {
          showPage("prediction");
          showToast(
            "Submit the student form to retry an individual prediction."
          );
        } else {
          runBatchPredictions();
        }
      }
    );

    initializeMLRiskDistribution();
  }

  function getMLBadge(student) {
    if (!student.mlPrediction) {
      return modelApiStatus === "offline"
        ? `
          <span class="ml-badge ml-unavailable">
            Unavailable
          </span>
        `
        : `
          <span class="ml-badge ml-pending">
            Pending
          </span>
        `;
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

  // ==================================================
  // ML RISK DISTRIBUTION
  // ==================================================

  function initializeMLRiskDistribution() {
    $$(".ml-gauge-wrap").forEach(container => {
      container.innerHTML = `
        <div class="ml-risk-distribution">

          <div class="ml-distribution-empty" data-ml-empty>
            No predictions available.
          </div>

          <div class="ml-risk-row" data-ml-risk-row hidden>

            <div class="ml-risk-row-top">

              <div class="ml-risk-label">
                <span class="ml-risk-dot danger"></span>
                At Risk
              </div>

              <div class="ml-risk-values">
                <strong class="ml-risk-count" data-ml-risk-count>
                  0
                </strong>

                <span class="ml-risk-percent" data-ml-risk-percent>
                  0%
                </span>
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
                <strong class="ml-risk-count" data-ml-safe-count>
                  0
                </strong>

                <span class="ml-risk-percent" data-ml-safe-percent>
                  0%
                </span>
              </div>

            </div>

            <div class="ml-risk-track">
              <div class="ml-risk-fill success" data-ml-safe-bar></div>
            </div>

          </div>

          <div class="ml-risk-total" data-ml-total hidden>
            <span>Total analyzed students</span>

            <strong data-ml-analyzed-count>
              0
            </strong>
          </div>

        </div>
      `;
    });

    updateMLRiskChart();
  }

  function updateMLRiskChart() {
    const distribution = getMLRiskDistribution();

    const hasPredictions = distribution.analyzed > 0;

    const riskPercentage = getPercentage(
      distribution.risk,
      distribution.analyzed
    );

    const safePercentage = getPercentage(
      distribution.safe,
      distribution.analyzed
    );

    $$(".ml-gauge-wrap").forEach(container => {
      const riskRow =
        container.querySelector("[data-ml-risk-row]");

      const safeRow =
        container.querySelector("[data-ml-safe-row]");

      const totalRow =
        container.querySelector("[data-ml-total]");

      const empty =
        container.querySelector("[data-ml-empty]");

      if (!riskRow || !safeRow || !totalRow) {
        return;
      }

      riskRow.hidden = !hasPredictions;
      safeRow.hidden = !hasPredictions;
      totalRow.hidden = !hasPredictions;

      if (empty) {
        empty.hidden = hasPredictions;

        empty.textContent =
          recordMode === "faculty"
            ? "Submit student academic information to generate the first prediction."
            : modelApiStatus === "offline"
              ? "The prediction service is currently unavailable."
              : "Waiting for demonstration prediction results.";
      }

      container.querySelector(
        "[data-ml-risk-count]"
      ).textContent = distribution.risk;

      container.querySelector(
        "[data-ml-safe-count]"
      ).textContent = distribution.safe;

      container.querySelector(
        "[data-ml-risk-percent]"
      ).textContent = `${riskPercentage.toFixed(1)}%`;

      container.querySelector(
        "[data-ml-safe-percent]"
      ).textContent = `${safePercentage.toFixed(1)}%`;

      container.querySelector(
        "[data-ml-risk-bar]"
      ).style.width = `${riskPercentage}%`;

      container.querySelector(
        "[data-ml-safe-bar]"
      ).style.width = `${safePercentage}%`;

      container.querySelector(
        "[data-ml-analyzed-count]"
      ).textContent = distribution.analyzed;
    });

    setText(
      "#mlRiskChartNote",
      hasPredictions
        ? `${getSourceLabel()}: ${distribution.analyzed} students analyzed. ${distribution.risk} classified At Risk (${riskPercentage.toFixed(1)}%) and ${distribution.safe} classified Not At Risk (${safePercentage.toFixed(1)}%).`
        : "Classification percentages will appear after successful API predictions."
    );

    refreshMLOverview();
  }

  // ==================================================
  // DEMONSTRATION BATCH PREDICTIONS
  // ==================================================

  async function runBatchPredictions() {
    if (modelApiLoading || individualPredictionLoading) {
      return;
    }

    modelApiLoading = true;

    updateModelApiStatus(
      "connecting",
      "Connecting to the Decision Tree model..."
    );

    try {
      const results = await requestPredictions(students);

      results.forEach((result,index) => {
        students[index].mlPrediction = result.prediction;
        students[index].mlScore = result.score;
        students[index].mlScoreLabel = result.scoreLabel;
      });

      updateModelApiStatus(
        "online",
        `${results.length} demonstration records successfully classified.`
      );

      refreshAcademicViews();

      showToast(
        "Demonstration ML predictions received."
      );

    } catch (error) {
      console.error("Demonstration prediction failed:", error);

      updateModelApiStatus(
        "offline",
        error.message || "Prediction service unavailable."
      );

      renderStudents();

    } finally {
      modelApiLoading = false;

      updateModelApiStatus(
        modelApiStatus,
        modelApiMessage
      );

      updateMLRiskChart();
    }
  }

  // ==================================================
  // FACULTY STUDENT INPUT FORM
  // ==================================================

  const predictionForm = $("#studentPredictionForm");

  function readPredictionForm() {
    const studentId =
      $("#predictionStudentId")?.value.trim() || "";

    const studentName =
      $("#predictionStudentName")?.value.trim() || "";

    const numericFields = [
      {
        selector:"#predictionPreviousGwa",
        name:"Previous GWA",
        min:1,
        max:5
      },
      {
        selector:"#predictionCurrentGwa",
        name:"Current GWA",
        min:1,
        max:5
      },
      {
        selector:"#predictionAttendance",
        name:"Attendance Rate",
        min:0,
        max:100
      },
      {
        selector:"#predictionProgress",
        name:"Academic Progress",
        min:0,
        max:100
      },
      {
        selector:"#predictionFailedSubjects",
        name:"Failed Subjects",
        min:0,
        max:Number.MAX_SAFE_INTEGER,
        integer:true
      }
    ];

    if (!studentId) {
      throw new Error("Student ID is required.");
    }

    if (!studentName) {
      throw new Error("Student name is required.");
    }

    const values = numericFields.map(field => {
      const input = $(field.selector);
      const rawValue = input?.value.trim() ?? "";
      const value = Number(rawValue);

      if (
        rawValue === "" ||
        !Number.isFinite(value) ||
        value < field.min ||
        value > field.max
      ) {
        throw new Error(
          `${field.name} contains an invalid value.`
        );
      }

      if (field.integer && !Number.isInteger(value)) {
        throw new Error(
          `${field.name} must be a whole number.`
        );
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
      program:"Not specified",
      year:"Not specified",
      source:"faculty",
      academicYear:null,
      semester:null,
      status:"Active",
      mlPrediction:null,
      mlScore:null,
      mlScoreLabel:"Model Score"
    };
  }

  function setPredictionLoading(loading) {
    individualPredictionLoading = loading;

    if (predictionForm) {
      predictionForm
        .querySelectorAll("input,button,select")
        .forEach(element => {
          element.disabled = loading;
        });
    }

    setText(
      "#submitPredictionBtn",
      loading
        ? "Analyzing Student..."
        : "Predict Student Risk →"
    );
  }

  function setPredictionResultStatus(label, type) {
    const status = $("#predictionResultStatus");

    if (!status) return;

    status.className = `status-pill ${type}`;
    status.textContent = label;
  }

  function renderPredictionLoading() {
    setPredictionResultStatus("Analyzing", "warning");

    const content = $("#predictionResultContent");

    if (!content) return;

    content.innerHTML = `
      <div class="prediction-loading">

        <div class="prediction-spinner"></div>

        <strong>Analyzing student academic information...</strong>

        <p>
          The information is being processed by the
          Decision Tree machine learning model.
        </p>

        <p>
          The server may take additional time to start.
          Please wait for the actual prediction result.
        </p>

      </div>
    `;
  }

  function renderPredictionError(message) {
    setPredictionResultStatus(
      "Prediction Failed",
      "danger"
    );

    const content = $("#predictionResultContent");

    if (!content) return;

    content.innerHTML = `
      <div class="prediction-error">

        <strong>Unable to generate a prediction.</strong>

        <p>${escapeHTML(message)}</p>

        <p>
          Your input has been retained. Please check
          the information or connection and try again.
          No prediction or student record was created
          from this unsuccessful request.
        </p>

      </div>
    `;
  }

  function resetPredictionResult() {
    setPredictionResultStatus(
      "Awaiting Input",
      "info"
    );

    const content = $("#predictionResultContent");

    if (!content) return;

    content.innerHTML = `
      <div class="prediction-result-placeholder">

        <p>
          <strong>No prediction available yet.</strong>
        </p>

        <p>
          Enter the student's academic information
          and submit the form to generate a prediction.
        </p>

      </div>
    `;
  }

  // ==================================================
  // INDIVIDUAL FACULTY PREDICTION
  // ==================================================

  predictionForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (individualPredictionLoading) {
      return;
    }

    if (!predictionForm.reportValidity()) {
      return;
    }

    let student;

    try {
      student = readPredictionForm();

    } catch (error) {
      renderPredictionError(error.message);
      return;
    }

    setPredictionLoading(true);
    renderPredictionLoading();

    try {
      // A single student is sent using the existing
      // batch endpoint and confirmed input field names.

      const results = await requestPredictions([student]);

      const result = results[0];

      student.mlPrediction = result.prediction;
      student.mlScore = result.score;
      student.mlScoreLabel = result.scoreLabel;

      student.status =
        result.prediction === "At Risk"
          ? "For Follow-up"
          : "Active";

      student.predictionDate = new Date().toISOString();

      const predictionRecord = {
        ...student,
        predictionId:++predictionSequence
      };

      // Latest result is used in Student Records.
      // Earlier results remain in Prediction History.

      const existingIndex = facultyStudents.findIndex(
        item =>
          item.id.toLowerCase() === student.id.toLowerCase()
      );

      if (existingIndex >= 0) {
        facultyStudents[existingIndex] = {
          ...predictionRecord
        };
      } else {
        facultyStudents.push({
          ...predictionRecord
        });
      }

      predictionHistory.unshift({
        ...predictionRecord
      });

      updateModelApiStatus(
        "online",
        "Faculty prediction successfully received from the model."
      );

      setRecordMode("faculty");

      renderPredictionResult(predictionRecord);
      renderPredictionHistory();

      showToast(
        `Prediction completed: ${result.prediction}.`
      );

    } catch (error) {
      console.error("Individual prediction failed:", error);

      updateModelApiStatus(
        "offline",
        error.message || "Prediction service unavailable."
      );

      renderPredictionError(
        error.message || "Unable to contact the prediction API."
      );

      showToast(
        "Prediction failed. Please try again."
      );

    } finally {
      setPredictionLoading(false);

      updateModelApiStatus(
        modelApiStatus,
        modelApiMessage
      );
    }
  });

  predictionForm?.addEventListener("reset", () => {
    if (!individualPredictionLoading) {
      resetPredictionResult();
    }
  });

  // ==================================================
  // ACTUAL PREDICTION RESULT DISPLAY
  // ==================================================

  function predictionDetail(label, value) {
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

    setPredictionResultStatus(
      "Prediction Completed",
      "success"
    );

    content.innerHTML = `
      <div class="prediction-result-status">

        <div>

          <span class="eyebrow">
            DECISION TREE CLASSIFICATION
          </span>

          <div class="prediction-result-classification ${
            isRisk
              ? "prediction-risk-text"
              : "prediction-safe-text"
          }">
            ${escapeHTML(record.mlPrediction)}
          </div>

        </div>

        <div>

          <div class="prediction-result-score ${
            isRisk
              ? "prediction-risk-text"
              : "prediction-safe-text"
          }">
            ${formatScore(record.mlScore)}
          </div>

          <span class="prediction-result-score-label">
            ${escapeHTML(record.mlScoreLabel)}
          </span>

        </div>

      </div>

      <div class="prediction-result-details">

        ${predictionDetail(
          "Student ID",
          record.id
        )}

        ${predictionDetail(
          "Student Name",
          record.name
        )}

        ${predictionDetail(
          "Previous GWA",
          Number(record.previousGwa).toFixed(2)
        )}

        ${predictionDetail(
          "Current GWA",
          Number(record.gwa).toFixed(2)
        )}

        ${predictionDetail(
          "Attendance Rate",
          `${record.attendance}%`
        )}

        ${predictionDetail(
          "Academic Progress",
          `${record.progress}%`
        )}

        ${predictionDetail(
          "Failed Subjects",
          record.failedSubjects
        )}

        ${predictionDetail(
          "GWA-based Standing",
          getStanding(record.gwa)
        )}

        ${predictionDetail(
          "Prediction Date",
          formatDate(record.predictionDate)
        )}

        ${predictionDetail(
          "Prediction Source",
          "Machine Learning API"
        )}

      </div>

      <div class="prediction-result-note">

        <strong>Suggested Faculty Action</strong>

        <p>
          ${
            isRisk
              ? "Review the student's academic performance and consider an appropriate consultation or academic support plan."
              : "Continue monitoring the student's academic performance and provide support when needed."
          }
        </p>

        <p>
          The result was returned by the trained
          Decision Tree model using the submitted
          academic information. It is not a definitive
          judgment or a calibrated forecast of future
          academic failure.
        </p>

        <p>
          This prediction is available during the
          current page session. Permanent database
          storage has not yet been implemented.
        </p>

      </div>

      <div class="prediction-result-actions">

        <button
          type="button"
          class="button button-outline"
          data-prediction-action="records"
        >
          View Student Records
        </button>

        <button
          type="button"
          class="button button-primary"
          data-prediction-action="new"
        >
          New Prediction
        </button>

      </div>
    `;
  }

  $("#predictionResultContent")?.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        "[data-prediction-action]"
      );

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
    }
  );

  // ==================================================
  // PREDICTION HISTORY
  // ==================================================

  function renderPredictionHistory() {
    const table = $("#predictionHistoryTable");

    setText(
      "#predictionHistoryCount",
      `${predictionHistory.length} ${
        predictionHistory.length === 1
          ? "record"
          : "records"
      }`
    );

    if (!table) return;

    if (!predictionHistory.length) {
      table.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="prediction-history-empty">
              No prediction history is available yet.
              Submit a student record to begin.
            </div>
          </td>
        </tr>
      `;

      return;
    }

    table.innerHTML = predictionHistory.map(record => `
      <tr>

        <td class="student-id">
          ${escapeHTML(record.id)}
        </td>

        <td>
          <span class="student-name">
            ${escapeHTML(record.name)}
          </span>
        </td>

        <td>
          <span class="ml-badge ${
            record.mlPrediction === "At Risk"
              ? "ml-risk"
              : "ml-safe"
          }">
            ${escapeHTML(record.mlPrediction)}
          </span>
        </td>

        <td>
          <strong>${formatScore(record.mlScore)}</strong>
          <small class="ml-score">
            ${escapeHTML(record.mlScoreLabel)}
          </small>
        </td>

        <td>
          ${escapeHTML(formatDate(record.predictionDate))}
        </td>

        <td>
          <button
            class="view-record"
            type="button"
            data-prediction-id="${record.predictionId}"
          >
            View
          </button>
        </td>

      </tr>
    `).join("");
  }

  $("#predictionHistoryTable")?.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        "[data-prediction-id]"
      );

      if (!button) return;

      const predictionId = Number(
        button.dataset.predictionId
      );

      const record = predictionHistory.find(
        item => item.predictionId === predictionId
      );

      if (record) {
        openStudentRecordDetails(
          record,
          "Student Prediction History"
        );
      }
    }
  );

  // ==================================================
  // STUDENT SUMMARY
  // ==================================================

  function renderStudentSummary() {
    const records = getActiveStudents();

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

    setText("#studentTotalCount", counts.total);
    setText("#excellentCount", counts.excellent);
    setText("#goodStandingCount", counts.good);
    setText("#monitoringCount", counts.monitoring);
    setText("#studentRiskCount", counts.risk);
  }

  // ==================================================
  // STUDENT RECORDS TABLE
  // ==================================================

  function renderStudents() {
    const query = (
      $("#studentSearch")?.value || ""
    ).trim().toLowerCase();

    const year =
      $("#studentYearFilter")?.value || "all";

    const standingFilter =
      $("#studentStandingFilter")?.value || "all";

    const filtered = getActiveStudents().filter(student => {
      const standing = getStanding(student.gwa);

      const matchesQuery = [
        student.id,
        student.name,
        student.program,
        student.year
      ].join(" ").toLowerCase().includes(query);

      return (
        matchesQuery &&
        (
          recordMode === "faculty" ||
          year === "all" ||
          student.year === year
        ) &&
        (
          standingFilter === "all" ||
          standing === standingFilter
        )
      );
    });

    const tbody = $("#studentTable");

    if (!tbody) return;

    setText(
      "#studentResultCount",
      `${filtered.length} ${
        filtered.length === 1 ? "record" : "records"
      } · ${getSourceLabel()}`
    );

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-row">
            ${
              recordMode === "faculty" &&
              facultyStudents.length === 0
                ? "No faculty-entered records yet. Submit a student prediction to create a record."
                : "No student records match your search or filters."
            }
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML = filtered.map(student => {
      const standing = getStanding(student.gwa);

      const statusClass =
        student.status === "Active"
          ? ""
          : "follow-up";

      return `
        <tr>

          <td class="student-id">
            ${escapeHTML(student.id)}
          </td>

          <td>
            <span class="student-name">
              ${escapeHTML(student.name)}
            </span>
          </td>

          <td>${escapeHTML(student.program)}</td>

          <td>${escapeHTML(student.year)}</td>

          <td>
            <strong>
              ${Number(student.gwa).toFixed(2)}
            </strong>
          </td>

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

          <td>
            ${getMLBadge(student)}
          </td>

          <td>
            <button
              class="view-record"
              type="button"
              data-student-id="${escapeHTML(student.id)}"
            >
              View
            </button>
          </td>

        </tr>
      `;
    }).join("");
  }

  function openStudentRecord(studentId) {
    const student = getActiveStudents().find(
      item => item.id === studentId
    );

    if (!student) return;

    openStudentRecordDetails(
      student,
      "Student Academic Record"
    );
  }

  function openStudentRecordDetails(
    student,
    title = "Student Academic Record"
  ) {
    const modalBody = $("#modalBody");

    if (!modalBody) return;

    setText("#modalTitle", title);

    const standing = getStanding(student.gwa);

    const details = [
      ["Student Name",student.name],
      ["Student ID",student.id],
      ["Program",student.program],
      ["Year Level",student.year],
      ["Previous GWA",Number(student.previousGwa).toFixed(2)],
      ["Current GWA",Number(student.gwa).toFixed(2)],
      ["Academic Standing",standing],
      ["Attendance Rate",`${student.attendance}%`],
      ["Academic Progress",`${student.progress}%`],
      ["Failed Subjects",student.failedSubjects],
      ["Record Status",student.status],
      ["Data Source",student.source === "faculty"
        ? "Faculty-entered"
        : "Demonstration"]
    ];

    modalBody.innerHTML = `
      <div class="student-detail-grid">

        ${details.map(([label,value]) => `
          <div class="detail-cell">
            <span>${escapeHTML(label)}</span>
            <strong>${escapeHTML(value)}</strong>
          </div>
        `).join("")}

        <div class="detail-cell">

          <span>Machine Learning Prediction</span>

          <strong>
            ${getMLBadge(student)}
          </strong>

        </div>

        ${
          student.predictionDate
            ? `
              <div class="detail-cell">
                <span>Prediction Date</span>
                <strong>
                  ${escapeHTML(formatDate(student.predictionDate))}
                </strong>
              </div>
            `
            : ""
        }

      </div>

      <div class="detail-note">

        <strong>Academic Decision Support</strong>

        <p>
          The GWA-based academic standing and
          machine learning classification are
          separate academic indicators.
        </p>

        <p>
          ${
            student.source === "demonstration"
              ? "This student record contains synthetic demonstration information."
              : "This record contains academic information submitted by the faculty member during the current session."
          }
        </p>

        <p>
          ML predictions must be reviewed by faculty
          before academic interventions are decided.
        </p>

        <div class="prediction-result-actions">

          <button
            type="button"
            class="button button-primary"
            id="predictSelectedStudentBtn"
          >
            Use Student Data for Prediction
          </button>

        </div>

      </div>
    `;

    $("#modalBackdrop")?.classList.remove("hidden");

    $("#predictSelectedStudentBtn")?.addEventListener(
      "click",
      () => {
        if (individualPredictionLoading) {
          showToast(
            "An individual prediction is already running."
          );
          return;
        }

        fillPredictionForm(student);
        closeModal();
        showPage("prediction");
      }
    );
  }

  function fillPredictionForm(student) {
    const fields = {
      predictionStudentId:student.id,
      predictionStudentName:student.name,
      predictionPreviousGwa:student.previousGwa,
      predictionCurrentGwa:student.gwa,
      predictionAttendance:student.attendance,
      predictionProgress:student.progress,
      predictionFailedSubjects:student.failedSubjects
    };

    Object.entries(fields).forEach(([id,value]) => {
      const input = document.getElementById(id);

      if (input) {
        input.value = value ?? "";
      }
    });

    resetPredictionResult();

    showToast(
      student.source === "demonstration"
        ? "Sample values loaded. Replace them with verified academic information before submission."
        : "Student academic information loaded."
    );
  }

  $("#studentTable")?.addEventListener("click", event => {
    const button = event.target.closest(
      "[data-student-id]"
    );

    if (button) {
      openStudentRecord(button.dataset.studentId);
    }
  });

  [
    "#studentSearch",
    "#studentYearFilter",
    "#studentStandingFilter"
  ].forEach(selector => {
    $(selector)?.addEventListener(
      "input",
      renderStudents
    );

    $(selector)?.addEventListener(
      "change",
      renderStudents
    );
  });

  // ==================================================
  // CLASS RECORDS
  // ==================================================

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
            <span class="status-pill success">
              ${escapeHTML(item.status)}
            </span>
          </td>
        </tr>
      `).join("");
    }

    const miniClassList = $("#miniClassList");

    if (miniClassList) {
      miniClassList.innerHTML = classes.map(item => `
        <div class="mini-class-item">

          <div>
            <strong>
              ${escapeHTML(item.code)} · ${escapeHTML(item.name)}
            </strong>

            <small>
              ${escapeHTML(item.section)} · ${item.students} students
            </small>
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
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
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
  }

  // ==================================================
  // ACADEMIC ALERTS
  // ==================================================

  let alerts = [];
  const reviewedAlerts = new Set();

  function buildAlerts() {
    const records = getActiveStudents();

    const riskStudents = records.filter(student =>
      recordMode === "faculty"
        ? student.mlPrediction === "At Risk"
        : student.gwa > 2.75
    );

    const attendanceStudents = records.filter(student =>
      student.attendance < 80
    );

    const nextAlerts = [];

    if (riskStudents.length) {
      nextAlerts.push({
        id:`${recordMode}-risk-${riskStudents.length}`,
        title:"Student Academic Risk",
        description:
          recordMode === "faculty"
            ? `${riskStudents.length} faculty-entered students were classified At Risk by the Decision Tree model.`
            : `${riskStudents.length} demonstration students have a GWA above 2.75.`,
        type:"Urgent",
        date:getSourceLabel(),
        actionLabel:"Review Student Records",
        target:"students",
        filter:
          recordMode === "faculty"
            ? "all"
            : "At Risk"
      });
    }

    if (attendanceStudents.length) {
      nextAlerts.push({
        id:`${recordMode}-attendance-${attendanceStudents.length}`,
        title:"Student Attendance Concern",
        description:
          `${attendanceStudents.length} students have attendance below 80% and may require follow-up.`,
        type:"Student Concern",
        date:getSourceLabel(),
        actionLabel:"Review Student Records",
        target:"students",
        filter:"all"
      });
    }

    nextAlerts.push({
      id:"sete",
      title:"Teaching Evaluation Summary",
      description:
        "The illustrative SETE rating is 4.28 out of 5. Review the evaluation results.",
      type:"Reminder",
      date:"Illustrative evaluation summary",
      actionLabel:"View Teaching Evaluation",
      target:"evaluation",
      filter:"all"
    });

    alerts = nextAlerts.map(alert => ({
      ...alert,
      open:!reviewedAlerts.has(alert.id)
    }));
  }

  function renderAlerts() {
    const openAlerts = alerts.filter(alert => alert.open);

    setText("#alertTotal", openAlerts.length);

    const alertNavCount = $("#alertNavCount");

    if (alertNavCount) {
      alertNavCount.textContent = openAlerts.length;

      alertNavCount.classList.toggle(
        "hidden",
        openAlerts.length === 0
      );
    }

    const summaryItems = $$(".alert-summary > div");

    if (summaryItems[1]) {
      const strong =
        summaryItems[1].querySelector("strong");

      const span =
        summaryItems[1].querySelector("span");

      if (strong) {
        strong.textContent = openAlerts.filter(
          alert => alert.type === "Urgent"
        ).length;
      }

      if (span) {
        span.textContent = "Urgent alerts";
      }
    }

    if (summaryItems[2]) {
      const strong =
        summaryItems[2].querySelector("strong");

      if (strong) {
        strong.textContent = openAlerts.filter(
          alert => alert.type === "Student Concern"
        ).length;
      }
    }

    const fullAlertList = $("#fullAlertList");

    if (fullAlertList) {
      fullAlertList.innerHTML = openAlerts.length
        ? openAlerts.map(alert => `
          <div class="alert-item">

            <div class="alert-content">

              <strong>
                ${escapeHTML(alert.title)}
              </strong>

              <p>
                ${escapeHTML(alert.description)}
              </p>

              <p>
                ${escapeHTML(alert.date)}
              </p>

              <button
                class="text-button alert-action"
                data-alert-target="${escapeHTML(alert.target)}"
                data-alert-filter="${escapeHTML(alert.filter)}"
              >
                ${escapeHTML(alert.actionLabel)} →
              </button>

            </div>

            <span class="status-pill ${
              alert.type === "Urgent"
                ? "danger"
                : alert.type === "Reminder"
                  ? "info"
                  : "warning"
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

            <strong>
              ${escapeHTML(alert.title)}
            </strong>

            ${escapeHTML(alert.description)}

          </div>
        `).join("")
        : `
          <div class="notification-item">
            No new notifications.
          </div>
        `;
    }

    const dot = $("#notificationDot");

    if (dot) {
      dot.classList.toggle(
        "hidden",
        notificationsRead || !openAlerts.length
      );

      dot.textContent = openAlerts.length;
    }
  }

  $("#fullAlertList")?.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        "[data-alert-target]"
      );

      if (!button) return;

      const target = button.dataset.alertTarget;
      const filter = button.dataset.alertFilter;

      if (target === "students") {
        if ($("#studentSearch")) {
          $("#studentSearch").value = "";
        }

        if ($("#studentYearFilter")) {
          $("#studentYearFilter").value = "all";
        }

        if ($("#studentStandingFilter")) {
          $("#studentStandingFilter").value =
            filter || "all";
        }

        renderStudents();
      }

      showPage(target);
    }
  );

  $("#clearAlertsBtn")?.addEventListener(
    "click",
    () => {
      alerts.forEach(alert => {
        reviewedAlerts.add(alert.id);
      });

      buildAlerts();
      renderAlerts();

      showToast("All alerts marked as reviewed.");
    }
  );

  $("#markReadBtn")?.addEventListener(
    "click",
    () => {
      notificationsRead = true;

      renderNotifications();

      showToast("Notifications marked as read.");
    }
  );

  $("#notificationBtn")?.addEventListener(
    "click",
    () => {
      $("#notificationPopover")?.classList.toggle("hidden");
    }
  );

  document.addEventListener("click", event => {
    if (!event.target.closest(".notification-wrap")) {
      $("#notificationPopover")?.classList.add("hidden");
    }
  });

  // ==================================================
  // MODALS AND NAVIGATION
  // ==================================================

  function closeModal() {
    $("#modalBackdrop")?.classList.add("hidden");
  }

  $("#modalClose")?.addEventListener(
    "click",
    closeModal
  );

  $("#modalCancel")?.addEventListener(
    "click",
    closeModal
  );

  $("#modalBackdrop")?.addEventListener(
    "click",
    event => {
      if (event.target === $("#modalBackdrop")) {
        closeModal();
      }
    }
  );

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();

      $("#notificationPopover")?.classList.add("hidden");
    }
  });

  function showPage(pageName) {
    const target = document.getElementById(
      `page-${pageName}`
    );

    if (!target) return;

    $$(".page").forEach(page => {
      page.classList.remove("active");
    });

    target.classList.add("active");

    $$(".nav-link[data-page]").forEach(link => {
      link.classList.toggle(
        "active",
        link.dataset.page === pageName
      );
    });

    $("#sidebar")?.classList.remove("open");

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
      renderDashboardCharts();
      updateMLRiskChart();
    }

    if (pageName === "students") {
      renderStudentSummary();
      renderStudents();
    }

    if (pageName === "prediction") {
      renderPredictionHistory();
    }

    if (pageName === "analytics") {
      renderAnalyticsCharts();
    }

    if (pageName === "evaluation") {
      renderEvaluationCharts();
    }
  }

  $$(".nav-link[data-page]").forEach(link => {
    link.addEventListener(
      "click",
      () => showPage(link.dataset.page)
    );
  });

  $$("[data-go]").forEach(button => {
    button.addEventListener(
      "click",
      () => showPage(button.dataset.go)
    );
  });

  $("#menuToggle")?.addEventListener(
    "click",
    () => {
      $("#sidebar")?.classList.toggle("open");
    }
  );

  $("#profileTrigger")?.addEventListener(
    "click",
    () => showPage("profile")
  );

  $("#signOutBtn")?.addEventListener(
    "click",
    () => {
      if (individualPredictionLoading) {
        showToast(
          "Please wait for the current prediction to finish."
        );
        return;
      }

      if (
        confirm(
          "Sign out of the demonstration portal? Temporary faculty-entered records will be cleared."
        )
      ) {
        facultyStudents.length = 0;
        predictionHistory = [];
        predictionSequence = 0;

        predictionForm?.reset();

        resetPredictionResult();
        renderPredictionHistory();

        setRecordMode("demonstration");
        showPage("overview");

        showToast(
          "Temporary faculty records cleared. This is a demonstration portal."
        );
      }
    }
  );

  $("#globalSearch")?.addEventListener(
    "keydown",
    event => {
      if (event.key !== "Enter") return;

      const query = event.target.value.trim();

      if (!query) return;

      if ($("#studentSearch")) {
        $("#studentSearch").value = query;
      }

      if ($("#studentYearFilter")) {
        $("#studentYearFilter").value = "all";
      }

      if ($("#studentStandingFilter")) {
        $("#studentStandingFilter").value = "all";
      }

      renderStudents();
      showPage("students");
    }
  );

  // ==================================================
  // DASHBOARD FILTER EVENTS
  // ==================================================

  function updateDashboardFilters() {
    const year =
      $("#yearFilter")?.value || "all";

    const semester =
      $("#semesterFilter")?.value || "all";

    const yearLabel =
      year === "all"
        ? "All Academic Years"
        : year;

    const semesterLabel =
      semester === "all"
        ? "Both Semesters"
        : semester === "1"
          ? "1st Semester"
          : "2nd Semester";

    setText(
      "#lastUpdated",
      recordMode === "faculty"
        ? "Showing faculty-entered session records"
        : `Demonstration · ${yearLabel} · ${semesterLabel}`
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

  $("#yearFilter")?.addEventListener(
    "change",
    updateDashboardFilters
  );

  $("#semesterFilter")?.addEventListener(
    "change",
    updateDashboardFilters
  );

  $("#resetFilters")?.addEventListener(
    "click",
    () => {
      if ($("#yearFilter")) {
        $("#yearFilter").value = "2025-2026";
      }

      if ($("#semesterFilter")) {
        $("#semesterFilter").value = "all";
      }

      updateDashboardFilters();

      showToast("Dashboard filters have been reset.");
    }
  );

  // ==================================================
  // CHART.JS UTILITIES
  // ==================================================

  function chartAvailable() {
    return typeof Chart !== "undefined";
  }

  function chartTextColor() {
    return getComputedStyle(document.body)
      .getPropertyValue("--muted")
      .trim() || "#a4b0b6";
  }

  function baseChartOptions() {
    return {
      responsive:true,
      maintainAspectRatio:false,
      animation:{duration:450},

      plugins:{
        legend:{
          labels:{
            color:chartTextColor(),
            font:{
              family:"Inter",
              size:10
            }
          }
        }
      },

      scales:{
        x:{
          ticks:{
            color:chartTextColor(),
            font:{
              family:"Inter",
              size:9
            }
          },
          grid:{
            color:"rgba(150,160,165,.10)"
          }
        },

        y:{
          ticks:{
            color:chartTextColor(),
            font:{
              family:"Inter",
              size:9
            }
          },
          grid:{
            color:"rgba(150,160,165,.10)"
          }
        }
      }
    };
  }

  function createChart(id, config) {
    if (!chartAvailable()) return;

    const canvas = document.getElementById(id);

    if (!canvas) return;

    if (chartInstances[id]) {
      chartInstances[id].destroy();
      delete chartInstances[id];
    }

    const context = canvas.getContext("2d");

    if (!context) return;

    chartInstances[id] = new Chart(context,config);
  }

  function resizePageCharts(pageId) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const page = document.getElementById(
          `page-${pageId}`
        );

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
        records.filter(student =>
          getStanding(student.gwa) === category
        ).length
      )
    };
  }

  function getAttendanceDistribution() {
    const records = getDashboardStudents();

    return {
      labels:[
        "Below 70%",
        "70–79%",
        "80–89%",
        "90–100%"
      ],

      counts:[
        records.filter(student =>
          student.attendance < 70
        ).length,

        records.filter(student =>
          student.attendance >= 70 &&
          student.attendance < 80
        ).length,

        records.filter(student =>
          student.attendance >= 80 &&
          student.attendance < 90
        ).length,

        records.filter(student =>
          student.attendance >= 90 &&
          student.attendance <= 100
        ).length
      ]
    };
  }

  function distributionTooltip(context) {
    const total = context.dataset.data.reduce(
      (sum,value) => sum + Number(value),
      0
    );

    const percentage = getPercentage(
      Number(context.raw),
      total
    );

    return ` ${context.label}: ${context.raw} students (${percentage.toFixed(1)}%)`;
  }

  // ==================================================
  // OVERVIEW CHARTS
  // ==================================================

  function renderDashboardCharts() {
    updateMLRiskChart();

    if (!chartAvailable()) return;

    createChart("performanceChart", {
      type:"line",

      data:{
        labels:[
          "2023–2024",
          "1st Sem 2024–2025",
          "2nd Sem 2024–2025",
          "1st Sem 2025–2026"
        ],

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

        plugins:{
          legend:{display:false}
        },

        scales:{
          y:{
            min:70,
            max:100,

            ticks:{
              color:chartTextColor(),
              callback:value => value + "%"
            },

            grid:{
              color:"rgba(150,160,165,.10)"
            }
          },

          x:{
            ticks:{color:chartTextColor()},
            grid:{display:false}
          }
        }
      }
    });

    createChart("seteChart", {
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
            "#188b45",
            "#168fa0",
            "#398bb6"
          ],
          borderWidth:0,
          hoverOffset:5
        }]
      },

      options:{
        responsive:true,
        maintainAspectRatio:false,
        cutout:"76%",
        plugins:{
          legend:{display:false}
        }
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
          backgroundColor:[
            "#188b45",
            "#168fa0",
            "#c99539",
            "#d92332"
          ],
          borderColor:
            getComputedStyle(document.body)
              .getPropertyValue("--surface")
              .trim() || "#222b32",
          borderWidth:3,
          hoverOffset:9,
          spacing:2
        }]
      },

      options:{
        responsive:true,
        maintainAspectRatio:false,
        cutout:"62%",

        animation:{
          animateRotate:true,
          animateScale:true,
          duration:650
        },

        plugins:{
          legend:{
            position:"bottom",

            labels:{
              color:chartTextColor(),
              padding:14,
              usePointStyle:true,
              pointStyle:"circle",

              font:{
                family:"Inter",
                size:9
              }
            }
          },

          tooltip:{
            callbacks:{
              label:distributionTooltip
            }
          }
        }
      }
    });

    const attendanceDistribution =
      getAttendanceDistribution();

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

            grid:{
              color:"rgba(150,160,165,.10)"
            },

            angleLines:{
              color:"rgba(150,160,165,.10)"
            }
          }
        },

        plugins:{
          legend:{
            position:"bottom",

            labels:{
              color:chartTextColor(),
              padding:13,
              usePointStyle:true,
              pointStyle:"circle",

              font:{
                family:"Inter",
                size:9
              }
            }
          },

          tooltip:{
            callbacks:{
              label:distributionTooltip
            }
          }
        }
      }
    });

    const chartNote = $(
      "#gwaDistributionChart"
    )?.closest(".panel")?.querySelector(
      ".overview-chart-note"
    );

    if (chartNote) {
      chartNote.textContent =
        `GWA-based academic standing. Values are based on ${getSourceLabel().toLowerCase()}.`;
    }

    resizePageCharts("overview");
  }

  // ==================================================
  // ACADEMIC ANALYTICS CHARTS
  // ==================================================

  function renderAnalyticsCharts() {
    if (!chartAvailable()) return;

    createChart("passingTrendChart", {
      type:"line",

      data:{
        labels:[
          "2023–2024",
          "1st Sem 2024–2025",
          "2nd Sem 2024–2025",
          "1st Sem 2025–2026"
        ],

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

            ticks:{
              color:chartTextColor(),
              callback:value => value + "%"
            },

            grid:{
              color:"rgba(150,160,165,.10)"
            }
          },

          x:{
            ticks:{
              color:chartTextColor()
            },

            grid:{
              display:false
            }
          }
        }
      }
    });

    const records = getDashboardStudents();

    createChart("gradeChart", {
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
            records.filter(student =>
              student.gwa <= 1.50
            ).length,

            records.filter(student =>
              student.gwa > 1.50 &&
              student.gwa <= 2.00
            ).length,

            records.filter(student =>
              student.gwa > 2.00 &&
              student.gwa <= 2.25
            ).length,

            records.filter(student =>
              student.gwa > 2.25 &&
              student.gwa <= 2.75
            ).length,

            records.filter(student =>
              student.gwa > 2.75
            ).length
          ],

          backgroundColor:[
            "#188b45",
            "#168fa0",
            "#398bb6",
            "#c99539",
            "#d92332"
          ],

          borderRadius:5,
          maxBarThickness:42
        }]
      },

      options:{
        ...baseChartOptions(),

        plugins:{
          legend:{display:false}
        },

        scales:{
          y:{
            beginAtZero:true,

            ticks:{
              color:chartTextColor(),
              precision:0
            },

            grid:{
              color:"rgba(150,160,165,.10)"
            }
          },

          x:{
            ticks:{
              color:chartTextColor(),
              maxRotation:0,
              minRotation:0
            },

            grid:{
              display:false
            }
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

          backgroundColor:[
            "#168fa0",
            "#398bb6",
            "#188b45",
            "#d1a34c",
            "#168fa0",
            "#398bb6"
          ],

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
              label:context =>
                ` Illustrative Passing Rate: ${context.raw}%`
            }
          }
        },

        scales:{
          x:{
            min:0,
            max:100,

            ticks:{
              color:chartTextColor(),
              callback:value => value + "%",
              stepSize:20
            },

            grid:{
              color:"rgba(150,160,165,.10)"
            }
          },

          y:{
            ticks:{
              color:chartTextColor(),

              font:{
                family:"Inter",
                size:11,
                weight:"600"
              }
            },

            grid:{
              display:false
            }
          }
        }
      }
    });

    resizePageCharts("analytics");
  }

  // ==================================================
  // TEACHING EVALUATION CHARTS
  // ==================================================

  function renderEvaluationCharts() {
    if (!chartAvailable()) return;

    createChart("dimensionChart", {
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
          label:"Illustrative Average Rating",
          data:[4.4,4.3,4.2,4.25,4.35],

          backgroundColor:[
            "#168fa0",
            "#398bb6",
            "#188b45",
            "#168fa0",
            "#398bb6"
          ],

          borderRadius:5,
          maxBarThickness:38
        }]
      },

      options:{
        ...baseChartOptions(),

        plugins:{
          legend:{display:false}
        },

        scales:{
          y:{
            min:0,
            max:5,

            ticks:{
              color:chartTextColor(),
              stepSize:1
            },

            grid:{
              color:"rgba(150,160,165,.10)"
            }
          },

          x:{
            ticks:{
              color:chartTextColor(),
              font:{size:8}
            },

            grid:{
              display:false
            }
          }
        }
      }
    });

    createChart("evaluationChart", {
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
            "#188b45",
            "#168fa0",
            "#398bb6"
          ],

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

            labels:{
              color:chartTextColor(),
              padding:15,
              font:{size:9}
            }
          }
        }
      }
    });

    resizePageCharts("evaluation");
  }

  // ==================================================
  // REFRESH ALL ACADEMIC VIEWS
  // ==================================================

  function refreshAcademicViews() {
    renderStudentSummary();
    renderStudents();

    buildAlerts();

    notificationsRead = false;

    renderAlerts();
    refreshMLOverview();
    updateDashboardFilters();
    updateMLRiskChart();
  }

  // ==================================================
  // PROFILE AND THEME SETTINGS
  // ==================================================

  let savedProfile = {};

  try {
    savedProfile = JSON.parse(
      localStorage.getItem("bsunisyncProfile") || "{}"
    ) || {};

  } catch (error) {
    savedProfile = {};

    console.warn(
      "Unable to read profile settings.",
      error
    );
  }

  const initialName =
    typeof savedProfile.name === "string"
      ? savedProfile.name
      : "Faculty Member";

  function updateFacultyName(name) {
    const cleanName =
      String(name || "").trim() || "Faculty Member";

    setText("#welcomeName",cleanName);
    setText("#topFacultyName",cleanName);
    setText("#profileNameHeading",cleanName);

    setText(
      ".profile-trigger .avatar",
      getInitials(cleanName)
    );

    setText(
      ".profile-large .avatar",
      getInitials(cleanName)
    );
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

  function refreshActiveCharts() {
    const pageName = $(".page.active")?.id.replace(
      "page-",
      ""
    );

    if (pageName === "overview") {
      renderDashboardCharts();
    }

    if (pageName === "analytics") {
      renderAnalyticsCharts();
    }

    if (pageName === "evaluation") {
      renderEvaluationCharts();
    }
  }

  $("#profileForm")?.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      const name =
        $("#facultyName")?.value.trim() ||
        "Faculty Member";

      const theme =
        $("#themeSelect")?.value || "dark";

      let storageSaved = true;

      try {
        localStorage.setItem(
          "bsunisyncProfile",
          JSON.stringify({
            name,
            theme
          })
        );

      } catch (error) {
        storageSaved = false;
      }

      updateFacultyName(name);

      document.body.classList.toggle(
        "light-theme",
        theme === "light"
      );

      refreshActiveCharts();

      showToast(
        storageSaved
          ? "Profile and settings saved successfully."
          : "Settings applied for this page. Browser storage is unavailable."
      );
    }
  );

  $("#themeSelect")?.addEventListener(
    "change",
    event => {
      document.body.classList.toggle(
        "light-theme",
        event.target.value === "light"
      );

      refreshActiveCharts();
    }
  );

  $("#printSchedule")?.addEventListener(
    "click",
    () => window.print()
  );

  // ==================================================
  // INITIALIZE APPLICATION
  // ==================================================

  initializeRecordMode();
  addMLInterface();

  renderClasses();
  renderSchedule();
  renderPredictionHistory();

  resetPredictionResult();

  const predictionFormNote =
    $(".prediction-form-note");

  if (predictionFormNote) {
    predictionFormNote.innerHTML = `
      <strong>Model Input:</strong>
      The Decision Tree model uses Previous GWA,
      Current GWA, Attendance Rate, Academic Progress,
      and Failed Subjects.

      Student ID and name identify the temporary
      browser record and are not submitted to the API.

      <p>
        Use fictional or authorized academic information
        while testing this demonstration portal.
      </p>
    `;
  }

  const predictionHistoryNote =
    $(".prediction-history-panel .overview-chart-note");

  if (predictionHistoryNote) {
    predictionHistoryNote.textContent =
      "Prediction history is available during the current page session. Refreshing or closing the page clears temporary faculty-entered records. Permanent database storage is not yet implemented.";
  }

  const performanceDescription =
    $("#performanceChart")
      ?.closest(".panel")
      ?.querySelector(".panel-header p");

  if (performanceDescription) {
    performanceDescription.textContent =
      "Illustrative student performance across recent terms";
  }

  const gradeDescription =
    $("#gradeChart")
      ?.closest(".panel")
      ?.querySelector(".panel-header p");

  if (gradeDescription) {
    gradeDescription.textContent =
      "Distribution of records from the selected data source";
  }

  setRecordMode("demonstration");

  runBatchPredictions();

  // ==================================================
  // WINDOW AND PAGE EVENTS
  // ==================================================

  window.addEventListener("resize", () => {
    Object.values(chartInstances).forEach(chart => {
      if (chart) {
        chart.resize();
      }
    });
  });

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) return;

      refreshActiveCharts();
      updateMLRiskChart();
    }
  );

});
