DROP POLICY IF EXISTS "read own shared or public materials" ON public.materials;

CREATE POLICY "read own shared or public materials"
ON public.materials
FOR SELECT
TO authenticated
USING (
  materials.user_id = auth.uid()
  OR materials.visibility = 'public'
  OR EXISTS (
    SELECT 1
    FROM public.material_shares AS share
    WHERE share.material_id = materials.id
      AND share.shared_with_user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);