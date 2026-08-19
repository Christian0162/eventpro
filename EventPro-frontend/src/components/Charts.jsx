// Charts.js
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    BarElement,
    ArcElement,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title,
} from "chart.js";

import { Line, Pie, Bar } from "react-chartjs-2";

ChartJS.register(
    LineElement,
    CategoryScale,
    BarElement,
    ArcElement,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Title
);

ChartJS.defaults.animation = false;

export const LineChart = ({
    className,
    dataPoints = [],       // array of numbers
    labels = [],           // array of strings
    label = "Data",        // dataset label
    lineColor = "rgb(143, 67, 210)",
    fillColor = "rgba(143, 67, 210, 0.2)",
    options: customOptions = {}
}) => {
    // Safe fallback
    const safeLabels = labels.length > 0 ? labels : ["No Data"];
    const safeDataPoints = dataPoints.length > 0 ? dataPoints : [0];

    const data = {
        labels: safeLabels,
        datasets: [
            {
                label,
                data: safeDataPoints,
                borderColor: lineColor,
                backgroundColor: fillColor,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: lineColor,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: "bottom" },
            title: { display: !!label, text: label },
        },
        scales: {
            y: { beginAtZero: true },
        },
        ...customOptions,
    };

    return (
        <div className={className}>
            <Line data={data} options={options} />
        </div>
    );
};



export const PieChart = ({
    className,
    labels = [],
    dataValues = [],
    backgroundColors = [],
    borderColors = [],
    title = "",
    options: customOptions = {}
}) => {
    const safeLabels = labels.length > 0 ? labels : ["No Data"];
    const safeDataValues = dataValues.length > 0 ? dataValues : [1];
    const safeBackgroundColors = backgroundColors.length > 0 ? backgroundColors : ["#d1d5db"];
    const safeBorderColors = borderColors.length > 0 ? borderColors : ["#9ca3af"];

    const data = {
        labels: safeLabels,
        datasets: [
            {
                label: title || "",
                data: safeDataValues,
                backgroundColor: safeBackgroundColors,
                borderColor: safeBorderColors,
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: "bottom" },
            title: { display: !!title, text: title },
        },
        ...customOptions,
    };

    return (
        <div className={className}>
            <Pie data={data} options={options} />
        </div>
    );
};


export const BarChart = ({ className, labels = [], datasets = [], title = "", xLabel = "", yLabel = "", options: customOptions = {} }) => {

    const data = {
        labels,
        datasets,
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
            title: { display: !!title, text: title },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: !!yLabel, text: yLabel },
            },
            x: {
                title: { display: !!xLabel, text: xLabel },
            },
        },
        ...customOptions,
    };

    return (
        <div className={className}>
            <Bar data={data} options={options} />
        </div>
    );
};

