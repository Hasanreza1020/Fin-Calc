-- Optional starter categories. Safe to re-run.
insert into public.categories (name, kind)
select * from (values
  ('Console',     'console'::category_kind_t),
  ('Controller',  'accessory'::category_kind_t),
  ('Headset',     'accessory'::category_kind_t),
  ('Cable / Charger', 'accessory'::category_kind_t),
  ('Game disc',   'game'::category_kind_t),
  ('Game key',    'game'::category_kind_t),
  ('Other',       'other'::category_kind_t)
) as v(name, kind)
where not exists (select 1 from public.categories where categories.name = v.name);
