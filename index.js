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

// Webhook verification (Meta requires this)
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Receive messages
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
      "Standard Room: ₹1500/night\n" +
      "Deluxe Room: ₹2200/night\n" +
      "Family Suite: ₹3000/night\n\n" +
      "Type *pay* to make a booking payment."
    );
  } else if (text.includes('pay')) {
    // Create Razorpay payment link
    const paymentLink = await razorpay.paymentLink.create({
      amount: 150000, // ₹1500 in paise (adjust per booking)
      currency: 'INR',
      description: 'Homestay Booking Advance',
      notify: { sms: false, email: false },
      reminder_enable: false,
      callback_url: 'https://yourdomain.com/payment-success',
      callback_method: 'get',
    });

    await sendMessage(from,
      `To confirm your booking, pay the advance here:\n\n${paymentLink.short_url}\n\n` +
      "Once payment is done, you'll receive a confirmation. Questions? Type *help*."
    );
  } else if (text.includes('checkin') || text.includes('check-in')) {
    await sendMessage(from,
      "Check-in: 12:00 PM noon\nCheck-out: 11:00 AM\n\n" +
      "Address: [Your address here]\nGoogle Maps: [Your maps link]"
    );
  } else {
    await sendMessage(from,
      "Welcome to [Your Homestay Name]!\n\nType:\n" +
      "*book* — check availability\n" +
      "*price* — see our rates\n" +
      "*pay* — make a payment\n" +
      "*checkin* — check-in info\n" +
      "*help* — talk to us directly"
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

app.listen(3000, () => console.log('Bot running on port 3000'));
```

**Step 4 — Create `.env` file** (never share this):
```
WA_TOKEN=your_whatsapp_token_here
PHONE_NUMBER_ID=your_phone_number_id
VERIFY_TOKEN=any_random_string_you_choose
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here