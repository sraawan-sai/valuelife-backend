import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors()); // Allow cross-origin requests

app.get('/api/send-sms', async (req, res) => {
  const { phone, customerId, password } = req.query;

  // Check for required parameters
  if (!phone || !customerId || !password) {
    return res.status(400).send('Missing parameters: phone, customerId, or password');
  }

  // Include admin numbers
  const adminNumbers = '9705259696,9701666220';
  const to_mobileno = `${phone},${adminNumbers}`;

  // Your approved DLT template message (ensure this matches exactly)
  const smsText = `Welcome to VALUE LIFE Family. Your Account Created and your customer ID is: ${customerId} with password: ${password}. Please do not share with anyone. valuelife.in`;

  // URL encode the SMS text
  const encodedText = encodeURIComponent(smsText);

  // Fixed DLT template ID you provided
  const t_id = '1707174279305340223';

  // SMS API endpoint with dynamic values
  const smsApiUrl = `https://login5.spearuc.com/MOBILE_APPS_API/sms_api.php?type=smsquicksend&user=valuelifefamily&pass=Value@123&sender=VLMPVT&to_mobileno=${to_mobileno}&sms_text=${encodedText}&t_id=${t_id}`;

  try {
    const response = await fetch(smsApiUrl);
    const result = await response.text();

    console.log('✅ SMS API response:', result);
    res.send(result);
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    res.status(500).send('Failed to send SMS');
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 SMS proxy server running at http://localhost:${PORT}`);
});
