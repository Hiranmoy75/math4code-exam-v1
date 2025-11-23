-- Check if courses exist and their published status
SELECT id, title, is_published, created_by, created_at 
FROM courses 
ORDER BY created_at DESC;

-- Check if there are any published courses
SELECT COUNT(*) as published_count 
FROM courses 
WHERE is_published = true;

-- Check RLS policies on courses table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'courses';
