-- Function to notify ALL users when a new course is launched (published)
CREATE OR REPLACE FUNCTION notify_all_users_new_course()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the course is being published (either inserted as published or updated to published)
  IF (TG_OP = 'INSERT' AND NEW.is_published = true) OR
     (TG_OP = 'UPDATE' AND NEW.is_published = true AND OLD.is_published = false) THEN
     
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT 
      id, 
      'New Course Launched! 🚀', 
      'Check out our new course: ' || NEW.title, 
      'info', 
      '/courses/' || NEW.id
    FROM public.profiles;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for courses table
DROP TRIGGER IF EXISTS on_course_published ON public.courses;
CREATE TRIGGER on_course_published
AFTER INSERT OR UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION notify_all_users_new_course();


-- Function to notify enrolled users when a new lesson is added to a PAID course
CREATE OR REPLACE FUNCTION notify_enrolled_users_new_lesson()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id uuid;
  v_course_title text;
  v_course_price numeric;
BEGIN
  -- Get course details via module
  SELECT c.id, c.title, c.price
  INTO v_course_id, v_course_title, v_course_price
  FROM public.modules m
  JOIN public.courses c ON m.course_id = c.id
  WHERE m.id = NEW.module_id;

  -- Only proceed if course exists and is PAID (price > 0)
  IF v_course_price > 0 THEN
    
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT 
      e.user_id, 
      'New Lesson Added 📚', 
      'A new lesson "' || NEW.title || '" has been added to ' || v_course_title, 
      'info', 
      '/learn/' || v_course_id || '?lessonId=' || NEW.id
    FROM public.enrollments e
    WHERE e.course_id = v_course_id AND e.status = 'active';
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lessons table
DROP TRIGGER IF EXISTS on_lesson_added ON public.lessons;
CREATE TRIGGER on_lesson_added
AFTER INSERT ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION notify_enrolled_users_new_lesson();
