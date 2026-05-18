// Vercel serverless function — Slack approval button → Discord post
// Triggered when user clicks "Post to Discord" in the Slack review message.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let payload;
  try {
    const raw = req.body?.payload;
    payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return res.status(400).json({ text: 'Invalid payload' });
  }

  const action = payload?.actions?.[0];
  if (!action) return res.status(400).json({ text: 'No action' });

  const [date, lang] = (action.value || '').split('|');
  if (!date || !lang) return res.status(400).json({ text: 'Bad action value' });

  // Fetch content from GitHub (public repo, no auth needed)
  const rawUrl = `https://raw.githubusercontent.com/junsoo-ai/Marketing_agent/main/_content/${date}/daily-discord-${lang}.md`;
  let content;
  try {
    const r = await fetch(rawUrl);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    content = (await r.text()).trim();
  } catch (e) {
    return res.status(200).json({ text: `❌ Content not found for ${date} (${lang}): ${e.message}` });
  }

  if (content.length > 2000) {
    return res.status(200).json({ text: `❌ Content too long (${content.length} chars). Fix before posting.` });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return res.status(200).json({ text: '❌ DISCORD_WEBHOOK_URL not set in Vercel' });

  const discordRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (discordRes.status === 204) {
    return res.status(200).json({
      response_type: 'in_channel',
      text: `✅ Posted ${lang.toUpperCase()} for ${date} to Discord.`,
    });
  }

  const err = await discordRes.text();
  return res.status(200).json({ text: `❌ Discord error ${discordRes.status}: ${err}` });
}
