import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://rvvgenxsprutwelzacff.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2dmdlbnhzcHJ1dHdlbHphY2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MTc5NDMsImV4cCI6MjA5ODk5Mzk0M30.dKITWCCV6Q6jsJ4lOkfA0VuV9SqJhJtpJz30H56UQL8'
)