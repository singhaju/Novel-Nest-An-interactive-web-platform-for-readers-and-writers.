-- ============================================================================
-- Novel Nest Database Seed Script
-- Initializes the database with sample novels, episodes, reviews, and comments
-- Based on CSS326 Project Proposal
-- ============================================================================

-- ============================================================================
-- 1. CREATE NECESSARY TABLES (if they don't exist)
-- ============================================================================

-- User table is assumed to exist; if not, uncomment below:
-- CREATE TABLE IF NOT EXISTS `users` (
--   `user_id` INT PRIMARY KEY AUTO_INCREMENT,
--   `username` VARCHAR(255) UNIQUE NOT NULL,
--   `email` VARCHAR(255) UNIQUE NOT NULL,
--   `password` VARCHAR(255) NOT NULL,
--   `profile_picture` VARCHAR(255),
--   `bio` TEXT,
--   `role` ENUM('Reader', 'Writer', 'Admin', 'Developer') NOT NULL DEFAULT 'Reader',
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Novel table
CREATE TABLE IF NOT EXISTS `novels` (
  `novel_id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `cover_image` VARCHAR(255),
  `tags` JSON,
  `status` ENUM('Ongoing', 'Completed', 'Hiatus') NOT NULL DEFAULT 'Ongoing',
  `last_update` TIMESTAMP,
  `views` INT DEFAULT 0,
  `likes` INT DEFAULT 0,
  `rating` DECIMAL(3, 2),
  `author_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
);

-- Episode table
CREATE TABLE IF NOT EXISTS `episodes` (
  `episode_id` INT PRIMARY KEY AUTO_INCREMENT,
  `novel_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `is_locked` BOOLEAN DEFAULT 0,
  `price` INT,
  `release_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`novel_id`) REFERENCES `novels`(`novel_id`) ON DELETE CASCADE
);

-- Review table
CREATE TABLE IF NOT EXISTS `reviews` (
  `review_id` INT PRIMARY KEY AUTO_INCREMENT,
  `novel_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  `comment` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`novel_id`) REFERENCES `novels`(`novel_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
);

-- Comment table
CREATE TABLE IF NOT EXISTS `comments` (
  `comment_id` INT PRIMARY KEY AUTO_INCREMENT,
  `episode_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `parent_comment_id` INT,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`episode_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_comment_id`) REFERENCES `comments`(`comment_id`) ON DELETE CASCADE
);

-- Novel_Authors bridge table (for co-authorship)
CREATE TABLE IF NOT EXISTS `novel_authors` (
  `user_id` INT NOT NULL,
  `novel_id` INT NOT NULL,
  `author_role` VARCHAR(100) DEFAULT 'Author',
  PRIMARY KEY (`user_id`, `novel_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`novel_id`) REFERENCES `novels`(`novel_id`) ON DELETE CASCADE
);

-- User_Wishlist bridge table
CREATE TABLE IF NOT EXISTS `user_wishlist` (
  `user_id` INT NOT NULL,
  `novel_id` INT NOT NULL,
  `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `novel_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`novel_id`) REFERENCES `novels`(`novel_id`) ON DELETE CASCADE
);

-- User_Follows bridge table
CREATE TABLE IF NOT EXISTS `user_follows` (
  `follower_id` INT NOT NULL,
  `following_id` INT NOT NULL,
  `followed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`, `following_id`),
  FOREIGN KEY (`follower_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`following_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
);

