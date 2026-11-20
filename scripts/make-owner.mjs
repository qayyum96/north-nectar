#!/usr/bin/env node
/**
 * Gives an existing Supabase Auth user full admin access (role "owner").
 *
 *   1. Supabase dashboard > Authentication > Users > Add user > Create new user
 *      (your email + a strong password, tick "Auto Confirm User").
 *   2. pnpm admin:make-owner you@example.com "Your Name"
 *
 * Safe to re-run: it updates the existing staff row.
 */
import { connect } from "./db.mjs";

const [, , email, ...nameParts] = process.argv;
if (!email || !email.includes("@")) {
  console.error('Usage: pnpm admin:make-owner you@example.com "Your Name"');
  process.exit(1);
}

const sql = connect();
try {
  const users = await sql`select id, email from auth.users where lower(email) = lower(${email})`;
  if (users.length === 0) {
    console.error(
      `No Supabase Auth user with email ${email}.\n` +
        "Create it first: Supabase dashboard > Authentication > Users > Add user (tick Auto Confirm User).",
    );
    process.exit(1);
  }
  const user = users[0];
  const name = nameParts.join(" ").trim() || email.split("@")[0];
  await sql`
    insert into public.staff (user_id, name, email, role, status)
    values (${user.id}, ${name}, ${user.email}, 'owner', 'active')
    on conflict (user_id) do update set role = 'owner', status = 'active', name = excluded.name, email = excluded.email`;
  console.log(`${user.email} is now an Owner of the North Nectar admin.`);
} finally {
  await sql.end();
}
