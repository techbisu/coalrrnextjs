-- acquisition.acq_proposal definition
-- Drop table
-- DROP TABLE acquisition.acq_proposal;

create table acquisition.acq_proposal ( proposal_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
proposal_no varchar(30) not null,
proposal_dt date not null,
mine_cd varchar(30) not null,
area_cd varchar(10) not null,
proj_cd varchar(30) not null,
acq_mode_id int2 not null,
purpose_justification text not null,
pr_scheme_ref_no varchar(100) null,
is_within_pr_limit bool default true not null,
cmd_admin_approval_ref varchar(100) null,
requires_board_approval bool default false not null,
total_land_cost_est numeric(18, 2) null,
total_rehab_cost_est numeric(18, 2) null,
total_employment_cost_est numeric(18, 2) null,
revenue_plan_doc_id int8 null,
current_stage_cd varchar(30) default 'DOCKET_PREP'::character varying not null,
overall_status varchar(20) default 'DRAFT'::character varying not null,
tot_acq_area numeric(12, 4) null,
tot_aprv_area numeric(12, 4) null,
entry_by varchar(20) not null,
updt_by varchar(20) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
updt_ts int8 default date_part('epoch'::text, now()) null,
del_ts int8 null,
constraint acq_proposal_no_uq unique (proposal_no),
constraint acq_proposal_pk primary key (proposal_id),
constraint chk_pr_limit_needs_cmd_approval check (((is_within_pr_limit = true)
or (cmd_admin_approval_ref is not null))));

create index idx_acq_proposal_proj on
acquisition.acq_proposal
    using btree (proj_cd)
where
(del_ts is null);

create index idx_acq_proposal_stage on
acquisition.acq_proposal
    using btree (current_stage_cd)
where
(del_ts is null);
-- Column comments

comment on
column acquisition.acq_proposal.current_stage_cd is 'Workflow Stage';

comment on
column acquisition.acq_proposal.overall_status is 'Status Code';
-- Permissions

alter table acquisition.acq_proposal owner to postgres;

grant all on
table acquisition.acq_proposal to postgres;
-- acquisition.acq_proposal_checklist definition
-- Drop table
-- DROP TABLE acquisition.acq_proposal_checklist;

create table acquisition.acq_proposal_checklist ( proposal_checklist_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
proposal_id int8 not null,
chk_id int4 not null,
is_complete bool default false not null,
document_id int8 null,
remarks text null,
verified_by varchar(10) null,
verified_ts int8 null,
entry_by varchar(10) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
constraint acq_proposal_checklist_pk primary key (proposal_checklist_id),
constraint acq_proposal_checklist_uq unique (proposal_id,
chk_id));
-- Permissions

alter table acquisition.acq_proposal_checklist owner to postgres;

grant all on
table acquisition.acq_proposal_checklist to postgres;
-- acquisition.checklist_justification definition
-- Drop table
-- DROP TABLE acquisition.checklist_justification;

create table acquisition.checklist_justification ( justification_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
proposal_id int8 not null,
fwd_to varchar(10) null,
jstn_cmnt text null,
status varchar(20) default 'FORWARDED'::character varying not null,
delta jsonb null,
entry_by varchar(10) null,
updt_by varchar(10) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
updt_ts int8 default date_part('epoch'::text, now()) null,
del_ts int8 null,
constraint checklist_justification_pk primary key (justification_id));

create index idx_cj_proposal on
acquisition.checklist_justification
    using btree (proposal_id)
where
(del_ts is null);

create index idx_cj_status on
acquisition.checklist_justification
    using btree (status)
where
(del_ts is null);
-- Permissions

alter table acquisition.checklist_justification owner to postgres;
-- acquisition.checklist_justification_item definition
-- Drop table
-- DROP TABLE acquisition.checklist_justification_item;

create table acquisition.checklist_justification_item ( justification_item_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
justification_id int8 not null,
proposal_checklist_id int8 not null,
entry_ts int8 default date_part('epoch'::text, now()) null,
constraint checklist_justification_item_pk primary key (justification_item_id),
constraint checklist_justification_item_uq unique (justification_id,
proposal_checklist_id));

