# Hours Calculation Logic - Simplified

## ✅ New Improved Logic

### How It Works:

1. **Enter Baseline Hours** (Required)
   - This is your budgeted/contracted hours for the project
   - Example: Client approved 1000 hours

2. **Allocate Hours to Resources**
   - Enter hours for each role (Project Manager, Developer, etc.)
   - System automatically sums these up = **Total Allocated Hours**
   - Example: PM (200) + Dev (600) + QA (300) = 900 hours

3. **System Calculates Non-Bill Hours Automatically**
   - If Total Allocated > Baseline Hours, the variance = **Non-Bill Hours**
   - Example: 950 allocated - 1000 baseline = 0 non-bill (under budget ✅)
   - Example: 1100 allocated - 1000 baseline = 100 non-bill hours (over budget ⚠️)

### Visual Display:

When you enter baseline hours and allocate resources, you'll see:

```
┌─────────────────────────────────────────────────────────┐
│  Baseline Hours: 1000.00                                │
│  Total Allocated: 1100.00                               │
│  Non-Bill Hours: 100.00 ⚠️ Over baseline by 100 hours  │
└─────────────────────────────────────────────────────────┘
```

**Green Border** = On budget or under budget
**Yellow Border** = Over budget (has non-bill hours)

---

## 📊 Example Scenarios

### Scenario 1: Under Budget (Good!)
```
Baseline Hours:       1000
PM Hours:             200
Developer Hours:      600
QA Hours:             150
──────────────────────────
Total Allocated:      950
Non-Bill Hours:       0      ✅ Under budget!
```

### Scenario 2: Exactly On Budget (Perfect!)
```
Baseline Hours:       1000
PM Hours:             200
Developer Hours:      600
QA Hours:             200
──────────────────────────
Total Allocated:      1000
Non-Bill Hours:       0      ✅ Perfect match!
```

### Scenario 3: Over Budget (Warning)
```
Baseline Hours:       1000
PM Hours:             250
Developer Hours:      700
QA Hours:             200
──────────────────────────
Total Allocated:      1150
Non-Bill Hours:       150    ⚠️ 150 hours over baseline
```

---

## 🔢 Impact on Calculations

### Non-Bill Hours Are Included in Costs

When non-bill hours exist (over baseline), they are **included** in the total cost calculation:

**Example:**
- Baseline: 1000 hours
- Allocated: 1150 hours
- Non-Bill: 150 hours
- Average Cost Rate: $100/hr

**Cost Calculation:**
```
Total Cost = (All Resource Hours × Their Rates) + (Non-Bill Hours × Average Rate)
           = (PM: 250 × $150) + (Dev: 700 × $100) + (QA: 200 × $80) + (150 × $110 avg)
           = $37,500 + $70,000 + $16,000 + $16,500
           = $140,000
```

**Why this matters:**
- Non-bill hours reduce your margin
- They represent scope creep or underestimation
- System automatically accounts for them in profitability calculations

---

## 🎯 What Changed

### ❌ Old Confusing Way:
```
- Baseline Hours (optional)
- Total Baseline Hours (required)
- Non-Bill Hours (manual entry)
→ User had to manually calculate everything
→ Two "baseline" fields were confusing
```

### ✅ New Clear Way:
```
- Baseline Hours (required) → The budgeted amount
- System calculates Total Allocated automatically
- System calculates Non-Bill Hours automatically
→ No manual math needed
→ Real-time feedback as you allocate hours
```

---

## 💡 Business Logic

### What is "Baseline Hours"?
The hours you **sold to the client** or budgeted for the project. This is your target.

### What is "Total Allocated"?
The **actual hours** you've planned to use across all roles.

### What are "Non-Bill Hours"?
The **over-allocation** - hours you'll work but can't bill because you exceeded the baseline.

**Business Impact:**
- Non-bill hours = reduced profitability
- They're a red flag for project planning
- System includes them in cost calculations to show true margin

---

## 🖥️ UI Features

### Real-Time Calculation
As you type hours into resource fields, the summary updates instantly:
- ✅ Green numbers = good (under or at baseline)
- ⚠️ Yellow/Red numbers = warning (over baseline)

### Visual Feedback
- Green border = Project is within baseline
- Yellow border = Project exceeds baseline (has non-bill hours)

### Automatic Totaling
No need to use a calculator - the system adds everything up for you!

---

## 📝 Summary

**You only need to enter:**
1. Baseline Hours (your budget)
2. Hours for each resource role

**System automatically calculates:**
1. Total Allocated Hours (sum of all roles)
2. Non-Bill Hours (if over baseline)
3. All financial metrics (margin, PS ratio, etc.)

**Result:** Clear, simple, and accurate project planning! ✨

---

**Updated:** 2025-11-20
**Status:** ✅ Implemented
