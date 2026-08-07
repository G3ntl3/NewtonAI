# Vercel Configuration

Each app in `apps/*` maps to its own Vercel project:
- student-web -> app.newtonai.example
- teacher-web -> teach.newtonai.example
- parent-web -> parent.newtonai.example
- admin-web -> admin.newtonai.example

Root Directory setting per project points at the corresponding `apps/<name>` folder.
