DROP TABLE IF EXISTS blocks;
CREATE TABLE IF NOT EXISTS blocks
(
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  object_hash VARCHAR(255) NULL COMMENT 'optional: a uniq field to fight duplicates',
  object      MEDIUMTEXT   NOT NULL,
  ts          timestamp default CURRENT_TIMESTAMP(),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_mblock_object_hash (object_hash)
  ) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;
