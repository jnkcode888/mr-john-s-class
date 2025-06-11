-- Create assignments table
CREATE TABLE assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assignment_submissions table
CREATE TABLE assignment_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    admission_number TEXT NOT NULL,
    file_path TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_assignment_admission UNIQUE (assignment_id, admission_number)
);

-- Create indexes for better query performance
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_submitted_at ON assignment_submissions(submitted_at);

-- Insert sample assignments
INSERT INTO assignments (title, description) VALUES
('Mathematics Assignment 1', 'Complete the calculus problems from Chapter 1'),
('Physics Lab Report', 'Write a detailed report on the pendulum experiment'),
('Chemistry Project', 'Research and present on chemical bonding'); 