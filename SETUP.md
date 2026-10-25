# Setup guide (no coding needed)

## Step 1: Connect the phones (about 5 minutes, free)
The scoreboard uses a free Google service called **Firebase** to pass scores between phones.

1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. Click **Create a project**, name it something like `tkd-scoreboard`, and click through the steps. You can turn Google Analytics off.
3. In the left menu, open **Build → Realtime Database** and click **Create database**. Pick the location closest to you and choose **Start in test mode**.
4. Open the **Rules** tab, replace everything with the contents of `database.rules.json` from this project, and click **Publish**.
   (Test mode stops working after 30 days, and these rules keep it working.)
5. Click the ⚙️ gear next to *Project overview*, then **Project settings**. Under *Your apps*, click the **</>** (Web) icon, give it any nickname and click **Register app**.
6. You'll see a block of text that starts with `const firebaseConfig = {`. Copy the lines inside the curly brackets `{ … }`.
7. Open `config.js` and paste them between the brackets, like this:
   ```js
   export const FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "tkd-scoreboard.firebaseapp.com",
     databaseURL: "https://tkd-scoreboard-default-rtdb.firebaseio.com",
     projectId: "tkd-scoreboard",
     storageBucket: "tkd-scoreboard.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   Make sure `databaseURL` is there. If it's missing, copy it from the top of the Realtime Database page.

   **Easier option:** send the copied text to Claude, and Claude will put it in for you.

## Step 2: Put it online
Pick one:

- **Netlify Drop (easiest):** download this project as a ZIP from GitHub (green **Code** button → *Download ZIP*) and unzip it. Then go to <https://app.netlify.com/drop> and drag the folder onto the page. You get a link like `https://something.netlify.app`. Make a free account so the link stays.
- **GitHub Pages:** ask Claude to set it up.

## Step 3: Run a match
1. **Referee:** open the link on your phone and tap **Start a new match**. Type the player names, choose the number of judges and tap **Create match**.
2. Tap **Connect screens and judges**. QR codes appear:
   - Scan **Big screen** with the TV or tablet, then tap the screen once to turn on full screen and sound.
   - Each judge scans their own **Judge** code.
   - Parents can scan the QR code shown on the big screen to watch.
3. Tap **Start**. Judges press buttons as points are scored.
4. When the match ends, tap **Next match**. All the screens stay connected.

## Tips
- With no Wi-Fi, phones can use mobile data, or one phone can share its hotspot. It uses very little data.
- Screens stay awake on their own in most browsers.
- Made a mistake? Use **+1 / −1**, **− Penalty**, or **Undo: continue this match** after a match ends.
