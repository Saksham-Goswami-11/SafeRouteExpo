# 🔥 Live Reload / Fast Refresh Guide for SafeRoute AI

## ✅ How to Enable Live Reload

### Method 1: Enable Fast Refresh on Your Phone

1. **While the app is running on your phone:**
   - **Shake your device** (or press and hold with 3 fingers)
   - The developer menu will appear
   
2. **In the Developer Menu:**
   - Look for **"Fast Refresh"**
   - Make sure it's **ENABLED** (should show a checkmark)
   - If it's disabled, tap to enable it

3. **Alternative way to open dev menu:**
   - Press `m` in the Metro terminal (on your computer)

### Method 2: Using Terminal Commands

**Keep Metro Running:**
```bash
# Run this and KEEP THE WINDOW OPEN:
npx expo start --tunnel

# Or use the batch file:
.\start-live.bat
```

**In the terminal, you can:**
- Press `r` = Reload the app
- Press `m` = Open developer menu on phone
- Press `j` = Open debugger

## 🎯 Testing Live Reload

### Quick Test - Change Text:

1. Open `App.tsx`
2. Find this line (around line 75):
```tsx
<Text style={styles.greeting}>Welcome to SafeRoute! 🛡️</Text>
```

3. Change it to:
```tsx
<Text style={styles.greeting}>Hello Live Reload! 🔥</Text>
```

4. **Save the file (Ctrl+S)**

5. **Watch your phone - it should update in 1-2 seconds!**

## ⚡ Why Live Reload Might Not Work

### Common Issues & Fixes:

#### 1. Fast Refresh is Disabled
**Fix:** Shake phone → Enable Fast Refresh

#### 2. Metro Server Stopped
**Fix:** The terminal window must stay open! Don't close it.

#### 3. Connection Lost
**Fix:** 
- Make sure phone and PC are on same WiFi
- Restart the app on phone
- Press `r` in terminal

#### 4. Cache Issues
**Fix:**
```bash
# Clear everything and restart:
npx expo start --tunnel --clear
```

## 📱 Live Reload Settings on Phone

**To check/enable on your phone:**

1. **Shake device** to open dev menu
2. Check these settings:
   - ✅ **Fast Refresh** - MUST BE ON
   - ❌ **Debug** - Keep OFF for better performance
   - ✅ **Show Element Inspector** - Optional

## 🚀 Best Practices for Live Development

### DO's:
- ✅ Keep Metro terminal window open
- ✅ Save files after making changes (Ctrl+S)
- ✅ Keep Fast Refresh enabled
- ✅ Stay on same WiFi network

### DON'Ts:
- ❌ Don't close the Metro terminal
- ❌ Don't disconnect from WiFi
- ❌ Don't disable Fast Refresh

## 💡 Pro Tips

### 1. Test if Live Reload Works:
Change any text in the app and save - should update in 1-2 seconds

### 2. If Changes Don't Appear:
- First, check if Fast Refresh is enabled
- Press `r` in terminal to force reload
- Last resort: Close app and reopen

### 3. For Style Changes:
Sometimes you need to press `r` for style changes to fully apply

### 4. Keep Terminal Visible:
Keep the Metro terminal visible to see build progress and errors

## 🔄 Types of Changes

### ✅ Instant Updates (Fast Refresh):
- Text changes
- Style property changes
- Component content changes
- Adding/removing elements

### ⚠️ Requires App Reload (Press 'r'):
- Adding new packages
- Changing navigation structure
- Major structural changes

### 🔴 Requires Restart:
- Installing new native dependencies
- Changing app.json
- Platform-specific changes

## 📝 Quick Commands Reference

```bash
# Start with live reload:
npx expo start --tunnel

# In terminal while running:
r - Reload app
m - Open dev menu
j - Open debugger
shift+m - More tools

# On phone:
Shake - Open dev menu
```

## ✨ Testing Live Reload Now

1. **Make sure Metro is running** (don't close the terminal!)
2. **Open App.tsx**
3. **Change this line:**
```tsx
<Text style={styles.greeting}>Welcome to SafeRoute! 🛡️</Text>
```
To:
```tsx
<Text style={styles.greeting}>Live Reload Works! 🎉</Text>
```
4. **Save (Ctrl+S)**
5. **Watch your phone update instantly!**

---

## 🆘 Still Not Working?

Run this exact sequence:

1. Close the app on your phone
2. Run:
```bash
npx expo start --tunnel --clear
```
3. Scan QR code again
4. Shake phone → Enable Fast Refresh
5. Make a change and save

Your live reload should now work perfectly! 🚀