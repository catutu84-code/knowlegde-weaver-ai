
CREATE POLICY "materials own folder insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "materials own folder update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "materials own folder delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'materials' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "materials readable when owned or shared" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'materials' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.materials m
      WHERE m.file_path = storage.objects.name
        AND (
          m.visibility = 'public'
          OR EXISTS (SELECT 1 FROM public.material_shares s WHERE s.material_id = m.id AND s.shared_with_user_id = auth.uid())
        )
    )
  )
);
