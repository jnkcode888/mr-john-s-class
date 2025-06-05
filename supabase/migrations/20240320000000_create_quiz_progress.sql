-- Create quiz_progress table
CREATE TABLE IF NOT EXISTS quiz_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    admission_number TEXT NOT NULL,
    student_name TEXT NOT NULL,
    answers JSONB DEFAULT '{}',
    current_question INTEGER DEFAULT 0,
    last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, admission_number)
);

-- Enable Row Level Security
ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own progress" ON quiz_progress;
DROP POLICY IF EXISTS "Students can insert their own progress" ON quiz_progress;
DROP POLICY IF EXISTS "Students can update their own progress" ON quiz_progress;

-- Create policies
-- Allow students to view their own progress
CREATE POLICY "Students can view their own progress"
ON quiz_progress
FOR SELECT
USING (admission_number = current_user);

-- Allow students to insert their own progress
CREATE POLICY "Students can insert their own progress"
ON quiz_progress
FOR INSERT
WITH CHECK (admission_number = current_user);

-- Allow students to update their own progress
CREATE POLICY "Students can update their own progress"
ON quiz_progress
FOR UPDATE
USING (admission_number = current_user);

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_quiz_progress_updated_at ON quiz_progress;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_quiz_progress_updated_at
    BEFORE UPDATE ON quiz_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 