create index idx_cji_justification on
acquisition.checklist_justification_item
    using btree (justification_id);

create index idx_cji_proposal_checklist on
acquisition.checklist_justification_item
    using btree (proposal_checklist_id);

comment on
table acquisition.checklist_justification_item is 'Junction: links one checklist_justification (forward) action to the specific acq_proposal_checklist rows it covers. Replaces chk_det.chk_id jsonb array.';
-- Permissions

alter table acquisition.checklist_justification_item owner to postgres;
-- acquisition.plot_schedule definition
-- Drop table
-- DROP TABLE acquisition.plot_schedule;

create table acquisition.plot_schedule ( schedule_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
proposal_id int8 not null,
plot_no varchar(30) not null,
mouza_lgd int8 not null,
jl_no varchar(10) null,
to_be_acquired_area numeric(12, 4) not null,
acq_status varchar(20) default 'PROPOSED'::character varying not null,
remarks text null,
entry_by varchar(10) null,
updt_by varchar(10) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
updt_ts int8 default date_part('epoch'::text, now()) null,
del_ts int8 null,
scheme_cd int8 null,
plot_ty varchar(3) null,
plot_number varchar(15) null,
bata_no varchar(15) null,
opt_plot_ty varchar(3) null,
opt_plot varchar(15) null,
opt_bata varchar(15) null,
state_lgd int8 null,
district_lgd int8 null,
block_lgd int8 null,
ps_lgd int8 null,
poss_proposal_id int8 null,
poss_status varchar(20) default 'PENDING'::character varying not null,
poss_remarks text null,
total_poss_area numeric(12, 4) null,
to_be_acquired_area_rm numeric(12, 4) null,
total_poss_area_rm numeric(12, 4) null,
constraint plot_schedule_pk primary key (schedule_id),
constraint plot_schedule_uq unique (proposal_id,
plot_no));

create index idx_plot_schedule_district on
acquisition.plot_schedule
    using btree (district_lgd)
where
(del_ts is null);

create index idx_plot_schedule_mouza on
acquisition.plot_schedule
    using btree (mouza_lgd)
where
(del_ts is null);

create index idx_plot_schedule_poss_status on
acquisition.plot_schedule
    using btree (poss_status)
where
(del_ts is null);

create index idx_plot_schedule_proposal on
acquisition.plot_schedule
    using btree (proposal_id)
where
(del_ts is null);

create index idx_plot_schedule_state on
acquisition.plot_schedule
    using btree (state_lgd)
where
(del_ts is null);

create unique index uq_plot_schedule_active_plot on
acquisition.plot_schedule
    using btree (plot_no)
where
((del_ts is null)
    and ((acq_status)::text <> all ((array['CANCELLED'::character varying,
    'WITHDRAWN'::character varying,
    'CLOSED'::character varying])::text[])));
-- Column comments

comment on
column acquisition.plot_schedule.scheme_cd is 'Acquisition scheme code (merged from sch_cd in both legacy tables)';

comment on
column acquisition.plot_schedule.plot_number is 'Revenue/dag number as per land record, distinct from plot_no (system plot key)';

comment on
column acquisition.plot_schedule.bata_no is 'Bata (sub-plot) number under the main plot';

comment on
column acquisition.plot_schedule.opt_plot_ty is 'Alternate/optional plot type, where a plot has been re-classified';

comment on
column acquisition.plot_schedule.opt_plot is 'Alternate/optional plot number';

comment on
column acquisition.plot_schedule.opt_bata is 'Alternate/optional bata number';

comment on
column acquisition.plot_schedule.poss_proposal_id is 'Proposal under which possession is tracked, if different from the acquisition proposal_id';

comment on
column acquisition.plot_schedule.poss_status is 'Lifecycle status of possession for this plot, independent of acq_status';
-- Permissions

alter table acquisition.plot_schedule owner to postgres;

grant all on
table acquisition.plot_schedule to postgres;
-- acquisition.plot_schedule_land_type definition
-- Drop table
-- DROP TABLE acquisition.plot_schedule_land_type;

