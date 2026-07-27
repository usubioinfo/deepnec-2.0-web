// Author: Naveen Duhan
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import 'd3-transition';
import './horiz.scss'
// import legend from 'd3-svg-legend';
import { colorbrewer } from './color-palette';
// import FileSaver from 'file-saver';
import { chartFactory, button_helper, save_handler, innerArrayValues, returnRange } from './util';

const SecondaryStructure = ({ data, label = "psipredChart", opts = {} }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    const xdimension = 50;
    const data_array = parseHFormat(data);
    console.log(data_array)
    const sets = Math.ceil(data_array.length / xdimension);
    const chartOptions = { ...opts, key_panel: false, download_buttons: true, id: label, parent: chartRef.current };
    const chart = chartFactory(chartOptions);

    chart.height = (7 * chart.em_size) * (sets + 1);
    chart.container_height = chart.height;
    chart.width = chart.em_size * xdimension;
    chart.container_width = chart.em_size * xdimension;
    chart.chartType = 'psipred';

    let key_position = 0;
    for (let i = 0; i < sets; i += 1) {
      let x_start = 1 + i * xdimension;
      let x_stop = xdimension + i * xdimension;
      let y_location = 0 + i * (10 * chart.em_size);
      let x_location = (7 * chart.em_size) + i * (10 * chart.em_size);

      let scales = setScale(chart, x_start, x_stop, (7 * chart.em_size));
      drawAxis(chart, 'axes', scales.x, scales.y, x_location, y_location);
      let slice = data_array.slice(x_start - 1, x_stop);
      key_position = drawDiagram(chart, slice, x_location, y_location, x_start);
    }
    drawKey(chart, data_array, key_position + 2 * chart.em_size, label);

  }, [data, label, opts]);

  return <div ref={chartRef} />;
};

export default SecondaryStructure;

// Function Definitions

function drawKey(chart, data_array, key_position, label) {
  let key = chart.container;
  key_position += chart.em_size;
  if (chart.download_buttons) {

    button_helper(chart, label, "png", chart.em_size * -10, "buttons", 5, 3);
    button_helper(chart, label, "svg", chart.em_size * -1, "buttons", 5, 3);
    save_handler(chart, label);
  }
  key.append("text")
    .attr("transform", `translate(0, ${key_position})`)
    .text("Legend:")
    .attr("font-family", "sans-serif")
    .attr("font-weight", "bold")
    .attr("fill", "black");
  key_position += chart.em_size;
  addSSElement(chart, key, key_position, "Strand", "Green");
  addTextElement(chart, key, key_position, "Conf:", "-");
  addConfElements(chart, key, key_position);
  key.append("text")
    .attr("transform", `translate(${chart.em_size * 17.5}, ${key_position + chart.em_size * 0.8})`)
    .text("+ Confidence of prediction")
    .attr("font-family", "sans-serif")
    .attr("fill", "black");
  key_position += chart.em_size;
  addSSElement(chart, key, key_position, "Helix", "Red");
  addTextElement(chart, key, key_position, "Cart:", "3-state assignment cartoon");
  key_position += chart.em_size;
  addSSElement(chart, key, key_position, "Coil", "DimGrey");
  addTextElement(chart, key, key_position, "Pred:", "3-state prediction");
  key_position += chart.em_size;
  addTextElement(chart, key, key_position, "AA:", "Target Sequence");
}

function addConfElements(chart, key, key_position) {
  let x_offset_adjust = 0;
  for (let j = 0; j < 9; j += 1) {
    const current_x_offset = x_offset_adjust; // Capture the current value of x_offset_adjust in each iteration
    key.append("rect")
      .attr("class", "rect")
      .attr("width", chart.em_size / 2)
      .attr("height", chart.em_size * (j / 10))
      .attr("transform", () => {
        let y_offset = chart.em_size - (chart.em_size * (j / 10));
        return `translate(${chart.em_size * 13 + (chart.em_size * current_x_offset)}, ${key_position + y_offset})`;
      })
      .attr("stroke", "black")
      .attr("fill", colorbrewer.PuBu[9][j]);
    x_offset_adjust += 0.5;
  }
}


function addTextElement(chart, key, key_position, title, desc) {
  key.append("text")
    .attr("transform", `translate(${chart.em_size * 10}, ${key_position + chart.em_size * 0.8})`)
    .text(title)
    .attr("font-family", "sans-serif")
    .attr("fill", "black")
    .attr("font-weight", "bold");
  key.append("text")
    .attr("transform", `translate(${chart.em_size * 13}, ${key_position + chart.em_size * 0.8})`)
    .text(desc)
    .attr("font-family", "sans-serif")
    .attr("fill", "black");
}

