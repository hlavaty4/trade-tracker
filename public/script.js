let currentDate = new Date();
let results = {};

let isEditable = true;
const ADMIN_PASSWORD = "traderlock";

// 🔄 Load all results from the server
async function fetchResultsFromServer() {
  try {
    const res = await fetch("/api/results");
    const data = await res.json();
    results = {};
    data.forEach((item) => {
      results[item.date] = item.value;
    });
    generateCalendar();
  } catch (err) {
    console.error("Error loading results from server:", err);
  }
}

// 📤 Save result to the server
async function saveResultToServer(date, value) {
  try {
    await fetch("/api/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, value }),
    });
  } catch (err) {
    console.error("Error saving result:", err);
  }
}

function updateWinRate() {
  const monthResults = Object.keys(results)
    .filter((key) => {
      const [year, month] = key.split("-");
      return (
        parseInt(year) === currentDate.getFullYear() &&
        parseInt(month) === currentDate.getMonth() + 1
      );
    })
    .map((key) => results[key]);

  const winRateElement = document.getElementById("winRate");

  if (monthResults.length === 0) {
    winRateElement.textContent = "Win Rate: 0% (0/0)";
    winRateElement.classList.remove("win-rate-profit", "win-rate-loss");
    updateSpreads(0, 0);
    return;
  }

  let totalWins = 0;
  let totalTries = 0;

  monthResults.forEach((result) => {
    const wins = parseInt(result?.[0] || 0);
    if (!isNaN(wins)) {
      totalWins += wins;
      totalTries += 3;
    }
  });

  const winRate =
    totalTries > 0 ? ((totalWins / totalTries) * 100).toFixed(1) : 0;
  winRateElement.textContent = `Win Rate: ${winRate}% (${totalWins}/${totalTries})`;
  winRateElement.classList.remove("win-rate-profit", "win-rate-loss");
  if (winRate > 50) winRateElement.classList.add("win-rate-profit");
  else if (winRate < 50) winRateElement.classList.add("win-rate-loss");

  updateSpreads(totalWins, totalTries);
}

function updateSpreads(totalWins, totalTries) {
  const nextDayTries = totalTries + 3;
  const nextDayOutcomes = [
    (((totalWins + 3) / nextDayTries) * 100).toFixed(1),
    (((totalWins + 2) / nextDayTries) * 100).toFixed(1),
    (((totalWins + 1) / nextDayTries) * 100).toFixed(1),
    ((totalWins / nextDayTries) * 100).toFixed(1),
  ];
  document.getElementById(
    "spread-3-3"
  ).textContent = `3/3: ${nextDayOutcomes[0]}%`;
  document.getElementById(
    "spread-2-3"
  ).textContent = `2/3: ${nextDayOutcomes[1]}%`;
  document.getElementById(
    "spread-1-3"
  ).textContent = `1/3: ${nextDayOutcomes[2]}%`;
  document.getElementById(
    "spread-0-3"
  ).textContent = `0/3: ${nextDayOutcomes[3]}%`;
}

function generateCalendar() {
  document.getElementById("monthYear").textContent = currentDate.toLocaleString(
    "default",
    {
      month: "long",
      year: "numeric",
    }
  );

  const today = new Date();
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const lastDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const tbody = document.getElementById("calendarBody");
  tbody.innerHTML = "";

  const frag = document.createDocumentFragment();

  let date = 1;
  let rowsNeeded = Math.ceil((firstDay.getDay() + lastDay.getDate()) / 7);

  for (let i = 0; i < rowsNeeded; i++) {
    const row = document.createElement("tr");

    for (let j = 0; j < 7; j++) {
      const cell = document.createElement("td");
      cell.className = "day-cell";

      if ((i === 0 && j < firstDay.getDay()) || date > lastDay.getDate()) {
        cell.classList.add("non-month-day");
      } else {
        const dayKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${date}`;
        const isWeekend = j === 0 || j === 6;
        cell.classList.add(isWeekend ? "non-month-day" : "month-day");

        const dayNumber = document.createElement("span");
        dayNumber.className = "day-number";
        dayNumber.textContent = date;

        const isToday =
          today.getFullYear() === currentDate.getFullYear() &&
          today.getMonth() === currentDate.getMonth() &&
          today.getDate() === date;

        if (isToday) {
          dayNumber.style.color = "#00ffff";
          dayNumber.style.fontWeight = "bold";
        }

        cell.appendChild(dayNumber);

        if (!isWeekend) {
          const select = document.createElement("select");
          select.innerHTML = `
              <option value="">-</option>
              <option value="0-3">0/3</option>
              <option value="1-3">1/3</option>
              <option value="2-3">2/3</option>
              <option value="3-3">3/3</option>
          `;
          select.value = results[dayKey] || "";
          select.disabled = !isEditable;

          if (select.value === "3-3") select.classList.add("green");
          else if (select.value === "0-3") select.classList.add("red");

          select.addEventListener("change", function () {
            if (this.value) {
              results[dayKey] = this.value;
              saveResultToServer(dayKey, this.value);
            } else {
              delete results[dayKey];
              saveResultToServer(dayKey, "");
            }

            select.classList.remove("green", "red");
            if (this.value === "3-3") select.classList.add("green");
            else if (this.value === "0-3") select.classList.add("red");

            updateWinRate();
          });

          cell.appendChild(select);
        }

        date++;
      }

      row.appendChild(cell);
    }

    frag.appendChild(row);
  }

  tbody.appendChild(frag);
  updateWinRate();
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  generateCalendar();
}

// 🍔 Hamburger menu toggle
document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("menu").classList.toggle("show");
});

// 🔒 Lock/Unlock button
document.getElementById("lockToggle").addEventListener("click", () => {
  const lockBtn = document.getElementById("lockToggle");

  if (!isEditable) {
    const input = prompt("Enter password to unlock:");
    if (input === ADMIN_PASSWORD) {
      isEditable = true;
      lockBtn.textContent = "🔓 Unlocked";
      lockBtn.classList.add("unlocked");
      enableEditing(true);
    } else {
      alert("Incorrect password.");
    }
  } else {
    isEditable = false;
    lockBtn.textContent = "🔒 Locked";
    lockBtn.classList.remove("unlocked");
    enableEditing(false);
  }
});

// 🧹 Clear Month button
document.getElementById("Clear").addEventListener("click", async () => {
  if (!isEditable) {
    alert("Unlock the calendar first to clear this month's results.");
    return;
  }

  const confirmClear = confirm("Are you sure you want to clear this entire month's results?");
  if (!confirmClear) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  try {
    const res = await fetch(`/api/results/month/${year}/${month}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      alert(`Cleared ${data.deletedCount} results for ${month}/${year}`);
      fetchResultsFromServer(); // Refresh calendar
    } else {
      alert("Failed to clear month.");
    }
  } catch (err) {
    console.error("Error clearing month:", err);
  }
});

function enableEditing(enable) {
  const selects = document.querySelectorAll("select");
  selects.forEach((select) => {
    select.disabled = !enable;
  });
}

// 🚀 Start
fetchResultsFromServer();
