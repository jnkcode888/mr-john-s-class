-- Create quizzes table
CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    choices JSONB NOT NULL, -- Array of strings
    correct_choice INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_choices CHECK (jsonb_typeof(choices) = 'array'),
    CONSTRAINT valid_correct_choice CHECK (correct_choice >= 0)
);

-- Create submissions table
CREATE TABLE submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    answers JSONB NOT NULL, -- Map of question_id to choice index
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    admission_number text,
    CONSTRAINT valid_answers CHECK (jsonb_typeof(answers) = 'object'),
    CONSTRAINT unique_quiz_admission UNIQUE (quiz_id, admission_number)
);

-- Create unit_notes table
CREATE TABLE unit_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create units table
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample quiz
INSERT INTO quizzes (title) VALUES ('Sample Math Quiz');

-- Insert sample questions
INSERT INTO questions (quiz_id, question_text, choices, correct_choice)
SELECT 
    id as quiz_id,
    'What is 2 + 2?' as question_text,
    '["3", "4", "5", "6"]'::jsonb as choices,
    1 as correct_choice
FROM quizzes
WHERE title = 'Sample Math Quiz';

INSERT INTO questions (quiz_id, question_text, choices, correct_choice)
SELECT 
    id as quiz_id,
    'What is 5 × 5?' as question_text,
    '["20", "25", "30", "35"]'::jsonb as choices,
    1 as correct_choice
FROM quizzes
WHERE title = 'Sample Math Quiz';

