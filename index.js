const express = require('express');
const axios = require('axios');
const Razorpay = require('razorpay');
require('dotenv').config();

const app = express();
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const HOMESTAY_INFO = `
You are a helpful assistant for Mountain Coworking Stay, a homestay in India.
Answer guest questions in a friendly, short and helpful way.

Key information:
- Rooms: Standard (Rs.1500/night), Deluxe (Rs.2200/night), Family Suite (Rs.3000/night)
- Check-in: 12 PM noon, Check-out: 11 AM
- Location: [Your address here]
- Amenities: [WiFi, breakfast, parking - add yours]
- Contact: [Your phone/email]

Keep replies short and friendly. If asked about booking or payment, 
tell them to type *book* or *pay*.
`;

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return res.sendStatus(200);

  const from = msg.from;
  const text = msg.text?.body?.toLowerCase().trim();

  if (text.includes('pay')) {
    const paymentLink = await razorpay.paymentLink.create({
      amount: 150000,
      currency: 'INR',
      description: 'Homestay Booking Advance',
      notify: { sms: false, email: false },
      reminder_enable: false,
    });
    await sendMessage(from,
      "To confirm your booking, pay the advance here:\n\n" +
      paymentLink.short_url +
      "\n\nOnce paid you will receive a confirmation."
    );
  } else if (text.includes('book')) {
    await sendMessage(from,
      "To book, please share:\n\n1. Check-in date\n2. Check-out date\n3. Number of guests\n\nType *pay* when ready to pay advance."
    );
  } else if (text.includes('checkin') || text.includes('check-in')) {
    await sendMessage(from,
      "Check-in: 12:00 PM noon\nCheck-out: 11:00 AM\n\nAddress: [Your address]\nGoogle Maps: [Your link]"
    );
  } else {
    // AI handles everything else
    const aiReply = await askGemini(text);
    await sendMessage(from, aiReply);
  }

  res.sendStatus(200);
});

async function askGemini(question) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: HOMESTAY_INFO + '\n\nGuest asks: ' + question
          }]
        }]
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (err) {
    return "Sorry, I could not understand that. Please type *book*, *price*, *pay*, or *checkin* for quick help.";
  }
}

async function sendMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } },
    { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` } }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
