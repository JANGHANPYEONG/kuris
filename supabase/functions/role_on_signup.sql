-- 트리거 함수: 회원가입 시 user_metadata.role 자동 할당
create or replace function public.set_default_user_role()
returns trigger as $$
begin
  -- 이미 role이 설정되어 있으면 덮어쓰지 않음
  if new.raw_user_meta_data->>'role' is null then
    update auth.users
    set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', '"user"')
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

-- 트리거 생성
create trigger on_signup_set_role
after insert on auth.users
for each row execute procedure public.set_default_user_role(); 