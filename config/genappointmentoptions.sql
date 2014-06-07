use pantax;
delimiter #

drop procedure if exists generate#

create procedure generate()
begin
    declare v_start datetime default date_add(now(), interval 1 day);
    declare v_duration int default 20;
    declare v_interval int default 10;
    declare v_count int default 0;
    declare v_next datetime;
    while v_count < 10 do
        set v_next = date_add(v_start, interval v_duration minute);
        INSERT INTO appointment_option (doctor_id, from_date, to_date) VALUES(2, v_start, v_next);
        set v_start = date_add(v_next, interval v_interval minute);
        set v_count = v_count + 1;
    end while;

    set v_count = 0;
    while v_count < 10 do
            set v_next = date_add(v_start, interval v_duration minute);
            INSERT INTO appointment_option (doctor_id, from_date, to_date) VALUES(1, v_start, v_next);
            set v_start = date_add(v_next, interval v_interval minute);
            set v_count = v_count + 1;
        end while;
    commit;
end#
delimiter ;
call generate();
drop procedure if exists generate;
INSERT INTO pantax.appointment (patient_id, weight, height, blood_pressure, temperature, appointment_reason, additional_info)
                        VALUES (1,          73.5,   175,    '120x80',       36.6,        'Glisti',           'sjhshshshshsha');
INSERT INTO pantax.appointment_appointment_option (appointment_id, appointment_option_id) VALUES(1, 8);

INSERT INTO pantax.appointment (patient_id, weight, height, blood_pressure, temperature, appointment_reason, additional_info)
                        VALUES (1,          73.5,   175,    '140x90',       36.6,        'Davlenie',           'sjhshshshshsha');
INSERT INTO pantax.appointment_appointment_option (appointment_id, appointment_option_id) VALUES(LAST_INSERT_ID(), 12);



