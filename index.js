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
Always reply in the same language the guest uses.

Key information:
- Rooms: Standard (Rs.1500/night), Deluxe (Rs.2200/night), Family Suite (Rs.3000/night)
- Check-in: 12 PM noon, Check-out: 11 AM
- Location: [Your address here]
- Amenities: WiFi, breakfast, parking [edit this]
- Contact: [Your phone/email]

Keep replies under 3-4 lines. Friendly and helpful tone.
If asked about booking or payment, tell them to type *book* or *pay*.
If asked something you do not know, ask them to call directly.
`;

app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    const text = msg.text?.body?.toLowerCase().trim();

    if (!text) return res.sendStatus(200);

    console.log(`Message from ${from}: ${text}`);

    if (text.includes('pay')) {
      try {
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
          "\n\nOnce paid you will receive a confirmation. Type *help* for assistance."
        );
      } catch (err) {
        console.log('Razorpay error:', err.message);
        await sendMessage(from,
          "Sorry, payment link could not be generated right now. Please call us directly."
        );
      }

    } else if (text.includes('book') || text.includes('available')) {
      await sendMessage(from,
        "To check availability please share:\n\n" +
        "1. Check-in date\n" +
        "2. Check-out date\n" +
        "3. Number of guests\n\n" +
        "Type *pay* when ready to pay the advance."
      );

    } else if (text.includes('price') || text.includes('rate') || text.includes('cost')) {
      await sendMessage(from,
        "Our room rates:\n\n" +
        "Standard Room: Rs.1500/night\n" +
        "Deluxe Room: Rs.2200/night\n" +
        "Family Suite: Rs.3000/night\n\n" +
        "Type *book* to check availability or *pay* to reserve now."
      );

    } else if (text.includes('checkin') || text.includes('check-in') || text.includes('checkout') || text.includes('check-out') || text.includes('timing')) {
      await sendMessage(from,
        "Check-in: 12:00 PM noon\n" +
        "Check-out: 11:00 AM\n\n" +
        "Address: [Your address]\n" +
        "Google Maps: [Your link]"
      );

    } else if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text === 'start') {
      await sendMessage(from,
        "Welcome to Mountain Coworking Stay!\n\n" +
        "Type:\n" +
        "*price* - see our room rates\n" +
        "*book* - check availability\n" +
        "*pay* - make a payment\n" +
        "*checkin* - check-in info\n\n" +
        "Or just ask me anything!"
      );

    } else {
      // AI handles all other questions
      console.log('Sending to Gemini AI:', text);
      const aiReply = await askGemini(text);
      await sendMessage(from, aiReply);
    }

  } catch (err) {
    console.log('Webhook error:', err.message);
  }

  res.sendStatus(200);
});

async function askGemini(question) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: HOMESTAY_INFO + '\n\nGuest asks: ' + question
          }]
        }]
      }
    );
    const reply = response.data.candidates[0].content.parts[0].text;
    console.log('Gemini reply:', reply);
    return reply;
  } catch (err) {
    console.log('Gemini error:', err.response?.data || err.message);
    return "Sorry, I could not understand that. Please type *price*, *book*, *pay*, or *checkin* for quick help.";
  }
}

async function sendMessage(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      },
      {
        headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` }
      }
    );
    console.log('Message sent to:', to);
  } catch (err) {
    console.log('Send message error:', err.response?.data || err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
```

---

## What to update before pushing

In the `HOMESTAY_INFO` section at the top, fill in your real details:
```
- Location: Sarainkhet, Almora, Uttrkahnd        ← add your real address
- Amenities: WiFi, breakfast, parking  ← edit to match your homestay
- Contact: ph: 8130979874 Email: Negiveer227@gmail.com          ← add your contact