create table acquisition.plot_schedule_land_type ( schedule_land_type_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
schedule_id int8 not null,
landt_id int8 not null,
area numeric(12, 4) not null,
area_to_acquire numeric(12, 4) not null,
area_acquired numeric(12, 4) default 0 null,
revenue_plan_colour varchar(20) null,
land_type_slug numeric(12, 4) null,
as_per_ror numeric(12, 4) null,
rem_area numeric(12, 4) null,
constraint chk_slt_area check (((area > (0)::numeric)
    and (area_to_acquire >= (0)::numeric)
        and (area_to_acquire <= area)
            and (area_acquired <= area_to_acquire))),
constraint plot_schedule_land_type_pk primary key (schedule_land_type_id),
constraint plot_schedule_land_type_uq unique (schedule_id,
landt_id));
-- Table Triggers

create trigger trg_sync_schedule_to_be_acquired after
insert
    or
delete
    or
update
    on
    acquisition.plot_schedule_land_type for each row execute function acquisition.fn_sync_schedule_to_be_acquired();
-- Permissions

alter table acquisition.plot_schedule_land_type owner to postgres;

grant all on
table acquisition.plot_schedule_land_type to postgres;
-- acquisition.proposal_workflow_transition definition
-- Drop table
-- DROP TABLE acquisition.proposal_workflow_transition;

create table acquisition.proposal_workflow_transition ( transition_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
proposal_id int8 not null,
stage_cd varchar(30) not null,
"action" varchar(20) not null,
acted_by varchar(10) not null,
acted_ts int8 default date_part('epoch'::text, now()) not null,
ref_form_no varchar(30) null,
remarks text null,
constraint chk_transition_action check (((action)::text = any ((array['FORWARDED'::character varying,
'APPROVED'::character varying,
'REJECTED'::character varying,
'RETURNED'::character varying,
'ESCALATED'::character varying])::text[]))),
constraint proposal_workflow_transition_pk primary key (transition_id));

create index idx_pwt_proposal on
acquisition.proposal_workflow_transition
    using btree (proposal_id,
acted_ts);
-- Permissions

alter table acquisition.proposal_workflow_transition owner to postgres;

grant all on
table acquisition.proposal_workflow_transition to postgres;
-- acquisition.reconciliation_cert definition
-- Drop table
-- DROP TABLE acquisition.reconciliation_cert;

create table acquisition.reconciliation_cert ( recon_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
proposal_id int8 not null,
form_no varchar(30) not null,
form_dt date not null,
requesting_mine_cd varchar(30) not null,
adjacent_mine_cd varchar(30) not null,
requesting_signatory varchar(10) null,
adjacent_signatory varchar(10) null,
requesting_signed_ts int8 null,
adjacent_signed_ts int8 null,
recon_status varchar(20) default 'PENDING'::character varying not null,
remarks text null,
entry_by varchar(20) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
updt_ts int8 default date_part('epoch'::text, now()) null,
del_ts int8 null,
constraint chk_recon_diff_mines check (((requesting_mine_cd)::text <> (adjacent_mine_cd)::text)),
constraint reconciliation_cert_pk primary key (recon_id));
-- Permissions

alter table acquisition.reconciliation_cert owner to postgres;

grant all on
table acquisition.reconciliation_cert to postgres;
-- acquisition.reconciliation_cert_plot definition
-- Drop table
-- DROP TABLE acquisition.reconciliation_cert_plot;

create table acquisition.reconciliation_cert_plot ( recon_plot_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
recon_id int8 not null,
schedule_id int8 not null,
previously_acquired bool default false not null,
previously_purchased bool default false not null,
comp_or_rr_paid_by_adjacent bool default false not null,
total_area numeric(12, 4) null,
purchased_area numeric(12, 4) null,
remarks text null,
constraint reconciliation_cert_plot_pk primary key (recon_plot_id),
constraint reconciliation_cert_plot_uq unique (recon_id,
schedule_id));
-- Permissions

alter table acquisition.reconciliation_cert_plot owner to postgres;

