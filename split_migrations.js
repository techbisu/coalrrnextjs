const fs = require('fs');
const path = require('path');

const inputSql = fs.readFileSync('db_export.sql', 'utf16le'); // PowerShell > creates utf16le
const statements = inputSql.split(/(?=-- CreateSchema|-- CreateTable|-- CreateIndex|-- AddForeignKey|-- DropForeignKey|-- AlterTable)/);

const schemas = [];
const tables = new Map();
const foreignKeys = [];

for (const stmt of statements) {
    if (stmt.trim() === '') continue;
    
    if (stmt.startsWith('-- CreateSchema')) {
        schemas.push(stmt);
    } else if (stmt.startsWith('-- CreateTable') || stmt.startsWith('-- AlterTable')) {
        const match = stmt.match(/TABLE "?(?:(?:master|public)\.)?"?([a-zA-Z0-9_]+)"?/);
        if (match) {
            const tableName = match[1];
            if (!tables.has(tableName)) tables.set(tableName, []);
            tables.get(tableName).push(stmt);
        }
    } else if (stmt.startsWith('-- CreateIndex')) {
        const match = stmt.match(/ON "?(?:(?:master|public)\.)?"?([a-zA-Z0-9_]+)"?/);
        if (match) {
            const tableName = match[1];
            if (!tables.has(tableName)) tables.set(tableName, []);
            tables.get(tableName).push(stmt);
        }
    } else if (stmt.startsWith('-- AddForeignKey') || stmt.startsWith('-- DropForeignKey')) {
        foreignKeys.push(stmt);
    }
}

let counter = 20260715110000;
const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });

function writeMigration(name, content) {
    const folderName = `${counter}_${name}`;
    const folderPath = path.join(migrationsDir, folderName);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    fs.writeFileSync(path.join(folderPath, 'migration.sql'), content, 'utf8');
    counter++;
}

// 1. Schemas
if (schemas.length > 0) {
    writeMigration('create_schemas', schemas.join('\n'));
}

// 2. Tables
for (const [tableName, stmts] of tables.entries()) {
    writeMigration(`create_${tableName}`, stmts.join('\n'));
}

// 3. Foreign Keys
if (foreignKeys.length > 0) {
    writeMigration('add_foreign_keys', foreignKeys.join('\n'));
}

console.log(`Generated ${tables.size + 2} migrations successfully.`);
