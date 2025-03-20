require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { PDFDocument } = require("pdf-lib");
const nodemailer = require("nodemailer");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Check if environment variables are loaded correctly
console.log("Email User:", process.env.EMAIL_USER);
console.log("Email Pass:", process.env.EMAIL_PASS ? "Loaded Successfully" : "Not Loaded");

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Disable SSL certificate validation
    },
  });
// Multer configuration
const upload = multer({ dest: "uploads/" });

// Route to handle form submission
app.post("/submit-form", upload.single("file"), async (req, res) => {
  try {
    const { firstName, lastName, email, accountType, age, referrer, bio } = req.body;
    const file = req.file;

    // Create a PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    page.drawText(
      `First Name: ${firstName}
Last Name: ${lastName}
Email: ${email}
Account Type: ${accountType}
Age: ${age}
Referrer: ${referrer}
Bio: ${bio}`,
      { x: 50, y: 350, size: 12 }
    );

    const pdfBytes = await pdfDoc.save();

    // Send email with PDF attachment
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "aginaemmanuel6@gmail.com",
      subject: "Form Submission",
      text: "Please find the attached PDF.",
      attachments: [
        {
          filename: "form-submission.pdf",
          content: Buffer.from(pdfBytes),
        },
        file && {
          filename: file.originalname,
          path: file.path,
        },
      ].filter(Boolean),
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ error: "Error sending email" });
      }
      console.log("Email sent:", info.response);
      res.status(200).json({ message: "Form submitted successfully!" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
