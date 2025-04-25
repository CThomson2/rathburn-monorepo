Please have a look at the logs , production and inventory schemas on my Supabase project . I'm making this PWA app, and it has this view. This app will be used on barcode scanner mobile computers. I will have a hidden HTML input element to read keyboard wedge scan text inputs. If the inbput string includes one of the Drum IDs in the array shown, it increments the Progress counter up by 1, and turns the drumId badge green.

Right now I'm just using mock data, which you can see in

UX improvements:

remove visible text input (only used for testing)

prevent keyboard from appearing on touchscreen smartphone (can an attribute in the HTML input handle this, or some react state logic?)

enhance the popup with drum ID on each scan, making it more visible and contrasting. Perhaps it show a temporary overlay on the screen, dimming the background and showing clear black capital letters: "PEN-17234" for instance, with a flash of green for success.

add a scan log/history view, accessible by the floating control button

provide option to register all drums in a job (e.g. for a transport job of 80 drums delivered by supplier), but with a confirmation screen "Press to confirm" and reminder that this carries risk of jeopardising 100% accuracy, and that every action taken will be logged for auditing and traceability purposes

allow user with specific role (in my case, our production manager James) to "undo" scans. This will not delete the record in logs.drum_scan, but will add a new record with scan_type "cancel" - linking to the first via internal foreign key relation. This should visually undo the progress bar.

app settings options:

Turn on/off the warning for confirming registering all drums as scanned

set up default email or file location for CSV

backend functionality:

irrespective of what is sacnned, success or failure, everything must be inserted into logs.drum_scan table, which is set up to handle all possibilites of incoming scan data

write server action or API route handler for the POST request, with supabase auth authentication

review or rewrite SQL function which handles new rows in the drum_scan table, ensuring that it can handle all scenarios (test everything)

add a client side localstorage for session scans, and allow user to download CSV or have it emailed to them (or another email address)
