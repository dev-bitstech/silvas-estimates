
-- Create storage bucket for photos (run in SQL Editor)
insert into storage.buckets (id, name, public) values ('project-photos','project-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to manage their files (adjust as needed)
create policy "photos_public_read" on storage.objects
for select to public using ( bucket_id = 'project-photos' );

create policy "photos_auth_write" on storage.objects
for insert to authenticated with check ( bucket_id = 'project-photos' );

create policy "photos_auth_update" on storage.objects
for update to authenticated using ( bucket_id = 'project-photos' )
with check ( bucket_id = 'project-photos' );

create policy "photos_auth_delete" on storage.objects
for delete to authenticated using ( bucket_id = 'project-photos' );
