import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function GenerateReport({
    title = "Performance Report",
    userData = {},
    fields = [],
    sections = [],
    filename = "Report",
}) {
    const generateReport = () => {
        const doc = new jsPDF();
        const img = new Image();

        img.src = "/eventpro-icon.png";

        img.onload = () => {
            /* ----------------------------- HEADER ----------------------------- */
            doc.addImage(img, "PNG", 14, 10, 18, 18);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("EventPro", 33, 21);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(14);
            doc.text(title, 14, 40);

            doc.setLineWidth(0.5);
            doc.line(14, 45, 195, 45); // Divider line

            /* ----------------------------- USER INFO ----------------------------- */
            doc.setFontSize(11);
            let cursorY = 55;

            if (userData.first_name || userData.last_name) {
                doc.text(`User: ${userData.first_name || ""} ${userData.last_name || ""}`, 14, cursorY);
                cursorY += 7;
            }

            if (userData.email) {
                doc.text(`Email: ${userData.email}`, 14, cursorY);
                cursorY += 7;
            }

            doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, cursorY);
            cursorY += 10;

            /* ----------------------------- SUMMARY TABLE ----------------------------- */
            if (fields.length > 0) {
                doc.setFont("helvetica", "bold");
                doc.text("Summary", 14, cursorY);

                doc.setFont("helvetica", "normal");
                cursorY += 3;

                autoTable(doc, {
                    startY: cursorY + 2,
                    head: [["Field", "Value"]],
                    body: fields.map((f) => [f.label, f.value]),
                    styles: { fontSize: 10, cellPadding: 3 },
                    headStyles: { fillColor: [41, 128, 185] }, // Blue header
                });
            }

            /* ----------------------------- SECTIONS / TABLES ----------------------------- */
            let nextY = doc.lastAutoTable?.finalY || cursorY + 10;

            sections.forEach((section, index) => {
                const startY = index === 0 ? nextY + 12 : doc.lastAutoTable.finalY + 12;

                doc.setFont("helvetica", "bold");
                doc.setFontSize(13);
                doc.text(section.title, 14, startY);

                doc.setFont("helvetica", "normal");

                autoTable(doc, {
                    startY: startY + 5,
                    head: [section.head],
                    body: section.body,
                    styles: { fontSize: 10, cellPadding: 3 },
                    headStyles: { fillColor: [52, 73, 94] }, // Gray header
                });
            });

            /* ----------------------------- FOOTER ----------------------------- */
            const pageCount = doc.getNumberOfPages();

            doc.setFontSize(10);

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    105,
                    290, // bottom center
                    { align: "center" }
                );
            }

            /* ----------------------------- SAVE ----------------------------- */
            doc.save(`${filename}.pdf`);
        };
    };

    return (
        <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
        >
            Generate Report
        </button>
    );
}
