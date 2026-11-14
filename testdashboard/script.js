/* LIVE DATE AND TIME */

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


/* RANDOM DATA GENERATOR */

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}


/* GENERATE SAMPLE DEPARTMENT DATA */

function generateDepartmentData() {

    return {
        teachingLoad: randomNumber(12, 24),
        classes: randomNumber(4, 8),
        students: randomNumber(35, 120),
        sete: randomDecimal(3.50, 4.95),
        pending: randomNumber(0, 8),
        response: randomNumber(55, 100)
    };

}


/* RANDOMIZED DATA FOR EACH DEPARTMENT */

const departmentData = {
    all: generateDepartmentData(),
    it: generateDepartmentData(),
    ba: generateDepartmentData(),
    cs: generateDepartmentData()
};


/* DISPLAY KPI DATA */

function updateKPIs(data) {

    document.getElementById("teachingLoad").textContent =
        data.teachingLoad + " Units";

    document.getElementById("classes").textContent =
        data.classes + " assigned classes";

    document.getElementById("students").textContent =
        data.students;

    document.getElementById("sete").textContent =
        data.sete + " / 5";

    document.getElementById("pending").textContent =
        data.pending;

    document.getElementById("response").textContent =
        data.response + "%";

}


/* INITIALIZE RANDOM KPI DATA */

updateKPIs(departmentData.all);


/* DEPARTMENT FILTER */

document.getElementById("department")
    .addEventListener("change", function() {

        const selectedDepartment = this.value;
        const data = departmentData[selectedDepartment];

        updateKPIs(data);

    });


/* RESET FILTERS */

function resetFilters() {

    document.getElementById("year").selectedIndex = 0;

    document.getElementById("semester").selectedIndex = 0;

    document.getElementById("department").value = "all";

    updateKPIs(departmentData.all);

}