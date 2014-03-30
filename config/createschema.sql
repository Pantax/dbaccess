CREATE TABLE pantax.doctors ( `id` INT UNSIGNED AUTO_INCREMENT NOT NULL,  `name` VARCHAR(256) NOT NULL, `prof_stat` TEXT NOT NULL, `pract_name` VARCHAR(256), `picture_url` VARCHAR(512), PRIMARY KEY (ID)) ENGINE = InnoDB ROW_FORMAT = DEFAULT;
CREATE TABLE pantax.category (`id` INT UNSIGNED AUTO_INCREMENT NOT NULL, `category_name` VARCHAR(512) NOT NULL, PRIMARY KEY (ID)) ENGINE = InnoDB ROW_FORMAT = DEFAULT;
CREATE TABLE pantax.doctor_category (`doctor_id` INT UNSIGNED NOT NULL, `category_id` INT UNSIGNED NOT NULL, PRIMARY KEY (doctor_id, category_id)) ENGINE = InnoDB ROW_FORMAT = DEFAULT;
CREATE TABLE pantax.doctor_appointment_options ( `id` INT UNSIGNED AUTO_INCREMENT NOT NULL, `doctor_id` INT UNSIGNED NOT NULL,`week_day` INT NOT NULL, `from_time` TIME NOT NULL, `to_time` TIME NOT NULL,  PRIMARY KEY (id)) ENGINE = InnoDB ROW_FORMAT = DEFAULT;
CREATE TABLE pantax.appointments (`id` INT UNSIGNED AUTO_INCREMENT NOT NULL, `patient_id` INT UNSIGNED NOT NULL, `appointment_date` DATE, `from_time` TIME, `to_time` TIME, PRIMARY KEY (id)) ENGINE = InnoDB ROW_FORMAT = DEFAULT;
CREATE TABLE pantax.patient(`id` INT UNSIGNED AUTO_INCREMENT NOT NULL, `name` VARCHAR(1024), PRIMARY KEY (id)) ENGINE = InnoDB ROW_FORMAT = DEFAULT;
CREATE TABLE pantax.appointment_appointment_options(`option_id` INT UNSIGNED, `appointment_id` INT UNSIGNED, PRIMARY KEY (option_id, appointment_id)) ENGINE = InnoDB ROW_FORMAT = DEFAULT;
CREATE TABLE pantax.documents (	`id` INT UNSIGNED NOT NULL AUTO_INCREMENT, `document_name` VARCHAR(256) NOT NULL, `file_path` VARCHAR(2048) NOT NULL, PRIMARY KEY (id)) ENGINE=InnoDB ROW_FORMAT = DEFAULT;