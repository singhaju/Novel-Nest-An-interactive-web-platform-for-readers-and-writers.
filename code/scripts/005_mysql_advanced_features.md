# MySQL Advanced Features (Stored Procedure + Triggers)

Run the statements below against the MySQL database to provision the stored procedure and triggers used by Novel Nest. These commands mirror what the automated installer executes via the `/api/admin/db-features` route.

```sql
-- Stored procedure: UpdateReadingProgress
DROP PROCEDURE IF EXISTS UpdateReadingProgress;
CREATE PROCEDURE UpdateReadingProgress(IN p_user_id INT, IN p_novel_id INT, IN p_episode_id INT)
BEGIN
  INSERT INTO user_reading_progress (user_id, novel_id, last_read_episode_id, updated_at)
  VALUES (p_user_id, p_novel_id, p_episode_id, NOW())
  ON DUPLICATE KEY UPDATE
    last_read_episode_id = VALUES(last_read_episode_id),
    updated_at = NOW();

  SELECT user_id, novel_id, last_read_episode_id, updated_at
  FROM user_reading_progress
  WHERE user_id = p_user_id AND novel_id = p_novel_id;
END;

-- Triggers: keep novels.rating synchronised with reviews
DROP TRIGGER IF EXISTS tr_reviews_after_insert;
CREATE TRIGGER tr_reviews_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
UPDATE novels
SET rating = (
  SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
  FROM reviews r
  WHERE r.novel_id = NEW.novel_id
)
WHERE novel_id = NEW.novel_id;

DROP TRIGGER IF EXISTS tr_reviews_after_update;
CREATE TRIGGER tr_reviews_after_update
AFTER UPDATE ON reviews
FOR EACH ROW
UPDATE novels
SET rating = (
  SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
  FROM reviews r
  WHERE r.novel_id = NEW.novel_id
)
WHERE novel_id = NEW.novel_id;

DROP TRIGGER IF EXISTS tr_reviews_after_delete;
CREATE TRIGGER tr_reviews_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
UPDATE novels
SET rating = (
  SELECT IFNULL(ROUND(AVG(r.rating), 2), 0)
  FROM reviews r
  WHERE r.novel_id = OLD.novel_id
)
WHERE novel_id = OLD.novel_id;
```