function addSSElement(chart, key, key_position, label, colour) {
  key.append("rect")
    .attr("class", "rect")
    .attr("width", chart.em_size)
    .attr("height", label === "Coil" ? chart.em_size / 4 : chart.em_size)
    .attr("transform", () => {
      let y_offset = label === 'Coil' ? chart.em_size / 2 : 0;
      return `translate(0, ${key_position + y_offset})`;
    })
    .attr("stroke", "White")
    .attr("fill", colour);
  key.append("text")
    .attr("transform", `translate(${chart.em_size * 1.5}, ${key_position + chart.em_size * 0.8})`)
    .text(label)
    .attr("font-family", "sans-serif")
    .attr("fill", "black");
}

function drawDiagram(chart, data_array, x_location, y_location, x_start) {
  let heatmapColour = d3.scaleLinear()
    .domain(d3.range(0, 1, 1.0 / (colorbrewer.BuPu[9].length - 1)))
    .range(colorbrewer.BuPu[9]);
  let c = d3.scaleLinear().domain(d3.extent(innerArrayValues(data_array, "conf"))).range([0, 1]);

  let confRect = chart.container.selectAll("g")
    .data(data_array);
  confRect.enter().append("rect")
    .attr("class", "rect")
    .attr("width", chart.em_size)
    .attr("height", d => chart.em_size * ((d.conf + 1) / 10))
    .attr("transform", (d, i) => {
      let y_offset = chart.em_size - (chart.em_size * ((d.conf + 1) / 10));
      return `translate(${i * chart.em_size}, ${y_location + y_offset})`;
    })
    .attr("fill", d => heatmapColour(c(d.conf)))
    .attr("stroke", "black")
    .append("svg:title").text(d => d.conf);

  y_location += chart.em_size * 2;

  let cartoonRect = chart.container.selectAll("g")
    .data(data_array);
  cartoonRect.enter().append("rect")
    .attr("class", "rect")
    .attr("width", chart.em_size)
    .attr("height", d => d.pred === 'C' ? chart.em_size / 4 : chart.em_size)
    .attr("transform", (d, i) => {
      let y_offset = d.pred === 'C' ? chart.em_size / 3 : 0;
      return `translate(${i * chart.em_size}, ${y_location + y_offset})`;
    })
    .attr("fill", d => {
      if (d.pred === 'C') return 'DimGrey';
      if (d.pred === 'E') return 'Green';
      if (d.pred === 'H') return 'Red';
    })
    .attr("stroke", d => {
      if (d.pred === 'C') return 'DimGrey';
      if (d.pred === 'E') return 'Green';
      if (d.pred === 'H') return 'Red';
    })
    .append("svg:title").text(d => d.pred);

  y_location += chart.em_size * 2;

  let predText = chart.container.selectAll("g")
    .data(data_array);
  predText.enter().append("text")
    .attr("transform", (d, i) => `translate(${i * chart.em_size}, ${y_location + (chart.em_size / 2)})`)
    .text(d => d.pred)
    .attr("font-family", "sans-serif")
    .attr("font-weight", "bold")
    .attr("fill", "black")
    .append("svg:title").text((d, i) => i + x_start);

  y_location += chart.em_size * 2;

  let aaText = chart.container.selectAll("g")
    .data(data_array);
  aaText.enter().append("text")
    .attr("transform", (d, i) => `translate(${i * chart.em_size}, ${y_location + (chart.em_size / 3)})`)
    .text(d => d.aa)
    .attr("font-family", "sans-serif")
    .attr("font-weight", "bold")
    .attr("fill", "black")
    .append("svg:title").text((d, i) => i + x_start);

  return y_location;
}

function setScale(chart, xstart, xstop, ysize) {
  let x = d3.scaleBand().range([0, chart.container_width])
    .domain(returnRange(xstart, xstop));

  let y = d3.scaleBand().range([0, ysize])
    .domain(['Conf', 'Cart', 'Pred', 'AA']);
  return { x, y };
}

function drawAxis(chart, layer, x, y, xlocation, ylocation) {
  const xAxis = d3.axisBottom().scale(x).tickValues(x.domain().filter((d, i) => !((i + 1) % 10)));
  const yAxis = d3.axisLeft().scale(y);
  chart[layer].append('g')
    .attr('class', 'axis y')
    .attr('transform', `translate(${chart.margin.left}, ${ylocation + chart.margin.top})`)
    .call(yAxis)
    .select(".domain").remove();

  chart[layer].append('g')
    .attr('class', 'axis x')
    .attr('transform', `translate(${chart.margin.left}, ${xlocation + chart.margin.top})`)
    .call(xAxis)
    .selectAll(".domain").remove();
  chart[layer].selectAll("line").remove();
}

function parseHFormat(data) {
  const parsed = [];
  const { confidence, prediction, amino_acids } = data;

  for (let i = 0; i < amino_acids.length; i++) {
    parsed.push({
      aa: amino_acids[i],
      pred: prediction[i],
      conf: Number(confidence[i])
    });
  }

  return parsed;
}
