# Release Notes - Github Issue [#25](https://github.com/CThomson2/rathburn-monorepo/issues/25)

## First Round of Feedback

Reviewers: Craig, Rafa

## Label design

- [ ] Make the barcode ID numbers on the labels larger for readability from afar

## QR Codes on label functionality

- [ ] Record the existing H number IDs along with new barcodes so we can review later during transition period (employees transporting drums and recording old H number ID)
- [x] Test the labels for scanning at distance

## App UX

- [x] Add a "Free Scan" option for new scanning sessions where users can scan any barcode without it being associated with a task (mainly used for real-life debugging)
- [ ] Use caching to prevent frequent re-loading of the task selection modal on open and close
- [ ] Show the completed sessions on reloading of page. Whenever a reload occurs, fetch data from the database for up-to-date scan session progress
- [ ] Remove the tasks that are already completed from the task selection modal `task-selection-modal.tsx`
- [ ] Completed Sessions now do not show up on the Task Selection menu anymore
- [ ] Task progress persists across sessions
- [ ] Buttons for task selection, cancellation etc. are now always in view regardless of screen size
- [ ] Error in simulataneous scanning sessions across multiple devices has been fixed - we can now use the same account on two devices without syncing issues
- [ ] In Free Scan mode, make the Gauge Counter increment by 1 for each scan, and show the scans in the `session-report.tsx` component

## Scanning functionality

- [ ] Set up the same suffix to the barcode scanning devices to auto-send a scan on pressing 'Enter' or '\'

-

## Misc

- [ ] Remove the 14 Caldic Isohexane order to replace it for the Cyclohexane batch
- [ ] Create new labels for the Toluene and n-Propanol (currently have older labels from a month ago). Same for the Pentane in the old site.
- [ ] Set the drums that Craig couldn't reach to be scanned in the DB. E.g. ICC Acetonitrile (17/20 scanned), remainder of the GeoCentric Hexane 99%.

---

Other Notes

- [ ] Use an npm patch to update the version number in the package.json file
- [ ] Integrate this into the `deploy.yml` CI/CD pipeline script on pushes to main
- [ ] Update the `README.md` file with the latest version number
- [ ] Update the Release Notes in the `page.tsx` Bento Grid release notes section

---

## Release Notes

### Mobile App

- [ ] Completed Sessions now do not show up on the Task Selection menu anymore
- [ ] Task progress persists across sessions
- [ ] Buttons for task selection, cancellation etc. are now always in view regardless of screen size
- [ ] Error in simulataneous scanning sessions across multiple devices has been fixed - we can now use the same account on two devices without syncing issues

### Web App

- [ ] Home page `page.tsx` shows a Bento Grid layout with workflows, user guides, release notes, page links, link to mobile app, and inventory KPIs.
