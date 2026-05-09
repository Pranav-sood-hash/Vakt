const fs = require('fs');
const path = require('path');

function replacePrisma(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules') replacePrisma(fullPath);
    } else if (fullPath.endsWith('.js') && fullPath !== path.join(__dirname, 'src', 'prisma.js') && !fullPath.includes('scaffold')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let relativeToSrc = path.relative(path.dirname(fullPath), path.join(__dirname, 'src', 'prisma.js'));
      relativeToSrc = relativeToSrc.replace(/\\/g, '/');
      if (!relativeToSrc.startsWith('.')) relativeToSrc = './' + relativeToSrc;
      if (relativeToSrc.endsWith('.js')) relativeToSrc = relativeToSrc.slice(0, -3); // remove .js

      const oldImport = /const \{\s*PrismaClient\s*\}\s*=\s*require\('@prisma\/client'\);\s*const prisma = new PrismaClient\(\);?/g;
      
      if (oldImport.test(content)) {
        content = content.replace(oldImport, `const prisma = require('${relativeToSrc}');`);
        fs.writeFileSync(fullPath, content);
        console.log(`Replaced in ${fullPath} with ${relativeToSrc}`);
      }
    }
  }
}

replacePrisma(__dirname);
