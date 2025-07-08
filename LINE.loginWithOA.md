# LINE User Onboarding with Official Account Friend Addition

## Overview
When a user accesses your LIFF URL, you can combine authentication with Official Account friend addition using LINE's built-in consent flow.

## Implementation Strategy

### 1. LIFF Login with Bot Prompt Integration
```typescript
const handleLineWallet = async () => {
  const liffId = import.meta.env.VITE_LINE_LIFF_ID;
  
  return new Promise((resolve, reject) => {
    liff.init({ liffId }).then(() => {
      if (!liff.isLoggedIn()) {
        // Login with bot_prompt parameter
        liff.login({
          redirectUri: window.location.href,
          // Key parameter for Official Account addition
          scope: 'profile openid email',
          bot_prompt: 'aggressive' // or 'normal'
        });
      } else {
        // User is already logged in, get profile
        const profile = liff.getDecodedIDToken();
        resolve({
          provider: 'line',
          lineID: profile.sub,
          displayName: profile.name,
          pictureUrl: profile.picture,
          email: profile.email
        });
      }
    });
  });
};
```

### 2. Bot Prompt Options
- **`bot_prompt: 'aggressive'`** - Shows friend addition prompt during login (like your AggressiveConsent.png)
- **`bot_prompt: 'normal'`** - Less intrusive prompt
- **No bot_prompt** - Standard login only

### 3. Post-Login Friend Addition Check
```typescript
const checkOfficialAccountFriendship = async () => {
  try {
    // Check if user added the bot as friend
    const friendship = await liff.getFriendship();
    
    if (friendship.friendFlag) {
      console.log('User is friends with Official Account');
      // Store friend status
      sessionStorage.setItem('line_oa_friends', 'true');
    } else {
      console.log('User is not friends with Official Account');
      // Optionally show another prompt
      promptFriendAddition();
    }
  } catch (error) {
    console.log('Friendship check not available');
  }
};
```

### 4. Manual Friend Addition Prompt
```typescript
const promptFriendAddition = () => {
  // Show custom modal asking user to add bot
  const addBotModal = document.createElement('div');
  addBotModal.innerHTML = `
    <div class="bot-add-modal">
      <h3>Stay Connected with dePick</h3>
      <p>Add our bot to receive updates and notifications</p>
      <button onclick="addOfficialAccountFriend()">Add Friend</button>
      <button onclick="skipFriendAddition()">Skip</button>
    </div>
  `;
  document.body.appendChild(addBotModal);
};

const addOfficialAccountFriend = () => {
  // Use LINE's add friend URL
  const botId = 'YOUR_BOT_ID'; // Your LINE Official Account ID
  const addFriendUrl = `https://line.me/R/ti/p/${botId}`;
  window.open(addFriendUrl, '_blank');
};
```

## Complete Integration Flow

### Updated WalletModal.tsx Implementation:
```typescript
const handleLineWallet = async () => {
  const liffId = import.meta.env.VITE_LINE_LIFF_ID;
  
  return new Promise((resolve, reject) => {
    liff.init({ liffId }).then(async () => {
      if (!liff.isLoggedIn()) {
        // Login with aggressive bot prompt
        liff.login({
          redirectUri: window.location.href,
          bot_prompt: 'aggressive'
        });
      } else {
        const profile = liff.getDecodedIDToken();
        
        // Check friendship status after login
        try {
          const friendship = await liff.getFriendship();
          console.log('Bot friendship status:', friendship.friendFlag);
        } catch (error) {
          console.log('Friendship check unavailable');
        }
        
        resolve({
          provider: 'line',
          lineID: profile.sub,
          displayName: profile.name,
          pictureUrl: profile.picture,
          email: profile.email
        });
      }
    }).catch(reject);
  });
};
```

## Key Points

1. **`bot_prompt: 'aggressive'`** - Most effective for friend addition during login
2. **`liff.getFriendship()`** - Check if user added your bot (requires LIFF v2.8+)
3. **Fallback URL** - `https://line.me/R/ti/p/YOUR_BOT_ID` for manual friend addition
4. **User Choice** - Always respect user's decision to skip

## What You Need
- Your LINE Official Account ID (the bot ID)
- LIFF app properly configured with your channel
- Bot prompt permissions enabled in LINE Developers Console

## Implementation Notes
- The `bot_prompt` parameter must be included in the initial `liff.login()` call
- Friend addition happens during the LINE login consent screen
- Users can decline friend addition while still completing authentication
- Friendship status can be checked after login for follow-up actions