grant all on
table acquisition.reconciliation_cert_plot to postgres;
-- acquisition.statutory_notification definition
-- Drop table
-- DROP TABLE acquisition.statutory_notification;

create table acquisition.statutory_notification ( notification_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
proposal_id int8 not null,
section_cd varchar(30) not null,
notification_dt date null,
gazette_ref_no varchar(100) null,
portal_application_id varchar(100) null,
collector_ref_no varchar(100) null,
status varchar(20) default 'PENDING'::character varying not null,
remarks text null,
entry_by varchar(10) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
constraint statutory_notification_pk primary key (notification_id),
constraint statutory_notification_uq unique (proposal_id,
section_cd));
-- Permissions

alter table acquisition.statutory_notification owner to postgres;

grant all on
table acquisition.statutory_notification to postgres;
-- acquisition.acq_proposal foreign keys

alter table acquisition.acq_proposal add constraint acq_proposal_fk_area foreign key (area_cd) references master.area(area_cd);

alter table acquisition.acq_proposal add constraint acq_proposal_fk_mine foreign key (mine_cd) references master.mine(mine_cd);

alter table acquisition.acq_proposal add constraint acq_proposal_fk_mode foreign key (acq_mode_id) references master.acqu_mode(acq_mode_id);

alter table acquisition.acq_proposal add constraint acq_proposal_fk_proj foreign key (proj_cd) references master.project(proj_cd);

alter table acquisition.acq_proposal add constraint acq_proposal_fk_status foreign key (overall_status) references master.status(status_cd);

alter table acquisition.acq_proposal add constraint fk_proposal_revenue_plan foreign key (revenue_plan_doc_id) references acquisition.documents(document_id);
-- acquisition.acq_proposal_checklist foreign keys

alter table acquisition.acq_proposal_checklist add constraint fk_pc_checklist foreign key (chk_id) references master.checklist(chk_id);

alter table acquisition.acq_proposal_checklist add constraint fk_pc_proposal foreign key (proposal_id) references acquisition.acq_proposal(proposal_id) on
delete
    cascade;

alter table acquisition.acq_proposal_checklist add constraint fk_pc_verifier foreign key (verified_by) references master.users(user_code);
-- acquisition.checklist_justification foreign keys

alter table acquisition.checklist_justification add constraint fk_cj_fwd_to foreign key (fwd_to) references master.users(user_code);

alter table acquisition.checklist_justification add constraint fk_cj_proposal foreign key (proposal_id) references acquisition.acq_proposal(proposal_id) on
delete
    cascade;

alter table acquisition.checklist_justification add constraint fk_cj_status foreign key (status) references master.status(status_cd);
-- acquisition.checklist_justification_item foreign keys

alter table acquisition.checklist_justification_item add constraint fk_cji_justification foreign key (justification_id) references acquisition.checklist_justification(justification_id) on
delete
    cascade;

alter table acquisition.checklist_justification_item add constraint fk_cji_proposal_checklist foreign key (proposal_checklist_id) references acquisition.acq_proposal_checklist(proposal_checklist_id) on
delete
    cascade;
-- acquisition.plot_schedule foreign keys

alter table acquisition.plot_schedule add constraint fk_schedule_mouza foreign key (mouza_lgd) references master.mouza(mouza_lgd);

alter table acquisition.plot_schedule add constraint fk_schedule_plot foreign key (plot_no) references acquisition.plot_det(plot_no);

alter table acquisition.plot_schedule add constraint fk_schedule_poss_status foreign key (poss_status) references master.status(status_cd);

alter table acquisition.plot_schedule add constraint fk_schedule_proposal foreign key (proposal_id) references acquisition.acq_proposal(proposal_id) on
delete
    cascade;

alter table acquisition.plot_schedule add constraint fk_schedule_status foreign key (acq_status) references master.status(status_cd);
-- acquisition.plot_schedule_land_type foreign keys

alter table acquisition.plot_schedule_land_type add constraint fk_slt_landtype foreign key (landt_id) references master.landtype(landt_id);

