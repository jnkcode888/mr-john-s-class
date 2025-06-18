-- Enable RLS on quizzes table
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to quizzes
CREATE POLICY "Allow public read access to quizzes"
ON quizzes
FOR SELECT
TO public
USING (true);

-- Enable RLS on questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to questions
CREATE POLICY "Allow public read access to questions"
ON questions
FOR SELECT
TO public
USING (true);

-- Enable RLS on submissions table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to submissions
CREATE POLICY "Allow public read access to submissions"
ON submissions
FOR SELECT
TO public
USING (true);

-- Create policy to allow public insert access to submissions
CREATE POLICY "Allow public insert access to submissions"
ON submissions
FOR INSERT
TO public
WITH CHECK (true); 