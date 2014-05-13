CREATE DATABASE pantax DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE TABLE pantax.user (id INT UNSIGNED NOT NULL AUTO_INCREMENT, name VARCHAR(100) NOT NULL, password VARCHAR(50) NOT NULL, entity_type VARCHAR(20) NOT NULL,	entity_id INT UNSIGNED NOT NULL, date_created DATETIME NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.doctor (id INT UNSIGNED NOT NULL AUTO_INCREMENT, name VARCHAR(512) NOT NULL, degree VARCHAR(20) NOT NULL, primary_care TEXT NULL,  rank INT UNSIGNED NULL, PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.user_login (id INT UNSIGNED NOT NULL AUTO_INCREMENT, user_id INT UNSIGNED NOT NULL, token VARCHAR(100) NOT NULL, date_created DATETIME NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.patient (id INT UNSIGNED NOT NULL AUTO_INCREMENT, name VARCHAR(512) NOT NULL, birthday DATE NULL, marital_status VARCHAR(512) NULL, occupation VARCHAR(512) NULL, address VARCHAR(2048) NULL, PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.review (id INT UNSIGNED NOT NULL AUTO_INCREMENT, doctor_id INT UNSIGNED NOT NULL, patient_id INT UNSIGNED NOT NULL, rank INT UNSIGNED NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.category (id INT UNSIGNED NOT NULL AUTO_INCREMENT, name VARCHAR(100) NOT NULL, explanation TEXT  NULL, PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.doctor_category (doctor_id INT UNSIGNED NOT NULL, category_id INT UNSIGNED NOT NULL, PRIMARY KEY (doctor_id, category_id)) ENGINE=InnoDB;
CREATE TABLE pantax.appointment (id INT UNSIGNED NOT NULL AUTO_INCREMENT, patient_id INT UNSIGNED NOT NULL, weight DECIMAL NULL, height DECIMAL NULL, blood_pressure DECIMAL, temperature DECIMAL NULL, appointment_reason VARCHAR(4096) NULL, additional_info TEXT NULL, PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.appointment_option (id INT UNSIGNED NOT NULL AUTO_INCREMENT, doctor_id INT UNSIGNED NOT NULL, from_date DATETIME NOT NULL, to_date DATETIME NOT NULL,  PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.appointment_appointment_option (appointment_id INT UNSIGNED NOT NULL, appointment_option_id INT UNSIGNED NOT NULL,  PRIMARY KEY (appointment_id, appointment_option_id)) ENGINE=InnoDB;
CREATE TABLE pantax.document (id INT UNSIGNED NOT NULL AUTO_INCREMENT, name varchar(256) NOT NULL, subject VARCHAR(4096) NOT NULL, created_date DATETIME NOT NULL, file_url VARCHAR(4096) NOT NULL,  PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.document_relation (id INT UNSIGNED NOT NULL AUTO_INCREMENT, document_id INT UNSIGNED NOT NULL, entity_type VARCHAR(20) NOT NULL, entity_id INT UNSIGNED NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB;
CREATE TABLE pantax.user_status (user_id INT UNSIGNED NOT NULL, status VARCHAR(50) NOT NULL, status_date DATETIME, PRIMARY KEY (user_id)) ENGINE=InnoDB;
delimiter //
create PROCEDURE pantax.getToken (in user_id int unsigned, in expiration int unsigned)
BEGIN
	declare retToken varchar(100);
	select ul.token into retToken from pantax.user_login ul where ul.user_id = user_id and date_add(ul.date_created, interval expiration day) >= now();
	if retToken is null then
		set retToken = uuid();
		INSERT INTO pantax.user_login (user_id, token, date_created) VALUES(user_id, retToken, now());
	end if;
	INSERT INTO pantax.user_status (user_id, status, status_date) VALUES(user_id, 'live', now()) ON DUPLICATE KEY UPDATE status_date = now();
	select retToken;
end//