# **App Name**: MandalPulse

## Core Features:

- Secure OTP Authentication & Role Assignment: Users securely sign up and log in via OTP. The system assigns appropriate roles (user, reporter, admin, editor) and records associated location details (mandal, district) for personalization.
- Reporter News Submission Flow: Reporters can draft and submit new news articles, including a title, concise content, mandatory location tags (mandal, district), and upload an image. Submissions automatically enter a 'pending' state, ready for moderation.
- AI-Powered Content Generation Tool: An integrated AI tool for reporters to automatically generate catchy, concise headlines and summarize longer article content to fit specified length constraints, improving submission efficiency and quality.
- Admin/Editor News Moderation Dashboard: A dedicated interface for administrators and editors to review pending news posts, edit content if necessary, change submission status to 'approved' or 'rejected', and manage reported content.
- Personalized & Curated News Feed: Users receive a highly personalized feed, dynamically displaying only 'approved' news posts specifically tagged for their registered mandal or district, presented in a smooth, vertical-scroll format.
- Interactive Engagement Features: Allow users to express their interest and interact with news posts through 'like' functionality and a commenting system, fostering community involvement and real-time feedback.
- Robust Role-Based Access Control: Implement granular security rules to ensure each user role ('user', 'reporter', 'editor', 'admin') has appropriate read, write, and update permissions across all data collections, securing sensitive workflows like news approval and content submission.

## Style Guidelines:

- Primary color: A grounded and professional indigo-blue (#3468C8), evoking trust and digital clarity for key elements and interactive components.
- Background color: A serene and understated light blue-gray (#ECF0F7), providing a clean and easily readable canvas that complements the primary blue without being distracting.
- Accent color: A vibrant yet clean cyan (#19B4C8), strategically used for call-to-action buttons, highlights, and engagement indicators to provide clear visual cues and a touch of modernity.
- Body and headline font: 'Inter', a versatile sans-serif typeface, chosen for its modern, objective aesthetic and exceptional readability across all text sizes, ensuring a professional and accessible news consumption experience.
- Utilize a consistent set of minimalist line-style icons with clear visual metaphors to maintain a professional appearance. Icons should be easily discernible at small sizes and complement the app's clean aesthetic.
- Implement a content-first layout with generous white space to enhance readability. News items will follow a vertical scrolling paradigm, optimized for rapid consumption of localized information. Distinct sections for content creation, moderation, and user feed will ensure a streamlined experience for different roles.
- Subtle, fluid animations will enhance the user experience, including smooth transitions between news cards during vertical scrolling, responsive feedback on interactive elements (likes, comments), and elegant loading indicators for image and data fetching.