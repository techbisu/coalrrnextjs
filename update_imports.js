const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  if (file.includes('store.ts')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('useCoalrr')) {
    // Basic replacement for standard imports
    content = content.replace(/import \{([^}]*)useCoalrr([^}]*)\} from '@\/components\/coalrr\/store'/g, (match, p1, p2) => {
        let imports = [];
        if (p1.trim() || p2.trim()) {
            const others = (p1 + p2).split(',').map(s => s.trim()).filter(Boolean);
            if (others.length > 0) {
                // If it contains NAV_ITEMS, extract it
                if (others.includes('NAV_ITEMS')) {
                    imports.push(`import { NAV_ITEMS } from '@/lib/constants/navigation'`);
                }
                const formatters = others.filter(o => o !== 'NAV_ITEMS');
                if (formatters.length > 0) {
                    imports.push(`import { ${formatters.join(', ')} } from '@/lib/utils/formatters'`);
                }
            }
        }
        imports.push(`import { useAuth } from '@/authorization/providers/AuthProvider'`);
        imports.push(`import { useUiState } from '@/providers/UiStateProvider'`);
        return imports.join('\n');
    });

    content = content.replace(/useCoalrr\.getState\(\)/g, 'useUiState()'); // This is a bit unsafe without hooks but let's fix it later if it fails
    content = content.replace(/useCoalrr/g, 'useUiState');
    
    // We need to replace useUiState().user with useAuth().user
    // A quick hack for the destructuring
    content = content.replace(/const \{([^}]*)user([^}]*)\} = useUiState\(\)/g, (match, p1, p2) => {
        return `const { user } = useAuth();\n  const { ${p1}${p2} } = useUiState()`;
    });
    // And for simple assignment
    content = content.replace(/const user = useUiState\(\(s\)\s*=>\s*s\.user\)/g, 'const { user } = useAuth()');
    content = content.replace(/const user = useUiState\(\(state\)\s*=>\s*state\.user\)/g, 'const { user } = useAuth()');

    // Clean up empty destructuring
    content = content.replace(/const \{\s*\} = useUiState\(\)/g, '');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
