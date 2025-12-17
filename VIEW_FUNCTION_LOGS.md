# View Function Logs for Trigger Email

## Step 1: View Logs from Function Details

When you're on the function details page (`ext-firestore-send-email-processqueue`):

1. **Look for tabs** at the top:

   - **"Logs"** tab (should be there)
   - **"Metrics"** tab
   - **"Testing"** tab
   - **"Source"** tab

2. **Click "Logs"** tab

If you don't see a Logs tab, try:

### Alternative: View Logs via Cloud Logging

1. **Click the function name** → Look for a **"View logs"** link or button
2. **Or go directly to Cloud Logging**:
   - Click this link: https://console.cloud.google.com/logs/query?project=bible-community-b5afa
   - In the search box, paste:
     ```
     resource.type="cloud_function"
     resource.labels.function_name="ext-firestore-send-email-processqueue"
     ```
   - Click "Run query"
   - You should see logs from the function

---

## Step 2: Check What the Function Processed

Since it shows **"1 request"**, it did process something! Let's see what happened:

1. **In the logs**, look for:

   - ✅ "Email sent successfully" - means it worked!
   - ❌ "Error" or "Failed" - means there was a problem
   - "Processing email document" - shows it's working

2. **Check the timestamp** - does it match when you created the test document?

---

## Step 3: Verify Email Was Sent

The function processed 1 request, which means:

- ✅ It detected your document in `mail` collection
- ✅ It tried to send the email
- ❓ But we don't know if it succeeded yet

**Check:**

1. **Your email inbox** (and spam folder)
2. **The logs** to see if there were any errors

---

## Step 4: Create Another Test Document

Since the function already processed 1 request, let's create a new one to see it process again:

1. **Go to Firestore** → **`mail` collection**
2. **Add a new document**:
   - `to`: `bophelompopo22@gmail.com`
   - `message` (map):
     - `subject`: `Second Test - $(new Date().toISOString())`
     - `html`: `<h1>Second Test</h1><p>Testing at ${new Date().toLocaleString()}</p>`
3. **Save**
4. **Watch the function** - the request count should go from 1 to 2
5. **Check logs immediately** after creating the document

---

## Quick Check: Is the Function Working?

The fact that it shows **"1 request"** is a good sign! It means:

- ✅ Extension is installed correctly
- ✅ Function is deployed and running
- ✅ It detected your document
- ❓ But we need logs to see if email was sent successfully

---

## Next Steps

1. **Find the Logs tab** or use Cloud Logging link above
2. **Share what you see in the logs** - any errors or success messages?
3. **Check your email** - did you receive anything?
4. **Create another test document** to see it process again

Let me know what you find in the logs!
