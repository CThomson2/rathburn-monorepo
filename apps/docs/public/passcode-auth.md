# Mobile App Passcode System: User Guide

## What is the Passcode System?

The Rathburn Chemicals mobile app uses a secure passcode system to keep the app and your data safe. Instead of remembering complex passwords, you can use a simple 4-digit passcode to quickly access the inventory management system on the go.

## How It Works

### Setting Up Your Passcode

If you already have a Rathburn account for the main web application, you can use the "Create Mobile Passcode" option on the login screen.

You'll need:

- Your preferred username for the mobile app
- Your Supabase User ID (ask your administrator if you don't know this)
- A 4-digit passcode that you can easily remember

### Logging In

1. Enter your username
2. Enter your 4-digit passcode
3. Tap "Sign In"

## Security Features

### Your Passcode is Secure

Your passcode is never stored as plain text. When you create or change your passcode, our system:

- Applies industry-standard encryption
- Stores only the encrypted version (called a "hash")
- Adds a unique security element (called a "salt") to ensure that even identical passcodes appear different in the system

This means:

- No one, not even system administrators, can see your actual passcode
- If someone ever gained unauthorized access to the database, they still couldn't determine your passcode
- Your passcode remains secure even if a device is lost or stolen

### Account Protection

For your security, the system includes additional protections:

- After 5 failed login attempts, your account will be temporarily locked for 5 minutes
- The lockout period helps prevent unauthorized attempts to guess your passcode
- You'll see how many attempts remain before a lockout occurs

## Resetting Your Passcode

If you forget your passcode:

1. Tap "Forgot passcode?" on the login screen
2. Enter your username
3. A secure reset link will be sent to the email address associated with your account
4. Follow the link to create a new 4-digit passcode

The reset link:

- Can only be used once
- Expires after one hour
- Provides a secure way to regain access to your account

## Connection to Your Main Account

The mobile passcode system is securely connected to your main Rathburn account:

- Your mobile login credentials are linked to your primary user account
- This means actions you take on the mobile app are properly attributed to you
- The system maintains consistent access controls across both the web and mobile platforms

## Need Help?

If you have any issues with your passcode:

- Contact your supervisor for immediate assistance
- Email conrad@rathburn.app for technical help
- Call the IT helpdesk at (555) 123-4567
