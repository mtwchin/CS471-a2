const outcomeOrder = ["Substantiated", "Exonerated", "Unsubstantiated"];
const outcomeColors = {
  Substantiated: "#087f78",
  Exonerated: "#d49b2a",
  Unsubstantiated: "#97a2a0"
};

const categoryOrder = [
  "Abuse of Authority",
  "Force",
  "Discourtesy",
  "Offensive Language"
];

const tooltip = d3.select("#tooltip");
let complaintData = [];

function groupOutcome(disposition) {
  if (disposition.startsWith("Substantiated")) return "Substantiated";
  return disposition;
}

function showTooltip(event, html) {
  tooltip
    .html(html)
    .style("left", `${Math.min(event.clientX + 14, window.innerWidth - 275)}px`)
    .style("top", `${event.clientY + 14}px`)
    .style("opacity", 1);
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}

function drawLegend() {
  const items = d3.select("#white-legend")
    .selectAll("div")
    .data(outcomeOrder)
    .join("div")
    .attr("class", "legend-item");

  items.append("span")
    .attr("class", "swatch")
    .style("background", d => outcomeColors[d]);

  items.append("span").text(d => d);
}

function summarizeWhiteData(startYear) {
  const filtered = startYear === "all"
    ? complaintData
    : complaintData.filter(d => d.year >= Number(startYear));

  const summary = categoryOrder.map(category => {
    const rows = filtered.filter(d => d.category === category);
    const result = { category, total: rows.length };

    outcomeOrder.forEach(outcome => {
      result[outcome] = rows.filter(d => d.outcome === outcome).length;
      result[`${outcome}Percent`] = rows.length
        ? (result[outcome] / rows.length) * 100
        : 0;
    });

    return result;
  });

  return { filtered, summary };
}

function drawWhiteChart(startYear = "all") {
  const container = d3.select("#white-chart");
  container.selectAll("*").remove();

  const { filtered, summary } = summarizeWhiteData(startYear);
  const width = 980;
  const height = 380;
  const margin = { top: 28, right: 25, bottom: 48, left: 165 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("aria-hidden", "true");

  const x = d3.scaleLinear()
    .domain([0, 100])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(categoryOrder)
    .range([margin.top, height - margin.bottom])
    .padding(0.28);

  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-(height - margin.top - margin.bottom)).tickFormat(""));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}%`));

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickSize(0).tickPadding(12))
    .call(g => g.select(".domain").remove());

  const stackData = summary.map(row => {
    const copy = { category: row.category, total: row.total, counts: row };
    outcomeOrder.forEach(outcome => copy[outcome] = row[`${outcome}Percent`]);
    return copy;
  });

  const stacked = d3.stack().keys(outcomeOrder)(stackData);

  const groups = svg.selectAll(".outcome-group")
    .data(stacked)
    .join("g")
    .attr("class", "outcome-group")
    .attr("fill", d => outcomeColors[d.key]);

  groups.selectAll("rect")
    .data(d => d.map(segment => ({ segment, outcome: d.key })))
    .join("rect")
    .attr("x", d => x(d.segment[0]))
    .attr("y", d => y(d.segment.data.category))
    .attr("width", d => Math.max(0, x(d.segment[1]) - x(d.segment[0])))
    .attr("height", y.bandwidth())
    .attr("tabindex", 0)
    .attr("aria-label", d => {
      const row = d.segment.data.counts;
      return `${d.segment.data.category}, ${d.outcome}: ${row[`${d.outcome}Percent`].toFixed(1)} percent, ${d3.format(",")(row[d.outcome])} allegations`;
    })
    .on("mousemove focus", function(event, d) {
      const row = d.segment.data.counts;
      showTooltip(event, `<strong>${d.segment.data.category}</strong>${d.outcome}: ${row[`${d.outcome}Percent`].toFixed(1)}%<br>${d3.format(",")(row[d.outcome])} of ${d3.format(",")(row.total)} allegations`);
    })
    .on("mouseleave blur", hideTooltip);

  groups.selectAll("text")
    .data(d => d.map(segment => ({ segment, outcome: d.key })))
    .join("text")
    .attr("class", "bar-label")
    .attr("x", d => (x(d.segment[0]) + x(d.segment[1])) / 2)
    .attr("y", d => y(d.segment.data.category) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .text(d => {
      const value = d.segment[1] - d.segment[0];
      return value >= 8 ? `${value.toFixed(1)}%` : "";
    });

  const periodText = startYear === "all"
    ? "the full dataset, September 1985–January 2020"
    : `${startYear}–2019`;

  d3.select("#white-subtitle").text(`Share of allegations in ${periodText}`);
  d3.select("#white-count").text(`${d3.format(",")(filtered.length)} allegation records shown.`);
}

function getYearRate(year) {
  const rows = complaintData.filter(d => d.year === year);
  const substantiated = rows.filter(d => d.outcome === "Substantiated").length;
  return { year, rate: (substantiated / rows.length) * 100, count: rows.length };
}

function drawBlackChart() {
  const selectedYears = [2008, 2011, 2015, 2019];
  const data = selectedYears.map(getYearRate);
  const container = d3.select("#black-chart");
  container.selectAll("*").remove();

  const width = 980;
  const height = 410;
  const margin = { top: 35, right: 38, bottom: 55, left: 68 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("aria-hidden", "true");

  const x = d3.scalePoint()
    .domain(selectedYears)
    .range([margin.left, width - margin.right])
    .padding(0.35);

  const y = d3.scaleLinear()
    .domain([14, 36])
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .attr("class", "black-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSize(0).tickPadding(14))
    .call(g => g.select(".domain").attr("stroke", "#426076"));

  svg.append("g")
    .attr("class", "black-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`).tickSize(-(width - margin.left - margin.right)))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").attr("stroke", "#27465e"));

  const area = d3.area()
    .x(d => x(d.year))
    .y0(y(14))
    .y1(d => y(d.rate))
    .curve(d3.curveMonotoneX);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.rate))
    .curve(d3.curveMonotoneX);

  const gradient = svg.append("defs").append("linearGradient")
    .attr("id", "area-gradient")
    .attr("x1", "0").attr("y1", "0").attr("x2", "0").attr("y2", "1");

  gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4aa6e8").attr("stop-opacity", 0.5);
  gradient.append("stop").attr("offset", "100%").attr("stop-color", "#4aa6e8").attr("stop-opacity", 0.04);

  svg.append("path")
    .datum(data)
    .attr("fill", "url(#area-gradient)")
    .attr("d", area);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#62b8f2")
    .attr("stroke-width", 4)
    .attr("d", line);

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.rate))
    .attr("r", 6)
    .attr("fill", "#dff2ff")
    .attr("stroke", "#3e9edd")
    .attr("stroke-width", 3);

  svg.selectAll(".point-label")
    .data(data)
    .join("text")
    .attr("class", "point-label")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.rate) - 16)
    .attr("text-anchor", "middle")
    .text(d => `${d.rate.toFixed(1)}%`);
}

d3.csv("data/allegations.csv", row => ({
  year: Number(row.year_received),
  category: row.fado_type,
  outcome: groupOutcome(row.board_disposition)
})).then(data => {
  complaintData = data.filter(d => d.year && categoryOrder.includes(d.category));
  drawLegend();
  drawWhiteChart();
  drawBlackChart();

  d3.select("#period-select").on("change", function() {
    drawWhiteChart(this.value);
  });
}).catch(error => {
  console.error(error);
  d3.select("#white-count").text("The data could not be loaded. Run the project from a local web server.");
});
