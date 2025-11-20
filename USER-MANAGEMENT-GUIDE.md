# 👥 User Management Guide

## Overview

Admins can now create and manage users directly from the web interface.

---

## 🔐 Access

**Who can access:** Admin users only

**How to access:**
1. Login as admin
2. Click **👥 Admin: Users** in the navigation menu

---

## ✅ Features

### 1. Create New Users
- Create admin or standard users
- Set email, password, name, and role
- Automatic password hashing for security

### 2. View All Users
- See complete user list
- View user status (Active/Inactive)
- See last login times
- Filter by role

### 3. Activate/Deactivate Users
- Deactivate users without deleting them
- Reactivate users at any time
- Preserves all user data

---

## 📝 How to Create a User

### Step 1: Click "Create New User"
```
[➕ Create New User]
```

### Step 2: Fill in the Form
```
Email:        user@example.com
Password:     ••••••••  (min 6 characters)
First Name:   John
Last Name:    Smith
Role:         User (Standard Access) ▼
```

### Step 3: Click "Create User"
```
[✓ Create User]
```

**Success!** The new user can now log in with their credentials.

---

## 👤 User Roles

### Admin (Full Access)
**Can do:**
- ✅ Create and manage projects
- ✅ View analytics dashboard
- ✅ See and edit cost rates
- ✅ Manage exchange rates
- ✅ Create and manage users
- ✅ Activate/deactivate users
- ✅ Access all admin features

### User (Standard Access)
**Can do:**
- ✅ Create and manage projects
- ✅ View analytics dashboard
- ✅ Search and filter projects
- ✅ Export data to Excel

**Cannot do:**
- ❌ See cost rates
- ❌ Manage cost rates
- ❌ Create or manage users
- ❌ Access admin features

---

## 🔄 Managing Existing Users

### View User Information
The user list shows:
- **Name** - Full name
- **Email** - Login email
- **Role** - Admin or User
- **Status** - Active or Inactive
- **Last Login** - When they last logged in
- **Created** - When account was created

### Deactivate a User
1. Find the user in the list
2. Click **[Deactivate]** button
3. User can no longer log in
4. All their data is preserved

### Reactivate a User
1. Find the deactivated user (shows "Inactive")
2. Click **[Activate]** button
3. User can log in again

---

## 🔒 Security Features

### Password Requirements
- **Minimum length:** 6 characters
- **Hashing:** Bcrypt (one-way hash)
- **Storage:** Only hash is stored, never plain text
- **Reset:** Passwords cannot be retrieved, only reset

### Email Validation
- Must be valid email format
- Must be unique (no duplicates)
- Case-insensitive

### Account Security
- Inactive users cannot log in
- JWT tokens expire after 24 hours
- Rate limiting prevents brute force attacks

---

## 📊 User List Display

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Name          Email              Role   Status   Last Login    Created   │
├──────────────────────────────────────────────────────────────────────────┤
│ John Admin    admin@co.com       ADMIN  Active   2024-11-20   2024-11-01│
│ Jane User     jane@co.com        USER   Active   2024-11-19   2024-11-15│
│ Bob Smith     bob@co.com         USER   Inactive Never        2024-11-10│
└──────────────────────────────────────────────────────────────────────────┘
```

**Color Coding:**
- **ADMIN** role - Purple badge
- **USER** role - Gray badge
- **Active** status - Green badge
- **Inactive** status - Red badge

---

## ⚠️ Important Notes

### Cannot Delete Users
- Users can only be deactivated, not deleted
- This preserves data integrity
- Audit trail remains intact

### Cannot Change Passwords
- Admins cannot see user passwords
- Admins cannot reset passwords via UI
- Users must contact admin for password reset
- Future enhancement: Self-service password reset

### Cannot Modify Existing Users
- Current version allows: Create, Activate, Deactivate
- Cannot edit: Name, Email, Role after creation
- Future enhancement: Full user editing

---

## 💡 Best Practices

### Creating Users
1. **Use work emails** - Company email addresses
2. **Strong passwords** - Minimum 6 chars, recommend 8+
3. **Correct role** - Double-check before creating
4. **Welcome email** - Send credentials securely (outside system)

### Managing Users
1. **Regular review** - Check user list monthly
2. **Deactivate promptly** - When staff leave
3. **Role assignment** - Give minimum necessary permissions
4. **Monitor logins** - Check "Last Login" column

### Security
1. **Don't share admin accounts** - Create individual admin users
2. **Rotate credentials** - Regular password changes
3. **Review access** - Audit who has admin rights
4. **Deactivate unused** - Clean up inactive accounts

---

## 🎯 Common Scenarios

### Scenario 1: New Employee
```
1. Click "Create New User"
2. Enter employee details
3. Set role as "User"
4. Click "Create User"
5. Send credentials to employee securely
```

### Scenario 2: Promote to Admin
```
Current: Cannot change role after creation
Workaround:
1. Create new admin account for user
2. Deactivate old user account
3. User logs in with new admin credentials
```

### Scenario 3: Employee Leaves
```
1. Find user in list
2. Click "Deactivate"
3. User cannot log in
4. Data preserved for records
```

### Scenario 4: Forgot Password
```
Current: No self-service reset
Process:
1. Admin creates new account with temp password
2. User logs in with new credentials
3. Deactivate old account
```

---

## 🔧 Technical Details

### API Endpoints Used
- `GET /api/auth/users` - Fetch all users
- `POST /api/auth/register` - Create new user (admin only)
- `PATCH /api/auth/users/:id/status` - Toggle user status

### Database Fields
- `id` - Unique user ID
- `email` - Login email (unique)
- `password` - Bcrypt hash
- `first_name` - First name
- `last_name` - Last name
- `role` - admin or user
- `active` - true/false
- `last_login` - Timestamp
- `created_at` - Account creation date

### Validation
- Email format validation
- Password minimum length (6)
- Required fields check
- Unique email constraint

---

## ✅ Summary

**Admin users can now:**
- ✅ Create new users (admin or standard)
- ✅ View all users in a table
- ✅ Activate/deactivate user accounts
- ✅ See user login history
- ✅ Manage team access

**Users created have:**
- ✅ Unique email login
- ✅ Secure password (hashed)
- ✅ Assigned role (admin/user)
- ✅ Active status
- ✅ Full audit trail

**Security maintained:**
- 🔒 Admin-only access
- 🔒 Password hashing
- 🔒 Email validation
- 🔒 Status control

---

**Added:** 2025-11-20
**Location:** Admin → Users menu
**Status:** ✅ Fully Implemented
