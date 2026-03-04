-- SQL Schema for Nasiiba Coaching Advanced Features

-- 1. Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    thumbnail_url TEXT,
    duration TEXT DEFAULT '10 hours',
    lectures_count INTEGER DEFAULT 5,
    video_minutes INTEGER DEFAULT 60,
    views_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_distinguished BOOLEAN DEFAULT false,
    teacher_name TEXT DEFAULT 'Abdullahi Yusuf',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Lessons Table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('video', 'pdf', 'quiz')),
    content TEXT, -- Video URL, PDF URL, or Quiz JSON
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES auth.users(id),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES auth.users(id),
    course_id UUID REFERENCES courses(id),
    amount DECIMAL(10, 2),
    status TEXT DEFAULT 'completed', -- Can be 'pending' if using real payment gateway
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Students Profile (if not already existing with full fields)
-- The existing code mentions a 'students' table. Ensure it has the right fields.
-- CREATE TABLE students (
--     id UUID PRIMARY KEY REFERENCES auth.users(id),
--     full_name TEXT,
--     email TEXT,
--     whatsapp_number TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- 6. Blogs Table
CREATE TABLE blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    thumbnail_url TEXT,
    category TEXT DEFAULT 'General',
    author_name TEXT DEFAULT 'Abdullahi Yusuf',
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON blogs FOR SELECT USING (true);

-- Allow authenticated admin to manage blogs
-- Note: Replace 'info@nasiibacoaching.com' with the actual admin email if different
CREATE POLICY "Allow admin manage blogs" ON blogs 
    FOR ALL 
    USING (auth.jwt() ->> 'email' = 'info@nasiibacoaching.com');

