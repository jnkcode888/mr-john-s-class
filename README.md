# Mr. John's Class - Educational Platform

A modern educational platform built with React, TypeScript, and Supabase, featuring quiz management, assignment submissions, and student progress tracking.

## 🚀 Features

### For Students

* Interactive quiz taking with immediate feedback
* Assignment submission system
* Progress tracking
* Real-time results
* Document upload support
* User-friendly interface

### For Administrators

* Quiz creation and management
* Assignment management
* Student submission tracking
* Performance analytics
* User management

## 🛠️ Tech Stack

* **Frontend:**  
   * React 18  
   * TypeScript  
   * Vite  
   * Chakra UI  
   * Framer Motion  
   * React Router  
   * React Query
* **Backend:**  
   * Supabase (PostgreSQL)  
   * Supabase Auth  
   * Supabase Storage

## 📦 Installation

1. Clone the repository:

git clone [repository-url]
cd mr-john-s-class

1. Install dependencies:

npm install

1. Create a `.env` file in the root directory with your Supabase credentials:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

1. Start the development server:

npm run dev

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── lib/           # Utility functions and configurations
├── types/         # TypeScript type definitions
└── App.tsx        # Main application component

```

## 📚 Database Schema

### Tables

1. **quizzes**  
   * id: uuid (primary key)  
   * title: string  
   * description: text  
   * created\_at: timestamp  
   * updated\_at: timestamp
2. **questions**  
   * id: uuid (primary key)  
   * quiz\_id: uuid (foreign key)  
   * question\_text: text  
   * options: jsonb  
   * correct\_answer: string  
   * points: integer
3. **submissions**  
   * id: uuid (primary key)  
   * quiz\_id: uuid (foreign key)  
   * student\_name: string  
   * admission\_number: string  
   * answers: jsonb  
   * score: integer  
   * created\_at: timestamp
4. **assignments**  
   * id: uuid (primary key)  
   * title: string  
   * description: text  
   * created\_at: timestamp  
   * updated\_at: timestamp
5. **assignment\_submissions**  
   * id: uuid (primary key)  
   * assignment\_id: uuid (foreign key)  
   * student\_name: string  
   * admission\_number: string  
   * document\_url: string  
   * created\_at: timestamp

## 🔐 Authentication

The platform uses Supabase Authentication for user management. Two main roles are supported:

1. **Students**  
   * Can take quizzes  
   * Submit assignments  
   * View their progress
2. **Administrators**  
   * Can create and manage quizzes  
   * Create assignments  
   * View and grade submissions  
   * Access analytics

## 🎯 Key Features Implementation

### Quiz System

* Dynamic quiz creation with multiple question types
* Real-time scoring and feedback
* Progress tracking
* Performance analytics

### Assignment System

* Document upload support
* Submission tracking
* Grading interface
* Progress monitoring

### Admin Dashboard

* Comprehensive overview of student performance
* Quiz and assignment management
* Submission tracking
* Analytics and reporting

## 🚀 Deployment

1. Build the project:

npm run build

1. Deploy to your preferred hosting platform (e.g., Vercel, Netlify)
2. Configure environment variables on your hosting platform

## 🔧 Development

### Available Scripts

* `npm run dev` \- Start development server
* `npm run build` \- Build for production
* `npm run preview` \- Preview production build
* `npm run lint` \- Run ESLint
* `npm run type-check` \- Run TypeScript type checking

### Code Style

* Follow TypeScript best practices
* Use functional components with hooks
* Implement proper error handling
* Write meaningful comments
* Follow the existing code structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

* \[Your Name/Team\]

## 🙏 Acknowledgments

* Chakra UI for the component library
* Supabase for the backend infrastructure
* React team for the amazing framework
