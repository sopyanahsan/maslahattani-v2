UPDATE users SET email = CONCAT('user_', id, '@temp.com') WHERE email IS NULL;
