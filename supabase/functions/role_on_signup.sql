-- 트리거 함수: 회원가입 시 user_metadata.role='user' 자동 할당
create or replace function public.set_default_user_role()
returns trigger as $$
begin
  update auth.users
  set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', '"user"')
  where id = new.id;
  return new;
end;
$$ language plpgsql;

-- 트리거 생성
create trigger on_signup_set_role
after insert on auth.users
for each row execute procedure public.set_default_user_role(); 