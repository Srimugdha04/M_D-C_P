
// Import Bootstrap JS
import * as bootstrap from 'bootstrap';
import './custom.js';

// Import SCSS
import '../scss/style.scss';

  function showLoading() {
  const loader = '<div class="loader"></div>';

  document.getElementById("totalCustomers").innerHTML = loader;
  document.getElementById("highRisk").innerHTML = loader;
  document.getElementById("avgChurn").innerHTML = loader;
  document.getElementById("predCount").innerHTML = loader;
}
function calculateRisk(row) {
          let score = 0;

          if (row.credit < 500) score += 30;
          if (row.balance < 50000) score += 25;
          if (row.age < 30) score += 20;
          if (row.salary < 50000) score += 15;

          // ❗ NO RANDOMNESS (important)
          score = Math.min(score, 100);

          let risk = score > 70 ? "high" : score > 40 ? "medium" : "low";

          return { score, risk };
        }
function processCSV() {
  const file = document.getElementById("csvFile").files[0];

  if (!file) {
    alert("Please upload a CSV file");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {

    showLoading();
    showInsightsLoading();

    const text = e.target.result;
    setTimeout(() => {


      const rows = text.trim().split("\n").map(r => r.split(","));
      const header = rows[0].map(h => h.trim().toLowerCase());
      const possibleTargets = ["churn", "exited", "attrition"];
      let churnIndex = header.findIndex(h => possibleTargets.includes(h));

      if (churnIndex === -1) {
        churnIndex = header.length - 1;
      }

      let rawData = rows.slice(1).filter(row => row.length > 1 && row[0] !== "");

      let data = rawData.map((row, i) => {
        return {
          id: i + 1,
          credit: parseFloat(row[header.indexOf("creditscore")] || 0),
          age: parseFloat(row[header.indexOf("age")] || 0),
          balance: parseFloat(row[header.indexOf("balance")] || 0),
          salary: parseFloat(row[header.indexOf("estimatedsalary")] || 0),
          churn: parseFloat(row[churnIndex]) === 1 ? 1 : 0
        };
      });

      localStorage.setItem("churnData", JSON.stringify(data));

      let total = data.length;
      let churnCount = 0;

      data.forEach(row => {
        if (row.churn === 1) churnCount++;
      });

      let retained = total - churnCount;
      let churnRate = ((churnCount / total) * 100).toFixed(2);
      let churnPercent = ((churnCount / total) * 100).toFixed(2);
      let retainedPercent = 100 - churnPercent;
      let atRisk = Math.floor(churnCount * 0.6);

      // 🔹 TOP CARDS
      document.getElementById("totalCustomers").innerText = total;
      document.getElementById("highRisk").innerText = churnCount;
      document.getElementById("avgChurn").innerText = churnRate + "%";
      document.getElementById("predCount").innerText = total;

      // 🔹 INSIGHTS
      document.getElementById("churnRate").innerText = churnRate + "%";
      document.getElementById("retained").innerText = retained;
      document.getElementById("atRisk").innerText = atRisk;

      // 🔹 RIGHT PANEL
      document.getElementById("churnCount").innerText = churnCount;
      document.getElementById("retainedCount").innerText = retained;
      document.getElementById("churnPercent").innerText = churnPercent + "%";
      document.getElementById("retainedPercent").innerText = retainedPercent + "%";

      // 🔹 BOTTOM STATS
      document.getElementById("totalCustomers2").innerText = total;
      document.getElementById("highRisk2").innerText = churnCount;
      document.getElementById("churnRate2").innerText = churnPercent + "%";

      // 🔥🔥 THIS IS THE MOST IMPORTANT PART
      updateBarChart(churnCount, retained);
      churnPercent = (churnCount / total) * 100;
      retainedPercent = (retained / total) * 100;

      updateDonutChart(churnPercent, retainedPercent);
      
      // 🔴 Top Risk Customers
        const topRisk = data
          .map(row => {
            let score = 0;

          if (row.credit < 500) score += 30;
          if (row.balance < 50000) score += 25;
          if (row.age < 30) score += 20;
          if (row.salary < 50000) score += 15;


          score = Math.min(score, 100);

            return { id: row.id, score: Math.min(score, 100) };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        document.getElementById("topRiskList").innerHTML =
          topRisk.map(c => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <p class="mb-1">Customer ${c.id}</p>
                <small class="fw-semibold text-danger">${c.score}% risk</small>
              </div>
              <span class="badge bg-danger text-white">HIGH</span>
            </li>
          `).join("");


        // 🟡 Risk Factors
        function getChurnRate(group) {
            if (group.length === 0) return 0;
            const churned = group.filter(x => x.churn === 1).length;
            return (churned / group.length) * 100;
          }

          // 🔹 Split groups
          let lowCredit = data.filter(x => x.credit < 500);
          let highCredit = data.filter(x => x.credit >= 500);

          let lowBalance = data.filter(x => x.balance < 50000);
          let highBalance = data.filter(x => x.balance >= 50000);

          let young = data.filter(x => x.age < 30);
          let old = data.filter(x => x.age >= 30);

          // 🔹 Compute churn rates
          let creditLowRate = getChurnRate(lowCredit);
          let creditHighRate = getChurnRate(highCredit);

          let balanceLowRate = getChurnRate(lowBalance);
          let balanceHighRate = getChurnRate(highBalance);

          let youngRate = getChurnRate(young);
          let oldRate = getChurnRate(old);

          // 🔹 Build insights
          let factors = [];

          // Credit insight
          factors.push(
            `Low credit score customers churn ${(creditLowRate - creditHighRate).toFixed(1)}% more`
          );

          // Balance insight
          factors.push(
            `Low balance customers show ${(balanceLowRate - balanceHighRate).toFixed(1)}% higher churn`
          );

          // Age insight
          factors.push(
            `Younger customers churn ${(youngRate - oldRate).toFixed(1)}% more`
          );
          function compareText(diff, goodText, badText) {
            return diff > 0 ? badText(diff) : goodText(Math.abs(diff));
          }

          factors.push(
            compareText(
              creditLowRate - creditHighRate,
              d => `High credit customers churn ${d.toFixed(1)}% less`,
              d => `Low credit customers churn ${d.toFixed(1)}% more`
            )
          );

          // fallback
          if (factors.length === 0) {
            factors.push("Churn is evenly distributed across customer segments");
          }

                  document.getElementById("riskFactors").innerHTML =
            factors.map(f => `
              <li class="list-group-item">
                📊 ${f}
              </li>
            `).join("");


        // 🔵 Recent Predictions
        const recent = data.slice(0, 5).map(row => {
          let score = 0;

          if (row.credit < 500) score += 30;
          if (row.balance < 50000) score += 25;
          if (row.age < 30) score += 20;

          let label = "Low";
          let color = "success";

          if (score > 70) {
            label = "High";
            color = "danger";
          } else if (score > 40) {
            label = "Medium";
            color = "warning";
          }

          return { id: row.id, label, color };
        });

        document.getElementById("recentPredictions").innerHTML =
          recent.map(c => `
            <li class="list-group-item d-flex justify-content-between">
              Customer ${c.id}
              <span class="badge bg-${c.color}-subtle text-${c.color}">
                ${c.label}
              </span>
            </li>
          `).join("");
            let currentPage = 1;
        let rowsPerPage = 15;
        
          function renderTable(data, page) {
            const start = (page - 1) * rowsPerPage;
            const end = start + rowsPerPage;

            const pageData = data.slice(start, end);

            let tableHTML = pageData.map(row => {

              const { score, risk } = calculateRisk(row);
              let color = risk === "high" ? "danger" : risk === "medium" ? "warning" : "success";

              return `
                <tr>
                  <td>Customer ${row.id}</td>
                  <td>${row.credit}</td>
                  <td>${row.age}</td>
                  <td>${row.balance}</td>
                  <td>${row.salary}</td>
                  <td class="fw-bold text-${color}">${score}%</td>
                  <td><span class="badge bg-${color}">${risk}</span></td>
                </tr>
              `;
            }).join("");

            document.getElementById("customerTable").innerHTML = tableHTML;
          }

          function setupPagination(data) {
            const totalPages = Math.ceil(data.length / rowsPerPage);

            let buttons = '';

            for (let i = 1; i <= totalPages; i++) {
              buttons += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                  <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
              `;
            }

            pagination.innerHTML = buttons;

            document.querySelectorAll(".page-link").forEach(btn => {
              btn.addEventListener("click", (e) => {
              e.preventDefault();
              currentPage = parseInt(e.target.dataset.page);
              renderTable(data, currentPage);
              setupPagination(data);
            });
            });
          }

          if (document.getElementById("customerTable")) {
            renderTable(data, currentPage);
            setupPagination(data);
          }
                }, 2500);
                  };

            reader.readAsText(file);
          }
          function showInsightsLoading() {
            const loader = '<div class="loader"></div>';

            // cards
            document.getElementById("churnRate").innerHTML = loader;
            document.getElementById("retained").innerHTML = loader;
            document.getElementById("atRisk").innerHTML = loader;

            // 🔥 charts loading state
            if (window.barChart) {
              window.barChart.updateSeries([
                {
                  name: "Customers",
                  data: [0, 0]
                }
              ]);
            }

            if (window.donutChart) {
              window.donutChart.updateSeries([0, 0]);
            }
          }
          window.processCSV = processCSV;

          document.addEventListener("DOMContentLoaded", () => {
              if (!document.getElementById("customerTable")) return;

          const stored = localStorage.getItem("churnData");
          if (!stored) return;

          const data = JSON.parse(stored);

          // ✅ NOW data exists → safe to use
          let originalData = data;
          let filteredData = [...data];

            let currentPage = 1;
            let rowsPerPage = 15;

            function renderTable(page) {
              const start = (page - 1) * rowsPerPage;
              const end = start + rowsPerPage;

              const pageData = filteredData.slice(start, end);

              let tableHTML = pageData.map(row => {

                const { score, risk } = calculateRisk(row);
                let color = risk === "high" ? "danger" : risk === "medium" ? "warning" : "success";

                return `
                  <tr>
                    <td>Customer ${row.id}</td>
                    <td>${row.credit}</td>
                    <td>${row.age}</td>
                    <td>${row.balance}</td>
                    <td>${row.salary}</td>
                    <td class="fw-bold text-${color}">${score}%</td>
                    <td><span class="badge bg-${color}">${risk.toUpperCase()}</span></td>
                  </tr>
                `;
              }).join("");

              document.getElementById("customerTable").innerHTML = tableHTML;
            }

          function setupPagination() {
            const totalPages = Math.ceil(filteredData.length / rowsPerPage);
            const pageSelect = document.getElementById("pageSelect");

            if (!pageSelect) return; // safety check

            let options = '';

            for (let i = 1; i <= totalPages; i++) {
              options += `<option value="${i}">${i}</option>`;
            }

            pageSelect.innerHTML = options;

            // ✅ update row count display
            const rowCount = document.getElementById("rowCount");
            if (rowCount) rowCount.innerText = rowsPerPage;

            // ✅ remove old listener (important)
            pageSelect.onchange = null;

            // ✅ attach new listener
            pageSelect.addEventListener("change", (e) => {
              currentPage = parseInt(e.target.value);
              renderTable(currentPage);
            });
          }

            const searchInput = document.getElementById("searchInput");

            if (searchInput) {
              searchInput.addEventListener("input", () => {
                const value = searchInput.value.toLowerCase();

                filteredData = originalData.filter(row =>
                  ("customer " + row.id).toLowerCase().includes(value)
                );

                currentPage = 1;
                renderTable(currentPage);
                setupPagination();

          });
          }
          // 🔥 👉 ADD FILTER HERE (after search)
            const riskFilter = document.getElementById("riskFilter");

            if (riskFilter) {
              riskFilter.addEventListener("change", () => {
                const value = riskFilter.value;

      filteredData = originalData.filter(row => {
  const { risk } = calculateRisk(row);
  return value === "all" || risk === value;
});

            currentPage = 1;
            renderTable(currentPage);
            setupPagination();
          });
        }

          // ✅ INITIAL LOAD (VERY IMPORTANT)
          renderTable(currentPage);
          setupPagination();

        });
        function predictCustomer(e) {
  if (e) e.preventDefault();

  // ✅ Get values FIRST
  const credit = parseFloat(document.getElementById("credit").value);
  const age = parseFloat(document.getElementById("age").value);
  const balance = parseFloat(document.getElementById("balance").value);
  const salary = parseFloat(document.getElementById("salary").value);
  const tenure = parseFloat(document.getElementById("tenure").value || 0);
  const products = parseFloat(document.getElementById("products").value || 0);
  const creditCard = parseFloat(document.getElementById("creditCard").value || 0);
  const activeMember = parseFloat(document.getElementById("activeMember").value || 0);
  const transactions = parseFloat(document.getElementById("transactions").value || 0);
  const complaints = parseFloat(document.getElementById("complaints").value || 0);

  // ✅ Validation AFTER getting values
  if (isNaN(credit) || isNaN(age) || isNaN(balance) || isNaN(salary)) {
    alert("Please fill all fields correctly");
    return;
  }

  // ✅ SHOW RESULT CARD & SPINNER
  const card = document.getElementById("resultCard");
  card.classList.remove("d-none");

  document.getElementById("riskText").innerText = "";
  document.getElementById("riskBadge").innerText = "";
  const bar = document.getElementById("riskBar");
  bar.className = "progress-bar bg-light d-flex justify-content-center align-items-center";
  bar.style.width = "0%";
  bar.innerHTML = "";
  document.getElementById("reasons").innerHTML = "";
  document.getElementById("recommendations").innerHTML = "";
  document.getElementById("loadingSpinner").classList.remove("d-none");

  // Call the Flask Backend `/api/predict/single`
  fetch('/api/predict/single', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credit, age, balance, salary, tenure, products, creditCard, activeMember, transactions, complaints })
  })
  .then(res => res.json())
  .then(data => {
      document.getElementById("loadingSpinner").classList.add("d-none");
      if (data.error) {
        alert("Error communicating with backend.");
        return;
      }
      
      const score = Math.round(data.probability);
      // Backend returns e.g. "High Risk of Churn". Extract just "HIGH"
      const risk = data.riskText.split(" ")[0].toUpperCase(); 
      let color = risk === "HIGH" ? "danger" : risk === "MEDIUM" ? "warning" : "success";

      const badge = document.getElementById("riskBadge");
      badge.className = `badge bg-${color}`;
      badge.innerText = risk;

      document.getElementById("riskText").innerText = `${score}% Risk Probability`;

      bar.style.width = score + "%";
      bar.className = `progress-bar bg-${color}`;
      bar.innerText = score + "%";

      document.getElementById("reasons").innerHTML = data.reasons.map(r => `<li>${r}</li>`).join("");
      document.getElementById("recommendations").innerHTML = data.recommendations.map(r => `<li>${r}</li>`).join("");
  })
  .catch(err => {
      console.error(err);
      document.getElementById("loadingSpinner").classList.add("d-none");
      alert("Backend prediction failed.");
  });
}
    function initPredict() {
      const btn = document.getElementById("predictBtn");
      if (btn) {
        btn.addEventListener("click", predictCustomer);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initPredict);
    } else {
      initPredict();
    }