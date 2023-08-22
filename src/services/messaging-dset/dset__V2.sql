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

DROP TABLE IF EXISTS dset_client;
CREATE TABLE IF NOT EXISTS dset_client
(
    id              INT          NOT NULL AUTO_INCREMENT,
    queue_name      varchar(32)  NOT NULL COMMENT 'target node queue name',
    target_node_id  varchar(128) NOT NULL COMMENT 'target node eth address',
    target_node_url varchar(128) NOT NULL COMMENT 'target node url, filled from the contract',
    target_offset   bigint(20)   NOT NULL DEFAULT 0 COMMENT 'initial offset to fetch target queue',
    state           tinyint(1)   NOT NULL DEFAULT 1 COMMENT '1 = enabled, 0 = disabled',
    PRIMARY KEY (id),
    UNIQUE KEY uniq_dset_name_and_target (queue_name, target_node_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8;