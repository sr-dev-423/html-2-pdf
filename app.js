const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const fs = require('fs');

const app = express();
const port = 2999;

// Middleware to parse JSON and URL-encoded bodies
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route to handle PDF generation from HTML received from the client
app.post("/generate-pdf", async (req, res) => {
  try {
    // Extract HTML content sent from the client
    const htmlContent = req.body.htmlContent;

    if (!htmlContent) {
      return res.status(400).send("No HTML content provided");
    }

    fs.writeFile('pdf.html', htmlContent, () => {});

    // Launch Puppeteer and open a new browser page
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set the HTML content received from the client
    await page.setContent(htmlContent, {
      waitUntil: ["load", "networkidle0", "networkidle2", "domcontentloaded"],
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    );

    await page.evaluateHandle("document.fonts.ready");
    
    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: "A4", // Paper size
      printBackground: true, // Print background graphics
      margin: { top: "20mm", left: "20mm", right: "20mm", bottom: "20mm" },
      width: 1060,
      height: 1500,
      timeout: 300000,
    });

    // Save the PDF buffer to the file system
    // const filePath = path.join(__dirname, 'generated-pdf.pdf');
    // fs.writeFileSync(filePath, pdfBuffer);
    // res.sendFile(filePath);

    // Send the generated PDF as a response
    const buffer = Buffer.from(pdfBuffer);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(buffer);

    // Close the browser
    await browser.close();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
