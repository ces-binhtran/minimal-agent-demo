-- Checkpoints table
CREATE TABLE IF NOT EXISTS checkpoints (
    thread_id VARCHAR(100) NOT NULL,
    checkpoint_ns VARCHAR(100) NOT NULL DEFAULT '',
    checkpoint_id VARCHAR(100) NOT NULL,
    parent_checkpoint_id VARCHAR(100),
    type VARCHAR(100),
    checkpoint JSON NOT NULL,
    metadata JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

-- Checkpoint Blobs table
-- Renamed column 'blob' to 'value' to avoid MySQL reserved keyword syntax error
-- Reduced VARCHAR length to 100 to avoid "Key too long" error (1071)
CREATE TABLE IF NOT EXISTS checkpoint_blobs (
    thread_id VARCHAR(100) NOT NULL,
    checkpoint_ns VARCHAR(100) NOT NULL DEFAULT '',
    channel VARCHAR(100) NOT NULL,
    version VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    value LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
);

-- Writes table
CREATE TABLE IF NOT EXISTS checkpoint_writes (
    thread_id VARCHAR(100) NOT NULL,
    checkpoint_ns VARCHAR(100) NOT NULL DEFAULT '',
    checkpoint_id VARCHAR(100) NOT NULL,
    task_id VARCHAR(100) NOT NULL,
    idx INT NOT NULL,
    channel VARCHAR(100) NOT NULL,
    type VARCHAR(100),
    value LONGTEXT,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);

-- Feedback table (Enhanced for RLHF/Fine-tuning)
CREATE TABLE IF NOT EXISTS feedback (
    id VARCHAR(36) PRIMARY KEY,
    thread_id VARCHAR(100) NOT NULL,
    run_id VARCHAR(100),      -- Links to the specific Agent Run (Trace)
    message_id VARCHAR(100),  -- Links to the specific UI message
    score INT NOT NULL,
    comment TEXT,
    user_input LONGTEXT,      -- Snapshot of what the user asked
    model_output LONGTEXT,    -- Snapshot of what the agent answered
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
