/*
  # Add UPDATE policy for storage objects

  1. Changes
    - Add UPDATE policy for authenticated users on storage.objects
    - This allows upsert operations to work properly when uploading files
  
  2. Security
    - Only authenticated users can update files in the media bucket
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to update media'
  ) THEN
    CREATE POLICY "Allow authenticated users to update media"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'media')
      WITH CHECK (bucket_id = 'media');
  END IF;
END $$;
