# The Minecraft Server Generator - Frontend

A modern React-Vite-Tailwind CSS web application for creating Minecraft Java Edition servers.

## 🎮 Features

- **Landing Page**: Modern hero section with Minecraft aesthetics
- **User Authentication**: Sign up and login pages with form validation
- **Dashboard**: Server management interface
- **Responsive Design**: Mobile-friendly layout
- **Minecraft Theme**: Custom color palette and styling inspired by Minecraft

## 🚀 Getting Started

### Prerequisites

- Node.js (v20.19+ or v22.12+ recommended, currently running on v20.17.0)
- npm or yarn

### Installation

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Header.jsx     # Navigation header
│   │   ├── Footer.jsx     # Footer with social links
│   │   └── CustomAlert.jsx # Custom alert component
│   ├── pages/             # Page components
│   │   ├── LandingPage.jsx    # Home/landing page
│   │   ├── SignUpPage.jsx     # User registration
│   │   ├── LoginPage.jsx      # User login
│   │   └── DashboardPage.jsx  # User dashboard
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles with Tailwind
├── public/                # Static assets
├── index.html             # HTML template
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Project dependencies

```

## 🎨 Design System

### Colors

The app uses a Minecraft-inspired color palette:

- **Green**: `#00AA00` (primary actions)
- **Brown**: `#8B4513` (secondary actions)
- **Grass**: `#7CBD6B` (accents)
- **Dark variants** for hover states

### Fonts

- **Headings**: Press Start 2P (Minecraft-style pixel font)
- **Body**: Inter (modern, clean sans-serif)

### Components

Custom Tailwind classes are available:

- `.btn-primary` - Primary button (green)
- `.btn-secondary` - Secondary button (brown)
- `.input-field` - Styled input fields
- `.card` - Card container with shadow

## 📄 Pages

### Landing Page (`/`)

- Hero section with Minecraft character
- Feature highlights
- Call-to-action buttons

### Sign Up (`/signup`)

- Email validation
- Password strength requirements (min 8 characters)
- Password confirmation
- Show/hide password toggles
- Custom success alert

### Login (`/login`)

- Email and password fields
- Remember me option
- Social login options (Google, GitHub)
- Forgot password link

### Dashboard (`/dashboard`)

- Server statistics
- Script execution button
- Upcoming features placeholders

## 🔧 Customization

### Replace Minecraft Skin

The landing page uses a default Steve skin from `https://mc-heads.net/avatar/steve/400`. To use a custom skin:

1. Add your PNG image to the `public` folder
2. Update the image source in `src/pages/LandingPage.jsx`:

```jsx
<img src="/your-custom-skin.png" alt="Minecraft Character" className="..." />
```

### Update Social Media Links

Edit `src/components/Footer.jsx` to update social media URLs:

```jsx
<a href="https://github.com/YOUR_USERNAME" ...>
<a href="https://twitter.com/YOUR_USERNAME" ...>
<a href="https://linkedin.com/in/YOUR_USERNAME" ...>
```

## 🛠️ Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## 📦 Technologies Used

- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router DOM 7** - Client-side routing
- **PostCSS** - CSS transformations
- **Autoprefixer** - CSS vendor prefixing

## 🎯 Future Enhancements

- [ ] Backend API integration
- [ ] Server creation wizard
- [ ] Real-time server status monitoring
- [ ] Server configuration editor
- [ ] Plugin/mod management
- [ ] User profile settings
- [ ] Email verification system
- [ ] OAuth authentication

## 👤 Author

**diego4lbarracin**

- Email: diegoalbarracin0405@gmail.com
- GitHub: [@diego4lbarracin](https://github.com/diego4lbarracin)

## 📝 License

This project is part of The Minecraft Server Generator.

---

Developed with ❤️ by diego4lbarracin
