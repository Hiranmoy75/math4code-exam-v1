-- Backfill Community Channels for Existing Courses

-- 1. Ensure all courses have community_enabled = TRUE (or as desired)
UPDATE courses 
SET community_enabled = TRUE 
WHERE community_enabled IS NULL OR community_enabled = FALSE;

-- 2. Insert default channels for ALL courses that don't have them yet
INSERT INTO community_channels (course_id, name, type, description)
SELECT id, 'announcements', 'announcement', 'Important updates and announcements from instructors'
FROM courses
WHERE community_enabled = TRUE
AND NOT EXISTS (
    SELECT 1 FROM community_channels 
    WHERE course_id = courses.id AND name = 'announcements'
);

INSERT INTO community_channels (course_id, name, type, description)
SELECT id, 'discussions', 'discussion', 'General discussions about the course'
FROM courses
WHERE community_enabled = TRUE
AND NOT EXISTS (
    SELECT 1 FROM community_channels 
    WHERE course_id = courses.id AND name = 'discussions'
);

INSERT INTO community_channels (course_id, name, type, description)
SELECT id, 'question-answer', 'qa', 'Ask questions and get help from peers and instructors'
FROM courses
WHERE community_enabled = TRUE
AND NOT EXISTS (
    SELECT 1 FROM community_channels 
    WHERE course_id = courses.id AND name = 'question-answer'
);
