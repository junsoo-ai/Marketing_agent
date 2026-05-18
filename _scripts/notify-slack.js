#!/usr/bin/env node
// Run review and send results to Slack
// Usage: node _scripts/notify-slack.js <YYYY-MM-DD>
// Requires: ANTHROPIC_API_KEY, SLACK_WEBHOOK_URL environment variables

const { execSync } = require('child_process');
const https = require('https');
const path = require('path');

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const slackUrl = process.env.SLACK_WEBHOOK_URL;

if (!slackUrl) {
  console.error('Error: SLACK_WEBHOOK_URL not set');
  process.exit(1);
}

// Run review.js and capture output
let reviewOutput = '';
let passed = true;

try {
  reviewOutput = execSync(
    `node ${path.join(__dirname, 'review.js')} ${date}`,
    { env: process.env, encoding: 'utf8' }
  );
} catch (err) {
  reviewOutput = err.stdout || err.message;
  passed = false;
}

const statusEmoji = passed ? '✅' : '⚠️';
const statusText  = passed ? 'PASS' : 'FAIL — fix before posting';

const summaryMatch = reviewOutput.match(/SUMMARY:\s*(.+)/);
const summary = summaryMatch ? summaryMatch[1].trim() : 'See details below.';

const issuesMatch = reviewOutput.match(/ISSUES_COUNT:\s*(\d+)/);
const issueCount = issuesMatch ? issuesMatch[1] : '?';

// Approve buttons always shown — review result is advisory only
const bottomBlock = {
  type: 'actions',
  elements: [
    {
      type: 'button',
      text: { type: 'plain_text', text: '🇺🇸 Post EN to Discord' },
      style: 'primary',
      value: `${date}|en`,
      action_id: 'post_discord_en',
    },
    {
      type: 'button',
      text: { type: 'plain_text', text: '🇰🇷 Post KO to Discord' },
      style: 'primary',
      value: `${date}|ko`,
      action_id: 'post_discord_ko',
    },
  ],
};

const message = {
  text: `${statusEmoji} CLYPT Daily Review — ${date}`,
  blocks: [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${statusEmoji} CLYPT Daily Review — ${date}` },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Status:* ${statusText}` },
        { type: 'mrkdwn', text: `*Issues:* ${issueCount}` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Summary:* ${summary}` },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Review details:*\n\`\`\`${reviewOutput.slice(0, 2800)}\`\`\``,
      },
    },
    { type: 'divider' },
    bottomBlock,
  ],
};

const body = JSON.stringify(message);
const url = new URL(slackUrl);

const req = https.request({
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}, res => {
  if (res.statusCode === 200) {
    console.log(`Slack notification sent (${passed ? 'PASS' : 'FAIL'})`);
  } else {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.error(`Slack error: HTTP ${res.statusCode}`, body));
  }
});

req.on('error', err => console.error('Request error:', err.message));
req.write(body);
req.end();
