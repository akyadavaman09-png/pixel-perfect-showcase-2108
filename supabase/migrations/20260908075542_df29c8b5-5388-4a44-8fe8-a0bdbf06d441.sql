
CREATE POLICY "complaint_photos_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'complaints');
CREATE POLICY "complaint_photos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaints' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "complaint_photos_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'complaints' AND owner = auth.uid());
CREATE POLICY "complaint_photos_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'complaints' AND owner = auth.uid());
