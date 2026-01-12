# OrderHelper Pro

A modern order management system with VIP member tracking, draft management, and GitHub backup integration.

## 🚀 Quick Start

### Running the Application

**Important:** This application uses ES6 modules and must be run through an HTTP server (cannot use `file://` protocol).

#### Option 1: Use the provided script (Recommended)
```bash
./start-server.sh
```

Then open: **http://localhost:8000**

#### Option 2: Python HTTP Server
```bash
python3 -m http.server 8000
```

#### Option 3: Node.js http-server
```bash
npm install -g http-server
http-server -p 8000
```

#### Option 4: VS Code Live Server
1. Install the "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

## 📁 Project Structure

```
OrderHelper/
├── index.html              # Main application
├── start-server.sh         # Quick start script
├── css/
│   ├── base.css           # Base styles
│   ├── components.css     # Component styles
│   ├── layout.css         # Layout styles
│   ├── utilities.css      # Utility classes
│   └── variables.css      # CSS variables
├── js/
│   ├── app.js             # Application bootstrap
│   ├── config.js          # Configuration & constants
│   ├── core/              # Core business logic
│   │   ├── draft.js       # Draft management
│   │   ├── order.js       # Order operations
│   │   ├── vip.js         # VIP member management
│   │   └── vipBalance.js  # VIP balance calculations
│   ├── services/          # External services
│   │   └── github.js      # GitHub backup service
│   └── utils/             # Utility functions
│       ├── formatters.js  # Formatting utilities
│       ├── storage.js     # Storage operations
│       ├── dom.js         # DOM utilities
│       └── selfTest.js    # Self-testing utilities
└── DB/                    # Data backups

Total: ~10,675 lines of code
  - Modules: 2,315 lines (11 files)
  - Inline: ~7,360 lines
```

## 🏗️ Architecture

### Modular Design

The application follows a modular architecture with clear separation of concerns:

- **Config:** Centralized configuration and constants
- **Core:** Business logic (orders, VIP, drafts)
- **Services:** External integrations (GitHub)
- **Utils:** Reusable utilities (formatters, storage, DOM)

### Module System

Uses ES6 modules (`import/export`) for:
- Better code organization
- Easier testing
- Reusable components
- Clear dependencies

### Key Features

1. **Order Management**
   - Create and track orders
   - Calculate pricing with profit margins
   - Split shipping costs
   - Order history with filtering

2. **VIP Member System**
   - Member balance tracking
   - Transaction history
   - Top-up and cash-out
   - Automatic balance reconciliation

3. **Draft Management**
   - Auto-save drafts
   - Multiple draft storage
   - Draft restoration
   - iCloud backup (optional)

4. **GitHub Integration**
   - Automatic backup to GitHub
   - Configurable backup intervals
   - Version control for data

## 🔧 Technical Details

### Technologies

- **Frontend:** Vanilla JavaScript (ES6+)
- **Styling:** Custom CSS with CSS variables
- **Storage:** localStorage
- **Modules:** Native ES6 modules
- **Backup:** GitHub API

### Browser Requirements

- Modern browser with ES6 module support
- Chrome 61+, Firefox 60+, Safari 11+, Edge 16+

### No Build Step

This application runs directly in the browser without transpilation or bundling, demonstrating:
- Clean, readable code
- Direct debugging
- Fast development iteration
- No complex toolchain

## 📊 Code Metrics

- **Total Lines:** ~10,675
- **Modules:** 2,315 lines across 11 files
- **CSS:** 1,438 lines across 5 files
- **Functions:** 50+ extracted to modules
- **Code Organization:** ⭐⭐⭐⭐⭐

## 🎯 Development Approach

This codebase demonstrates:

1. **Pragmatic Refactoring**
   - Extracted high-value modules first
   - Maintained working application throughout
   - Clear patterns for future refactoring

2. **Modern JavaScript**
   - ES6+ features
   - Module system
   - Async/await
   - Arrow functions

3. **Clean Code Principles**
   - Single Responsibility
   - DRY (Don't Repeat Yourself)
   - Clear naming
   - Commented where necessary

4. **Testability**
   - Modular functions
   - Dependency injection
   - Pure functions where possible

## 📝 Notes

- Remaining inline code (~7,360 lines) consists mainly of:
  - Complex computation logic (`compute()`)
  - State management (global state variables)
  - UI glue code (event handlers)
  - Integration code (module coordination)

- Future improvements could include:
  - State management library (Redux/Zustand)
  - TypeScript for type safety
  - Unit tests for modules
  - Component framework (React/Vue)

## 🤝 Contributing

This is a demonstration project showcasing:
- Modular architecture
- Clean code practices
- ES6 modules
- Pragmatic refactoring

## 📄 License

Private project for portfolio demonstration.

## 👤 Author

Created as a demonstration of software engineering skills and architectural thinking.

---

**Built with ❤️ and modern JavaScript**
