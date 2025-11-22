# Test Series Attempt Tracking - Setup Guide

## Current Issue
The attempt statistics (number of attempts, best score, remaining attempts) are not showing on the test series page because the required database column is missing.

## ✅ What's Already Fixed in Code
1. **Stats Display Logic** - Shows attempts made, best score, and remaining attempts
2. **Button Logic** - Properly disables "Retake Exam" when no attempts are left
3. **Graceful Handling** - Works even if `max_attempts` column doesn't exist (shows "Unlimited attempts")

## ⚠️ What You MUST Do

### Step 1: Run This SQL in Supabase SQL Editor

```sql
-- Add max_attempts column to test_series_exams table
ALTER TABLE public.test_series_exams 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.test_series_exams.max_attempts IS 
'Maximum number of attempts allowed for this exam. NULL or 0 means unlimited attempts.';
```

### Step 2: Set Max Attempts for Your Exams (Optional)

If you want to limit attempts, update the test_series_exams table:

```sql
-- Example: Set max 3 attempts for a specific exam in a test series
UPDATE public.test_series_exams 
SET max_attempts = 3 
WHERE test_series_id = '3033e82a-5972-421f-abab-a5e850f2b6e6' 
AND exam_id = 'YOUR_EXAM_ID';

-- Or set for all exams in a series
UPDATE public.test_series_exams 
SET max_attempts = 3 
WHERE test_series_id = '3033e82a-5972-421f-abab-a5e850f2b6e6';
```

## 📊 How It Works After Setup

### For Each Exam Card, Students Will See:

1. **📝 Attempts Made**
   - Blue badge showing "2 Attempts" (or however many they've taken)
   - Always visible if enrolled

2. **🏆 Best Score**
   - Green badge showing "Best: 85.50 marks"
   - Only shows if they've attempted at least once

3. **⏳ Remaining Attempts**
   - Amber badge showing:
     - "3 attempts left" (if max_attempts = 5 and they've done 2)
     - "Unlimited attempts" (if max_attempts is NULL or 0)
     - "No attempts left" (if they've used all attempts)

### Button Behavior:

- **"Start Exam"** - Shows if never attempted
- **"Retake Exam"** - Shows if attempted but has attempts remaining
- **"No Attempts Left"** (Disabled) - Shows if max attempts reached
- **"Locked"** (Disabled) - Shows if not enrolled

## 🔍 How to Verify It's Working

1. **Check Database:**
   ```sql
   -- Verify column exists
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'test_series_exams' 
   AND column_name = 'max_attempts';
   ```

2. **Check Test Series Page:**
   - Navigate to: `/student/my-series/3033e82a-5972-421f-abab-a5e850f2b6e6`
   - You should see the three badges on each exam card
   - Button should change based on attempts

3. **Test the Flow:**
   - Take an exam and submit it
   - Return to test series page
   - Stats should update showing 1 attempt and your score
   - If max_attempts is set, remaining should decrease

## 🐛 Troubleshooting

### Stats Not Showing?
- **Check:** Did you run the SQL migration?
- **Check:** Are you enrolled in the test series?
- **Check:** Open browser console for any errors

### Button Still Shows "Retake" When No Attempts Left?
- **Check:** Is `max_attempts` set in the database?
- **Check:** Refresh the page after submitting an exam
- **Check:** Verify submitted attempts in `exam_attempts` table

### "Unlimited attempts" Showing When It Shouldn't?
- **Check:** `max_attempts` value in database
- **Check:** If it's NULL or 0, it will show unlimited
- **Fix:** Set a specific number: `UPDATE test_series_exams SET max_attempts = 3 WHERE ...`

## 📝 Database Schema Reference

```sql
-- test_series_exams table structure
CREATE TABLE test_series_exams (
  id UUID PRIMARY KEY,
  test_series_id UUID REFERENCES test_series(id),
  exam_id UUID REFERENCES exams(id),
  exam_order INTEGER,
  max_attempts INTEGER DEFAULT NULL,  -- ← This is the new column
  created_at TIMESTAMP
);
```

## 🎯 Default Behavior

**Without running the migration:**
- Stats will show "Unlimited attempts"
- Students can retake exams indefinitely
- Attempt count and best score will still display

**After running the migration:**
- You can control attempts per exam
- Set `max_attempts = NULL` for unlimited
- Set `max_attempts = 1` for one-time exams
- Set `max_attempts = 3` for practice exams, etc.
