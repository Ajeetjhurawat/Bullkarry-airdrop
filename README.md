# Bullkarry Drops (Static SEO + Netlify Deploy)

1. Push this folder to a GitHub repository.
2. Connect the repository to Netlify (free tier):
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Update `ads.txt` with your approved Google AdSense Publisher ID.
4. (Optional) Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in GitHub Repository Secrets for automatic Telegram notifications when `data/content.json` is updated.
