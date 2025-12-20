/*
  # Merge Duplicate Gene Tua Profiles

  1. Problem
    - Two profiles exist for Gene Tua:
      - genetua@gtrax.net (089e6599-e9e3-49d3-b8b0-a1cf67a6380d) - no subscription
      - djtua75@gmail.com (2bc8bb18-74af-41bd-85f3-0ba320275a26) - has active subscription
    
  2. Solution
    - Reassign all data from duplicate profile to the subscribed profile
    - Delete the duplicate profile and auth user

  3. Tables Updated
    - bookings
    - booking_requests
    - favourites
    - messages
    - artist_reviews
    - profiles (delete)
    - auth.users (delete)
*/

-- Reassign bookings
UPDATE bookings 
SET planner_id = '2bc8bb18-74af-41bd-85f3-0ba320275a26'
WHERE planner_id = '089e6599-e9e3-49d3-b8b0-a1cf67a6380d';

-- Reassign booking requests
UPDATE booking_requests 
SET planner_id = '2bc8bb18-74af-41bd-85f3-0ba320275a26'
WHERE planner_id = '089e6599-e9e3-49d3-b8b0-a1cf67a6380d';

-- Reassign favourites
UPDATE favourites 
SET planner_id = '2bc8bb18-74af-41bd-85f3-0ba320275a26'
WHERE planner_id = '089e6599-e9e3-49d3-b8b0-a1cf67a6380d';

-- Reassign messages (sender)
UPDATE messages 
SET sender_id = '2bc8bb18-74af-41bd-85f3-0ba320275a26'
WHERE sender_id = '089e6599-e9e3-49d3-b8b0-a1cf67a6380d';

-- Reassign messages (recipient)
UPDATE messages 
SET recipient_id = '2bc8bb18-74af-41bd-85f3-0ba320275a26'
WHERE recipient_id = '089e6599-e9e3-49d3-b8b0-a1cf67a6380d';

-- Reassign artist reviews
UPDATE artist_reviews 
SET planner_id = '2bc8bb18-74af-41bd-85f3-0ba320275a26'
WHERE planner_id = '089e6599-e9e3-49d3-b8b0-a1cf67a6380d';

-- Delete the duplicate profile from profiles table
DELETE FROM profiles 
WHERE id = '089e6599-e9e3-49d3-b8b0-a1cf67a6380d';

-- Delete the duplicate user from auth.users
DELETE FROM auth.users 
WHERE id = '089e6599-e9e3-49d3-b8b0-a1cf67a6380d';
