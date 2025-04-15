# Mon 3 Mar Meeting Feedback

## Summary

### Main Points

- Director is happy to proceed with barcode scanner investment after the following is ironed out:
- Speak to workers to gain feedback on - the users - would envision the user interface as best tailored towards them
- Figure out the optimal method of implementing the passcode login/logout for the barcode scanner, keeping in mind that each time the scanner is shared between users, the passcode will need to be reset (i.e. initial user must be logged out; either manually or by an automated system process)
- We cannot rely on users to remember to log out every single time and to understand the importance of (not) doing so

Technical potential solutions:

- Use a physical button on the scanner to log out the current user
- Lock the scanner when placed in its case/holster/desk-stand, or wired to computer (if appropriate)
- Log out after a period of inactivity, and/or after a noticeable change in user's geographic location
- Use reminders on the app to log out the user
- Disable scanner's functionality functionality on each new "task", regardless of whether the user has logged out or not. I.e. if the user passes the scanner to someone else without logging out, that person can use it as normal to view the app. But as soon as they scan a barcode which is different from the last barcode scanned, the smartphone app issues a warning to the current user to verify their identity and log back in.
  - This cannot be too annoying or intrusive: ask what they'd feel about it, and whether this would work well i.e. 9/10 times each user only does one task and thus this warning would trigger correctly for the next user (which only occurs if intentionally/negligently they haven't logged in yet)
  - Also log and monitor the occurences of this event, and the logged in user at the time, with a red flag if the app is logged into by a different user within a short interval (indiciating that user 1 had passed the scanner to user 2 without logging out)
- Make workers _want_ to log out in order to keep their data and activity private from others, just like with their personal phone. This could be done by adding personal customisation to the app, passwords which they are told must be kept secret, allowing users to use other apps like social media on their break time on the phone etc.

## Details
