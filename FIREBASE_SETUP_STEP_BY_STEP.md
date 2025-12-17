# 🔥 Firebase Authentication Setup - Step by Step Guide

## 📋 Prerequisites

- ✅ Firebase project created
- ✅ Access to Firebase Console

## 🚀 Step 1: Navigate to Authentication

### 1.1 Open Firebase Console

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. Click on your **"Bible Community"** project (or whatever you named it)

### 1.2 Find Authentication Section

1. In the left sidebar, look for **"Authentication"**
2. Click on **"Authentication"**
3. You should see a page that says "Get started with Authentication"

## 🔐 Step 2: Enable Authentication Methods

### 2.1 Start Authentication Setup

1. Click the **"Get started"** button (blue button)
2. You'll be taken to the Authentication dashboard

### 2.2 Enable Email/Password Authentication

1. Click on the **"Sign-in method"** tab (at the top)
2. You'll see a list of providers
3. Find **"Email/Password"** in the list
4. Click on **"Email/Password"**
5. Toggle the **"Enable"** switch to ON
6. Click **"Save"**

### 2.3 Enable Google Authentication

1. Still in the **"Sign-in method"** tab
2. Find **"Google"** in the provider list
3. Click on **"Google"**
4. Toggle the **"Enable"** switch to ON
5. You'll see a **"Project support email"** field
6. Enter your email address (this is required)
7. Click **"Save"**

## 🗄️ Step 3: Set Up Firestore Database

### 3.1 Navigate to Firestore

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**

### 3.2 Choose Security Rules

1. Select **"Start in test mode"** (we'll secure it later)
2. Click **"Next"**

### 3.3 Choose Location

1. Select a location closest to your users (e.g., "us-central1" for US)
2. Click **"Done"**
3. Wait for the database to be created

## 📱 Step 4: Get Your Firebase Configuration

### 4.1 Go to Project Settings

1. In the left sidebar, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**

### 4.2 Add Web App

1. Scroll down to **"Your apps"** section
2. Click the **"</>"** icon (Web app icon)
3. Enter app nickname: **"Bible Community Web"**
4. Click **"Register app"**

### 4.3 Copy Configuration

1. You'll see a code block with your Firebase config
2. Copy the entire `firebaseConfig` object
3. It should look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef...",
};
```

## 🔧 Step 5: Update Your App Configuration

### 5.1 Update Firebase Config File

1. Open `config/firebase.js` in your project
2. Replace the placeholder values with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key-here",
  authDomain: "your-actual-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
};
```

### 5.2 Test Your Setup

1. Save the file
2. Run your app: `npx expo start`
3. Try to navigate to the authentication screen

## 🎯 Step 6: Test Authentication

### 6.1 Test Email Signup

1. Open your app
2. Navigate to the Community tab
3. Try to access a feature that requires authentication
4. You should see the authentication screen
5. Try creating an account with email/password

### 6.2 Check Firebase Console

1. Go back to Firebase Console
2. Click **"Authentication"** → **"Users"**
3. You should see your test user account

## 🛡️ Step 7: Set Up Security Rules (Important!)

### 7.1 Navigate to Firestore Rules

1. In Firebase Console, go to **"Firestore Database"**
2. Click on the **"Rules"** tab

### 7.2 Add Security Rules

1. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public posts can be read by authenticated users
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.authorId;
    }

    // Community data
    match /communities/{communityId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

## 📧 Step 8: Customize Email Templates (Optional)

### 8.1 Navigate to Templates

1. Go to **"Authentication"** → **"Templates"**
2. Click on **"Email address verification"**

### 8.2 Customize Verification Email

1. Update the subject line: **"Welcome to Bible Community - Verify Your Email"**
2. Customize the email body with your branding
3. Click **"Save"**

### 8.3 Customize Password Reset

1. Click on **"Password reset"**
2. Update the subject line: **"Reset Your Bible Community Password"**
3. Customize the email body
4. Click **"Save"**

## ✅ Step 9: Verify Everything Works

### 9.1 Test Complete Flow

1. **Sign Up** with a new email
2. **Check your email** for verification link
3. **Click the verification link**
4. **Sign In** with your account
5. **Test password reset** functionality

### 9.2 Check Firebase Console

1. Go to **"Authentication"** → **"Users"**
2. Verify your user appears
3. Check **"Firestore Database"** → **"Data"**
4. Verify user data is stored in the `users` collection

## 🚨 Troubleshooting

### Common Issues:

**1. "Firebase not initialized" error**

- Check that your config values are correct
- Make sure you copied the entire config object

**2. "Permission denied" error**

- Check your Firestore security rules
- Make sure they're published

**3. "Email not verified" error**

- Check your email for verification link
- Make sure you clicked the link

**4. "Google sign-in not working"**

- Make sure Google provider is enabled
- Check that project support email is set

### Debug Steps:

1. Check Firebase Console for error logs
2. Verify all configuration values
3. Test on a physical device (not just simulator)
4. Check network connectivity

## 🎉 Success Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password + Google)
- [ ] Firestore database created
- [ ] Configuration copied to app
- [ ] Security rules set up
- [ ] Email templates customized
- [ ] Test signup works
- [ ] Test signin works
- [ ] Test password reset works
- [ ] User data appears in Firestore

---

🎯 **You're all set!** Your Bible Community app now has enterprise-level authentication with Firebase! 🙏✨

## 📞 Need Help?

If you get stuck at any step:

1. Check the Firebase Console for error messages
2. Verify all configuration values are correct
3. Make sure you're testing on a physical device
4. Check that all authentication methods are enabled

Your authentication system is now production-ready! 🚀
