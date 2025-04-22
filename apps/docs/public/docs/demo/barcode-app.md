# Plan for Demonstration of new Mobile Barcode Scanning App

**Presenters:**

- [ ] Conrad

**Audience:**

- [ ] Terri
- [ ] James
- [ ] ***
- [ ] ***

**Apps to demo:**

> Mock data used throughout

**Web App**

- [ ] Viewing raw material stock levels
- [ ] Creating today's production schedule
  - [ ] Adding a new production order
  - [ ] Adding a new raw material
  - [ ] Setting quantity, date and item type (_from `items` table_)
- [ ] UX
  - Responsive design on selection of items (do we have enough items to schedule this order?)
  - If not enough stock, show warning and options:
    - Use existing stock material, but from another supplier/batch, or
    - Link to reorder material (with material input cell filled out)
- [ ] Confirmation popup ("Submit Production Schedule")
- [ ] Production order notification sent via Resend to barcode scanner devices' email inboxes (_ensure to turn on sound on devices_)

**Mobile App**

- [ ] Notification received on device
- [ ] Choice of production orders to fulfil
  - Order details show material type, quantity (with 0/X progress bar), scheduled distillation date, urgency
  - Clicking order self-assigns it, logging to other users that \<user> has taken this order (similar to Slack/Jira tickets)
- [ ] Barcode scanner
  - [ ] Activating scan context screen
  - [ ] Scanning drums; with progress bar filling up at top of view
  - [ ] Option to quick-scan a set of drums (available on goods inwards deliveries, with many drums (more than 20))
    - If selected, show confirmation screen, with warning: "Are you sure you want to log all drums as received? In case of discrepancy, your score will be affected."
    - _(Note: this is a demo of the barcode scanner app, so we don't need to worry about the logistics of actually scanning drums)_
    - _(Make it clear that this is still a risk, as it goes against the standard SOPs and may jeopardise the goal of 100% traceability as quick scanning is based on estimated quantities, without the system able to verify logged quantities like it does when scanning drum by drum)_
  - [ ] Success screen on order completion, with dialog component showing a "mission report" with stats and figures, as well as user XP and rank up animation
  - [ ] Further options:
    - Quit/pause an ongoing order
    - Unassign yourself from an order
    - Flag issue, which shows a dropdown menu of possible issues, with a text input to add a custom issue (e.g. "drum not sealed", "drum not clean", "missing drum", "wrong label/code", "other: \_\_\_")

**Goal:**

- [ ] Show the benefits of the mobile app over the web app, in terms of speed and convenience
- [ ] Show the benefits of the barcode scanner over manual data entry
- [ ] Demonstrate the management capability of the web app, with the ability to see all production orders and their status, as well as the ability to see all raw materials and their stock levels - and monitor barcode scanning activity and user audit logs
