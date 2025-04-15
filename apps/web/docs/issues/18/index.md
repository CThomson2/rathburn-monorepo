# Personalised Dashboards Broad Feature Proposal

## Purpose

> Provide users with personalised, workflow-curated and customisable route-protected dashboard pages on redirect after login and subsequent app loads.

### General Features

- Protected Routes, with full access permitted to authenticated user associated with a given route.
  - Important data on dashboards _is not hidden/protected_ - other public dashboard pages aggregate and show all business data
  - Protected is the user's customised dashboard configuration, as some widgets will be for messages, personal goals and performance/logbook/work history etc.
- Widgets can be individually protected from access with policies set by dashboard user using dashboard settings. Alternatively, entire dashboard may be kept private.
  - Each widget has a padlock button in the corner, for toggling between view-only (no edit icon), blank display to other users (padlock), or full viewing permissions (eye).
  - User must authenticate to change widget / full dashboard permissions (to verify it's actually the user associated with dashboard page). This promoted password secrecy (good thing), and prevents "fraud".
- Page UI is quite customisable
  - Widgets may be dragged and dropped, resized, and moved into secondary "favourites" view.
  - Some **widgets are fixed**, i.e. those which comprise actions necessary for effective completion of user's tasks, e.g. widget for creating a New Order record.
- Public pages will have a _Widget Library_, where users can select extra widgets to add to their personal dashboard.

### Planned Dashboards

- [ ] **Raw Materials & Purchase Orders**: Tailored for Gillian's digital tasks, and equipped with quick action widgets to view data of interest and related to her workflows.
- [ ] **Production Management**: Oriented and designed around James' workflow. Put yourself in his shoes - how would his ideal dashboard view be different from e.g. Gillian's?
- [ ] **Business Management**: general high-level page, sleek and professional theme, for use by site managers and directors.
  - [ ] Widgets to generate stock and operational reports
  - [ ] Shortcuts for management actions and sending out communications
  - [ ] Costs and billings info graphs for IT running costs, ROI on hardware investment
  - [ ] Documents including invoices, HMRC reports
  - [ ] Ability to manage aspects of app and database
  - [ ] Overall daily/weekly live operational updates
  - [ ] View of user activity
  - [ ] "Support ticket" widget for sending immediate email to me/admin for guidance/help with system
- [ ] **Documentation**:
  - [ ] Organised system documentation
  - [ ] Software docs
  - [ ] SOPs and training guides to download or view in-browser such as slides, videos
- [ ] **KPI data dashboard**: primary place for data visualisations fetched from DB data, comprising a variety of views and information.
- [ ] **Comms channel**: for internal communication
  - [ ] Sending and reading messages (public or private, also public updates dependent on role)
  - [ ] Read app notification logs
  - [ ] Operational logs
  - [ ] Sharing files and paperwork to print e.g. QRD011, test results
  - [ ] Quick template messages for regular updates, such as QC batch info, distillation updates. Select from a few inputs quickly, and full message is sent.