alter table acquisition.plot_schedule_land_type add constraint fk_slt_schedule foreign key (schedule_id) references acquisition.plot_schedule(schedule_id) on
delete
    cascade;
-- acquisition.proposal_workflow_transition foreign keys

alter table acquisition.proposal_workflow_transition add constraint fk_pwt_proposal foreign key (proposal_id) references acquisition.acq_proposal(proposal_id) on
delete
    cascade;

alter table acquisition.proposal_workflow_transition add constraint fk_pwt_stage foreign key (stage_cd) references master.workflow_stage(stage_cd);

alter table acquisition.proposal_workflow_transition add constraint fk_pwt_user foreign key (acted_by) references master.users(user_code);
-- acquisition.reconciliation_cert foreign keys

alter table acquisition.reconciliation_cert add constraint fk_recon_adj_mine foreign key (adjacent_mine_cd) references master.mine(mine_cd);

alter table acquisition.reconciliation_cert add constraint fk_recon_proposal foreign key (proposal_id) references acquisition.acq_proposal(proposal_id) on
delete
    cascade;

alter table acquisition.reconciliation_cert add constraint fk_recon_req_mine foreign key (requesting_mine_cd) references master.mine(mine_cd);
-- acquisition.reconciliation_cert_plot foreign keys

alter table acquisition.reconciliation_cert_plot add constraint fk_rcp_recon foreign key (recon_id) references acquisition.reconciliation_cert(recon_id) on
delete
    cascade;

alter table acquisition.reconciliation_cert_plot add constraint fk_rcp_schedule foreign key (schedule_id) references acquisition.plot_schedule(schedule_id);
-- acquisition.statutory_notification foreign keys

alter table acquisition.statutory_notification add constraint fk_sn_proposal foreign key (proposal_id) references acquisition.acq_proposal(proposal_id) on
delete
    cascade;

alter table acquisition.statutory_notification add constraint fk_sn_section foreign key (section_cd) references master.statutory_section(section_cd);





























-- master.acqu_mode definition
-- Drop table
-- DROP TABLE master.acqu_mode;

create table master.acqu_mode ( acq_mode_id int2 not null,
acqu_method varchar(50) not null,
description text null,
is_active bool default true null,
entry_by varchar(20) null,
updt_by varchar(20) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
updt_ts int8 default date_part('epoch'::text, now()) null,
del_ts int8 null,
constraint acqu_mode_pk primary key (acq_mode_id),
constraint acqu_mode_uq unique (acq_mode_id));
-- Permissions

alter table master.acqu_mode owner to postgres;

grant all on
table master.acqu_mode to postgres;
-- master.checklist definition
-- Drop table
-- DROP TABLE master.checklist;

create table master.checklist ( chk_id int4 not null,
chk_description text null,
chk_type varchar(15) null,
chk_sub_type varchar(15) null,
chk_inp_type varchar(50) null,
acq_mode_id int8 null,
is_initial bool null,
noti_type varchar(30) null,
chk_inp_instruc text null,
local_vernacular text null,
entry_by varchar(10) null,
updt_by varchar(10) null,
entry_ts int8 null,
updt_ts int8 null,
del_ts int8 null,
constraint checklist_pk primary key (chk_id));
-- Permissions

alter table master.checklist owner to postgres;

grant all on
table master.checklist to postgres;
-- master.landtype definition
-- Drop table
-- DROP TABLE master.landtype;

create table master.landtype ( landt_id int8 not null,
land_type varchar(255) not null,
entry_by varchar(10) null,
updt_by varchar(10) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
updt_ts int8 default date_part('epoch'::text, now()) null,
del_ts int8 null,
constraint landtype_pk primary key (landt_id));
-- Permissions

alter table master.landtype owner to postgres;

grant all on
table master.landtype to postgres;
-- master.statutory_section definition
-- Drop table
-- DROP TABLE master.statutory_section;

create table master.statutory_section ( section_cd varchar(30) not null,
act_name varchar(100) not null,
section_no varchar(20) not null,
section_desc text not null,
seq_no int2 not null,
acq_mode_id int2 not null,
authority varchar(100) null,
constraint statutory_section_pk primary key (section_cd),
constraint fk_ss_mode foreign key (acq_mode_id) references master.acqu_mode(acq_mode_id));
-- Permissions

