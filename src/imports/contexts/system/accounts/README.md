# Accounts

## True accounts

## Demo Accounts

Demo accounts are accounts with original roles but restrictive properties and permissions:

- Email Address is always ending with the current domain of this app
- These Email addresses can't be validated, thus they're always `valid: false`

From there the system derives the following restrictions:

- They can only have teacher and/or student roles
- No invitations can be generated
- No new classes can be created
- They are bound to a specific class/course
- If the class is deleted, the corresponding demo accounts will be deleted, too

Admins and Schooladmins can bulk-create Demo Accounts for any given institution/class combination.
