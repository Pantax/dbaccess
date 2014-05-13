START TRANSACTION;
INSERT INTO pantax.doctor (name, degree, primary_care, rank) VALUES('Dr Kala Mala', 'MD', 'Hello doctor kalaMala', 0);
INSERT INTO pantax.user (name, password, entity_type, entity_id, date_created) VALUES('kala', password('mala'), 'doctor', LAST_INSERT_ID(), now());
INSERT INTO pantax.doctor (name, degree, primary_care, rank) VALUES('Dr Barla Sharla', 'MD', 'Hello doctor Barla Sharla', 0);
INSERT INTO pantax.user (name, password, entity_type, entity_id, date_created) VALUES('barla', password('sharla'), 'doctor', LAST_INSERT_ID(), now());
COMMIT;