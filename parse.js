const fs = require('fs');
['error_limits.html', 'error_milestones.html'].forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  console.log('---', f, '---');
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) console.log('TITLE:', titleMatch[1]);
  
  const dataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">({.*?})<\/script>/);
  if (dataMatch) {
    const data = JSON.parse(dataMatch[1]);
    console.log('ERRORS:', JSON.stringify(data.err, null, 2));
  }
});
