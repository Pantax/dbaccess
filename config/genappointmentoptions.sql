use pantax;
delimiter #

drop procedure if exists generate#

create procedure generate()
begin
    declare v_start datetime default '2014-5-13 08:00';
    declare v_duration int default 20;
    declare v_interval int default 10;
    declare v_count int default 0;
    declare v_next datetime;
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

