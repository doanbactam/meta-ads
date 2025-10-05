# E2E Testing - Installation & Setup Guide

## 🚀 Quick Installation

### Step 1: Install Playwright

```bash
npm install --save-dev @playwright/test
```

### Step 2: Install Browsers

```bash
npx playwright install
```

This will install:
- Chromium
- Firefox  
- WebKit (Safari)

### Step 3: Setup Environment

```bash
cp .env.test.example .env.test.local
```

Edit `.env.test.local`:

```env
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=your_test_email@example.com
TEST_USER_PASSWORD=YourTestPassword123!
TEST_FACEBOOK_ACCESS_TOKEN=your_test_token
TEST_FACEBOOK_APP_ID=your_app_id
```

---

## ✅ Verify Installation

### Run Your First Test

```bash
npm run test:e2e:ui
```

This opens Playwright UI where you can:
- See all tests
- Run individual tests
- Debug tests
- View test results

---

## 📖 Common Commands

```bash
# Run all tests
npm run test:e2e

# Run with UI (best for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# Run specific browser
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit

# View last report
npm run test:e2e:report
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module '@playwright/test'"

**Solution:**
```bash
npm install --save-dev @playwright/test
```

### Issue: "Browsers not installed"

**Solution:**
```bash
npx playwright install --with-deps
```

### Issue: "Dev server not starting"

**Solution:**
```bash
# Start dev server manually in another terminal
npm run dev

# Then run tests
npm run test:e2e
```

### Issue: "Tests timing out"

**Solution:**
- Check if dev server is running
- Increase timeout in `playwright.config.ts`
- Check network connection

---

## 📚 Next Steps

1. Read `e2e/README.md` for complete documentation
2. Explore test files in `e2e/tests/`
3. Try running tests with `npm run test:e2e:ui`
4. View `E2E_TESTING_COMPLETE.md` for details

---

## 🎯 Quick Test Run

```bash
# 1. Ensure dev server is running
npm run dev

# 2. In another terminal, run tests
npm run test:e2e

# 3. View report
npm run test:e2e:report
```

---

## ✨ Success!

You should see:
- ✅ Tests running in Playwright
- ✅ Browser windows opening
- ✅ Tests passing/failing
- ✅ HTML report generated

**Happy Testing!** 🎉
