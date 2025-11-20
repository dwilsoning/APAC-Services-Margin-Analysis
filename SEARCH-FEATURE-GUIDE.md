# 🔍 Project Search Feature Guide

## Overview

You can now search for individual projects using multiple criteria in the Analytics Dashboard.

---

## ✅ Search Fields Added

### 1. Contract Number
- **Field:** Text input with partial matching
- **Example:** Search "2024" to find all contracts containing "2024"
- **Use Case:** Find specific contracts quickly

### 2. Oracle ID
- **Field:** Text input with partial matching
- **Example:** Search "ORD-" to find all Oracle IDs starting with "ORD-"
- **Use Case:** Locate projects by Oracle system reference

### 3. Project Name
- **Field:** Text input with partial matching
- **Example:** Search "Migration" to find all migration projects
- **Use Case:** Find projects by name or keyword

---

## 🎯 How to Use

### Quick Search

1. Go to **Analytics Dashboard**
2. At the top of the page, you'll see three search fields:
   ```
   🔍 Contract Number  |  🔍 Oracle ID  |  🔍 Project Name
   ```
3. Type in any field (or multiple fields)
4. Click **🔍 Search** button
5. Results filter automatically

### Example Searches

**Find a specific contract:**
```
Contract Number: "C-2024-0015"
Oracle ID: [leave empty]
Project Name: [leave empty]
→ Click Search
```

**Find all migration projects:**
```
Contract Number: [leave empty]
Oracle ID: [leave empty]
Project Name: "migration"
→ Click Search
```

**Find Oracle projects for a client:**
```
Contract Number: [leave empty]
Oracle ID: "ORD"
Project Name: [leave empty]
Client: [Select specific client]
→ Click Search
```

---

## 🔄 Combining Search with Filters

You can combine search fields with other filters:

```
🔍 Contract Number: "2024"
🔍 Oracle ID: [empty]
🔍 Project Name: [empty]

Client: ABC Corporation
Start Date: 2024-01-01
End Date: 2024-12-31

→ Click Search
```

This will find:
- All projects with "2024" in contract number
- For ABC Corporation only
- Created in 2024

---

## 💡 Search Tips

### Partial Matching
All search fields use **partial matching** (LIKE search):
- "2024" will match "C-2024-001", "CONT-2024", "2024-PROJECT"
- "ORD" will match "ORD-123", "ORDER-456", "DISCORD"
- Case-insensitive (searches work regardless of caps)

### Clear All
Click the **Clear** button to reset all search fields and filters

### No Results
If no projects match your search:
```
No projects found. Create your first project to see analytics!
```
Try:
- Check spelling
- Use fewer search terms
- Clear some filters

---

## 📊 What Gets Filtered

When you search, both the **project list** and **statistics** update:

### Project List
- Shows only matching projects in the table
- All columns remain visible

### Statistics
- **Total Projects** - Count of matching projects only
- **Average Margin** - Based on filtered projects
- **Average PS Ratio** - Based on filtered projects
- **On Track / Below Target** - Counts from filtered projects only

---

## 📥 Export Filtered Results

The **Export to Excel** button exports only the filtered/searched projects:

1. Apply your search and filters
2. Click **📥 Export to Excel**
3. Downloaded file contains only visible/filtered projects

---

## 🎨 UI Layout

```
┌────────────────────────────────────────────────────┐
│  Search & Filters                                  │
├────────────────────────────────────────────────────┤
│                                                    │
│  🔍 Contract Number  🔍 Oracle ID  🔍 Project Name │
│  [_______________]  [___________]  [_____________] │
│                                                    │
│  Client          Start Date      End Date          │
│  [All Clients▼]  [YYYY-MM-DD]  [YYYY-MM-DD]  [🔍]│
│                                                [Clear]
└────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### Backend
- Uses SQL `LIKE` operator for partial matching
- Pattern: `%searchterm%` (matches anywhere in field)
- All searches are case-insensitive
- Multiple criteria combined with AND logic

### Frontend
- Real-time state management
- Debounced search (instant feedback)
- Filter state persists until cleared

### Database Queries
```sql
SELECT * FROM projects
WHERE contract_number LIKE '%2024%'
  AND oracle_id LIKE '%ORD%'
  AND project_name LIKE '%migration%'
ORDER BY created_at DESC
```

---

## 📋 Search Scenarios

### Scenario 1: Find Specific Contract
```
Input:   Contract Number = "C-2024-0123"
Result:  Exact contract match (or similar)
```

### Scenario 2: Find All Oracle Projects
```
Input:   Oracle ID = "ORD"
Result:  All projects with Oracle IDs containing "ORD"
```

### Scenario 3: Find Migration Projects for Q1 2024
```
Input:   Project Name = "migration"
         Start Date = "2024-01-01"
         End Date = "2024-03-31"
Result:  Migration projects in Q1 2024
```

### Scenario 4: Combined Search
```
Input:   Contract Number = "2024"
         Client = "ACME Corp"
         Project Name = "upgrade"
Result:  All 2024 upgrade contracts for ACME Corp
```

---

## ✅ Summary

**New Search Fields:**
- ✅ Contract Number (partial match)
- ✅ Oracle ID (partial match)
- ✅ Project Name (partial match)

**Works With:**
- ✅ Client filter
- ✅ Date range filters
- ✅ Excel export
- ✅ Statistics calculations

**Benefits:**
- 🚀 Fast project lookup
- 🎯 Precise filtering
- 📊 Accurate reporting
- 📥 Export specific results

---

**Added:** 2025-11-20
**Status:** ✅ Fully Implemented and Working
