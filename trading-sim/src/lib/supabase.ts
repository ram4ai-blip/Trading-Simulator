import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://skvwmspkbunmukuhmrda.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdndtc3BrYnVubXVrdWhtcmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzE0NjgsImV4cCI6MjA5OTAwNzQ2OH0.qewOoU7oMqyI8fCLp4l0it7INfaMYz4VC67udbgTv7E'
)
