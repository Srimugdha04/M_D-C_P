



import ApexCharts from 'apexcharts';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('salesPurchaseChart')) {
         var options = {
      series: [
      {
        name: 'Customers',
        data: [0, 0]
      }
    ],
      colors: ['#06933a', '#ac1b0b'],
      chart: {
      type: 'bar',
      height: 350,
      width: '100%',
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
      grid: {
        show: true,
        borderColor: "#e2e8f0",

      },
      legend: {
        show: true,
        fontFamily: 'Poppins, serif',
        fontWeight: 500,
        markers: {
          size: 5,
          shape: 'square',
          strokeWidth: 8,
          fillColors: undefined,
          customHTML: undefined,
          onClick: undefined,
          offsetX: -2,
          offsetY: 0,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '85%',
          borderRadius: 3,
          borderRadiusApplication: 'end',
          distributed : true
        },
      },
      dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff']
      }
    },
      stroke: {
        show: false,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: ['Retained', 'Churned'],
        axisBorder: {
          show: false,
          color: "#e2e8f0",
          height: 1,
          width: '100%',
          offsetX: 0,
          offsetY: 0,
        },
        axisTicks: {
          show: false,
          borderType: 'solid',
          color: "#e2e8f0",
          height: 6,
          offsetX: 0,
          offsetY: 0,
        },
      },

      yaxis: {
        labels: {
          formatter: function (e) {
            return e;
          },
        },
        title: {
          text: 'Customers' ,
        },
      },
      fill: {
        opacity: 1,
      },
     tooltip: {
    			y: {
    				formatter: function (val) {
    					return val + " customers";
    				}
    			}
    		},
    };

window.barChart = new ApexCharts(document.querySelector("#salesPurchaseChart"), options);
window.barChart.render();

    }
      if (document.getElementById('customerChart')) {
    var options = {
      series: [0, 0],
      labels: ['Churned', 'Retained'],
      plotOptions: {
        radialBar: {
          hollow: {
            size: '50%',
          },
          track: {
            background: '#f2f2f2',
          },
          dataLabels: {
            show: true,
            name: {
              fontSize: '14px',
            },
            value: {
              fontSize: '18px',
              formatter: function (val) {
                return val.toFixed(1) + "%";
              }
            }
          }
        }
      },
      chart: {
      height: 200,
      type: 'radialBar',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
      colors: ['#bd090c', '#22c55e'],
      plotOptions: {
        radialBar: {
          dataLabels: {
            name: {
              fontSize: '22px',
            },
            value: {
              fontSize: '16px',
            },
            total: {
              show: false,
            },
          },
          hollow: {
            margin: 3,
            size: '40%',
            background: 'transparent',
            image: undefined,
            imageWidth: 150,
            imageHeight: 150,
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageClipped: true,
            position: 'front',
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5,
            },
          },
          track: {
            show: true,
            startAngle: undefined,
            endAngle: undefined,
            background: "#f0f0f0",
            strokeWidth: '45%',
            opacity: 1,
            margin: 5,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5,
            },
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          gradientToColors: ['#007867', '#FFD666', '#FFAC82'],
          stops: [0, 100],
        },
      },
      stroke: {
        lineCap: 'round',
        width : 6
      },
 labels: ['Churned', 'Retained'],

    };

    window.donutChart = new ApexCharts(document.querySelector('#customerChart'), options);
    window.donutChart.render();
  }
   if (document.getElementById('salesChart')) {
   // --- Replace these arrays with your real monthly sales numbers (12 values each) ---
    const salesThisYear = [42000, 53000, 48000, 61000, 72000, 69000, 74000, 82000, 78000, 86000, 91000, 97000];
    const salesLastYear = [38000, 45000, 47000, 56000, 65000, 63000, 68000, 70000, 69000, 75000, 80000, 84000];

    // Categories for x-axis (months)
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const options = {
      chart: {
        id: 'sales-overview',
        type: 'area',
        height: 420,
        zoom: { enabled: false },
        toolbar: {
          show: false,
        },
      },
      colors: ['#E66239', '#198754'],
      stroke: { width: [3, 2.5], curve: 'smooth' },
      markers: { size: 4, hover: { sizeOffset: 2 } },
      series: [
        { name: 'This Year', data: salesThisYear },
        { name: 'Last Year', data: salesLastYear }
      ],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 60, 100]
        }
      },
      yaxis: {
        labels: { formatter: function (val) { return formatCurrency(val); } },
        title: { text: 'Sales (INR)' }
      },
      xaxis: {
        categories: months,
        tickPlacement: 'on'
      },
      tooltip: {
        shared: true,
        y: {
          formatter: function(val) { return formatCurrency(val); }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right'
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: { height: 340 },
            legend: { position: 'bottom', horizontalAlign: 'center' }
          }
        }
      ]
    };

    // mount chart
    const chart = new ApexCharts(document.querySelector("#salesChart"), options);
    chart.render();

    // helper: format currency with thousands separators (assumes INR — change locale/currency as needed)
    function formatCurrency(value) {
      if (value == null) return '-';
      // ensure numeric
      const n = Number(value);
      return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }

    // Example control: Randomize data (for demo)
    document.getElementById('btn-random').addEventListener('click', () => {
      const rand = () => Math.round((Math.random() * 80 + 20) * 1000); // 20k - 100k
      const newThisYear = Array.from({length: 12}, rand);
      const newLastYear = Array.from({length: 12}, rand);
      chart.updateSeries([
        { name: 'This Year', data: newThisYear },
        { name: 'Last Year', data: newLastYear }
      ]);
    });

    // Example control: Toggle to show only This Year
    let showingBoth = true;
    document.getElementById('btn-update').addEventListener('click', () => {
      if (showingBoth) {
        chart.updateSeries([{ name: 'This Year', data: salesThisYear }]);
        document.getElementById('btn-update').textContent = 'Show Comparison';
      } else {
        chart.updateSeries([
          { name: 'This Year', data: salesThisYear },
          { name: 'Last Year', data: salesLastYear }
        ]);
        document.getElementById('btn-update').textContent = 'Show This Year Only';
      }
      showingBoth = !showingBoth;
    });

    // Public function: update chart with new monthly sales data
    // call updateMonthlySales([arrayOf12], optionalCompareArrayOf12)
    function updateMonthlySales(currentYearArray, compareYearArray = null) {
      if (!Array.isArray(currentYearArray) || currentYearArray.length !== 12) {
        console.warn('updateMonthlySales expects an array of 12 numbers for currentYearArray');
        return;
      }
      const series = [{ name: 'This Year', data: currentYearArray }];
      if (Array.isArray(compareYearArray) && compareYearArray.length === 12) {
        series.push({ name: 'Last Year', data: compareYearArray });
      }
      chart.updateSeries(series);
    }
  }
  window.updateBarChart = function(churn, retained) {
  window.barChart.updateSeries([
    {
      name: "Customers",
      data: [retained, churn]
    }
  ]);

  window.barChart.updateOptions({
    xaxis: {
      categories: ["Retained", "Churned"]
    }
  });
};

window.updateDonutChart = function(churn, retained) {
  window.donutChart.updateSeries([churn, retained]);
};
});