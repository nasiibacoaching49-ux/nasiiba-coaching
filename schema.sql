-- SQL Schema for Nasiiba Coaching Advanced Features

-- 1. Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    thumbnail_url TEXT,
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
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
