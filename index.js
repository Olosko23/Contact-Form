import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const URI = process.env.MONGO_URI;
const PORT = 7000;

const contactSchema = new mongoose.Schema({
  email: String,
  message: String,
  username: String,
});

const Contact = mongoose.model("Contact", contactSchema);

mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Remove the useCreateIndex option
    // useCreateIndex: true,
    writeConcern: { w: "majority" },
  })
  .then(() => {
    // Explicitly create indexes
    return Contact.createIndexes();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Database Connected and Server Running on Port ${PORT}..`);
    });
  })
  .catch((error) => {
    console.log({ message: error.message });
  });

app.post("/create", async (req, res) => {
  try {
    const { email, message, username } = req.body;

    const newContact = new Contact({
      email,
      message,
      username,
    });

    await newContact.save();

    const elasticEmailApiKey = process.env.ELASTIC_EMAIL_API_KEY;
    const fromEmail = "oloogeorge633@gmail.com";
    const toEmail = "oloogeorge633@gmail.com";

    const elasticEmailEndpoint = "https://api.elasticemail.com/v2/email/send";

    const emailData = {
      apiKey: elasticEmailApiKey,
      subject: "New Contact Form Submission",
      to: toEmail,
      from: fromEmail,
      bodyHtml: `
        <h3>New Contact Details:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    const response = await axios.post(elasticEmailEndpoint, emailData);

    res.status(200).json({
      message: "Contact details saved and email forwarded successfully",
      response: response.data,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
    console.log(error);
  }
});

app.get("/details", async (req, res) => {
  try {
    const details = await Contact.find();
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
