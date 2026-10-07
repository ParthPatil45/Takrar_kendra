# Smart Community Complaint Management System

**Report. Track. Resolve. Together.** — a Community Engagement Project (CEP) prototype.

A working web application where community members register, submit complaints (with a photo), and track them, while an administrator reviews, prioritises, assigns and resolves them. Built with plain **HTML, CSS and JavaScript** (no frameworks, no build step). Data is saved in the browser with **localStorage**.

> **Prototype notice:** localStorage is a demo database. Data stays in one browser, passwords are stored as plain text and the login checks run in the browser. This is **not secure**. A real deployment needs a server and database. No real SMS or email is sent — notifications are in-app only.

## Run it

1. Unzip the folder.
2. Double-click `index.html` (works directly from the folder), **or** serve it: `python3 -m http.server 8000` and open http://localhost:8000
3. To host free on GitHub Pages: push the folder to a repository → *Settings → Pages → Deploy from branch → main / root*.

## Demo logins

| Role | Email | Password |
|---|---|---|
| Community user | user@gmail.com | user123 |
| Administrator | admin@gmail.com | admin123 |

Anyone can also register a new community account. Admin accounts cannot be created from the public form.

## Folder structure

```
ccms-website/
├── index.html            Page shell, loads all scripts
├── README.md
├── css/
│   └── styles.css        All styling (responsive, accessible)
└── js/
    ├── config.js         Categories, statuses, priorities, teams, limits
    ├── util.js           Helpers: HTML escaping, dates, CSV download
    ├── storage.js        DATA LAYER: all localStorage access + sample data
    ├── auth.js           Register, login, logout, password reset
    ├── complaints.js     Workflow engine: create, admin update, filter, stats
    ├── ui.js             Icons, badges, form fields, tables, tracker, timeline
    ├── charts.js         SVG/CSS charts (no libraries)
    ├── layout.js         Public header/footer, dashboard sidebar, notifications
    ├── router.js         Hash router (#/page)
    ├── views-public.js   Landing, Login, Register, Admin Login, Forgot, Track
    ├── views-user.js     User dashboard, Submit, My Complaints, Details, Track, History, Profile
    ├── views-admin.js    Admin dashboard, lists, Complaint management, Users, Analytics, Settings
    └── app.js            Routes, access rules, start-up
```

## Main modules

- **Data layer (`storage.js`)** – the only file that touches localStorage. Users, complaints, notifications, settings and the login session each have a small repository. Replace these functions with API calls to connect a real backend.
- **Authentication (`auth.js`)** – validation, registration (role always *Community User*), login with role-based redirect, "remember me", password reset (demo).
- **Workflow engine (`complaints.js`)** – creates complaints (ID `CMP-YYYY-NNN`, status *Pending*), applies admin changes, writes timeline entries and notifications, filters/searches, computes statistics.
- **Router + access rules (`router.js`, `app.js`)** – `/user/*` pages need a user, `/admin/*` pages need an admin; others are redirected.
- **Views** – one function per page that returns HTML and attaches events.

## How the complaint workflow works

1. **Register / Login** – the user logs in and lands on the user dashboard.
2. **Submit** – category, title, description, location, date and optional photo are validated. A unique ID is generated, status is set to **Pending**, priority is "Not set", and the first timeline entry is added. Admins receive a notification.
3. **Admin checks** – the admin opens the complaint, sets **priority** (Low/Medium/High/Critical), **assigns** a team, writes **remarks**, and changes **status**.
4. **Work starts** – status **In Progress**; the timeline records it and the user is notified.
5. **Resolved** – status **Resolved** (a resolution note is required); the user is notified and the note appears in their history.
6. **User sees updates** – dashboard badges, the progress tracker (Submitted → Pending → In Progress → Resolved), the timeline and the notification bell all update from the same stored record.

## Ready for future features

The code is separated so these can be added later without rewriting everything: real backend/database and secure authentication (replace `storage.js` / `auth.js`), Google Maps (location field in the Submit form), SMS / email / push notifications (hook into `Store.Notifications.add`), automatic categorisation (before `Complaints.create`), multiple departments (teams list in Settings), multi-language (text is kept in the view files), mobile app (reuse the same API).
None of these integrations are implemented or faked in this prototype.
