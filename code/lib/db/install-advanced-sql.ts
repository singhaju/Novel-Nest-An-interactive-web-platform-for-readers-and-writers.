import { getPool } from "../db"

// Installs MySQL stored procedures and triggers required by the project rubric.
// Run via the admin installer API (see app/api/admin/db-features/route.ts).
export async function installAdvancedSqlFeatures() {
  const statements = [
    // Ensure audit log table exists for user deletions.
    `CREATE TABLE IF NOT EXISTS deleted_users_log (
      log_id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      username VARCHAR(255),
      email VARCHAR(255),
      role VARCHAR(32),
      deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Trigger to archive user details before deletion.
    `DROP TRIGGER IF EXISTS log_user_deletions`,
    `CREATE TRIGGER log_user_deletions
    BEFORE DELETE ON users
    FOR EACH ROW
    BEGIN
      INSERT INTO deleted_users_log (user_id, username, email, role)
      VALUES (OLD.user_id, OLD.username, OLD.email, OLD.role);
    END`,

    // Stored procedure for upserting reading progress.
    `DROP PROCEDURE IF EXISTS UpdateReadingProgress`,
    `CREATE PROCEDURE UpdateReadingProgress(IN p_user_id INT, IN p_novel_id INT, IN p_episode_id INT)
BEGIN
  INSERT INTO user_reading_progress (user_id, novel_id, last_read_episode_id, updated_at)
  VALUES (p_user_id, p_novel_id, p_episode_id, NOW())
  ON DUPLICATE KEY UPDATE
    last_read_episode_id = VALUES(last_read_episode_id),
    updated_at = NOW();
  SELECT user_id, novel_id, last_read_episode_id, updated_at
  FROM user_reading_progress
  WHERE user_id = p_user_id AND novel_id = p_novel_id;
END`,

    // Trigger to refresh novel rating after a new review is added.
    `DROP TRIGGER IF EXISTS tr_reviews_after_insert`,
    `CREATE TRIGGER tr_reviews_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
UPDATE novels
SET rating = (
  SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
  FROM reviews r
  WHERE r.novel_id = NEW.novel_id
)
WHERE novel_id = NEW.novel_id`,

    // Trigger to refresh novel rating after a review is updated.
    `DROP TRIGGER IF EXISTS tr_reviews_after_update`,
    `CREATE TRIGGER tr_reviews_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
UPDATE novels
SET rating = (
  SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
  FROM reviews r
  WHERE r.novel_id = NEW.novel_id
)
WHERE novel_id = NEW.novel_id`,

    // Trigger to refresh novel rating after a review is deleted.
    `DROP TRIGGER IF EXISTS tr_reviews_after_delete`,
    `CREATE TRIGGER tr_reviews_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
UPDATE novels
SET rating = (
  SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
  FROM reviews r
  WHERE r.novel_id = OLD.novel_id
)
WHERE novel_id = OLD.novel_id`,

    // Trending novels procedure to surface popular titles by timeframe.
    `DROP PROCEDURE IF EXISTS GetTrendingNovels`,
    `CREATE PROCEDURE GetTrendingNovels(IN p_time_period VARCHAR(10))
BEGIN
  SELECT
    n.novel_id,
    n.title,
  n.description,
  n.cover_image,
    n.tags,
    n.status,
    n.views,
    n.likes,
    n.rating,
    n.created_at,
    n.last_update,
    n.author_id,
    u.username AS author_username,
    u.profile_picture AS author_profile_picture,
    COUNT(r.review_id) AS total_reviews,
    SUM(
      CASE
        WHEN p_time_period = 'daily' AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1
        WHEN p_time_period = 'weekly' AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN 1
        WHEN p_time_period = 'monthly' AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1
        WHEN p_time_period NOT IN ('daily','weekly','monthly') THEN 1
        ELSE 0
      END
    ) AS recent_review_score
  FROM novels n
  LEFT JOIN users u ON u.user_id = n.author_id
  LEFT JOIN reviews r ON r.novel_id = n.novel_id
  GROUP BY n.novel_id
  ORDER BY (n.views + n.likes + COALESCE(recent_review_score, 0)) DESC, n.last_update DESC
  LIMIT 50;
END`,

    // Wishlist helpers to add/remove entries via stored procedures.
    `DROP PROCEDURE IF EXISTS AddToWishlist`,
    `CREATE PROCEDURE AddToWishlist(IN p_user_id INT, IN p_novel_id INT)
BEGIN
  INSERT INTO user_wishlist (user_id, novel_id, added_at)
  VALUES (p_user_id, p_novel_id, NOW())
  ON DUPLICATE KEY UPDATE added_at = VALUES(added_at);
END`,

    `DROP PROCEDURE IF EXISTS RemoveFromWishlist`,
    `CREATE PROCEDURE RemoveFromWishlist(IN p_user_id INT, IN p_novel_id INT)
BEGIN
  DELETE FROM user_wishlist
  WHERE user_id = p_user_id AND novel_id = p_novel_id;
END`,

    // Follow helpers to manage author subscriptions.
    `DROP PROCEDURE IF EXISTS FollowAuthor`,
    `CREATE PROCEDURE FollowAuthor(IN p_follower_id INT, IN p_following_id INT)
BEGIN
  INSERT INTO user_follows (follower_id, following_id, followed_at)
  VALUES (p_follower_id, p_following_id, NOW())
  ON DUPLICATE KEY UPDATE followed_at = VALUES(followed_at);
END`,

    `DROP PROCEDURE IF EXISTS UnfollowAuthor`,
    `CREATE PROCEDURE UnfollowAuthor(IN p_follower_id INT, IN p_following_id INT)
BEGIN
  DELETE FROM user_follows
  WHERE follower_id = p_follower_id AND following_id = p_following_id;
END`,
  ]

  const pool = getPool()
  for (const statement of statements) {
    await pool.query(statement)
  }
}