alter table master.statutory_section owner to postgres;

grant all on
table master.statutory_section to postgres;
-- master.workflow_stage definition
-- Drop table
-- DROP TABLE master.workflow_stage;

create table master.workflow_stage ( stage_cd varchar(30) not null,
stage_name varchar(100) not null,
seq_no int2 not null,
authority_level varchar(30) not null,
acq_mode_id int2 null,
is_active bool default true null,
constraint workflow_stage_pk primary key (stage_cd),
constraint workflow_stage_seq_uq unique (seq_no,
acq_mode_id),
constraint fk_ws_mode foreign key (acq_mode_id) references master.acqu_mode(acq_mode_id));
-- Permissions

alter table master.workflow_stage owner to postgres;

grant all on
table master.workflow_stage to postgres;
-- master.mine_adjacency definition
-- Drop table
-- DROP TABLE master.mine_adjacency;

create table master.mine_adjacency ( adjacency_id int8 generated always as identity( increment by 1 minvalue 1 maxvalue 9223372036854775807 start 1 cache 1 no cycle) not null,
mine_cd varchar(30) not null,
adjacent_mine_cd varchar(30) not null,
adjacency_type varchar(30) default 'BOUNDARY'::character varying null,
is_active bool default true null,
remarks text null,
entry_by varchar(20) null,
entry_ts int8 default date_part('epoch'::text, now()) null,
updt_by varchar(20) null,
updt_ts int8 default date_part('epoch'::text, now()) null,
constraint chk_ma_self check (((mine_cd)::text <> (adjacent_mine_cd)::text)),
constraint mine_adjacency_pkey primary key (adjacency_id),
constraint uq_ma_pair unique (mine_cd,
adjacent_mine_cd));

comment on
table master.mine_adjacency is 'Stores the adjacency relationship between mines. Each record defines whether one mine shares a common boundary or operational adjacency with another mine. This master table is used for reconciliation certificates, boundary verification, joint surveys, mine expansion planning, and other inter-mine operational processes.';
-- Column comments

comment on
column master.mine_adjacency.adjacency_id is 'System-generated unique identifier for the mine adjacency record.';

comment on
column master.mine_adjacency.mine_cd is 'Mine code of the primary (source) mine as referenced from the Mine Master.';

comment on
column master.mine_adjacency.adjacent_mine_cd is 'Mine code of the adjacent (neighbouring) mine sharing a common boundary or operational interface.';

comment on
column master.mine_adjacency.adjacency_type is 'Type of adjacency between the two mines (e.g., BOUNDARY, LEASE, UNDERGROUND, SURFACE, ROAD, RAILWAY, WATERBODY).';

comment on
column master.mine_adjacency.is_active is 'Indicates whether the adjacency relationship is currently active.';

comment on
column master.mine_adjacency.remarks is 'Additional remarks or notes regarding the adjacency relationship.';

comment on
column master.mine_adjacency.entry_by is 'User ID of the person who created the record.';

comment on
column master.mine_adjacency.entry_ts is 'Unix epoch timestamp when the record was created.';

comment on
column master.mine_adjacency.updt_by is 'User ID of the person who last updated the record.';

comment on
column master.mine_adjacency.updt_ts is 'Unix epoch timestamp when the record was last updated.';
-- Table Triggers

create trigger trg_mine_adjacency_reverse after
insert
    on
    master.mine_adjacency for each row execute function master.fn_mine_adjacency_reverse();
-- Permissions

alter table master.mine_adjacency owner to postgres;

grant all on
table master.mine_adjacency to postgres;
-- master.mine_adjacency foreign keys

alter table master.mine_adjacency add constraint fk_ma_adj_mine foreign key (adjacent_mine_cd) references master.mine(mine_cd) on
delete
    cascade;

alter table master.mine_adjacency add constraint fk_ma_mine foreign key (mine_cd) references master.mine(mine_cd) on
delete
    cascade;