-- User_Reading_Progress bridge table
CREATE TABLE IF NOT EXISTS `user_reading_progress` (
  `user_id` INT NOT NULL,
  `novel_id` INT NOT NULL,
  `last_read_episode_id` INT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `novel_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`novel_id`) REFERENCES `novels`(`novel_id`) ON DELETE CASCADE,
  FOREIGN KEY (`last_read_episode_id`) REFERENCES `episodes`(`episode_id`) ON DELETE CASCADE
);

-- ============================================================================
-- 2. INSERT SAMPLE USERS (Authors and Readers)
-- ============================================================================

-- Authors
INSERT INTO `users` (`user_id`, `username`, `email`, `password`, `profile_picture`, `bio`, `role`) 
VALUES
(101, 'jane_austen', 'jausten@example.com', '$2b$10$K/d.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', 'Novelist of manners and romance.', 'Writer'),
(102, 'frank_herbert', 'fherbert@example.com', '$2b$10$K/d.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1', 'https://images.pexels.com/photos/3771836/pexels-photo-3771836.jpeg', 'Chronicler of Arrakis and the Golden Path.', 'Writer'),
(103, 'jrr_tolkien', 'jrrt@example.com', '$2b$10$K/d.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1', 'https://images.pexels.com/photos/839011/pexels-photo-839011.jpeg', 'Philologist, poet, and author of Middle-earth.', 'Writer'),
(104, 'harper_lee', 'hlee@example.com', '$2b$10$K/d.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1', 'https://images.pexels.com/photos/5082181/pexels-photo-5082181.jpeg', 'Chronicler of Maycomb County.', 'Writer'),
(105, 'george_orwell', 'gorwell@example.com', '$2b$10$K/d.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1', 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg', 'Essayist, journalist, and novelist.', 'Writer'),
-- Readers
(106, 'BookLover22', 'reader22@example.com', '$2b$10$K/d.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg', NULL, 'Reader'),
(107, 'Bibliophile_Ben', 'ben@example.com', '$2b$10$K/d.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1.dK1', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg', NULL, 'Reader')
ON DUPLICATE KEY UPDATE user_id = user_id;

-- ============================================================================
-- 3. INSERT NOVELS
-- ============================================================================

INSERT INTO `novels` (`novel_id`, `title`, `description`, `cover_image`, `tags`, `status`, `last_update`, `views`, `likes`, `rating`, `author_id`) 
VALUES
(2001, 'Pride and Prejudice', 'A classic romance novel that follows the spirited Elizabeth Bennet as she navigates love, family, and social expectations in Regency-era England.', '/pride-prejudice-cover.jpg', JSON_ARRAY('romance', 'classic', 'regency'), 'Completed', NOW(), 150230, 12500, 4.95, 101),
(2002, 'Dune', 'Set in the distant future, this sci-fi epic follows Paul Atreides as he becomes embroiled in the politics of the desert planet Arrakis and the struggle for the precious spice melange.', '/dune-cover.webp', JSON_ARRAY('sci-fi', 'epic', 'fantasy'), 'Completed', NOW(), 210500, 18200, 4.98, 102),
(2003, 'The Hobbit', 'The adventure of hobbit Bilbo Baggins, who is swept into an epic quest to reclaim treasure guarded by a dragon in Middle-earth.', '/hobbit-cover.jpg', JSON_ARRAY('fantasy', 'adventure', 'classic'), 'Completed', NOW(), 320000, 25000, 4.99, 103),
(2004, 'To Kill a Mockingbird', 'Told through the eyes of Scout Finch, this novel explores the irrationality of adult attitudes towards race and class in the American South.', '/mockingbird-cover.jpg', JSON_ARRAY('classic', 'fiction', 'southern-gothic'), 'Completed', NOW(), 180450, 15300, 4.96, 104),
(2005, 'Nineteen Eighty-Four', 'A chilling dystopian novel set in Airstrip One, where the totalitarian Party controls every aspect of human existence through surveillance and propaganda.', '/nineteen-eighty-four-cover.jpg', JSON_ARRAY('dystopian', 'sci-fi', 'classic'), 'Completed', NOW(), 255000, 21000, 4.97, 105)
ON DUPLICATE KEY UPDATE novel_id = novel_id;

-- ============================================================================
-- 4. INSERT EPISODES (Chapters)
-- ============================================================================

-- Pride and Prejudice Episodes
INSERT INTO `episodes` (`episode_id`, `novel_id`, `title`, `content`, `release_date`) 
VALUES
(3001, 2001, 'Chapter 1: First Impressions', 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.', '2025-09-01 10:00:00'),
(3002, 2001, 'Chapter 2: The Bennet Family', 'Mr. and Mrs. Bennet had five daughters; and Mr. Bennet, who was fond of having witty dialogue, was amazed at his wife\'s talk of establishing them all. His wife was a woman of mean understanding, little information, and uncertain temper.', '2025-09-02 10:00:00'),
-- Dune Episodes
(3003, 2002, 'Book One: Dune - Chapter 1', 'In the week before their departure to Arrakis, when all the final scurrying about had reached a nearly unbearable frenzy, an old woman came to visit the mother of the boy, Paul Atreides. Gaius Helen Mohiam, the Emperor\'s own Shadow, arrived at the Arrakis heighliner dock.', '2025-09-01 10:00:00'),
(3004, 2002, 'Book One: Dune - Chapter 2', 'The spice must flow. This was the fundamental principle that had shaped the history of Arrakis. Paul understood this now, felt the weight of it pressing down upon him as he stood in the palace, watching the sandworm-killed landscape stretch endlessly toward the horizon.', '2025-09-02 10:00:00'),
-- The Hobbit Episodes
(3005, 2003, 'Chapter 1: An Unexpected Party', 'In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and oozy smells, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort.', '2025-09-01 10:00:00'),
(3006, 2003, 'Chapter 2: Roast Mutton', 'When Bilbo woke, the sun was already shining through the window, and he realized that he had slept much later than intended. The dwarves were no longer sitting at the table; their breakfast was finished, and they were making ready to depart on their great adventure.', '2025-09-02 10:00:00'),
-- To Kill a Mockingbird Episodes
(3007, 2004, 'Part One, Chapter 1', 'When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow. When it healed, and Jem\'s fears of never being able to play football were assuaged, he was seldom self-conscious about his injury.', '2025-09-01 10:00:00'),
(3008, 2004, 'Part One, Chapter 2', 'Maycomb was an old town, but it was a tired old town when I first knew it. In rainy weather the streets turned to red slop; grass grew on the sidewalks, the courthouse sagged in the square. Somehow, it was hotter then; a black dog suffered on a summer\'s day.', '2025-09-02 10:00:00'),
-- Nineteen Eighty-Four Episodes
(3009, 2005, 'Part One, Chapter 1', 'It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.', '2025-09-01 10:00:00'),
(3010, 2005, 'Part One, Chapter 2', 'The Party told you to reject the evidence of your eyes and ears. It was their final, most essential command. His heart sank as he thought of the endless war, the terrible crushing weight of the Party\'s power, and the inexorable march toward 1984.', '2025-09-02 10:00:00')
ON DUPLICATE KEY UPDATE episode_id = episode_id;

-- ============================================================================
-- 5. INSERT REVIEWS
-- ============================================================================

INSERT INTO `reviews` (`review_id`, `novel_id`, `user_id`, `rating`, `comment`) 
VALUES
-- Pride and Prejudice Reviews
(4001, 2001, 106, 5, 'An absolute masterpiece of wit and romance. Elizabeth Bennet is one of my favorite characters of all time! The social commentary is as sharp today as it was 200 years ago.'),
(4002, 2001, 107, 4, 'A brilliant novel. It can be a bit slow at times if you\'re not used to the language, but the payoff is incredible. Mr. Darcy\'s character development is second to none.'),
-- Dune Reviews
(4003, 2002, 107, 5, 'The world-building is on another level. I\'ve never read anything so dense and imaginative. Politics, religion, ecology... it\'s all here. A must-read for any sci-fi fan.'),
(4004, 2002, 106, 5, 'Intimidating at first, but once you get into it, you can\'t put it down. The concept of the Spice and the Fremen is just genius.'),
-- The Hobbit Reviews
(4005, 2003, 106, 5, 'The perfect adventure story. It\'s cozy, exciting, and timeless. It feels like a warm blanket and a thrilling journey all at once. I read it every year.'),
(4006, 2003, 107, 5, 'A fantastic introduction to Middle-earth. It\'s much lighter than Lord of the Rings but no less magical. The riddle scene with Gollum is a masterclass in tension.'),
-- To Kill a Mockingbird Reviews
(4007, 2004, 107, 5, 'A powerful and moving story that everyone should read at least once in their life. Atticus Finch is a true hero and a moral compass for the ages.'),
(4008, 2004, 106, 5, 'Seeing the world through Scout\'s eyes is an unforgettable experience. It\'s a beautiful, heartbreaking, and important book.'),
-- Nineteen Eighty-Four Reviews
(4009, 2005, 106, 5, 'Terrifying because of how plausible it feels, even decades later. This book is a warning that has stayed with me for years. It fundamentally changes how you view the world.'),
(4010, 2005, 107, 5, 'An absolute masterpiece of dystopian fiction. The concepts of \'thoughtcrime\' and \'Newspeak\' are chillingly brilliant. More relevant now than ever.')
ON DUPLICATE KEY UPDATE review_id = review_id;

-- ============================================================================
-- 6. INSERT COMMENTS
-- ============================================================================

INSERT INTO `comments` (`comment_id`, `episode_id`, `user_id`, `parent_comment_id`, `content`) 
VALUES
-- Pride and Prejudice Comments
(5001, 3001, 107, NULL, 'What a brilliant opening line! Sets the entire tone for the book perfectly.'),
(5002, 3002, 106, NULL, 'I love Mr. Bennet\'s dry humor. He\'s always one step ahead of his wife. \'I have a high respect for your nerves\' - classic!'),
-- Dune Comments
(5003, 3003, 106, NULL, 'The Bene Gesserit are so mysterious and terrifying. The \'gom jabbar\' test is an incredible introduction to the stakes.'),
(5004, 3004, 107, 5003, 'Totally agree. The idea that pain is just in a box and the real test is your humanity is a concept that sticks with you.'),
-- The Hobbit Comments
(5005, 3005, 106, NULL, 'The description of the hobbit-hole makes me want to live there! So comfortable.'),
(5006, 3006, 107, NULL, 'The trolls are hilarious. The way they argue is so perfectly written.'),
-- To Kill a Mockingbird Comments
(5007, 3007, 106, NULL, 'The way the history of the Finch family is laid out is so immersive. You feel like you\'re part of Maycomb from the very first page.'),
(5008, 3008, 107, NULL, 'Miss Caroline\'s first day is such a perfect example of good intentions gone wrong. Scout trying to explain the Cunninghams is both funny and sad.'),
-- Nineteen Eighty-Four Comments
(5009, 3009, 107, NULL, 'The description of the telescreen and \'BIG BROTHER IS WATCHING YOU\' is instantly iconic and unsettling.'),
(5010, 3010, 106, NULL, 'The Parsons children are so creepy! The \'Spies\' are a horrifyingly effective tool of the Party.')
ON DUPLICATE KEY UPDATE comment_id = comment_id;

-- ============================================================================
-- 7. INSERT NOVEL_AUTHORS (Author-Novel relationships)
-- ============================================================================

INSERT INTO `novel_authors` (`user_id`, `novel_id`, `author_role`) 
VALUES
(101, 2001, 'Primary Author'),
(102, 2002, 'Primary Author'),
(103, 2003, 'Primary Author'),
(104, 2004, 'Primary Author'),
(105, 2005, 'Primary Author')
ON DUPLICATE KEY UPDATE user_id = user_id;

-- ============================================================================
-- 8. INSERT USER_WISHLIST (Sample wishlist entries)
-- ============================================================================

INSERT INTO `user_wishlist` (`user_id`, `novel_id`) 
VALUES
(106, 2001),
(106, 2002),
(107, 2003),
(107, 2005)
ON DUPLICATE KEY UPDATE user_id = user_id;

-- ============================================================================
-- 9. INSERT USER_FOLLOWS (Sample follow relationships)
-- ============================================================================

INSERT INTO `user_follows` (`follower_id`, `following_id`) 
VALUES
(106, 101),
(106, 103),
(107, 102),
(107, 104)
ON DUPLICATE KEY UPDATE follower_id = follower_id;

-- ============================================================================
-- 10. INSERT USER_READING_PROGRESS (Sample reading progress)
-- ============================================================================

INSERT INTO `user_reading_progress` (`user_id`, `novel_id`, `last_read_episode_id`, `updated_at`) 
VALUES
(106, 2001, 3002, NOW()),
(106, 2003, 3005, NOW()),
(107, 2002, 3004, NOW()),
(107, 2005, 3010, NOW())
ON DUPLICATE KEY UPDATE last_read_episode_id = last_read_episode_id;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This seed script creates:
-- - 7 users (5 writers/authors, 2 readers)
-- - 5 novels with complete metadata
-- - 10 episodes (chapters) with 2 per novel
-- - 10 reviews from readers
-- - 10 comments with 1 reply thread
-- - Author-novel relationships
-- - Sample wishlists and follow relationships
-- - Sample reading progress for readers
-- ============================================================================

SELECT 'Novel Nest Database Seed Complete!' AS Status;
