import type { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto';
import crypto from 'crypto';

export async function seedUsers(db: PrismaClient) {
  console.log('Seeding users across Unit, Area, and HQ roles...')
  const hash = crypto.createHash('sha256').update('demo1234').digest('hex');
  const users = [
    // ── 4 Unit Roles ────────────────────────────────────────────────────────
    { email: 'landclerk@coalrr.gov.in', name: 'Land Clerk', designation: 'Land Clerk / Rev. Inspector', tenant_id: 'ecl' },
    { email: 'unit@coalrr.gov.in', name: 'Biswajit Nandi', designation: 'Unit Surveyor', tenant_id: 'ecl' },
    { email: 'manager@coalrr.gov.in', name: 'Colliery Manager', designation: 'Colliery Manager', tenant_id: 'ecl' },
    { email: 'agent@coalrr.gov.in', name: 'Project Agent', designation: 'Colliery Agent', tenant_id: 'ecl' },

    // ── 3 Area Roles ────────────────────────────────────────────────────────
    { email: 'area@coalrr.gov.in', name: 'Area Land Officer', designation: 'Area Land Dealing Officer', tenant_id: 'ecl' },
    { email: 'landcell@coalrr.gov.in', name: 'Area Land Cell Member', designation: 'Land Cell Committee Member', tenant_id: 'ecl' },
    { email: 'areagm@coalrr.gov.in', name: 'Area General Manager', designation: 'Area General Manager', tenant_id: 'ecl' },

    // ── 5 HQ Roles ──────────────────────────────────────────────────────────
    { email: 'landofficer.lre@coalrr.gov.in', name: 'Land Officer LRE', designation: 'Land Officer (L&RE HQ)', tenant_id: 'ecl' },
    { email: 'gm.lre@coalrr.gov.in', name: 'GM LRE', designation: 'General Manager (L&RE HQ)', tenant_id: 'ecl' },
    { email: 'gm.planning@coalrr.gov.in', name: 'GM Planning', designation: 'General Manager (Planning HQ)', tenant_id: 'ecl' },
    { email: 'gm.finance@coalrr.gov.in', name: 'GM Finance', designation: 'General Manager (Finance HQ)', tenant_id: 'ecl' },
    { email: 'gm.safety@coalrr.gov.in', name: 'GM Safety', designation: 'General Manager (Safety HQ)', tenant_id: 'ecl' },

    // ── Apex & Admin Roles ──────────────────────────────────────────────────
    { email: 'cmd@coalrr.gov.in', name: 'CMD', designation: 'Director / CMD', tenant_id: 'ecl' },
    { email: 'superadmin@coalrr.in', name: 'System Super Admin', designation: 'Super Admin', tenant_id: 'ecl' },
  ];

  // Ensure baseline state, area, mine exist for scope assignment
  let state = await db.state.findFirst();
  if (!state) {
    state = await db.state.create({
      data: {
        state_lgd: BigInt(20),
        state_en: 'Jharkhand',
        state_loc_vern: 'Jharkhand',
        is_active: true,
      },
    });
  }

  let area = await db.area.findFirst();
  if (!area) {
    area = await db.area.create({
      data: {
        area_cd: 'AREA-01',
        area_en: 'Kajora Area',
        is_active: true,
        state_lgd: state.state_lgd,
      },
    });
  }

  let mine = await db.mine.findFirst();
  if (!mine) {
    mine = await db.mine.create({
      data: {
        mine_cd: 'MINE-01',
        mine_en: 'Central Kajora Colliery',
        area_cd: area.area_cd,
        is_active: true,
        state_lgd: state.state_lgd,
      },
    });
  }

  for (const u of users) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        designation: u.designation,
        updt_ts: new Date(),
      },
      create: {
        ...u,
        password_hash: hash,
        mobile: Math.floor(Math.random() * 10000000000).toString(),
        updt_ts: new Date(),
      },
    });

    // Assign organizational scope per role level
    const email = u.email.toLowerCase();
    const isUnit = ['landclerk@', 'unit@', 'manager@', 'agent@'].some(prefix => email.startsWith(prefix));
    const isArea = ['area@', 'landcell@', 'areagm@'].some(prefix => email.startsWith(prefix));
    const scopeLevel: 'UNIT' | 'AREA' | 'HQ' = isUnit ? 'UNIT' : isArea ? 'AREA' : 'HQ';

    const existingScope = await db.user_org_scope.findFirst({
      where: { user_id: user.id },
    });

    if (!existingScope) {
      await db.user_org_scope.create({
        data: {
          user_id: user.id,
          scope_level: scopeLevel,
          area_cd: (scopeLevel === 'UNIT' || scopeLevel === 'AREA') ? area.area_cd : null,
          mine_cd: scopeLevel === 'UNIT' ? mine.mine_cd : null,
          created_by: 'system',
          entry_by: 'system',
        },
      });
    }
  }
}
