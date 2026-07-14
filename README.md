# GradClear Portal

A digital graduation clearance management system. Students move through five departments — Faculty, Bursary, Library, Clinic, and DSC — and must receive sign-off from each before they are fully cleared.

---

## Getting Started

**The only thing you need:** [Node.js](https://nodejs.org/en/download) (v18 or higher)

Once Node.js is installed, open a terminal in the project folder and run:

```bash
npm install
```

Then start the app:

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

That's it. No accounts, no credentials, no extra setup.

---

## How to Use the App

### Logging In

On the login page you have two options:

1. **Quick Demo Login** *(recommended for testing)* — Creates a temporary account instantly. Just pick a role from the dropdown before clicking it.
2. **Login / Register** — Enter any email and password. If the account doesn't exist it will be created automatically.

### Roles

| Role | What they see |
|------|--------------|
| **Student** | Their own clearance progress. Can upload required documents for their current stage. |
| **Faculty Admin** | All students currently at the Faculty stage. Can approve or halt each one. |
| **Bursary Admin** | All students currently at the Bursary stage. |
| **Library Admin** | All students currently at the Library stage. |
| **Clinic Admin** | All students currently at the Clinic stage. |
| **DSC Admin** | All students currently at the DSC stage. |
| **Central Admin** | Every student in the system. Can force-clear any student. |

---

## The Clearance Workflow

Students move through five stages **in order**:

```
Faculty  →  Bursary  →  Library  →  Clinic  →  DSC  →  Fully Cleared
```

**Step-by-step:**

1. A student logs in and sees their current stage (starts at Faculty)
2. They upload all required documents for that stage
3. The relevant department admin logs in, sees the student in their roster, and clicks **Approve**
4. The student is automatically advanced to the next stage
5. This repeats until all five stages are complete

A department admin can also click **Halt** if there is an issue — the student receives a notification explaining what action is required, and can upload a corrected document to resolve it.

---

## Running Multiple Roles at Once

To test the full workflow (e.g. approving a student as an admin while viewing the student dashboard), open the app in two different browsers or use a normal window + a private/incognito window — each can be logged into a different role simultaneously.

---

## Tech Stack

- **Frontend:** React + TypeScript, Vite
- **Authentication:** Firebase Auth (email/password)
- **Database:** Firebase Firestore
- **File Storage:** Firebase Storage
- **Dev Server:** Express + Vite middleware