-- Insert additional questions (51-70) for quiz f7223861-d5da-4e13-9429-42b2a7a120b6
INSERT INTO questions (quiz_id, question_text, choices, correct_choice) VALUES
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you insert a non-breaking space in Word?', '["Press Space twice", "Insert → Symbol → Non-breaking Space", "Type underscore", "Ctrl + Space"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the difference between a page break and a section break?', '["No difference", "Section break starts a new document", "Page break starts a new page only", "Page break splits sections"]', 2),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you lock editing to specific parts of a document?', '["File → Save As", "Insert → Lock Text", "Review → Restrict Editing", "View → Protect"]', 2),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What does "Keep lines together" do in paragraph settings?', '["Prevents paragraph breaks", "Keeps the paragraph from splitting across pages", "Links sentences", "Forces page break"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How can you highlight all instances of a word without using Find?', '["Select → Similar Text", "Double-click", "Ctrl + H", "Paste"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What does Ctrl + Shift + 8 show in Word?', '["Table of contents", "Paragraph marks and hidden formatting", "Inserted images", "Font settings"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How is a multilevel list different from a regular numbered list?', '["Multilevel lists use Roman numerals", "Multilevel lists allow sub-levels", "They are the same", "Multilevel lists are only in tables"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you set different headers in different sections?', '["View → Split", "Insert → New Header", "Use Section Breaks and uncheck "Link to Previous"", "Copy and paste header"]', 2),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What does "Update automatically" do for inserted dates?', '["Saves document on a timer", "Sets a reminder", "Changes the date every time the document is opened", "Locks the date field"]', 2),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you insert a field code manually?', '["Insert → Field", "Type it", "View → Code", "Right-click → Generate"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What formatting marks does Ctrl + Shift + 8 toggle?', '["None", "Page numbers", "Hidden text", "Paragraph and hidden formatting marks"]', 3),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How can you hide text without deleting it?', '["Set font to white", "Select text → Home → Font → Hidden", "Move it to a footer", "Minimize text"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you compare two documents side by side?', '["View → Compare", "Insert → New", "File → Save Copy", "References → Cross-check"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the difference between Ctrl + Z and Ctrl + Y?', '["Undo and redo", "Copy and paste", "Zoom in and out", "Cut and repeat"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you password-protect a Word document for editing?', '["File → Export", "Review → Comments", "File → Info → Protect Document", "View → Security"]', 2),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How can you protect a form using content controls?', '["Use mail merge", "Add styles", "Use Developer tab → Restrict Editing", "Lock paragraphs"]', 2),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the function of linked text boxes?', '["Sharing formatting", "Text flows from one box to another", "Locking content", "Creating forms"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you rotate text vertically in a shape or text box?', '["Layout → Vertical", "Right-click → Text Direction", "Home → Orientation", "View → Flip"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you create a list of all figures in a document?', '["Insert → Table", "References → Insert Caption", "References → Insert Table of Figures", "View → Navigation"]', 2),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What are Quick Parts used for?', '["Auto-generating quizzes", "Saving reusable content like headers, signatures", "Image formatting", "Page numbering"]', 1);

-- Insert additional questions (21-50) for quiz f7223861-d5da-4e13-9429-42b2a7a120b6
INSERT INTO questions (quiz_id, question_text, choices, correct_choice) VALUES
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you update all fields in a document at once?', '["Right-click each field → Update Field", "Press Ctrl + A, then F9", "File → Save As", "View → Refresh"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the use of Paste Special?', '["Paste with formatting options like unformatted text or pictures", "Paste without permission", "Paste only numbers", "Paste macros"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you set the default font for new documents?', '["Home → Font → Set as Default", "File → Options → Fonts", "Insert → Text Box", "Review → Language"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you insert a clickable cross-reference?', '["Insert → Hyperlink", "References → Cross-reference", "View → Links", "File → Insert Link"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the difference between embedded and linked objects?', '["Embedded objects update automatically", "Linked objects are stored outside the document and update when changed", "Embedded objects are pictures", "Linked objects cannot be edited"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you show each reviewer's edits in different colors?', '["Review → Track Changes → Advanced Options", "File → Properties", "View → Color Mode", "Insert → Comments"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you create and apply custom styles?', '["Home → Styles → New Style", "Insert → Table", "Review → Comments", "Layout → Themes"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you center text vertically on a page?', '["Layout → Page Setup → Layout tab → Vertical alignment → Center", "Home → Center text", "View → Vertical Center", "Insert → Text Box"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What does the "Keep Text Only" paste option do?', '["Pastes text with all formatting", "Pastes text without any formatting", "Pastes images only", "Pastes hyperlinks only"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you recover text from a damaged document?', '["Use File → Open → Open and Repair", "Copy paste the file", "Use Ctrl + Z", "File → Export"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What does "Lock anchor" mean for an image?', '["Locks the image position to the page or paragraph", "Prevents resizing", "Makes image editable", "Changes image color"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you remove all formatting from selected text?', '["Select text → Home → Clear All Formatting", "Review → Delete", "Insert → Remove Style", "View → Plain Text"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the Navigation Pane used for in long documents?', '["Adding page numbers", "Browsing headings, pages, and search results", "Editing headers", "Comparing documents"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you repeat a table header on each page?', '["Select header row → Table Tools → Layout → Repeat Header Rows", "Insert → Header", "View → Repeat", "Table → Properties"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you change the line numbering format?', '["Layout → Line Numbers → Line Numbering Options → Customize", "Review → Track Changes", "Insert → Page Number", "View → Numbering"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you view all bookmarks in a document?', '["Insert → Bookmark → Show Bookmarks", "View → Bookmarks", "Review → Comments", "File → Info"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the Document Inspector used for?', '["Checking for hidden metadata or personal information", "Fixing grammar", "Formatting text", "Reviewing comments"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you create fillable form fields?', '["Insert → Table", "Developer tab → Controls", "Review → Comments", "Layout → Forms"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the difference between Normal and Draft view?', '["No difference", "Draft view hides images and formatting for faster editing", "Normal is for printing", "Draft is read-only"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How can you see styles applied to specific text?', '["Home → Styles Pane → Select Text", "View → Styles", "Review → Comments", "Insert → Style"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the Style Inspector?', '["A tool to see and fix style formatting on selected text", "A spell checker", "A thesaurus", "A table editor"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you convert footnotes to endnotes?', '["References → Show Notes → Convert Notes", "Insert → Endnote", "Review → Track Changes", "Layout → Breaks"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What is the difference between linking and embedding a chart?', '["Linking updates when source changes; embedding does not", "Embedding always updates", "Linking creates copies", "No difference"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you find and replace formatting (not just text)?', '["Ctrl + F", "Home → Replace → More → Format", "Insert → Replace", "Review → Track Changes"]', 1),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you change the default template for Word?', '["Save changes in Normal.dotm file", "File → Save As", "View → Templates", "Insert → Template"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What does "Widow/Orphan control" do?', '["Prevents a single line of paragraph from being left alone on a page", "Deletes extra paragraphs", "Adds spacing", "Changes font color"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you make a page border appear only on the first page?', '["Design → Page Borders → Options → Apply to First page only", "Insert → Shapes", "Layout → Margins", "View → Borders"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you insert a clickable email link?', '["Insert → Hyperlink → mailto:email@example.com", "Insert → Email", "Review → Links", "File → Info"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'What's the use of the Researcher tool in Word?', '["To find and add credible sources and content from within Word", "For grammar check", "To add pictures", "To print"]', 0),
('f7223861-d5da-4e13-9429-42b2a7a120b6', 'How do you enable auto-saving to OneDrive?', '["File → Save → OneDrive → Turn on AutoSave", "View → Sync", "Insert → Cloud", "Review → Save"]', 0);

-- Create indexes for better query performance
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_submissions_quiz_id ON submissions(quiz_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_unit_notes_unit_id ON unit_notes(unit_id);

-- Insert sample unit notes
INSERT INTO unit_notes (unit_id, title, content) VALUES
(1, 'Introduction to Basic Concepts', 'This unit covers the fundamental concepts...'),
(1, 'Getting Started Guide', 'A comprehensive guide to help you get started...'),
(2, 'Advanced Topics Overview', 'An overview of the advanced topics covered in this unit...');

-- Insert sample units
INSERT INTO units (title, description, icon) VALUES
('Unit 1: Introduction', 'Basic concepts and fundamentals', '📚'),
('Unit 2: Advanced Topics', 'Dive deeper into complex concepts', '🎯'),
('Unit 3: Practical Applications', 'Real-world examples and case studies', '💡'); 