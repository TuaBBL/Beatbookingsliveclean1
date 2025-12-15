/*
  # Create media storage bucket

  1. New Storage Bucket
    - Create 'media' bucket for event images and videos
    - Set bucket to public for easy access to media files
    
  2. Security
    - Enable RLS on storage.objects
    - Allow authenticated users to upload files
    - Allow everyone to view files (public bucket)
    - Allow users to delete event media they own
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to upload media'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload media"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public to view media'
  ) THEN
    CREATE POLICY "Allow public to view media"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to delete media'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete media"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'media');
  END IF;
END $$;