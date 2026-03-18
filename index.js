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

  if (text.includes('book') || text.includes('available')) {
    await sendMessage(from,
      "Hi! We have rooms available. Please share your:\n\n" +
      "1. Check-in date\n2. Check-out date\n3. Number of guests\n\n" +
      "Type *price* to see our rates."
    );
  } else if (text.includes('price') || text.includes('rate')) {
    await sendMessage(from,
      "Our rates:\n\n" +
      "Standard Room: Rs.1500/night\n" +
      "Deluxe Room: Rs.2200/night\n" +
      "Family Suite: Rs.3000/night\n\n" +
      "Type *pay* to make a booking payment."
    );
  } else if (text.includes('pay')) {
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
      "\n\nOnce paid, you will receive a confirmation. Type *help* for assistance."
    );
  } else if (text.includes('checkin') || text.includes('check-in')) {
    await sendMessage(from,
      "Check-in: 12:00 PM noon\nCheck-out: 11:00 AM\n\n" +
      "Address: [Your address here]\nGoogle Maps: [Your maps link]"
    );
  } else {
    await sendMessage(from,
      "Welcome to [Your Homestay Name]!\n\nType:\n" +
      "*book* - check availability\n" +
      "*price* - see our rates\n" +
      "*pay* - make a payment\n" +
      "*checkin* - check-in info\n" +
      "*help* - talk to us directly"
    );
  }

  res.sendStatus(200);
});

async function sendMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } },
    { headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` } }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot running on port ${PORT}`));
