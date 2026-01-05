#!/usr/bin/env node

/**
 * Script to download PostgreSQL and MySQL binaries for bundling with the app
 *
 * This downloads platform-specific database binaries so users don't need to
 * install PostgreSQL/MySQL separately.
 *
 * For macOS: Downloads Postgres.app and MySQL DMG, extracts binaries
 * For Windows: Downloads PostgreSQL and MySQL ZIP files
 * For Linux: Uses system package manager or downloads portable versions
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const platform = process.platform;
const binDir = path.join(__dirname, "..", "binaries", platform);

// Create binaries directory
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

console.log(`Downloading database binaries for ${platform}...`);

async function downloadPostgres() {
  if (platform === "darwin") {
    console.log("\n📥 For macOS, you can download PostgreSQL binaries from:");
    console.log("   https://postgresapp.com/ OR");
    console.log(
      "   brew install postgresql (then copy from /opt/homebrew/opt/postgresql@17/bin/)"
    );
    console.log(`\nCopy these files to: ${binDir}/`);
    console.log("   - pg_dump");
    console.log("   - psql");
    console.log("   - pg_restore");
  } else if (platform === "win32") {
    console.log("\n📥 For Windows, download PostgreSQL from:");
    console.log(
      "   https://www.enterprisedb.com/downloads/postgres-postgresql-downloads"
    );
    console.log(`\nExtract and copy these files to: ${binDir}/`);
    console.log("   - pg_dump.exe");
    console.log("   - psql.exe");
    console.log("   - libpq.dll and other required DLLs");
  } else {
    console.log("\n📥 For Linux, install PostgreSQL client:");
    console.log("   sudo apt-get install postgresql-client");
    console.log(`\nThen copy from /usr/bin/ to: ${binDir}/`);
    console.log("   - pg_dump");
    console.log("   - psql");
  }
}

async function downloadMySQL() {
  if (platform === "darwin") {
    console.log("\n📥 For macOS, you can download MySQL binaries from:");
    console.log("   https://dev.mysql.com/downloads/mysql/ OR");
    console.log(
      "   brew install mysql (then copy from /opt/homebrew/opt/mysql/bin/)"
    );
    console.log(`\nCopy these files to: ${binDir}/`);
    console.log("   - mysqldump");
    console.log("   - mysql");
  } else if (platform === "win32") {
    console.log("\n📥 For Windows, download MySQL from:");
    console.log("   https://dev.mysql.com/downloads/mysql/");
    console.log(`\nExtract and copy these files to: ${binDir}/`);
    console.log("   - mysqldump.exe");
    console.log("   - mysql.exe");
    console.log("   - libmysql.dll and other required DLLs");
  } else {
    console.log("\n📥 For Linux, install MySQL client:");
    console.log("   sudo apt-get install mysql-client");
    console.log(`\nThen copy from /usr/bin/ to: ${binDir}/`);
    console.log("   - mysqldump");
    console.log("   - mysql");
  }
}

async function copyFromHomebrew() {
  if (platform !== "darwin") {
    return;
  }

  console.log("\n🔍 Checking for Homebrew installations...");

  try {
    // Check for PostgreSQL
    const pgPath = execSync(
      "brew --prefix postgresql@17 2>/dev/null || brew --prefix postgresql 2>/dev/null",
      { encoding: "utf-8" }
    ).trim();
    if (pgPath) {
      console.log(`✅ Found PostgreSQL at ${pgPath}`);
      const pgBinPath = path.join(pgPath, "bin");

      ["pg_dump", "psql", "pg_restore"].forEach((bin) => {
        const src = path.join(pgBinPath, bin);
        const dest = path.join(binDir, bin);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          fs.chmodSync(dest, 0o755);
          console.log(`   Copied ${bin}`);
        }
      });
    }
  } catch (e) {
    console.log("   PostgreSQL not found via Homebrew");
  }

  try {
    // Check for MySQL
    const mysqlPath = execSync("brew --prefix mysql 2>/dev/null", {
      encoding: "utf-8",
    }).trim();
    if (mysqlPath) {
      console.log(`✅ Found MySQL at ${mysqlPath}`);
      const mysqlBinPath = path.join(mysqlPath, "bin");

      ["mysqldump", "mysql"].forEach((bin) => {
        const src = path.join(mysqlBinPath, bin);
        const dest = path.join(binDir, bin);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          fs.chmodSync(dest, 0o755);
          console.log(`   Copied ${bin}`);
        }
      });
    }
  } catch (e) {
    console.log("   MySQL not found via Homebrew");
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Database Binaries Bundler");
  console.log("═══════════════════════════════════════════════════\n");

  // Try to auto-copy from Homebrew on macOS
  await copyFromHomebrew();

  // Show manual instructions
  await downloadPostgres();
  await downloadMySQL();

  console.log("\n═══════════════════════════════════════════════════");
  console.log(`\nBinaries directory: ${binDir}`);

  const files = fs.readdirSync(binDir);
  if (files.length > 0) {
    console.log("\n✅ Current binaries:");
    files.forEach((f) => console.log(`   - ${f}`));
  } else {
    console.log("\n⚠️  No binaries found yet. Please copy them manually.");
  }

  console.log("\n═══════════════════════════════════════════════════\n");
}

main().catch(console.error);
