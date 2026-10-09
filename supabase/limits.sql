  -- ITEX: spam va takroriy arizalardan himoya. Supabase SQL Editor'da ishga tushiring.

  -- 0) Avval test paytida kiritilgan takroriy arizalar bo'lsa, ularni o'chiring (aks holda 1-qadam xato beradi):
  -- delete from public.applications a using public.applications b
  --  where a.phone = b.phone and a.direction = b.direction and a.created_at > b.created_at;

  -- 1) Bir telefon raqami bir yo'nalishga faqat bitta ariza yubora oladi
  create unique index if not exists applications_phone_dir_unique
    on public.applications (phone, direction);

  -- 2) Umumiy tezlik chegarasi: 1 daqiqada 60 tadan ortiq ariza qabul qilinmaydi (raqamni o'zgartirishingiz mumkin)
  create or replace function public.limit_applications() returns trigger
  language plpgsql as $$
  begin
    if (select count(*) from public.applications
        where created_at > now() - interval '1 minute') >= 60 then
      raise exception 'Juda ko''p ariza. Birozdan keyin qayta urinib ko''ring.';
    end if;
    return new;
  end $$;

  drop trigger if exists applications_rate_limit on public.applications;
  create trigger applications_rate_limit before insert on public.applications
  for each row execute function public.limit_applications();
