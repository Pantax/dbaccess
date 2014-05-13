PROCEDURE pantax.getToken (
	in user_id int unsigned,
	in expiration int unsigned
)
BEGIN
	declare retToken varchar(100);
	select ul.token into retToken from pantax.user_login ul where ul.user_id = user_id and date_add(ul.date_created, interval expiration day) >= now();
	if retToken is null then
		set retToken = uuid();
		INSERT INTO pantax.user_login (user_id, token, date_created) VALUES(user_id, retToken, now());
	end if;
	select retToken;
end;