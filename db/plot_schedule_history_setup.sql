-- 1. Create the history table for plot_schedule
CREATE TABLE IF NOT EXISTS acquisition.plot_schedule_history (
    history_id BIGSERIAL PRIMARY KEY,
    sys_action VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    sys_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Original columns from plot_schedule
    schedule_id BIGINT,
    proposal_id UUID,
    plot_no VARCHAR(30),
    mouza_lgd BIGINT,
    jl_no VARCHAR(10),
    to_be_acquired_area NUMERIC(12, 4),
    acq_status VARCHAR(20),
    remarks TEXT,
    entry_by VARCHAR(10),
    updt_by VARCHAR(10),
    entry_ts BIGINT,
    updt_ts BIGINT,
    del_ts BIGINT,
    scheme_cd BIGINT,
    plot_ty VARCHAR(3),
    plot_number VARCHAR(15),
    bata_no VARCHAR(15),
    opt_plot_ty VARCHAR(3),
    opt_plot VARCHAR(15),
    opt_bata VARCHAR(15),
    state_lgd BIGINT,
    district_lgd BIGINT,
    block_lgd BIGINT,
    ps_lgd BIGINT,
    poss_proposal_id UUID,
    poss_status VARCHAR(20),
    poss_remarks TEXT,
    total_poss_area NUMERIC(12, 4),
    to_be_acquired_area_rm NUMERIC(12, 4),
    total_poss_area_rm NUMERIC(12, 4),
    total_ror_area NUMERIC(12, 4)
);

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION acquisition.plot_schedule_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO acquisition.plot_schedule_history 
        SELECT nextval('acquisition.plot_schedule_history_history_id_seq'), 'DELETE', NOW(), OLD.*;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO acquisition.plot_schedule_history 
        SELECT nextval('acquisition.plot_schedule_history_history_id_seq'), 'UPDATE', NOW(), OLD.*;
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO acquisition.plot_schedule_history 
        SELECT nextval('acquisition.plot_schedule_history_history_id_seq'), 'INSERT', NOW(), NEW.*;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to plot_schedule
DROP TRIGGER IF EXISTS trg_plot_schedule_audit ON acquisition.plot_schedule;

CREATE TRIGGER trg_plot_schedule_audit
AFTER INSERT OR UPDATE OR DELETE ON acquisition.plot_schedule
FOR EACH ROW EXECUTE FUNCTION acquisition.plot_schedule_audit_trigger();

-- 4. Create indexes for fast time-travel queries
CREATE INDEX IF NOT EXISTS idx_plot_schedule_hist_proposal ON acquisition.plot_schedule_history(proposal_id);
CREATE INDEX IF NOT EXISTS idx_plot_schedule_hist_time ON acquisition.plot_schedule_history(sys_timestamp);
