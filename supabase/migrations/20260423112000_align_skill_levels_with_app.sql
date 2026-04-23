begin;

-- Normalize legacy level values to current app values before applying new checks.
update public.users
set skill_level = case skill_level
  when 'weak_minus' then 'yeu_minus'
  when 'weak_plus' then 'yeu_plus'
  when 'medium_plus' then 'tb_plus'
  when 'medium_advanced_plus' then 'kha_plus'
  when 'advanced_minus' then 'gioi_minus'
  when 'advanced_plus' then 'gioi_plus'
  when 'expert_plus' then 'gioi_plus'
  else skill_level
end
where skill_level in (
  'weak_minus',
  'weak_plus',
  'medium_plus',
  'medium_advanced_plus',
  'advanced_minus',
  'advanced_plus',
  'expert_plus'
);

update public.event_skill_requirements
set skill_level = case skill_level
  when 'weak_minus' then 'yeu_minus'
  when 'weak_plus' then 'yeu_plus'
  when 'medium_plus' then 'tb_plus'
  when 'medium_advanced_plus' then 'kha_plus'
  when 'advanced_minus' then 'gioi_minus'
  when 'advanced_plus' then 'gioi_plus'
  when 'expert_plus' then 'gioi_plus'
  else skill_level
end
where skill_level in (
  'weak_minus',
  'weak_plus',
  'medium_plus',
  'medium_advanced_plus',
  'advanced_minus',
  'advanced_plus',
  'expert_plus'
);

update public.bookings
set skill_level = case skill_level
  when 'weak_minus' then 'yeu_minus'
  when 'weak_plus' then 'yeu_plus'
  when 'medium_plus' then 'tb_plus'
  when 'medium_advanced_plus' then 'kha_plus'
  when 'advanced_minus' then 'gioi_minus'
  when 'advanced_plus' then 'gioi_plus'
  when 'expert_plus' then 'gioi_plus'
  else skill_level
end
where skill_level in (
  'weak_minus',
  'weak_plus',
  'medium_plus',
  'medium_advanced_plus',
  'advanced_minus',
  'advanced_plus',
  'expert_plus'
);

alter table public.users
  drop constraint if exists users_skill_level_check;

alter table public.event_skill_requirements
  drop constraint if exists event_skill_requirements_skill_level_check;

alter table public.bookings
  drop constraint if exists bookings_skill_level_check;

alter table public.users
  add constraint users_skill_level_check check (
    skill_level is null
    or skill_level in (
      'yeu_minus',
      'yeu',
      'yeu_plus',
      'tby_minus',
      'tby',
      'tby_plus',
      'tb_minus',
      'tb',
      'tb_plus',
      'kha_minus',
      'kha',
      'kha_plus',
      'gioi_minus',
      'gioi',
      'gioi_plus'
    )
  );

alter table public.event_skill_requirements
  add constraint event_skill_requirements_skill_level_check check (
    skill_level in (
      'yeu_minus',
      'yeu',
      'yeu_plus',
      'tby_minus',
      'tby',
      'tby_plus',
      'tb_minus',
      'tb',
      'tb_plus',
      'kha_minus',
      'kha',
      'kha_plus',
      'gioi_minus',
      'gioi',
      'gioi_plus'
    )
  );

alter table public.bookings
  add constraint bookings_skill_level_check check (
    skill_level in (
      'yeu_minus',
      'yeu',
      'yeu_plus',
      'tby_minus',
      'tby',
      'tby_plus',
      'tb_minus',
      'tb',
      'tb_plus',
      'kha_minus',
      'kha',
      'kha_plus',
      'gioi_minus',
      'gioi',
      'gioi_plus'
    )
  );

commit;