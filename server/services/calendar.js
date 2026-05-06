// Generate a fake-but-realistic Google Meet link format
function generateMeetLink() {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const rand = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`
}

module.exports = { generateMeetLink }
