// Creates the schema and loads the demo data from init-db.sql.
// Run with: npm run init-db
// Connection details come from .env, so nobody has to type credentials or use the mysql client.
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mariadb = require("mariadb");

const { DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;

async function main() {
    if (!DB_HOST || !DB_USER || !DB_DATABASE) {
        throw new Error("DB_HOST, DB_USER and DB_DATABASE must be set in .env (see .env.sample)");
    }
    // the database name goes into the SQL text below, so only allow plain identifiers
    if (!/^[A-Za-z0-9_$]+$/.test(DB_DATABASE)) {
        throw new Error(`DB_DATABASE "${DB_DATABASE}" is not a valid database name`);
    }

    // Connect WITHOUT selecting a database: on a fresh machine it doesn't exist yet.
    // multipleStatements lets one query run the whole init-db.sql file.
    const conn = await mariadb.createConnection({
        host: DB_HOST, user: DB_USER, password: DB_PASSWORD, multipleStatements: true,
    });

    try {
        try {
            await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\``);
        } catch (error) {
            // shared/managed servers often don't allow creating databases; that's fine if it already exists
            console.log(`Could not create database "${DB_DATABASE}" (${error.code}), assuming it already exists.`);
        }
        await conn.query(`USE \`${DB_DATABASE}\``);

        const sqlFile = path.join(__dirname, "..", "init-db.sql");
        await conn.query(fs.readFileSync(sqlFile, "utf8"));

        console.log(`Database "${DB_DATABASE}" initialised:`);
        for (const table of ["web_users", "web_user_profiles", "web_posts", "web_comments", "web_post_likes"]) {
            const [row] = await conn.query(`SELECT COUNT(*) AS n FROM \`${table}\``);
            console.log(`  ${table.padEnd(18)} ${Number(row.n)} rows`);
        }
        console.log("\nDemo accounts: alice / ben / chloe / dan / emma  (password: demo1234)");
    } finally {
        await conn.end();
    }
}

main().catch((error) => {
    console.error("init-db failed:", error.message);
    process.exit(1);
});
