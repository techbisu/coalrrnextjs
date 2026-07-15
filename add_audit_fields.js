const fs = require('fs');
const lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

let insideModel = false;
let hasEntryTs = false;
let hasUpdtTs = false;
let hasEntryBy = false;
let hasUpdtBy = false;

const output = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.match(/^model\s+\w+\s+\{/)) {
    insideModel = true;
    hasEntryTs = false;
    hasUpdtTs = false;
    hasEntryBy = false;
    hasUpdtBy = false;
    output.push(line);
    continue;
  }
  
  if (insideModel && line.match(/^\}/)) {
    // We reached the end of the model block. Inject fields if they don't exist.
    if (!hasEntryTs) output.push('  entry_ts DateTime @default(now())');
    if (!hasUpdtTs) output.push('  updt_ts  DateTime @updatedAt');
    if (!hasEntryBy) output.push('  entry_by String?');
    if (!hasUpdtBy) output.push('  updt_by  String?');
    
    output.push(line);
    insideModel = false;
    continue;
  }
  
  if (insideModel) {
    if (line.match(/^\s*entry_ts\b/)) hasEntryTs = true;
    if (line.match(/^\s*updt_ts\b/)) hasUpdtTs = true;
    if (line.match(/^\s*entry_by\b/)) hasEntryBy = true;
    if (line.match(/^\s*updt_by\b/)) hasUpdtBy = true;
  }
  
  output.push(line);
}

fs.writeFileSync('prisma/schema.prisma', output.join('\n'));
console.log('Successfully injected audit fields via line-by-line parser');
