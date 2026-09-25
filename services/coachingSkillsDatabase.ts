import { SkillItem, PositionRole, CoachingSportId } from './academyService';

export type SkillPresetType = 'core' | 'development' | 'master40' | 'positional' | 'custom';

export interface SkillPresetInfo {
  id: SkillPresetType;
  name: string;
  badge: string;
  description: string;
  countLabel: string;
}

export const SKILL_PRESETS_META: SkillPresetInfo[] = [
  {
    id: 'core',
    name: 'Basic Essentials',
    badge: '⚡ Basic',
    countLabel: '12 Skills',
    description: 'Fundamental core skills for beginners, young learners, and quick evaluations.'
  },
  {
    id: 'development',
    name: 'Standard Syllabus',
    badge: '🎯 Standard',
    countLabel: '20 Skills',
    description: 'Balanced technical, tactical, and fitness skills for intermediate academy students.'
  },
  {
    id: 'master40',
    name: 'All 40 Skills',
    badge: '🏆 Complete',
    countLabel: '40 Skills',
    description: 'Complete skill list covering technical, game tactics, fitness, and conduct.'
  },
  {
    id: 'positional',
    name: 'Position & Role Skills',
    badge: '🛡️ Role Focus',
    countLabel: 'Role Specific',
    description: 'Core basic skills combined with specific skills for the player’s position.'
  },
  {
    id: 'custom',
    name: 'Custom Selection',
    badge: '✏️ Custom',
    countLabel: 'Custom',
    description: 'Hand-picked skills chosen by the coach or teacher for this athlete.'
  }
];

// Helper builder to create skills cleanly
function createSkill(
  id: string,
  name: string,
  category: 'technical' | 'tactical' | 'physical' | 'gameBehaviour',
  isCore: boolean,
  description: string,
  coachingCue: string,
  defaultScore: number = 3
): SkillItem {
  return { id, name, category, isCore, description, coachingCue, defaultScore };
}

// ==========================================
// 1. FOOTBALL (SOCCER) - 40 SKILLS
// ==========================================
export const FOOTBALL_SKILLS: SkillItem[] = [
  createSkill('fb_ball_control', 'Ball Control & Cushioning', 'technical', true, 'Cushioning rolling and aerial balls with instep, thigh, and chest.', 'Soft ankles, body behind line of flight.'),
  createSkill('fb_first_touch_directional', 'Directional First Touch', 'technical', true, 'Directing first contact into open space away from defender.', 'Head up before touch, open body stance.'),
  createSkill('fb_dribbling_close', 'Close Control Dribbling', 'technical', true, 'Keeping ball within striking radius while weaving at moderate tempo.', 'Small touches with laces and outside foot.'),
  createSkill('fb_speed_dribbling', 'Speed Dribbling & Acceleration', 'technical', true, 'Driving into open space at sprint speed without losing control.', 'Push ball 2-3 yards ahead, sprint onto stride.'),
  createSkill('fb_turning_cod', 'Turning & Changing Direction', 'technical', true, 'Sharp turns (Cruyff, hook, drag-back) with fast exit.', 'Drop hips low, push off outer foot.'),
  createSkill('fb_short_passing', 'Short Passing Accuracy', 'technical', true, 'Crisp inside-foot ground passes with correct speed and line.', 'Lock ankle, follow through along ground.'),
  createSkill('fb_long_passing', 'Lofted Long Passing', 'technical', false, 'Delivering aerial passes over 25+ meters with backspin or drive.', 'Strike lower half of ball with laces.'),
  createSkill('fb_receiving_backfoot', 'Receiving on Far Foot', 'technical', true, 'Receiving with far foot to open up the entire pitch in one motion.', 'Check shoulder, receive across body.'),
  createSkill('fb_shooting_power', 'Shooting Power (Instep Strike)', 'technical', true, 'Clean contact through laces generating strong shot speed.', 'Plant foot beside ball, chest over ball.'),
  createSkill('fb_shooting_accuracy', 'Shooting Placement & Finesse', 'technical', true, 'Placing shots low into bottom corners.', 'Target corners, prioritize placement over pure power.'),
  createSkill('fb_1v1_attacking', '1v1 Attacking Moves & Feints', 'technical', true, 'Using body drops, stepovers, and speed shifts to beat defenders.', 'Commit defender onto heels then accelerate past.'),
  createSkill('fb_weak_foot', 'Weak-Foot Passing & Striking', 'technical', false, 'Passing, crossing, and striking cleanly with non-dominant foot.', 'Keep plant foot balanced, mirror dominant motion.'),
  createSkill('fb_crossing_delivery', 'Crossing from Wide Flanks', 'technical', false, 'Inswinging, outswinging, and cutback deliveries from wide zones.', 'Look up before crossing, wrap foot around ball.'),
  createSkill('fb_heading_technique', 'Heading (Defensive & Attacking)', 'technical', false, 'Attacking aerial balls with forehead at peak jump height.', 'Eyes on ball, strike with forehead hairline.'),
  createSkill('fb_volleying', 'Volley & Half-Volley Technique', 'technical', false, 'Striking ball cleanly out of the air or on the bounce.', 'Keep knee over ball, snap lower leg downward.'),
  createSkill('fb_shielding_retention', 'Ball Shielding & Protection', 'technical', true, 'Using body frame and low center of gravity to protect ball.', 'Side-on body position, protect with furthest foot.'),
  createSkill('fb_set_pieces', 'Free Kicks & Corner Deliveries', 'technical', false, 'Dead-ball striking precision, curve control, and penalties.', 'Consistent approach angle and strike rhythm.'),
  createSkill('fb_tackling_block', 'Block Tackles & Interception Tackles', 'technical', true, 'Timing clean tackles on the ground without committing fouls.', 'Firm plant foot, strike through ball center.'),

  // Tactical (10)
  createSkill('fb_positioning_spacing', 'Positional Awareness & Spacing', 'tactical', true, 'Maintaining good distance and supporting angles for teammates.', 'Form passing triangles, do not hide behind opponents.'),
  createSkill('fb_scanning_preorientation', 'Looking Around & Head Scanning', 'tactical', true, 'Scanning shoulders 3-5 times before receiving the ball.', 'Check shoulder whenever ball is traveling.'),
  createSkill('fb_offball_movement', 'Off-the-Ball Movement & Runs', 'tactical', true, 'Creating passing lanes and timed runs into open space.', 'Move as ball travels, time your run.'),
  createSkill('fb_decision_making', 'Decision Making Under Pressure', 'tactical', true, 'Selecting pass vs dribble vs shoot under opponent pressure.', 'Play 1-touch when closed down quickly.'),
  createSkill('fb_pressing_triggers', 'Defensive Pressing Triggers', 'tactical', false, 'Recognizing cues (bad touch, backward pass) to press.', 'Move together as a compact unit.'),
  createSkill('fb_interception_anticipation', 'Anticipating Passing Lanes', 'tactical', false, 'Reading passer hips and eyes to step into passing lanes.', 'Anticipate pass path before release.'),
  createSkill('fb_transition_attack_to_defense', 'Transition: Attack to Defense', 'tactical', true, 'Immediate 3-second counter-press or sprint back on turnover.', 'First 3 seconds after loss: press or sprint back.'),
  createSkill('fb_transition_defense_to_attack', 'Transition: Defense to Attack', 'tactical', false, 'Moving ball forward quickly into open spaces upon winning it.', 'First look forward into open channels.'),
  createSkill('fb_buildup_angles', 'Build-Up Support Angles', 'tactical', false, 'Supporting central midfielders and defenders from deep zones.', 'Provide wide and deep passing support angles.'),
  createSkill('fb_game_tempo_control', 'Tempo Management & Ball Reset', 'tactical', false, 'Knowing when to slow the match down versus playing direct.', 'Pass back and keep possession when forward lanes are blocked.'),

  // Physical (6)
  createSkill('fb_speed_acceleration', 'Short Sprint Acceleration (10m)', 'physical', true, 'Fast first 3-5 steps acceleration to win loose balls.', 'Forward torso angle, powerful arm drive.'),
  createSkill('fb_max_velocity', 'Top-End Running Speed', 'physical', false, 'Sustaining high speed across 30-50m tracking runs.', 'Upright sprint posture, high knee drive.'),
  createSkill('fb_agility_cod', 'Agility & Quick Direction Changes', 'physical', true, 'Rapid braking, sideways cutting, and fast acceleration.', 'Low center of gravity, light footwork.'),
  createSkill('fb_aerobic_stamina', 'Match Stamina & Repeat Sprints', 'physical', true, 'Sustaining high work rate for the full match duration.', 'Maintain steady breathing during breaks.'),
  createSkill('fb_physical_strength', 'Core Strength & Balance in Duels', 'physical', false, 'Holding off opponents in physical 1v1 shoulder contests.', 'Engage core, maintain wide solid stance.'),
  createSkill('fb_jumping_power', 'Jumping Power & Soft Landing', 'physical', false, 'Takeoff for aerial headers and balanced 2-foot landings.', 'Explode through ankles and hips, land on bent knees.'),

  // Conduct & Mental (6)
  createSkill('fb_communication_calling', 'Talking on Pitch & Calling Out', 'gameBehaviour', true, 'Loud and clear calls ("Man on!", "Turn!", "Time!").', 'Call early before teammate receives ball.'),
  createSkill('fb_coachability_feedback', 'Listening to Coach & Applying Advice', 'gameBehaviour', true, 'Active listening, receptive attitude, applying instructions.', 'Apply coach instruction on the very next play.'),
  createSkill('fb_tactical_discipline', 'Discipline & Team Role Execution', 'gameBehaviour', true, 'Sticking strictly to assigned team duties.', 'Stay true to team formation structure.'),
  createSkill('fb_resilience_errors', 'Bouncing Back After Mistakes', 'gameBehaviour', true, 'Instant reset after mistakes, lost goals, or referee calls.', 'Next play mentality, clap and reset immediately.'),
  createSkill('fb_competitive_grit', 'Work Ethic & Effort in Defense', 'gameBehaviour', true, 'High effort, tracking back, never giving up on loose balls.', 'Never give up on loose balls.'),
  createSkill('fb_sportsmanship', 'Sportsmanship & Respect', 'gameBehaviour', true, 'Respect towards opponents, referees, and teammates.', 'Play hard, play fair, shake hands with pride.')
];

// ==========================================
// 2. BASKETBALL - 40 SKILLS
// ==========================================
export const BASKETBALL_SKILLS: SkillItem[] = [
  createSkill('bb_dribbling_both_hands', 'Dribbling with Both Hands', 'technical', true, 'Control dribbling with right and left hand with head up.', 'Pound ball hard, eyes scanning floor.'),
  createSkill('bb_crossover_moves', 'Crossover & Change of Pace Dribble', 'technical', true, 'Low below-the-knee crossovers and hesitation moves.', 'Sell move with eyes and shoulders, change speed.'),
  createSkill('bb_advanced_handles', 'Between-the-Legs & Behind-Back Dribbles', 'technical', false, 'Fluid combination dribbles under defender pressure.', 'Keep ball low and tight to body.'),
  createSkill('bb_shooting_form_beef', 'Shooting Form & Release Mechanics', 'technical', true, 'Balance, Eyes on target, Elbow under ball, Follow-through snap.', 'Hold follow-through finish.'),
  createSkill('bb_catch_and_shoot', 'Catch-and-Shoot Accuracy', 'technical', true, 'Footwork preparation before catch, quick release from 3pt/mid-range.', '1-2 footwork or hop into shot, shoot on way up.'),
  createSkill('bb_pullup_jumper', 'Off-the-Dribble Pull-Up Jumper', 'technical', false, 'Stopping from sprint into balanced jump shot.', 'Pound-1-2 plant, elevate straight up.'),
  createSkill('bb_layup_right_hand', 'Right Hand Layups & High Glass Touch', 'technical', true, 'High knee drive, soft touch off glass backboard square.', 'Jump off inside foot, drive outside knee high.'),
  createSkill('bb_layup_weak_hand', 'Left Hand (Weak Hand) Layups', 'technical', true, 'Protecting ball with body while finishing smoothly with weak hand.', 'Shield rim defender with torso, release softly.'),
  createSkill('bb_floaters_touch', 'Floaters & Runners in the Paint', 'technical', false, 'High-arcing touch finishes in paint over tall defenders.', 'Soft push with high release, no backboard.'),
  createSkill('bb_eurostep_finishes', 'Eurostep & Gather Finishes', 'technical', false, 'Two-step lateral gather changing directions around shot blockers.', 'Hard plant step one way, leap the other.'),
  createSkill('bb_chest_bounce_pass', 'Chest & Bounce Passing Accuracy', 'technical', true, 'Direct 2-hand and 1-hand push passes hitting shooter in pocket.', 'Step into pass, snap thumbs down with backspin.'),
  createSkill('bb_overhead_skip_pass', 'Overhead & Skip Passes', 'technical', false, 'Delivering cross-court passes over trapping zone defenses.', 'Strong wrist flick over defender arms.'),
  createSkill('bb_freethrow_routine', 'Free Throw Routine & Form', 'technical', true, 'Repeatable pre-shot routine and steady free throw stroke.', 'Consistent breath and bounce routine, soft arc.'),
  createSkill('bb_triple_threat', 'Triple Threat Stance & Jab Steps', 'technical', true, 'Balanced stance: shoot, drive, or pass readiness.', 'Keep ball on hip pocket, sharp low jab step.'),
  createSkill('bb_onball_defense_stance', 'On-Ball Defensive Stance & Slides', 'technical', true, 'Low stance, active hands, quick lateral slides without crossing feet.', 'Chest up, nose behind ball, slide on balls of feet.'),
  createSkill('bb_closeout_technique', 'Perimeter Closeout & Hand Contest', 'technical', true, 'Choppy breakdown steps, high contest hand, balance against drives.', 'Sprint first 2/3, chop feet last 1/3 with high hand.'),
  createSkill('bb_post_moves', 'Low Post Footwork & Drop Steps', 'technical', false, 'Back to basket moves, drop steps, hook shots, and pump fakes.', 'Feel defender body, drop baseline foot hard.'),
  createSkill('bb_boxout_mechanics', 'Box-Out & Rebounding Technique', 'technical', true, 'Forearm check, reverse pivot into defender hip, two-hand rebound.', 'Find opponent, make contact, snatch ball with 2 hands.'),

  // Tactical (10)
  createSkill('bb_floor_spacing', 'Floor Spacing & Wing Balance', 'tactical', true, 'Maintaining 15-18ft spacing, filling open corner and wing spots.', 'Stay in passing vision, do not crowd the ball handler.'),
  createSkill('bb_pnr_ballhandler', 'Pick-and-Roll (Ball Handler)', 'tactical', true, 'Setting up defender, coming shoulder to shoulder off screen.', 'Come off screen tight, read defense.'),
  createSkill('bb_pnr_screener', 'Setting Screens & Rolling to Basket', 'tactical', false, 'Solid wide screen base, rolling hard to rim or popping for shot.', 'Set feet firmly, open chest to ball on roll.'),
  createSkill('bb_offball_cuts', 'Off-Ball Cuts (Backdoor & V-Cuts)', 'tactical', true, 'Timing cuts when defender overplays passing lanes.', 'Cut with sudden speed change when defender turns head.'),
  createSkill('bb_fastbreak_decision', 'Fastbreak Decisions (Pass vs Drive)', 'tactical', true, 'Advancing ball with pass, attacking 3v2 and 2v1 advantages.', 'Pass ahead to open runner, attack paint to draw defender.'),
  createSkill('bb_helpside_defense', 'Help-Side Defense & Rotations', 'tactical', true, 'Positioning in help line, protecting rim on drives.', 'See ball and man, step into paint on drive.'),
  createSkill('bb_transition_defense', 'Transition Defense & Sprinting Back', 'tactical', true, 'Stopping ball handler in transition, talking on matched runners.', 'Sprint back to key, protect paint first.'),
  createSkill('bb_shot_clock_mgmt', 'Clock Awareness & Late Shot Execution', 'tactical', false, 'Managing clock tempo, creating good looks in final seconds.', 'Know time and score before calling play.'),
  createSkill('bb_matchup_reading', 'Reading Defense (Zone vs Man-to-Man)', 'tactical', false, 'Finding gaps in 2-3 zone vs attacking mismatches in man-to-man.', 'Penetrate gaps in zone, reverse ball quickly.'),
  createSkill('bb_defensive_switches', 'Switching on Defense & Calling Picks', 'tactical', false, 'Calling switches on screens, fighting through off-ball screens.', 'Loud vocal "SWITCH" before contact happens.'),

  // Physical (6)
  createSkill('bb_lateral_quickness', 'Lateral Quickness & Shuffling Speed', 'physical', true, 'Explosive lateral recovery and hip rotation.', 'Stay low, push hard off outside foot.'),
  createSkill('bb_vertical_leap', 'Vertical Jump & Rebounding Lift', 'physical', true, 'One-foot and two-foot vertical jumping power.', 'Penultimate step load, dual arm swing upward.'),
  createSkill('bb_first_step_burst', 'First-Step Burst Acceleration', 'physical', true, 'Fast forward blow-by speed out of triple threat.', 'Low forward shin angle, push floor away.'),
  createSkill('bb_anaerobic_repeat', 'Full-Court Running Stamina', 'physical', true, 'Maintaining shooting touch and defense during transitions.', 'Deep recovery breaths during free throws.'),
  createSkill('bb_core_stability', 'Core Stability & Balance in Air', 'physical', false, 'Absorbing contact in mid-air and completing finishes in balance.', 'Tighten core when taking contact in paint.'),
  createSkill('bb_landing_mechanics', 'Safe Landing & Knee Balance', 'physical', false, 'Soft balanced two-foot landings with bent knees.', 'Land softly with bent knees and chest up.'),

  // Conduct & Mental (6)
  createSkill('bb_floor_vocalization', 'Calling Out on Defense & Talking', 'gameBehaviour', true, 'Calling screens ("Pick left!"), cutters, energetic floor talk.', 'Loud, constant communication on every possession.'),
  createSkill('bb_hustle_dive_effort', 'Hustle & Winning Loose Balls', 'gameBehaviour', true, 'Diving for loose balls, taking charges, high energy motor.', 'Win every 50-50 loose ball on the floor.'),
  createSkill('bb_coachability_timeout', 'Focus During Timeouts & Set Plays', 'gameBehaviour', true, 'Listening to coach during timeouts, executing set plays cleanly.', 'Execute plays precisely as shown on board.'),
  createSkill('bb_clutch_composure', 'Composure Under Close Match Pressure', 'gameBehaviour', true, 'Calm mental focus under pressure and free throws.', 'Trust training, exhale and shoot smoothly.'),
  createSkill('bb_teammate_synergy', 'Encouraging Teammates & High Fives', 'gameBehaviour', true, 'High-fives, picking up teammates, positive team spirit.', 'Lift teammates up after every play.'),
  createSkill('bb_sportsmanship', 'Respect for Referees & Opponents', 'gameBehaviour', true, 'Respecting referee whistle without complaining, shaking hands.', 'Hand ball to referee, focus on next play.')
];

// ==========================================
// 3. CRICKET - 40 SKILLS
// ==========================================
export const CRICKET_SKILLS: SkillItem[] = [
  createSkill('ck_bat_stance_grip', 'Batting Stance, Grip & Still Head', 'technical', true, 'Balanced stance, V-grip alignment, eyes level at bowler release.', 'Still head, weight evenly spread on balls of feet.'),
  createSkill('ck_bat_front_foot_def', 'Front Foot Defense & Forward Block', 'technical', true, 'Leaning into pitch of ball, playing under eyes with soft hands.', 'Lead with head and front shoulder, high elbow.'),
  createSkill('ck_bat_back_foot_def', 'Back Foot Defense & Weight Shift', 'technical', true, 'Moving back and across to rising deliveries, soft wrists.', 'Get back and across behind line of ball, play downwards.'),
  createSkill('ck_bat_cover_straight_drive', 'Front Foot Straight & Cover Drive', 'technical', true, 'Presenting full face of bat through ball line with high front elbow.', 'Head over ball at contact, full vertical bat swing.'),
  createSkill('ck_bat_square_cut', 'Back Foot Punch & Square Cut', 'technical', true, 'Transferring weight back, rolling wrists on wide short balls.', 'Extend arms fully, hit down along ground.'),
  createSkill('ck_bat_pull_hook', 'Pull Shot & Swivel on Back Foot', 'technical', false, 'Swiveling on back foot, rolling wrists over top to keep ball down.', 'Watch ball onto bat, roll wrists at contact.'),
  createSkill('ck_bat_sweep_paddle', 'Sweep Shot Against Spin Bowling', 'technical', false, 'Dropping onto front knee, sweeping from outside off to leg side.', 'Head over front knee, control bat face angle.'),
  createSkill('ck_bat_flick_on_drive', 'Flick off Pads & Mid-Wicket Drive', 'technical', true, 'Working straight deliveries through mid-wicket with supple wrists.', 'Keep bat close to front pad, close face gently.'),
  createSkill('ck_bowl_runup_rhythm', 'Pace Bowling Run-Up & Rhythm', 'technical', true, 'Smooth repeatable run-up, progressive acceleration, balanced jump.', 'Run tall and rhythmic, explode off back foot jump.'),
  createSkill('ck_bowl_seam_presentation', 'Seam Presentation & Wrist Position', 'technical', true, 'Upright seam rotation towards target with locked wrist at release.', 'Cock wrist behind ball, snap straight towards batter.'),
  createSkill('ck_bowl_swing_movement', 'Outswing & Inswing Release', 'technical', false, 'Angling seam towards slips or leg-gully with fine wrist adjustment.', 'Follow through across body for inswing, straight for outswing.'),
  createSkill('ck_bowl_line_length', 'Good Length & Channel Accuracy', 'technical', true, 'Consistently hitting 5-7 meter corridor on top of off-stump.', 'Focus eyes on landing target marker.'),
  createSkill('ck_bowl_yorker_bouncer', 'Yorker & Slower Ball Variations', 'technical', false, 'Executing base-of-stumps yorkers, knuckleballs, and bouncers.', 'Look at base of off stump, pull front arm down hard.'),
  createSkill('ck_spin_revs_grip', 'Spin Bowling Grip & Revolutions', 'technical', true, 'Imparting heavy revolutions on ball using fingers or wrist.', 'Rip fingers over seam at point of release.'),
  createSkill('ck_spin_flight_drift', 'Spin Flight, Drift & Dip Variations', 'technical', false, 'Using flight variations to deceive batter in the air.', 'Give ball air, pull release higher above eyeline.'),
  createSkill('ck_fielding_ground_sliding', 'Ground Fielding & Clean Pick-Up', 'technical', true, 'Attacking ball with soft hands, slide and gather in single motion.', 'Knee down barrier, scoop into hands under eyes.'),
  createSkill('ck_fielding_catching_slips', 'Catching High Balls & Slip Catches', 'technical', true, 'Cupped reverse-cup technique, soft giving hands, wide slip base.', 'Watch ball into palms, give with impact.'),
  createSkill('ck_fielding_direct_hit', 'Overarm Throwing & Direct Hits', 'technical', true, 'High elbow overarm throw with flat trajectory targeting stumps.', 'Step towards target, full follow through of throwing arm.'),

  // Tactical (10)
  createSkill('ck_strike_rotation', 'Running Between Wickets & Quick Singles', 'tactical', true, 'Dropping ball into gaps for quick singles, loud decisive calling.', 'Call "YES / NO / WAIT" immediately upon contact.'),
  createSkill('ck_gap_finding_placement', 'Finding Gaps & Reading Fielders', 'tactical', true, 'Surveying boundary fielders, placing shots into vacant zones.', 'Identify deep fielders before bowler begins run-up.'),
  createSkill('ck_game_phase_tempo', 'Match Phase Tempo (Overs Management)', 'tactical', true, 'Adjusting batting risk according to match overs and game situation.', 'Build partnerships in middle overs, accelerate at end.'),
  createSkill('ck_bowler_setup_plan', 'Bowler 6-Ball Plan & Setup', 'tactical', false, 'Setting up batter with consistent line before surprise variation.', 'Bowl to field setting, stick to 6-ball plan.'),
  createSkill('ck_target_chasing_rate', 'Target Chasing & Run Rate Pacing', 'tactical', true, 'Pacing run chase, calculating needed runs per over.', 'Break chase into 5-over small targets.'),
  createSkill('ck_pitch_condition_reading', 'Reading Pitch & Weather Conditions', 'tactical', false, 'Adapting batting and bowling to dry, turning, or bouncy pitches.', 'Assess bounce in first two overs of innings.'),
  createSkill('ck_wicketkeeping_glovework', 'Wicketkeeping Glovework & Reflexes', 'technical', false, 'Clean takes down leg side, fast stumping reflexes, standing up.', 'Rise with bounce of ball, soft relaxed gloves.'),
  createSkill('ck_slip_cordination', 'Inner Circle Pressure & Backing Up', 'tactical', false, 'Cutting off singles, backing up throws to keeper and bowler.', 'Move in with bowler run-up, back up every throw.'),
  createSkill('ck_batter_trap_execution', 'Field Placements for Catch Traps', 'tactical', false, 'Setting catching fielders to induce risky shots from batter.', 'Starve batter of easy singles to force high-risk stroke.'),
  createSkill('ck_drs_review_awareness', 'Umpire Decisions & Appeals Awareness', 'tactical', false, 'Consulting keeper and bowler within 15 seconds for appeals.', 'Confirm impact line and height before appealing.'),

  // Physical (6)
  createSkill('ck_sprint_speed_wickets', '22-Yard Sprint Speed & Bat Slide', 'physical', true, 'Fast 22-yard sprints, sharp turns with bat slide over crease.', 'Turn facing ball, stretch bat in extended hand.'),
  createSkill('ck_bowling_stamina_repeat', 'Bowling Stamina Over Long Spells', 'physical', true, 'Maintaining 100% pace and line through multi-over spells.', 'Controlled breathing on walk back to bowling mark.'),
  createSkill('ck_throwing_shoulder_power', 'Throwing Shoulder Strength & Power', 'physical', true, 'Hurling boundary returns on the full to keeper.', 'Transfer force from hips through throwing shoulder.'),
  createSkill('ck_lateral_agility_fielding', 'Diving Agility & Mat Quickness', 'physical', true, 'Explosive horizontal lunges and dives to stop boundaries.', 'Push off nearest foot, extend full body length.'),
  createSkill('ck_core_back_stability', 'Core & Back Dynamic Stability', 'physical', false, 'Protecting back during repetitive bowling actions.', 'Maintain strong core brace at front-foot landing.'),
  createSkill('ck_visual_tracking_reflex', 'Hand-Eye Coordination & Ball Tracking', 'physical', true, 'Tracking fast ball out of bowler hand into batting zone.', 'Focus on bowler release point early.'),

  // Conduct & Mental (6)
  createSkill('ck_patience_concentration', 'Ball-by-Ball Concentration', 'gameBehaviour', true, 'Treating every ball as a fresh contest; forgetting past errors.', 'Tap crease, take deep breath, reset mind.'),
  createSkill('ck_pressure_composure', 'Composure Under Wicket Collapse', 'gameBehaviour', true, 'Batting with calm temperament when wickets fall quickly.', 'Absorb pressure, build one solid over at a time.'),
  createSkill('ck_spirit_of_cricket', 'Spirit of Cricket & Respect for Umpires', 'gameBehaviour', true, 'Accepting decisions gracefully, applauding milestones.', 'Respect the game, accept umpire call without dispute.'),
  createSkill('ck_team_energy_field', 'Fielding Energy & Team Support', 'gameBehaviour', true, 'Constantly encouraging bowlers, lively chatter in the field.', 'Keep energy buzzing between overs.'),
  createSkill('ck_resilience_bad_overs', 'Resilience After Errors or Misfields', 'gameBehaviour', true, 'Backing up teammate who dropped catch, resetting focus.', 'Clap teammate, focus on next delivery.'),
  createSkill('ck_coachability_analysis', 'Listening to Coach & Net Practice Focus', 'gameBehaviour', true, 'Reviewing dismissals, refining technique diligently in nets.', 'Review coach notes and apply in net sessions.')
];

// ==========================================
// 4. CHESS - 40 SKILLS
// ==========================================
export const CHESS_SKILLS: SkillItem[] = [
  createSkill('ch_forks_pins', 'Forks & Absolute / Relative Pins', 'technical', true, 'Finding double attacks with Knights/Pawns and pins on royalty.', 'Look for undefended pieces and aligned royalty.'),
  createSkill('ch_skewers_discovered', 'Skewers & Discovered Attacks', 'technical', true, 'Attacking high-value piece in front to win piece behind.', 'Unleash masked attacks with forcing checks.'),
  createSkill('ch_deflection_decoy', 'Deflection, Decoy & Overloading', 'technical', true, 'Forcing defender away from critical square; overloading piece.', 'Find the piece doing two defensive jobs.'),
  createSkill('ch_calculation_depth', 'Calculating 3-5 Moves Ahead', 'technical', true, 'Visualizing move trees accurately without touching pieces.', 'Calculate checks, captures, and threats first.'),
  createSkill('ch_candidate_moves', 'Finding Candidate Moves', 'technical', true, 'Generating 3-4 candidate options before calculating lines.', 'Do not play first move you see; look for better.'),
  createSkill('ch_king_pawn_endgame', 'King & Pawn Endgames (Opposition)', 'technical', true, 'Taking opposition, key squares, and outflanking.', 'Activate King in front of pawn, take opposition.'),
  createSkill('ch_rook_endgames', 'Rook Endgames (Lucena & Philidor)', 'technical', false, 'Building a bridge (Lucena) and drawing techniques (Philidor).', 'Rooks behind passed pawns, check from distance.'),
  createSkill('ch_minor_piece_endgames', 'Minor Piece Endgames (Bishop vs Knight)', 'technical', false, 'Handling bishop pairs, bad bishops, and outpost knights.', 'Fix enemy pawns on bishop color, activate minor piece.'),
  createSkill('ch_basic_mating_patterns', 'Basic Checkmates (Q+K, R+K, 2B+K)', 'technical', true, 'Boxing enemy King into edge using box-step.', 'Use King as escort, avoid stalemate trap squares.'),
  createSkill('ch_anastasia_smothered', 'Classic Mating Patterns (Smothered & Back Rank)', 'technical', false, 'Recognizing back rank weaknesses and smothered checkmates.', 'Look for trapped King along back rank and weak f7/h7.'),
  createSkill('ch_passed_pawn_creation', 'Creating & Pushing Passed Pawns', 'technical', true, 'Pushing passed pawns and creating outside runners.', 'Push passed pawns, outside passer distracts King.'),
  createSkill('ch_piece_activity_maximization', 'Piece Coordination & Teamwork', 'technical', true, 'Coordinating Queen, Rooks, and minor pieces together.', 'All pieces must participate in the battle.'),
  createSkill('ch_outpost_knight_creation', 'Knight Outposts on Central Squares', 'technical', false, 'Planting Knights on unchallengeable central squares.', 'Look for hole where enemy pawns cannot drive Knight away.'),
  createSkill('ch_weak_pawn_exploitation', 'Targeting Weak & Isolated Pawns', 'technical', false, 'Targeting backward and isolated Queen pawns on open files.', 'Blockade with Knight, pile major pieces on weakness.'),
  createSkill('ch_open_file_control', 'Open File Control & 7th Rank Rook', 'technical', true, 'Doubling rooks on open files and invading enemy 7th rank.', 'Seize open files with Rooks, plant Rook on 7th rank.'),
  createSkill('ch_prophylaxis_defense', 'Preventing Opponent Plans (Prophylaxis)', 'technical', true, 'Anticipating opponent attack and stopping it in advance.', 'Ask: "What is my opponent trying to do next?"'),
  createSkill('ch_piece_trades_simplification', 'Trading Pieces When Ahead in Material', 'technical', false, 'Trading queens and active pieces when ahead to simplify.', 'When ahead in material, trade pieces not pawns.'),
  createSkill('ch_perpetual_check_drawing', 'Perpetual Check & Stalemate Escapes', 'technical', false, 'Finding escapes and checks when defending lost positions.', 'Never give up early, seek counter-threats.'),

  // Tactical & Strategic (10)
  createSkill('ch_opening_principles', 'Opening Rules & Quick Development', 'tactical', true, 'Controlling center, developing minor pieces, castling early.', 'Develop pieces quickly, do not move same piece twice.'),
  createSkill('ch_king_safety_castling', 'King Safety & Castling Timing', 'tactical', true, 'Castling early, keeping pawn shield intact in front of King.', 'Do not push pawns in front of castled King carelessly.'),
  createSkill('ch_center_control_space', 'Center Board Control & Space', 'tactical', true, 'Controlling e4/d4/e5/d5 squares with pawns and pieces.', 'The player who controls center controls the game.'),
  createSkill('ch_pawn_structure_chains', 'Pawn Chains & Pawn Breaks', 'tactical', true, 'Attacking base of pawn chain with pawn breaks.', 'Attack the base of the enemy pawn chain.'),
  createSkill('ch_positional_sacrifices', 'Exchange & Positional Sacrifices', 'tactical', false, 'Giving up an exchange for a dominant outpost or active attack.', 'Value active pieces over small material points.'),
  createSkill('ch_attack_castled_king', 'Attacking the Enemy Castled King', 'tactical', false, 'Sacrifices on h7/g7 and opening files against the King.', 'Calculate follow-up checks and queen entry squares.'),
  createSkill('ch_transition_middlegame_endgame', 'Transition to Winning Endgame', 'tactical', true, 'Knowing exact moment to trade into winning pawn endgame.', 'Assess King activity and pawn count before trading Queens.'),
  createSkill('ch_blunder_check_filter', 'Blunder Check Before Every Move', 'tactical', true, 'Double checking opponent checks and captures before moving.', 'Sit on hands: check move safety before letting go of piece.'),
  createSkill('ch_time_management_clock', 'Clock & Time Management', 'tactical', true, 'Balancing time on hard positions vs playing easy moves fast.', 'Spend time on big turning point moves.'),
  createSkill('ch_opponent_weakness_targeting', 'Targeting Static Board Weaknesses', 'tactical', false, 'Targeting weak light/dark squares and backward pawns.', 'Focus pieces on squares opponent cannot defend.'),

  // Cognitive & Physical (6)
  createSkill('ch_focus_multi_hour', 'Long Match Focus & Concentration', 'physical', true, 'Sustaining clear thinking across 2-3 hour tournament games.', 'Stay seated, maintain calm steady breathing.'),
  createSkill('ch_cognitive_stamina_rounds', 'Tournament Stamina Across Rounds', 'physical', true, 'Keeping clear head across multiple games in a day.', 'Drink water, walk away from board between games.'),
  createSkill('ch_stress_heartrate_control', 'Staying Calm Under Low Time (Time Trouble)', 'physical', true, 'Managing nervousness when clock is under 1 minute.', 'Slow deep breaths, stay physically relaxed.'),
  createSkill('ch_rapid_blitz_reflexes', 'Fast Tactical Vision in Blitz', 'physical', false, 'Quick pattern spotting and fast clean hand movement.', 'Trust your practiced tactical instincts under time pressure.'),
  createSkill('ch_ergonomic_posture', 'Sitting Posture & Board Comfort', 'physical', false, 'Sitting upright without slouching over board.', 'Sit upright, feet flat on floor, avoid slouching.'),
  createSkill('ch_visual_memory_recall', 'Remembering Opening Patterns', 'physical', false, 'Remembering opening ideas and past lessons.', 'Review master game patterns regularly.'),

  // Conduct & Mental (6)
  createSkill('ch_resilience_after_blunder', 'Mental Composure After a Blunder', 'gameBehaviour', true, 'Staying calm and fighting on after giving away a piece.', 'Forget the past move, make opponent find the win.'),
  createSkill('ch_sportsmanship_handshake', 'Etiquette, Handshakes & Notation', 'gameBehaviour', true, 'Polite handshake before/after match and clean notation.', 'Shake hands with genuine respect regardless of result.'),
  createSkill('ch_objective_postmortem', 'Post-Game Analysis with Opponent', 'gameBehaviour', true, 'Reviewing game with opponent to learn from mistakes.', 'Treat every loss as a lesson to improve.'),
  createSkill('ch_tenacity_worse_positions', 'Fighting Hard in Difficult Positions', 'gameBehaviour', true, 'Making it hard for opponent to win when down material.', 'Make opponent calculate every winning move.'),
  createSkill('ch_coachability_prep', 'Following Coach Game Plan & Opening Prep', 'gameBehaviour', true, 'Applying opening preparation taught by coach.', 'Stick to opening preparation and coach advice.'),
  createSkill('ch_grace_under_pressure', 'Humility in Victory & Calm in Defeat', 'gameBehaviour', true, 'Staying humble after winning, gracious in defeat.', 'Celebrate quietly, treat opponent with respect.')
];

// Helper to generate 40 skills for any sport with realistic, professional coaching criteria
function generate40SkillsForSport(
  sportId: string,
  prefix: string,
  technicalList: Array<{ id: string; name: string; isCore: boolean; desc: string; cue: string }>,
  tacticalList: Array<{ id: string; name: string; isCore: boolean; desc: string; cue: string }>,
  physicalList: Array<{ id: string; name: string; isCore: boolean; desc: string; cue: string }>,
  behaviourList: Array<{ id: string; name: string; isCore: boolean; desc: string; cue: string }>
): SkillItem[] {
  const result: SkillItem[] = [];
  technicalList.forEach(item => {
    result.push(createSkill(`${prefix}_${item.id}`, item.name, 'technical', item.isCore, item.desc, item.cue));
  });
  tacticalList.forEach(item => {
    result.push(createSkill(`${prefix}_${item.id}`, item.name, 'tactical', item.isCore, item.desc, item.cue));
  });
  physicalList.forEach(item => {
    result.push(createSkill(`${prefix}_${item.id}`, item.name, 'physical', item.isCore, item.desc, item.cue));
  });
  behaviourList.forEach(item => {
    result.push(createSkill(`${prefix}_${item.id}`, item.name, 'gameBehaviour', item.isCore, item.desc, item.cue));
  });
  return result;
}

// ==========================================
// 5. TENNIS - 40 SKILLS
// ==========================================
export const TENNIS_SKILLS: SkillItem[] = generate40SkillsForSport(
  'tennis', 'tn',
  [
    { id: 'forehand_topspin', name: 'Forehand Topspin Drive', isCore: true, desc: 'Low-to-high brush over ball, windshield wiper finish, weight transfer.', cue: 'Unit turn early, strike out in front of body.' },
    { id: 'backhand_drive', name: 'Backhand (1-Hand / 2-Hand Drive)', isCore: true, desc: 'Clean contact point, non-dominant hand drive on two-hander.', cue: 'Shoulders turned sideways, smooth extension.' },
    { id: 'serve_flat_slice', name: 'First Serve (Flat / Slice)', isCore: true, desc: 'Trophy pose, consistent ball toss, racket pronation into court.', cue: 'High toss into court, full upward reach.' },
    { id: 'second_serve_kick', name: 'Second Serve (Kick / Spin)', isCore: false, desc: 'Brushing up back of ball for high bounce and safety over net.', cue: 'Arch back, brush 7-to-1 on clock face.' },
    { id: 'forehand_volley', name: 'Forehand Net Volley', isCore: true, desc: 'Punching volley without backswing, keeping racket head above wrist.', cue: 'Step with opposite foot, punch firmly.' },
    { id: 'backhand_volley', name: 'Backhand Net Volley', isCore: true, desc: 'Firm wrist, punching through ball with racket angle.', cue: 'Lead with elbow, solid wrist block.' },
    { id: 'overhead_smash', name: 'Overhead Smash', isCore: true, desc: 'Pointing at ball with off-hand, scissor kick, striking at apex.', cue: 'Side-on preparation, snap down through ball.' },
    { id: 'forehand_slice', name: 'Forehand Slice & Defensive Scramble', isCore: false, desc: 'High-to-low slice resetting defensive points.', cue: 'Open racket face, glide through ball.' },
    { id: 'backhand_slice', name: 'Backhand Slice & Skid', isCore: true, desc: 'Knife-through slice keeping ball low over net.', cue: 'Carve underneath ball, stay low in knees.' },
    { id: 'return_of_first_serve', name: 'Return of First Serve (Block Return)', isCore: true, desc: 'Short compact backswing, blocking fast serves back deep.', cue: 'Split-step forward, compact punch.' },
    { id: 'return_of_second_serve', name: 'Return of Second Serve (Attack)', isCore: false, desc: 'Stepping into court to dictate point on weak second serve.', cue: 'Step inside baseline, attack high ball.' },
    { id: 'drop_shot_disguise', name: 'Drop Shot & Net Touch', isCore: false, desc: 'Disguised drop shot dying shortly past the net.', cue: 'Soft hands, absorb ball pace at last second.' },
    { id: 'topspin_lob', name: 'Topspin & Defensive Lob', isCore: false, desc: 'High arcing ball over net rusher landing within baseline.', cue: 'Extreme low-to-high acceleration.' },
    { id: 'swinging_volley', name: 'Mid-Court Drive Volley', isCore: false, desc: 'Taking floating mid-court balls out of the air with full swing.', cue: 'Catch ball above shoulder height, drive through.' },
    { id: 'approach_shot', name: 'Approach Shot & Net Transition', isCore: true, desc: 'Driving short balls deep to corners and moving forward to net.', cue: 'Hit on the rise, follow ball to net.' },
    { id: 'half_volley_pickup', name: 'Half-Volley & Baseline Pickups', isCore: false, desc: 'Short hop pick-up off the court with soft hands.', cue: 'Get low to ground, quiet racket head.' },
    { id: 'running_forehand', name: 'Running Forehand on the Stretch', isCore: false, desc: 'Hitting open-stance forehand at full stretch with recovery.', cue: 'Plant outside leg, whip racket across.' },
    { id: 'tiebreak_deadball_routine', name: 'Pre-Serve Ball Bounce Ritual', isCore: false, desc: 'Steady repeatable 3-4 bounce routine for mental focus.', cue: 'Consistent breath, steady eyes on target.' }
  ],
  [
    { id: 'crosscourt_depth', name: 'Crosscourt Baseline Depth', isCore: true, desc: 'Keeping groundstrokes deep beyond service line crosscourt.', cue: 'Aim 3 feet above net, deep into backcourt.' },
    { id: 'down_the_line_change', name: 'Down-the-Line Direction Change', isCore: true, desc: 'Changing rally direction to open up court for winner.', cue: 'Take ball early, aim inside sideline.' },
    { id: 'targeting_weakness', name: 'Targeting Opponent Weakness', isCore: true, desc: 'Consistently placing balls to opponent weaker stroke.', cue: 'Identify weak side early, keep pressure there.' },
    { id: 'short_angle_creation', name: 'Short Angle Creation', isCore: false, desc: 'Pulling opponent wide off court with acute crosscourt angles.', cue: 'Brush outside of ball with heavy spin.' },
    { id: 'net_rushing_closing', name: 'Net Rushing & Covering Passing Lanes', isCore: false, desc: 'Closing space at net, covering down-the-line and crosscourt.', cue: 'Follow line of your approach shot.' },
    { id: 'break_point_tactics', name: 'Break Point & Critical Point Play', isCore: true, desc: 'Playing high percentage tennis on 30-40 and deuce points.', cue: 'First serve in, high percentage deep ball.' },
    { id: 'pace_modulation', name: 'Pace & Height Modulation (Moonball / Skid)', isCore: false, desc: 'Mixing high topspin with low slice to break rhythm.', cue: 'Change height and speed to disrupt rhythm.' },
    { id: 'doubles_poaching', name: 'Doubles Poaching & Interceptions', isCore: false, desc: 'Reading returner body language to cross and volley at net.', cue: 'Move as returner begins forward swing.' },
    { id: 'court_positioning', name: 'Baseline Recovery & Center Positioning', isCore: true, desc: 'Recovering behind baseline center after hitting each stroke.', cue: 'Split-step on opponent contact.' },
    { id: 'game_tempo_management', name: 'Towel & 25-Second Clock Routine', isCore: false, desc: 'Using allowed time between points to regain breath and focus.', cue: 'Walk to towel, slow breath, reset plan.' }
  ],
  [
    { id: 'split_step_timing', name: 'Split-Step & First Step Explosiveness', isCore: true, desc: 'Light hop timed right as opponent strikes the ball.', cue: 'Hop and land on balls of feet as ball is hit.' },
    { id: 'lateral_slide_recovery', name: 'Lateral Slide & Cross-Over Footwork', isCore: true, desc: 'Fast recovery footwork returning to court center.', cue: 'Cross-over step, then side shuffle.' },
    { id: 'match_stamina_sets', name: 'Multi-Set Endurance & Leg Power', isCore: true, desc: 'Maintaining stroke power throughout 3-set matches.', cue: 'Active recovery between points.' },
    { id: 'shoulder_rotational_power', name: 'Shoulder & Core Rotational Power', isCore: true, desc: 'Kinetic chain transfer from legs and hips through racket.', cue: 'Load legs, uncoil hips into stroke.' },
    { id: 'change_of_direction', name: 'Quick Direction Changes & Deceleration', isCore: false, desc: 'Braking from full sprint and pushing back into court.', cue: 'Low center of gravity, bend knees.' },
    { id: 'eye_tracking_impact', name: 'Tracking Ball Through Contact', isCore: false, desc: 'Keeping head still and eyes focused on ball contact zone.', cue: 'Keep eyes on contact point for a split second.' }
  ],
  [
    { id: 'mistake_reset', name: 'Unforced Error Recovery & Composure', isCore: true, desc: 'Not dwelling on missed shots; instant positive reset.', cue: 'Look at strings, take a breath, next point.' },
    { id: 'respect_line_calls', name: 'Fair Line Calling & Etiquette', isCore: true, desc: 'Giving benefit of doubt on close calls, honest sport ethics.', cue: 'Call out loud and clear, play with honesty.' },
    { id: 'competitive_grit', name: 'Fighting for Every Ball & Comebacks', isCore: true, desc: 'Relentless effort chasing down balls even when behind.', cue: 'Run every ball down until it bounces twice.' },
    { id: 'body_language', name: 'Positive On-Court Body Language', isCore: true, desc: 'Shoulders back, energetic walk between points.', cue: 'Head high, positive energy regardless of score.' },
    { id: 'coachability_matches', name: 'Applying Coach Advice Between Sets', isCore: true, desc: 'Listening and executing tactical adjustments during matches.', cue: 'Focus on 1-2 key tactical adjustments.' },
    { id: 'handshake_respect', name: 'Post-Match Handshake & Respect', isCore: true, desc: 'Looking opponent and umpire in eye with genuine handshake.', cue: 'Walk to net with pride, thank opponent and ref.' }
  ]
);

// ==========================================
// 6. BADMINTON - 40 SKILLS
// ==========================================
export const BADMINTON_SKILLS: SkillItem[] = generate40SkillsForSport(
  'badminton', 'bm',
  [
    { id: 'forehand_grip', name: 'Forehand & Backhand Grip Transition', isCore: true, desc: 'Loose relaxed grip shifting smoothly between V-grip and thumb grip.', cue: 'Relaxed fingers, tighten only at point of impact.' },
    { id: 'high_clear', name: 'Forehand Overhead High Clear', isCore: true, desc: 'High deep trajectory landing within 1 foot of rear line.', cue: 'High elbow, full reach, hit shuttle high and deep.' },
    { id: 'forehand_smash', name: 'Forehand Smash Power & Steep Angle', isCore: true, desc: 'Explosive wrist snap generating fast downward shuttle speed.', cue: 'Turn sideways, scissor jump, strike in front.' },
    { id: 'drop_shot_fast', name: 'Fast & Sliced Drop Shots', isCore: true, desc: 'Disguised stroke landing gently in front court over net.', cue: 'Maintain smash swing action, slice gently.' },
    { id: 'backhand_clear', name: 'Backhand Overhead Clear', isCore: false, desc: 'Thumb grip power, elbow lead, snapping wrist from rear court.', cue: 'Back to net, lead with elbow, thumb push.' },
    { id: 'backhand_drop', name: 'Backhand Drop Shot', isCore: false, desc: 'Soft touch backhand drop dying close to net tape.', cue: 'Soft thumb tap, gentle angle.' },
    { id: 'net_tumble_spin', name: 'Spinning Net Shot (Hairpin)', isCore: true, desc: 'Brushing shuttle cork tightly across net tape.', cue: 'Soft relaxed wrist, guide shuttle nose.' },
    { id: 'net_kill_tap', name: 'Net Kill & Tap on Loose Shuttles', isCore: true, desc: 'Quick wrist tap on shuttles floating above net.', cue: 'Racket high, quick short tap, do not touch net.' },
    { id: 'net_lift_defensive', name: 'Underarm High Net Lift', isCore: true, desc: 'Deep high defensive lob pushing opponent to rear corners.', cue: 'Lunge with racket leg, high lift to backline.' },
    { id: 'short_low_serve', name: 'Low Short Serve Precision', isCore: true, desc: 'Skimming net tape consistently on short serve.', cue: 'Stable stance, push shuttle with thumb.' },
    { id: 'flick_serve_deception', name: 'Flick Serve & Drive Serve', isCore: false, desc: 'Deceptive quick wrist flick over opponent head.', cue: 'Same preparation as short serve, sudden thumb flick.' },
    { id: 'flat_drive_exchange', name: 'Fast Flat Drives (Forehand / Backhand)', isCore: true, desc: 'Fast parallel and crosscourt mid-court drive exchanges.', cue: 'Short compact swing, keep shuttle flat.' },
    { id: 'smash_defense_block', name: 'Smash Defense (Cross & Straight Block)', isCore: true, desc: 'Absorbing heavy smashes with soft touch over net.', cue: 'Low ready stance, soft hands, absorb pace.' },
    { id: 'smash_defense_lift', name: 'Smash Defense High Lift', isCore: false, desc: 'Digging out steep smashes and lifting high to re-set rally.', cue: 'Get under shuttle, explosive forearm flick.' },
    { id: 'crosscourt_net_shot', name: 'Crosscourt Net Tumble', isCore: false, desc: 'Hooking shuttle sharply across net from one corner to the other.', cue: 'Angle racket face across body gently.' },
    { id: 'round_the_head_smash', name: 'Round-the-Head Attack', isCore: false, desc: 'Taking non-dominant side overheads with forehand swing.', cue: 'Bend spine sideways, fast arm rotation.' },
    { id: 'stick_smash_half', name: 'Half Smash & Stick Smash', isCore: false, desc: 'Fast steep wrist snap without full arm backswing.', cue: 'Fast forearm pronation, aim for lines.' },
    { id: 'push_to_midcourt', name: 'Push Shot into Body & Midcourt Gaps', isCore: false, desc: 'Pushing shuttle into vacant midcourt spaces.', cue: 'Guide shuttle through gap with finger control.' }
  ],
  [
    { id: 'center_base_recovery', name: 'Center T-Base Recovery', isCore: true, desc: 'Springing back to central court base after every shot.', cue: 'Push off landing foot, recover to T-line.' },
    { id: 'corner_to_corner_rallies', name: '4-Corner Pressure Construction', isCore: true, desc: 'Moving opponent from front net to back corners systematically.', cue: 'Make opponent run the diagonals.' },
    { id: 'reading_deception', name: 'Reading Opponent Racket Deception', isCore: true, desc: 'Watching shuttle contact point to anticipate direction.', cue: 'Watch opponent racket angle, do not commit too early.' },
    { id: 'attack_vs_defense_stance', name: 'Switching Between Attack & Defense Stance', isCore: true, desc: 'Side-by-side defensive stance vs forward-backward attacking stance.', cue: 'Side-by-side for defense, split stance for attack.' },
    { id: 'doubles_rotation', name: 'Doubles Front-Back & Side-Side Rotation', isCore: false, desc: 'Front-back attacking formation and side-by-side defensive coverage.', cue: 'Lift = side-by-side; Attack = front-back.' },
    { id: 'exploiting_weak_backhand', name: 'Pinning Opponent to Deep Backhand Corner', isCore: true, desc: 'Forcing opponent into deep backhand overhead difficulty.', cue: 'Keep deep clears tight to opponent backhand corner.' },
    { id: 'serve_receive_rush', name: 'Attacking Serve Returns', isCore: false, desc: 'Stepping forward to pounce on low serves.', cue: 'Pounce as server releases shuttle.' },
    { id: 'pace_disruption', name: 'Tempo Modulation (Fast Attacks vs Soft Drops)', isCore: false, desc: 'Varying speed of rally to create opening.', cue: 'Mix heavy smashes with delicate drops.' },
    { id: 'line_call_awareness', name: 'Court Boundary & Shuttle Drift Awareness', isCore: false, desc: 'Judging shuttles going out under draft conditions.', cue: 'Watch drift direction, let long shuttles go.' },
    { id: 'clutch_points_strategy', name: 'Point Management at 19-19 & Deuce', isCore: false, desc: 'Staying calm and playing high-percentage shots at 20-all.', cue: 'Patience, wait for clear opening to attack.' }
  ],
  [
    { id: 'six_corner_footwork', name: '6-Corner Footwork & Chasse Steps', isCore: true, desc: 'Fluid movement to all 4 corners and net with split-step.', cue: 'Push off rear foot, land in balance on lunges.' },
    { id: 'split_step_explosiveness', name: 'Split-Step Reaction Speed', isCore: true, desc: 'Micro-second reaction jump as opponent strikes shuttle.', cue: 'Hop and react instantly to shuttle trajectory.' },
    { id: 'scissor_kick_jump', name: 'Scissor Kick Jump & Rear Takeoff', isCore: true, desc: 'Jumping in rear court, swapping legs in air for power.', cue: 'Kick rear leg back, land on opposite foot.' },
    { id: 'anaerobic_repeat_stamina', name: 'High-Heart Rate Rally Stamina', isCore: true, desc: 'Sustaining high mechanical intensity over 30+ shot rallies.', cue: 'Deep breathing during shuttle collection.' },
    { id: 'wrist_forearm_explosiveness', name: 'Wrist & Forearm Pronation Speed', isCore: true, desc: 'Fast whip-like pronation for power on smashes and clears.', cue: 'Relaxed forearm until moment of strike.' },
    { id: 'lunge_landing_balance', name: 'Net Lunge Recovery & Ankle Stability', isCore: false, desc: 'Deep front lunge, heel-to-toe landing with knee above ankle.', cue: 'Heel strikes floor first, push back explosively.' }
  ],
  [
    { id: 'composure_under_rallies', name: 'Composure After Long Grueling Rallies', isCore: true, desc: 'Taking breath and resetting mindset immediately.', cue: 'Calm breath, focus on next point.' },
    { id: 'sportsmanship_line_calls', name: 'Honest Line Calls & Umpire Respect', isCore: true, desc: 'Honest calling on close lines and respectful conduct.', cue: 'Give opponent benefit of doubt on close lines.' },
    { id: 'tenacity_saving_smashes', name: 'Defensive Hustle & Diving for Shuttles', isCore: true, desc: 'Chasing down seemingly impossible shuttles.', cue: 'Never stop until shuttle hits floor.' },
    { id: 'coachability_timeout', name: 'Listening to Coach at 11-Point Interval', isCore: true, desc: 'Applying tactical instructions given in 60-second break.', cue: 'Listen intently, execute game plan changes.' },
    { id: 'body_language_confidence', name: 'Positive Body Posture & Confidence', isCore: true, desc: 'Walking tall between points, no visible frustration.', cue: 'Head high, energetic racket carriage.' },
    { id: 'fair_play_handshake', name: 'Handshake with Opponent & Service Judge', isCore: true, desc: 'Warm handshake with opponent, coach, and officials.', cue: 'Shake hands with genuine sportsmanship.' }
  ]
);

// ==========================================
// 7. ATHLETICS (TRACK & FIELD) - 40 SKILLS
// ==========================================
export const ATHLETICS_SKILLS: SkillItem[] = generate40SkillsForSport(
  'athletics', 'ath',
  [
    { id: 'sprint_posture', name: 'Sprint Posture & Tall Torso Alignment', isCore: true, desc: 'Upright torso, neutral pelvis, head still, relaxed jaw.', cue: 'Run tall, eyes focused 20m ahead on track.' },
    { id: 'arm_drive_mechanics', name: 'Arm Swing & Shoulder Drive', isCore: true, desc: '90-degree elbow bend, driving from shoulder socket.', cue: 'Pocket to chin, avoid crossing body midline.' },
    { id: 'block_start_setup', name: 'Block Start Setup & "Set" Position', isCore: true, desc: 'Feet spacing in pedals, hips higher than shoulders, fingers behind line.', cue: 'Load pedals firmly, rise smoothly on "Set".' },
    { id: 'acceleration_drive_phase', name: 'Acceleration Drive Phase (0-30m)', isCore: true, desc: 'Low 45-degree body angle, driving ground behind body.', cue: 'Push ground away, do not stand up too fast.' },
    { id: 'transition_to_upright', name: 'Transition to Max Velocity Upright Sprint', isCore: true, desc: 'Gradual rise over 10-15 strides into tall sprint posture.', cue: 'Smooth rise step by step without braking.' },
    { id: 'top_speed_mechanics', name: 'Top Speed Mechanics (Front-Side Mechanics)', isCore: true, desc: 'High knee lift, dorsiflexed foot, clawing ground under hips.', cue: 'Step over opposite knee, strike ground under center of mass.' },
    { id: 'speed_endurance_finish', name: 'Speed Endurance & Sprint Finish (Dip)', isCore: true, desc: 'Maintaining stride mechanics under lactic fatigue and chest dip.', cue: 'Relax shoulders, thrust chest forward across finish line.' },
    { id: 'hurdling_lead_leg', name: 'Hurdling Lead Leg Snap & Trail Leg Drive', isCore: false, desc: 'Fast straight lead leg extension and flat trail leg rotation.', cue: 'Attack hurdle, fast downward snap of lead leg.' },
    { id: 'baton_exchange_blind', name: 'Relay Baton Exchange (Blind Passing)', isCore: false, desc: 'Outgoing runner acceleration, receiving baton without looking back.', cue: 'Explode on check-mark, loud "STICK" call.' },
    { id: 'middle_distance_stride', name: 'Middle Distance Stride Economy (800m/1500m)', isCore: true, desc: 'Relaxed rhythmic cadence conserving energy over laps.', cue: 'Smooth arm carriage, light quiet foot strikes.' },
    { id: 'distance_pacing_laps', name: 'Lap Pacing & Even-Split Control', isCore: true, desc: 'Hitting target lap splits without surging prematurely.', cue: 'Know your lap split target, stay relaxed in pack.' },
    { id: 'kick_finish_surge', name: 'Final Lap Kick & Tactical Surge', isCore: false, desc: 'Increasing cadence and knee drive in final 200-300m.', cue: 'Pump arms harder, accelerate out of final bend.' },
    { id: 'long_jump_approach', name: 'Long Jump Approach Run & Penultimate Step', isCore: false, desc: 'Consistent 16-stride acceleration, lowering center of mass.', cue: 'Hit approach marks at full speed, sink hips slightly.' },
    { id: 'long_jump_takeoff_flight', name: 'Long Jump Takeoff & Hang / Hitch-Kick', isCore: false, desc: 'Explosive vertical jump off board, extension, and heels-first landing.', cue: 'Drive knee high, reach legs forward into pit.' },
    { id: 'high_jump_curve_approach', name: 'High Jump J-Curve & Fosbury Flop', isCore: false, desc: 'Running curved approach, vertical takeoff, arching back over bar.', cue: 'Lean away from bar on curve, drive inside knee.' },
    { id: 'shot_put_glide_rotation', name: 'Shot Put Glide / Spin & Power Position', isCore: false, desc: 'Linear glide or rotational acceleration, explosive hip thrust.', cue: 'Chin-knee-toe alignment, explode up through legs.' },
    { id: 'javelin_cross_steps', name: 'Javelin Approach & 5-Step Cross Rhythm', isCore: false, desc: 'Withdrawal of javelin, cross-over steps, block with left leg.', cue: 'Pull from far back, firm front-leg block.' },
    { id: 'rhythmic_breathing_running', name: 'Rhythmic 2-2 / 3-3 Breathing Cadence', isCore: false, desc: 'Matching inhale and exhale cycles to foot strides.', cue: 'Inhale for 2 strides, exhale for 2 strides.' }
  ],
  [
    { id: 'curve_running_strategy', name: 'Curve Running & Lane Positioning', isCore: true, desc: 'Leaning slightly into bend, driving right arm across body.', cue: 'Hug the inside line of your lane on bends.' },
    { id: 'pack_drafting_distance', name: 'Drafting & Pack Positioning in Distance Races', isCore: true, desc: 'Running in slipstream behind leaders to conserve energy.', cue: 'Tuck in behind leader shoulder, avoid running wide on bends.' },
    { id: 'break_point_tactics', name: 'Tactical Break & Passing at 300m', isCore: false, desc: 'Timing moves on straights rather than wasting energy on bends.', cue: 'Pass decisively on straightaways.' },
    { id: 'energy_distribution', name: 'Energy Distribution (First Half vs Second Half)', isCore: true, desc: 'Avoiding burnout by controlling pace in first 25% of race.', cue: 'Do not sprint out the first 100m of distance race.' },
    { id: 'wind_weather_adjustment', name: 'Adapting to Headwinds & Hot Conditions', isCore: false, desc: 'Adjusting stride cadence and hydration in adverse conditions.', cue: 'Lower body slightly into headwind, shorten stride.' },
    { id: 'check_mark_accuracy', name: 'Check Mark Accuracy in Jumps & Relays', isCore: false, desc: 'Measuring steps precisely to ensure zero fouls on takeoff board.', cue: 'Measure checkmarks with tape, repeat consistently.' },
    { id: 'race_visualization', name: 'Mental Race Visualization Strategy', isCore: false, desc: 'Mentally running the race from start gun to finish tape.', cue: 'Visualize every 50m phase before race call.' },
    { id: 'field_event_attempts_mgmt', name: 'Managing 3-6 Attempts in Field Events', isCore: false, desc: 'Securing a safe legal mark first before going for maximum risk.', cue: 'Get a solid banker mark on Attempt 1.' },
    { id: 'warmup_timing', name: 'Call Room & Warm-Up Timing Management', isCore: false, desc: 'Timing dynamic stretches and strides to peak at gun time.', cue: 'Complete warmup 15 minutes prior to call room entry.' },
    { id: 'lap_counting_focus', name: 'Lap Counting & Bell Lap Focus', isCore: false, desc: 'Keeping accurate track of remaining laps and bell sound.', cue: 'Check scoreboard lap counter each time around.' }
  ],
  [
    { id: 'ankle_stiffness_elasticity', name: 'Ankle Stiffness & Ground Elasticity', isCore: true, desc: 'Stiff dorsiflexed ankle joint producing high elastic spring.', cue: 'Pencil stiff ankles, minimal ground contact time.' },
    { id: 'plyometric_bounding_power', name: 'Plyometric Bounding & Triple Extension', isCore: true, desc: 'Full extension through ankle, knee, and hip joints.', cue: 'Explode through big toe, complete extension.' },
    { id: 'vo2_max_aerobic_engine', name: 'Aerobic Base & VO2 Max Capacity', isCore: true, desc: 'Sustaining high oxygen uptake across repeat tempo runs.', cue: 'Deep belly breathing, relaxed upper body.' },
    { id: 'core_pelvic_stability', name: 'Core & Pelvic Stability Under Fatigue', isCore: true, desc: 'Preventing excessive hip drop or torso rotation during sprints.', cue: 'Brace core, keep hips high and level.' },
    { id: 'hamstring_eccentric_strength', name: 'Hamstring Strength & Deceleration Resilience', isCore: false, desc: 'Resilient posterior chain preventing sprint strains.', cue: 'Perform Nordic hamstring curls with good control.' },
    { id: 'reaction_time_gun', name: 'Reaction Time to Starter Pistol / Clapper', isCore: true, desc: 'Fast auditory reaction without anticipating or false starting.', cue: 'Focus on sound of gun, explode on the bang.' }
  ],
  [
    { id: 'lactic_burn_grit', name: 'Mental Toughness Through Lactic Acid Burn', isCore: true, desc: 'Pushing through the final 100 meters of intense muscular fatigue.', cue: 'Embrace the burn, hold running form.' },
    { id: 'false_start_discipline', name: 'Start Line Composure & Zero False Starts', isCore: true, desc: 'Staying perfectly motionless on "Set" command.', cue: 'Hold completely still until gun fires.' },
    { id: 'coachability_stride_data', name: 'Applying Coach Split Times & Feedback', isCore: true, desc: 'Reviewing timing splits and adjusting stride cadence.', cue: 'Listen to split times and adjust on next repetition.' },
    { id: 'track_etiquette', name: 'Track Etiquette & Lane Respect', isCore: true, desc: 'Clearing lanes after finish, never crossing live sprint lines.', cue: 'Look both ways before crossing active track.' },
    { id: 'sportsmanship_competitors', name: 'Congratulating Fellow Competitors', isCore: true, desc: 'Shaking hands with lane neighbors after crossing finish line.', cue: 'Walk back, congratulate every athlete in heat.' },
    { id: 'training_consistency', name: 'Dedication to Conditioning & Recovery', isCore: true, desc: 'Diligent execution of warm-ups, cool-downs, and hydration.', cue: 'Treat cool-down and stretching as part of training.' }
  ]
);

// ==========================================
// 8. VOLLEYBALL - 40 SKILLS
// ==========================================
export const VOLLEYBALL_SKILLS: SkillItem[] = generate40SkillsForSport(
  'volleyball', 'vb',
  [
    { id: 'forearm_pass_platform', name: 'Forearm Passing (Bump Platform)', isCore: true, desc: 'Locked elbows, thumbs parallel, angling platform to setter.', cue: 'Quiet upper body, absorb with legs, point platform.' },
    { id: 'overhead_set_fingerwork', name: 'Overhead Setting & Finger Placement', isCore: true, desc: 'Soft finger contact above forehead, extension through arms and legs.', cue: 'Form triangle window with thumbs and index fingers.' },
    { id: 'overhand_float_serve', name: 'Overhand Float Serve', isCore: true, desc: 'Solid wrist, flat palm contact on ball center, stopping follow-through.', cue: 'Strike ball center, stop hand immediately for knuckle float.' },
    { id: 'jump_serve_topspin', name: 'Jump Float / Topspin Jump Serve', isCore: false, desc: 'Toss into court, 3-step approach, high vertical contact.', cue: 'High forward toss, aggressive arm swing.' },
    { id: 'spike_approach_footwork', name: '3-Step Spike Approach Footwork', isCore: true, desc: 'Left-Right-Left (or Right-Left-Right) acceleration with dual arm backswing.', cue: 'Slow-to-fast approach, explode upward with both arms.' },
    { id: 'spike_arm_swing_snap', name: 'Spike Arm Swing & Wrist Snap', isCore: true, desc: 'Bow-and-arrow arm draw, high contact, snapping wrist on top of ball.', cue: 'High elbow, snap wrist over ball for topspin.' },
    { id: 'tip_and_roll_shot', name: 'Off-Speed Tip & Roll Shots', isCore: false, desc: 'Soft open-hand tip over or around high block into vacant space.', cue: 'Disguise as hard spike, softly push with fingertips.' },
    { id: 'line_and_cross_spike', name: 'Hitting Line & Sharp Crosscourt', isCore: true, desc: 'Changing shot direction in mid-air avoiding opponent block.', cue: 'Turn wrist to cut ball sharp cross or drive down line.' },
    { id: 'block_footwork_seal', name: 'Block Footwork & Net Penetration', isCore: true, desc: 'Lateral shuffling, timing jump with hitter, pressing hands over tape.', cue: 'Spread fingers wide, press hands into opponent court.' },
    { id: 'soft_block_rebound', name: 'Soft Blocking & Deflections', isCore: false, desc: 'Angling hands upward to pop ball high for teammate recovery.', cue: 'Tilt hands back to deflect hard attacks upward.' },
    { id: 'floor_defense_dive', name: 'Diving & Pancake Dig Defense', isCore: true, desc: 'Extending flat hand along floor to bounce ball off back of hand.', cue: 'Slide hand flat on turf before ball bounces.' },
    { id: 'overhand_dig_defense', name: 'Overhand Finger Dig (Hard Spikes)', isCore: false, desc: 'Open hand setting dig on spikes traveling above chest height.', cue: 'Firm fingers, absorb pace into high ball.' },
    { id: 'freeball_pass_target', name: 'Free Ball Pass Precision to Setter', isCore: true, desc: 'Passing high floating free balls directly into setter target basket.', cue: 'Call loud early, deliver high arching pass to position 2/3.' },
    { id: 'back_set_execution', name: 'Back Setting Behind Head', isCore: false, desc: 'Setting reverse tempo ball to right-side opposite hitter.', cue: 'Arch back slightly, push evenly through thumbs.' },
    { id: 'quick_attack_tempo', name: 'Quick Middle Attack (A-Ball / 1-Tempo)', isCore: false, desc: 'Middle hitter in air before ball reaches setter hands.', cue: 'Jump with setter release, fast short snap.' },
    { id: 'serve_receive_seam', name: 'Seam Communication on Serve Receive', isCore: true, desc: 'Passing balls served between two players with clear calls.', cue: 'Call "MINE" loudly, trust passing platform.' },
    { id: 'pipe_backrow_attack', name: 'Pipe Attack (Back-Row Spike)', isCore: false, desc: 'Jumping from behind 3-meter line for powerful attack.', cue: 'Take off behind 3m line, elevate through ball.' },
    { id: 'setter_dump_attack', name: 'Setter Tip / Left-Hand Dump', isCore: false, desc: 'Surprise second-touch dump on opponent defense.', cue: 'Disguise set, flick left hand into open donut hole.' }
  ],
  [
    { id: 'court_coverage_defense', name: 'Rotational Base & Perimeter Defense', isCore: true, desc: 'Shifting to defensive positions based on setter location.', cue: 'Read hitter shoulder angle, stay on toes.' },
    { id: 'covering_spikers', name: 'Covering Teammate Spikers (Block Rebound)', isCore: true, desc: 'Getting low around attacker to retrieve blocked spikes.', cue: 'Surround attacker in low ready stance.' },
    { id: 'reading_opponent_setter', name: 'Reading Opponent Setter Hands & Habits', isCore: true, desc: 'Watching setter body language to anticipate set direction.', cue: 'Watch setter arch, don’t commit before ball leaves hands.' },
    { id: 'target_weak_receiver', name: 'Targeting Weaker Serve Receivers', isCore: true, desc: 'Directing serves towards opponent struggling with reception.', cue: 'Find target receiver, aim flat float into their body.' },
    { id: 'out_of_system_setting', name: 'Out-of-System High Ball Setting', isCore: true, desc: 'Setting safe high ball to outside pins when initial pass is off.', cue: 'Bump set high and 3 feet inside court sideline.' },
    { id: 'deciding_line_vs_cross_block', name: 'Setting Block Scheme (Line vs Angle)', isCore: false, desc: 'Coordinating with backrow defenders which zone to take away.', cue: 'Blocker takes line, digger takes crosscourt angle.' },
    { id: 'sideout_efficiency', name: 'Sideout Mentality on Opponent Serves', isCore: true, desc: 'Focusing on immediate 1-pass 1-kill on opponent serves.', cue: 'Pass-Set-Kill on first ball.' },
    { id: 'transition_defense_to_attack', name: 'Transition Footwork (Dig to Approach)', isCore: false, desc: 'Opening up off the net after digging to initiate full spike approach.', cue: 'Backpedal off net immediately, get into approach rhythm.' },
    { id: 'calling_in_out_decisions', name: 'Calling Out-of-Bounds Ball Decisions', isCore: false, desc: 'Helping passers by loudly calling balls going long.', cue: 'Loud "OUT" call before ball crosses baseline.' },
    { id: 'timeout_strategy_execution', name: 'Executing Coach Strategy from Timeouts', isCore: false, desc: 'Applying designated offensive set combinations after timeout.', cue: 'Execute play call drawn on clipboard.' }
  ],
  [
    { id: 'vertical_jump_repeat', name: 'Repeat Vertical Jump Capacity', isCore: true, desc: 'Maintaining explosive jumping height across 5-set matches.', cue: 'Two-foot penultimate plant, explosive arm drive.' },
    { id: 'lateral_shuffling_speed', name: 'Lateral Shuffling & Quick Hip Shifts', isCore: true, desc: 'Fast movement across the net without crossing legs.', cue: 'Stay low, push hard off trailing foot.' },
    { id: 'shoulder_arm_whip_speed', name: 'Shoulder Arm Swing Whip Speed', isCore: true, desc: 'Fast arm swing velocity while protecting shoulder rotator cuff.', cue: 'Dynamic torso rotation, relaxed whip arm.' },
    { id: 'core_air_balance', name: 'Mid-Air Core Stability & Balance', isCore: false, desc: 'Adjusting body in mid-air to hit off-target sets cleanly.', cue: 'Brace core, maintain eye contact with ball.' },
    { id: 'soft_knee_landing', name: 'Safe Two-Foot Landing Mechanics', isCore: true, desc: 'Landing soft on both feet with knee flexion to absorb impact.', cue: 'Land like a cat on both feet with bent knees.' },
    { id: 'reaction_time_spikes', name: 'Reflex & Reaction Speed Against Hard Spikes', isCore: true, desc: 'Micro-second reaction to deflect or dig 100km/h spikes.', cue: 'Keep hands up in front of chest, stay on balls of feet.' }
  ],
  [
    { id: 'team_vocalization', name: 'Floor Talk & Vocal Calling ("MINE / IN / OUT")', isCore: true, desc: 'Continuous loud communication on every contact.', cue: 'Call the ball early and loud before it crosses net.' },
    { id: 'energy_huddle_points', name: 'Huddle Energy After Every Point', isCore: true, desc: 'Quick team huddle with high fives after both won and lost points.', cue: 'Come together in center, reset energy for next point.' },
    { id: 'resilience_after_blocked', name: 'Resilience After Getting Blocked', isCore: true, desc: 'Asking for the next set with confidence after getting blocked.', cue: 'Next ball mentality, call for set again.' },
    { id: 'referee_respect_whistle', name: 'Respect for Referees & Whistle Calls', isCore: true, desc: 'Accepting net touch and line calls without disputing.', cue: 'Captain speaks to referee, team stays composed.' },
    { id: 'bench_support_vocal', name: 'Bench Support & Substitutes Energy', isCore: true, desc: 'Active encouragement, tracking stats, clapping from sidelines.', cue: 'Loud vocal support on every point from bench.' },
    { id: 'postmatch_handshake', name: 'Post-Match Net Handshake', isCore: true, desc: 'Walking under net to shake hands with opposing players and coaches.', cue: 'Shake hands with warmth and sportsmanship.' }
  ]
);

// ==========================================
// 9. KABADDI - 40 SKILLS
// ==========================================
export const KABADDI_SKILLS: SkillItem[] = generate40SkillsForSport(
  'kabaddi', 'kb',
  [
    { id: 'cant_breath_chant', name: 'Continuous Cant & Diaphragmatic Breath', isCore: true, desc: 'Unbroken audible "Kabaddi-Kabaddi" chant under intense physical movement.', cue: 'Deep belly inhale before crossing midline, steady rhythm.' },
    { id: 'hand_touch_feint', name: 'Running Hand Touch & Feint', isCore: true, desc: 'Extending arm to touch defender shoulder/chest with rapid evasion.', cue: 'Feint left, explode right with outstretched hand.' },
    { id: 'toe_touch_sweep', name: 'Toe Touch & Leg Sweep', isCore: true, desc: 'Low extended leg sweep targeting defender foot without overbalancing.', cue: 'Keep weight on back foot, quick flick and retreat.' },
    { id: 'dubki_evasion', name: 'Dubki (Ducking Under Defender Chain)', isCore: true, desc: 'Ducking low below defenders arms and springing across midline.', cue: 'Drop hips below defender waist level, burst forward.' },
    { id: 'frog_jump_escape', name: 'Frog Jump Over Defenders', isCore: false, desc: 'Explosive leap over diving defenders to cross midline.', cue: 'Explode off both feet, tuck knees in air.' },
    { id: 'bonus_line_crossing', name: 'Bonus Line Crossing & Trailing Foot Lift', isCore: true, desc: 'Planting one foot across bonus line while other foot is in the air.', cue: 'Trailing foot must be clearly off the ground.' },
    { id: 'mule_kick_back_kick', name: 'Back Kick & Reverse Mule Kick', isCore: false, desc: 'Blindsided heel kick extending toward trailing corner defender.', cue: 'Look over shoulder, snap heel back directly.' },
    { id: 'turning_escape_burst', name: '360 Turn & Escape from Holds', isCore: true, desc: 'Spinning body out of defender grasp and diving towards midline.', cue: 'Rotate hips violently, reach hand towards midline.' },
    { id: 'ankle_catch_corner', name: 'Ankle Catch (Corner Defender)', isCore: true, desc: 'Timing double-handed grip on raider ankle, pulling inward.', cue: 'Clamp both hands around ankle, pull raider into mat.' },
    { id: 'thigh_hold_grip', name: 'Thigh Hold & Lifting Lock', isCore: true, desc: 'Wrapping both arms around raider thighs, lifting feet off mat.', cue: 'Shoulder into thighs, wrap arms tight, lift up.' },
    { id: 'dash_block_cover', name: 'Dash Block (Cover Defender)', isCore: true, desc: 'Explosive lateral sprint pushing raider out of bounds into lobby.', cue: 'Low shoulder contact on raider hip, drive legs hard.' },
    { id: 'chain_tackle_hold', name: 'Chain Tackle & Double-Arm Wrap', isCore: true, desc: 'Two defenders holding hands, encircling raider with closed chain.', cue: 'Do not break hand grip until tackle is secured.' },
    { id: 'waist_hold_back', name: 'Back Hold & Waist Lock', isCore: false, desc: 'Grabbing raider waist from behind when raider turns back.', cue: 'Lock hands around waist, pull raider backward to mat.' },
    { id: 'diving_ankle_hold', name: 'Diving Ankle Hold on the Retreat', isCore: false, desc: 'Full-length horizontal dive snatching retreating raider foot.', cue: 'Full extension dive, clamp both hands on heel.' },
    { id: 'lion_jump_hurdle', name: 'Lion Jump / Aerial Midline Reach', isCore: false, desc: 'Leaping over multiple defenders attempting corner tackle.', cue: 'Explosive takeoff, reach hand for midline.' },
    { id: 'croc_hold_wrist', name: 'Wrist Catch & Arm Twist', isCore: false, desc: 'Snatching raider extended hand during hand touch attempt.', cue: 'Grip wrist firmly, pull raider into defenders.' },
    { id: 'baulk_line_crossing', name: 'Baulk Line Validation on Every Raid', isCore: true, desc: 'Crossing baulk line cleanly to make raid valid.', cue: 'Cross baulk line completely before 30-second timer.' },
    { id: 'pursuit_quick_raid', name: 'Pursuit Raid (Instant Attack on Defender)', isCore: false, desc: 'Rushing into opponent court immediately as opponent raider crosses back.', cue: 'Cross line before defenders set up their chain.' }
  ],
  [
    { id: 'do_or_die_raid_tactics', name: 'Do-or-Die Raid Execution', isCore: true, desc: 'Scoring a mandatory point under 3rd raid pressure without self-out.', cue: 'Target weakest corner defender, commit to decisive move.' },
    { id: 'chain_coordination_movement', name: 'Chain Movement & Semi-Circle Encirclement', isCore: true, desc: 'Moving in unison as 7/6/5/4 player chain without breaking.', cue: 'Move as a wave, corner controls the chain tempo.' },
    { id: 'super_tackle_strategy', name: 'Super Tackle Setup (3 Defenders or Less)', isCore: true, desc: 'Executing coordinated 2-point tackle with reduced team numbers.', cue: 'Lure raider deep, strike together on corner turn.' },
    { id: 'empty_raid_tempo_control', name: 'Empty Raid Pacing & Time Consumption', isCore: true, desc: 'Using full 30 seconds on raid to protect team lead.', cue: 'Stay near baulk line, run down clock safely.' },
    { id: 'luring_raider_trap', name: 'Corner Trap & Stepping Back', isCore: false, desc: 'Feigning weakness in corner to invite raider into double dash trap.', cue: 'Step back to tempt raider, cover dashes in.' },
    { id: 'bonus_prevention_depth', name: 'Deep Defense to Deny Bonus Points', isCore: false, desc: 'Playing on baulk line to prevent raider from touching bonus line.', cue: 'Stay aggressive on baulk line, do not let raider step over.' },
    { id: 'all_out_prevention', name: 'Last Man Standing Defense Strategy', isCore: false, desc: 'Solo defending to gain bonus point before all-out occurs.', cue: 'Go for bonus touch, fight to revive teammates.' },
    { id: 'target_defender_selection', name: 'Targeting Off-Balance Defenders', isCore: true, desc: 'Attacking defender who just stepped or is out of position.', cue: 'Attack the defender whose feet are crossed.' },
    { id: 'lobby_rules_awareness', name: 'Lobby Activation & Touch Rules', isCore: true, desc: 'Knowing when lobby zone is active after touch.', cue: 'Do not enter lobby before making contact with defender.' },
    { id: 'substitute_revival_order', name: 'Revival Order & Tactical Bench Calls', isCore: false, desc: 'Knowing which star raider/defender is next in revival queue.', cue: 'Score points to bring key raider back on mat.' }
  ],
  [
    { id: 'mat_lateral_agility', name: 'Explosive Mat Agility & Shuffling', isCore: true, desc: 'Fast side-to-side footwork on mat without crossing legs.', cue: 'Stay low on balls of feet, ready to spring.' },
    { id: 'lower_body_grip_power', name: 'Lower Body Grip & Clamping Power', isCore: true, desc: 'Arm and finger grip strength holding thrashing raiders.', cue: 'Lock fingers, clamp into chest.' },
    { id: 'explosive_leg_drive', name: 'Leg Drive & Pushing Power', isCore: true, desc: 'Driving through defenders to drag body across midline.', cue: 'Keep pumping legs, crawl towards white line.' },
    { id: 'core_torsional_stability', name: 'Core Strength Against Twisting Forces', isCore: true, desc: 'Holding ground when raider spins or tries to roll.', cue: 'Brace core, widen base of support on mat.' },
    { id: 'anaerobic_repeat_intensity', name: 'Full-Match High Intensity Stamina', isCore: true, desc: 'Maintaining explosive power across 40-minute physical contest.', cue: 'Deep recovery breathing during raid changeovers.' },
    { id: 'fall_absorption_mechanics', name: 'Safe Tumble & Impact Absorption', isCore: false, desc: 'Rolling safely onto mat without injuring shoulders or neck.', cue: 'Tuck chin, roll smoothly with momentum.' }
  ],
  [
    { id: 'fearless_courage_tackles', name: 'Courage & Commitment in 1v1 Tackles', isCore: true, desc: 'Throwing body into tackle without fear of injury.', cue: 'Commit 100% to the tackle, no hesitation.' },
    { id: 'sportsmanship_on_mat', name: 'Fair Play & Helping Opponent Up', isCore: true, desc: 'Helping fallen raiders up after whistle, respecting refs.', cue: 'Hard on mat, respectful after whistle.' },
    { id: 'accepting_umpire_calls', name: 'Graceful Acceptance of Out / Safe Calls', isCore: true, desc: 'Accepting umpire decisions without arguing on mat.', cue: 'Return to resting box promptly when declared out.' },
    { id: 'captain_court_leadership', name: 'Captain Leadership & Calling Formation', isCore: true, desc: 'Calling defensive formation changes (Cover-Corner alignment).', cue: 'Vocal directives before raider enters court.' },
    { id: 'bench_energy_cheering', name: 'Vocal Support for Raiding Teammates', isCore: true, desc: 'Timing countdown for raiding teammates from bench.', cue: 'Call out remaining seconds on raid timer.' },
    { id: 'coachability_half_time', name: 'Executing Halftime Tactical Adjustments', isCore: true, desc: 'Adjusting defensive chains and raiding strategy for second half.', cue: 'Apply coach defensive scheme in second half.' }
  ]
);

// ==========================================
// 10. TABLE TENNIS - 40 SKILLS
// ==========================================
export const TABLE_TENNIS_SKILLS: SkillItem[] = generate40SkillsForSport(
  'table-tennis', 'tt',
  [
    { id: 'forehand_drive', name: 'Forehand Drive & Counter-Hit', isCore: true, desc: 'Compact forward stroke, waist rotation, contacting ball at top of bounce.', cue: 'Closed racket face, brush forward and through.' },
    { id: 'backhand_drive', name: 'Backhand Drive & Punch Block', isCore: true, desc: 'Compact stroke in front of body, elbow stable, wrist flick.', cue: 'Start near chest, extend forearm smoothly forward.' },
    { id: 'forehand_topspin_loop', name: 'Forehand Topspin Loop Against Backspin', isCore: true, desc: 'Low-to-high brush imparting heavy topspin on backspin balls.', cue: 'Drop racket below ball, brush upward with fast forearm acceleration.' },
    { id: 'backhand_topspin_loop', name: 'Backhand Topspin Loop / Banana Flick', isCore: true, desc: 'Wrist rotation opening ball from over the table (Chiquita flick).', cue: 'Drop wrist down, whip forearm up and over ball.' },
    { id: 'forehand_push_short', name: 'Forehand Short Push (Touch Play)', isCore: true, desc: 'Short backspin push dropping 2 bounces over the net.', cue: 'Open racket face, graze under ball softly.' },
    { id: 'backhand_push_deep', name: 'Backhand Deep Push with Heavy Backspin', isCore: true, desc: 'Fast deep backspin push into opponent corner.', cue: 'Brush underneath ball, drive deep to corners.' },
    { id: 'pendulum_serve_spin', name: 'Pendulum Serve (Sidespin / Backspin / Top)', isCore: true, desc: 'Deceptive wrist contact producing varied spin from same motion.', cue: 'High toss, snap wrist under or across ball.' },
    { id: 'reverse_pendulum_serve', name: 'Reverse Pendulum Serve', isCore: false, desc: 'Striking ball inside-out producing reverse sidespin.', cue: 'Elbow high, whip racket outward across ball.' },
    { id: 'tomahawk_serve', name: 'Tomahawk Serve Variations', isCore: false, desc: 'Squatting stance, slicing down on ball with tomahawk motion.', cue: 'Drop down into knees, slice downward with high racket.' },
    { id: 'active_block_placement', name: 'Active Block & Counter-Punch Placement', isCore: true, desc: 'Absorbing topspin loop and placing ball to open corner.', cue: 'Compact block, steer ball with racket angle.' },
    { id: 'chop_defense_backspin', name: 'Long Chop Defense Against Loops', isCore: false, desc: 'High-to-low slicing stroke from 2-3m back generating heavy backspin.', cue: 'Carve down through ball with open face.' },
    { id: 'forehand_smash_high', name: 'Forehand Smash on High Floating Balls', isCore: true, desc: 'Flat forward kill on high loose balls.', cue: 'High racket preparation, strike ball flat and hard.' },
    { id: 'counter_loop_rally', name: 'Mid-Distance Counter-Looping', isCore: false, desc: 'Topspin loop rallies 2 meters back from table.', cue: 'Wider arm swing, brush ball at highest point.' },
    { id: 'flip_kill_over_table', name: 'Forehand Over-the-Table Flick', isCore: false, desc: 'Attacking short balls directly with wrist flick.', cue: 'Step right foot under table, quick wrist snap.' },
    { id: 'half_long_serve_drop', name: 'Half-Long Deceptive Serve Delivery', isCore: false, desc: 'Serve bouncing once on opponent side and catching baseline.', cue: 'Control pace so second bounce barely hits edge.' },
    { id: 'lob_defense_high', name: 'High Fish & Lob Defense', isCore: false, desc: 'High arcing topspin lobs returning hard smashes from deep.', cue: 'Heavy upward brush, float ball deep onto table.' },
    { id: 'hook_serve_spin', name: 'Hook Serve with Pure Sidespin', isCore: false, desc: 'Brushing back of ball sideways producing severe corkscrew bounce.', cue: 'Snap wrist towards body, brush side of ball.' },
    { id: 'drop_shot_touch', name: 'Drop Shot Dead Stop Block', isCore: false, desc: 'Deadening ball momentum so it barely trickles over net.', cue: 'Pull racket back slightly at contact to absorb pace.' }
  ],
  [
    { id: 'third_ball_attack_plan', name: '3rd Ball Attack Strategy', isCore: true, desc: 'Serving with specific spin to set up immediate forehand kill on 3rd ball.', cue: 'Serve short, anticipate return, attack 3rd ball.' },
    { id: 'fifth_ball_followup', name: '5th Ball Follow-Up & Continuous Pressure', isCore: false, desc: 'Maintaining offensive loop pressure if opponent blocks 3rd ball.', cue: 'Recover quickly after 3rd ball, loop 5th ball.' },
    { id: 'reading_serve_spin_grip', name: 'Reading Opponent Serve Spin (Grip & Angle)', isCore: true, desc: 'Watching opponent racket face angle at point of contact.', cue: 'Look at racket rubber at moment of impact.' },
    { id: 'targeting_middle_elbow', name: 'Targeting Crossover / Hip & Elbow Point', isCore: true, desc: 'Directing attacks into opponent playing elbow causing hesitation.', cue: 'Aim for opponent right hip/elbow crossover zone.' },
    { id: 'receive_short_vs_long', name: 'Receive Strategy: Short Touch vs Long Push', isCore: true, desc: 'Preventing opponent from opening loop on your return of serve.', cue: 'Keep return short over net or drive fast and deep.' },
    { id: 'changing_pace_spin', name: 'Mixing Heavy Spin with No-Spin Balls', isCore: false, desc: 'Deceiving opponent with identical motion producing empty ball.', cue: 'Fake heavy brush, hit through center for no-spin.' },
    { id: 'exploiting_weak_backhand_block', name: 'Pinning Opponent to Deep Backhand Corner', isCore: true, desc: 'Challenging opponent backhand before switching wide to forehand.', cue: '2 balls to backhand, then quick switch to wide forehand.' },
    { id: 'timeout_tactical_break', name: 'Timeout Timing at 9-9 / Critical Points', isCore: false, desc: 'Taking timeout to disrupt opponent rhythm and plan serve.', cue: 'Take timeout to reset plan and choose best serve.' },
    { id: 'edge_and_net_reactions', name: 'Reacting to Net Cord & Edge Balls', isCore: false, desc: 'Quick reflex adjustment when ball clips net or table edge.', cue: 'Never stop watching ball, lunge for net cord balls.' },
    { id: 'game_tempo_routine', name: 'Towel Routine Every 6 Points', isCore: false, desc: 'Using 6-point towel break to breathe and plan next points.', cue: 'Walk to towel, slow breath, plan next 2 serves.' }
  ],
  [
    { id: 'falkenberg_footwork', name: 'Falkenberg 3-Step Footwork Transition', isCore: true, desc: 'Backhand, Pivot Forehand, and Wide Forehand footwork sequence.', cue: 'Pivot around backhand corner, explode out wide.' },
    { id: 'side_step_shuffle', name: 'Side-to-Side Shuffle Footwork', isCore: true, desc: 'Fast lateral hops keeping body square to table.', cue: 'Small light hops, never cross feet.' },
    { id: 'in_and_out_stepping', name: 'In-and-Out Footwork for Short Balls', isCore: true, desc: 'Stepping dominant foot under table for touch and pushing back.', cue: 'Step in with dominant foot, spring back immediately.' },
    { id: 'micro_second_reflex', name: 'Reflex Speed on Close-Table Counters', isCore: true, desc: 'Reacting to fast blocks traveling under 0.2 seconds.', cue: 'Neutral ready position with racket in front.' },
    { id: 'explosive_waist_rotation', name: 'Waist & Hip Rotational Power', isCore: true, desc: 'Generating loop speed from waist uncoiling rather than just arm.', cue: 'Turn waist back, snap forward through hip.' },
    { id: 'multi_ball_stamina', name: 'High-Cadence Multi-Ball Rally Stamina', isCore: false, desc: 'Maintaining stroke consistency over 60-ball multi-ball drills.', cue: 'Continuous rhythm, keep knees bent.' }
  ],
  [
    { id: 'calmness_deuce_points', name: 'Composure at Deuce (10-10) Points', isCore: true, desc: 'Playing with confidence and clear mind at critical scores.', cue: 'Trust your best shot, commit without fear.' },
    { id: 'sportsmanship_net_apology', name: 'Acknowledging Net Cord & Edge Balls', isCore: true, desc: 'Raising index finger politely when winning lucky points.', cue: 'Polite hand raise, stay humble.' },
    { id: 'reset_after_bad_errors', name: 'Instant Emotional Reset After Missed Kills', isCore: true, desc: 'Not allowing frustration from missed smash to carry over.', cue: 'Take deep breath, wipe hand on table, focus on next serve.' },
    { id: 'coachability_between_games', name: 'Listening to Coach in 1-Minute Game Break', isCore: true, desc: 'Applying tactical advice given between game 1 and 2.', cue: 'Listen to key cue, apply on first serve of next game.' },
    { id: 'respect_for_opponents', name: 'Respecting Opponent Style & Equipment', isCore: true, desc: 'Checking opponent rubber type respectfully before match.', cue: 'Inspect opponent racket politely before warm-up.' },
    { id: 'handshake_with_umpire', name: 'Handshake with Opponent & Match Umpires', isCore: true, desc: 'Shaking hands warmly with opponent and umpire after match.', cue: 'Walk to umpire table with smile, thank them.' }
  ]
);

// ==========================================
// 11. SWIMMING - 40 SKILLS
// ==========================================
export const SWIMMING_SKILLS: SkillItem[] = generate40SkillsForSport(
  'swimming', 'sw',
  [
    { id: 'streamline_off_wall', name: 'Streamline Position & Push-Off', isCore: true, desc: 'Locking thumbs, head tucked between biceps, tight core off wall.', cue: 'Squeeze ears with arms, tight pencil body off wall.' },
    { id: 'freestyle_evf_catch', name: 'Freestyle High-Elbow Catch (EVF)', isCore: true, desc: 'Early vertical forearm, fingertip entry, pressing water directly back.', cue: 'Fingertips down, high elbow, pull water back.' },
    { id: 'freestyle_body_roll', name: 'Freestyle Body Roll along Longitudinal Axis', isCore: true, desc: 'Rotating shoulders and hips 45 degrees together with each stroke.', cue: 'Roll hips with shoulders, keep head still except to breathe.' },
    { id: 'freestyle_flutter_kick', name: 'Flutter Kick Mechanics & Ankle Floppiness', isCore: true, desc: 'Kicking from hips with pointed, relaxed flexible ankles.', cue: 'Small fast kicks inside body slipstream, floppy ankles.' },
    { id: 'freestyle_bilateral_breathing', name: 'Bilateral Breathing & Low Head Profile', isCore: true, desc: 'Breathing every 3 strokes keeping one goggle in the water.', cue: 'Keep one goggle in water, turn head not body.' },
    { id: 'freestyle_flip_turn', name: 'Freestyle Tumble / Flip Turn', isCore: true, desc: 'Somersault without lifting head, planting feet on wall, dolphin kick.', cue: 'Tuck chin, fast flip, push off on back and rotate.' },
    { id: 'backstroke_arm_rotation', name: 'Backstroke Straight Arm Recovery & Catch', isCore: true, desc: 'Thumb exit, pinky entry, deep catch and push past hip.', cue: 'Thumb out, rotate shoulder, pinky enters first.' },
    { id: 'backstroke_kick_tempo', name: 'Backstroke Continuous Flutter Kick', isCore: true, desc: 'Upward toe kick breaking surface with toes, head still.', cue: 'Keep chin up, eyes to ceiling, toes boiling water.' },
    { id: 'backstroke_flip_turn', name: 'Backstroke Count & Roll-Over Turn', isCore: false, desc: 'Counting stroke from flags, single freestyle pull, flip turn.', cue: 'Count 4 strokes from flags, roll onto stomach and flip.' },
    { id: 'breaststroke_whip_kick', name: 'Breaststroke Whip Kick Mechanics', isCore: true, desc: 'Heels to butt, feet turned out (dorsiflexed), outward whip squeeze.', cue: 'Heels up, turn feet out, snap legs together and glide.' },
    { id: 'breaststroke_pull_breath', name: 'Breaststroke Pull-Breathe-Kick-Glide Cycle', isCore: true, desc: 'Heart-shaped pull, shoot hands forward into streamline glide.', cue: 'Pull, breathe, kick, long glide in streamline.' },
    { id: 'breaststroke_underwater_pullout', name: 'Breaststroke Underwater Pullout (Pull-Down)', isCore: false, desc: 'Single dolphin kick, full butterfly pull to thighs, recovery.', cue: 'One dolphin kick, sweep arms to thighs, recover tight.' },
    { id: 'butterfly_dual_arm_recovery', name: 'Butterfly Simultaneous Arm Recovery', isCore: true, desc: 'Wide sweeping recovery skimming over water, thumb entry.', cue: 'Thumbs enter first, high hip lift on hand entry.' },
    { id: 'butterfly_dolphin_undulation', name: 'Butterfly Undulation & 2-Beat Kick', isCore: true, desc: 'Chest press undulation, first kick on entry, second on exit.', cue: 'Press chest, kick on hand entry, kick on push.' },
    { id: 'relay_takeoff_timing', name: 'Relay Step-Over Takeoff & Windmill', isCore: false, desc: 'Timing arm swing step as incoming swimmer touches wall.', cue: 'Windmill arms as swimmer approaches, hit block with zero delay.' },
    { id: 'starting_block_dive', name: 'Track Start Dive & Wedge Takeoff', isCore: true, desc: 'Weight back, explosive push off back wedge, clean hole entry.', cue: 'Pull up on block, explode forward into clean single hole entry.' },
    { id: 'underwater_dolphin_kicks', name: 'Underwater Dolphin Kicking Off Walls', isCore: true, desc: 'Powerful rhythmic dolphin kicks past 10-12 meters off every turn.', cue: 'Kick from core and hips in tight streamline.' },
    { id: 'touch_finish_hard', name: 'Touch Finish on Full Stroke Extension', isCore: false, desc: 'Finishing hard to the touchpad without breathing on final stroke.', cue: 'No breath on final stroke, drive hand hard to pad.' }
  ],
  [
    { id: 'stroke_count_efficiency', name: 'Distance Per Stroke (DPS) Optimization', isCore: true, desc: 'Reducing stroke count per 25m/50m while maintaining speed.', cue: 'Count strokes per lap; strive for long gliding stroke.' },
    { id: 'pacing_even_splits', name: 'Race Lap Pacing (Even Splits)', isCore: true, desc: 'Maintaining consistent split times across 200m/400m races.', cue: 'Know your 50m split target, do not sprint first 50m.' },
    { id: 'descending_interval_sets', name: 'Descending Interval Management', isCore: false, desc: 'Swimming each repeat faster than the previous one on clock.', cue: 'Save energy on rep 1, drop 2 seconds on rep 4.' },
    { id: 'open_water_sighting', name: 'Open Water Sighting & Alligator Eyes', isCore: false, desc: 'Lifting eyes slightly above water without dropping hips.', cue: 'Quick alligator eye lift ahead, keep rhythm.' },
    { id: 'drafting_swimming_bubble', name: 'Drafting on Swimmer Hip / Wave', isCore: false, desc: 'Swimming in the wash of leading swimmer to save energy.', cue: 'Swim off shoulder/hip of leader in open water.' },
    { id: 'medley_transition_turns', name: 'Individual Medley (IM) Stroke Transitions', isCore: false, desc: 'Crossover turn from Back to Breast, Fly to Back, Breast to Free.', cue: 'Touch on back, tuck knees, shoot into breaststroke.' },
    { id: 'breath_holding_hypoxic', name: 'Hypoxic Breathing Sets (5 / 7 Strokes)', isCore: false, desc: 'Building lung capacity and oxygen efficiency under sets.', cue: 'Controlled exhale under water, steady rhythm.' },
    { id: 'warmup_activation_pool', name: 'Pre-Race Pool Warmup & Pacing Strides', isCore: false, desc: 'Executing 400m easy, drill work, and 2x25m race pace sprints.', cue: 'Test starting blocks, feel the water catch.' },
    { id: 'lane_clock_discipline', name: 'Pace Clock Reading (Leaving on :00 / :30)', isCore: true, desc: 'Reading top/bottom of clock and leaving precisely on intervals.', cue: 'Eyes on clock, push off on the exact second.' },
    { id: 'suit_goggle_inspection', name: 'Equipment & Goggle Seal Readiness', isCore: false, desc: 'Securing goggle strap under cap to prevent leaking on dives.', cue: 'Double cap, tuck goggle strap under top cap.' }
  ],
  [
    { id: 'ankle_flexibility_dorsiflexion', name: 'Ankle Dorsiflexion & Plantar Flexibility', isCore: true, desc: 'Flexible ankles producing maximum propulsion in kicks.', cue: 'Stretch ankles daily, relax foot in water.' },
    { id: 'shoulder_mobility_catch', name: 'Shoulder Range & Thoracic Mobility', isCore: true, desc: 'High overhead reach without arching lower back.', cue: 'Keep core engaged during full reach.' },
    { id: 'aerobic_vo2_lap_stamina', name: 'Cardiovascular Lap Stamina', isCore: true, desc: 'Sustaining high mechanical output over 4000m practices.', cue: 'Maintain stroke mechanics even during severe fatigue.' },
    { id: 'core_horizontal_alignment', name: 'Core Strength & Horizontal Body Position', isCore: true, desc: 'Keeping hips and feet high on the surface of the water.', cue: 'Press chest down to elevate hips to surface.' },
    { id: 'leg_kick_power_surge', name: '6-Beat Kick Sprint Power', isCore: true, desc: 'Explosive high-cadence kicking during 50m sprint events.', cue: 'Continuous motor kick, high ankle whip.' },
    { id: 'lung_capacity_recovery', name: 'Heart Rate Recovery Between Interval Reps', isCore: false, desc: 'Fast heart rate recovery during 15-30 second rest periods.', cue: 'Deep belly inhales through nose, slow mouth exhales.' }
  ],
  [
    { id: 'wall_touch_grit', name: 'Finishing Every Set to the Wall', isCore: true, desc: 'Never stopping early before touching the wall on all reps.', cue: 'Touch the wall firmly on every single repeat.' },
    { id: 'lane_etiquette_sharing', name: 'Lane Etiquette & Circle Swimming', isCore: true, desc: 'Swimming on left/right side of lane without crowding teammates.', cue: 'Leave 5 seconds behind leader, turn on cross.' },
    { id: 'coachability_stroke_feedback', name: 'Immediate Application of Stroke Drills', isCore: true, desc: 'Applying coach stroke corrections on the very next 50m.', cue: 'Focus on coach feedback for every stroke.' },
    { id: 'sportsmanship_lane_neighbor', name: 'Handshake Over Lane Line', isCore: true, desc: 'Reaching over lane line to congratulate competitor after race.', cue: 'Congratulate swimmers in adjacent lanes immediately.' },
    { id: 'calm_behind_blocks', name: 'Pre-Race Calm Behind the Starting Blocks', isCore: true, desc: 'Staying relaxed, clapping hands, deep breathing before whistle.', cue: 'Breathe, shake out arms, focus on your race plan.' },
    { id: 'training_attendance_discipline', name: 'Early Morning Practice Dedication', isCore: true, desc: 'Consistency in showing up on deck on time every day.', cue: 'On deck ready 10 minutes before workout begins.' }
  ]
);

// ==========================================
// 12. YOGA & PHYSICAL FITNESS - 40 SKILLS
// ==========================================
export const YOGA_FITNESS_SKILLS: SkillItem[] = generate40SkillsForSport(
  'yoga-fitness', 'yg',
  [
    { id: 'surya_namaskar_12flow', name: 'Surya Namaskar (12-Step Classical Flow)', isCore: true, desc: 'Breath-synchronized movement through all 12 sequential postures.', cue: 'Inhale on expansion, exhale on forward folding.' },
    { id: 'tadasana_mountain_posture', name: 'Tadasana (Mountain Pose Alignment)', isCore: true, desc: 'Rooted feet, neutral pelvis, open chest, crown of head reaching high.', cue: 'Ground all 4 corners of feet, lengthen spine.' },
    { id: 'vrikshasana_tree_balance', name: 'Vrikshasana (Tree Pose Stability)', isCore: true, desc: 'Single-leg balance, foot placed on inner thigh, hands in prayer.', cue: 'Fix gaze on one non-moving point (Drishti), engage core.' },
    { id: 'trikonasana_triangle_stretch', name: 'Trikonasana (Triangle Pose)', isCore: true, desc: 'Wide stance, side body lengthening, opening chest to ceiling.', cue: 'Lengthen spine sideways, keep both legs straight.' },
    { id: 'virabhadrasana_warrior_stances', name: 'Virabhadrasana I & II (Warrior Poses)', isCore: true, desc: 'Deep 90-degree front knee bend, active back leg, strong gaze.', cue: 'Front knee over ankle, arms parallel to ground.' },
    { id: 'paschimottanasana_seated_fold', name: 'Paschimottanasana (Seated Forward Bend)', isCore: true, desc: 'Lengthening spine from hips, reaching chest toward shins.', cue: 'Hinge from hips, keep back flat, don’t round shoulders.' },
    { id: 'bhujangasana_cobra_pose', name: 'Bhujangasana (Cobra Pose Spine Extension)', isCore: true, desc: 'Gentle backbend using spinal muscles, shoulders away from ears.', cue: 'Elbows close to ribs, lift chest with back muscles.' },
    { id: 'dhanurasana_bow_pose', name: 'Dhanurasana (Bow Pose Backbend)', isCore: false, desc: 'Holding ankles, kicking feet up and back to elevate chest.', cue: 'Kick legs into hands, lift thighs and chest off floor.' },
    { id: 'sarvangasana_shoulder_stand', name: 'Sarvangasana (Shoulder Stand Inversion)', isCore: false, desc: 'Vertical body alignment supported on shoulders, chin to chest.', cue: 'Support lower back with hands, point toes to ceiling.' },
    { id: 'halasana_plow_pose', name: 'Halasana (Plow Pose Inversion)', isCore: false, desc: 'Toes touching floor behind head, straight legs, interlocked fingers.', cue: 'Keep neck straight, lengthen through hamstrings.' },
    { id: 'plank_core_hold', name: 'Kumbhakasana (Plank Pose Hold)', isCore: true, desc: 'Neutral spine, shoulders over wrists, core engaged.', cue: 'Straight line from heels to head, draw navel to spine.' },
    { id: 'navasana_boat_pose', name: 'Navasana (Boat Pose Core Balance)', isCore: true, desc: 'Balancing on sit bones, V-shape torso and straight legs.', cue: 'Lift chest, keep spine straight, arms parallel to ground.' },
    { id: 'anulom_vilom_pranayama', name: 'Anulom Vilom (Alternate Nostril Breathing)', isCore: true, desc: 'Rhythmic breath regulation balancing sympathetic & parasympathetic systems.', cue: 'Smooth silent inhale for 4s, gentle exhale for 6s.' },
    { id: 'kapalbhati_cleansing_breath', name: 'Kapalbhati (Skull Shining Breath)', isCore: false, desc: 'Active forceful exhalations with passive automatic inhalations.', cue: 'Pumping abdomen on exhale, face completely relaxed.' },
    { id: 'bhramari_humming_bee_breath', name: 'Bhramari (Humming Bee Pranayama)', isCore: false, desc: 'Calming resonance vibration on exhale soothing the nervous system.', cue: 'Close ears with thumbs, gentle steady humming sound.' },
    { id: 'shavasana_deep_relaxation', name: 'Shavasana (Corpse Pose Conscious Release)', isCore: true, desc: 'Complete physical stillness, body scanning, and letting go of tension.', cue: 'Relax every muscle group from toes to crown of head.' },
    { id: 'functional_squat_mechanics', name: 'Functional Squat & Hip Mobility', isCore: true, desc: 'Deep squat with heels on ground, knees tracking over toes.', cue: 'Chest tall, hips sink below parallel, push off heels.' },
    { id: 'burpee_explosive_conditioning', name: 'Burpee & Dynamic Bodyweight Power', isCore: false, desc: 'Chest to floor drop, explosive jump with overhead clap.', cue: 'Land soft on feet, jump tall with full hip extension.' }
  ],
  [
    { id: 'breath_movement_synchronization', name: 'Breath-Movement Synchronization (Vinyasa)', isCore: true, desc: 'Matching every transition smoothly with an inhale or exhale.', cue: 'Inhale to lift and open, exhale to bend and ground.' },
    { id: 'drishti_gaze_focus', name: 'Drishti (Single-Point Focus Discipline)', isCore: true, desc: 'Fixing gaze on steady point to eliminate mental distractions.', cue: 'Soft focused gaze on one spot, calm the mind.' },
    { id: 'postural_self_correction', name: 'Postural Self-Correction & Body Awareness', isCore: true, desc: 'Recognizing and correcting pelvic tilt or rounded shoulders.', cue: 'Check your alignment from feet to crown.' },
    { id: 'energy_conservation_pacing', name: 'Energy Conservation During Long Holds', isCore: true, desc: 'Using slow deep breathing to sustain demanding posture holds.', cue: 'Breathe into tension, avoid clenching jaw.' },
    { id: 'warmup_cooldown_sequencing', name: 'Safe Warmup and Progressive Asana Sequencing', isCore: false, desc: 'Starting with gentle spinal warmups before deep backbends.', cue: 'Warm up spine in all 6 directions before deep poses.' },
    { id: 'joint_safety_alignment', name: 'Joint Safety & Micro-Bend Protection', isCore: true, desc: 'Avoiding hyperextension of knees and elbows in poses.', cue: 'Keep micro-bend in joints, engage surrounding muscles.' },
    { id: 'stress_reduction_routine', name: 'Stress Reduction & Exam Anxiety Protocol', isCore: false, desc: 'Using 5-minute breathing routine to reduce test anxiety.', cue: 'Slow down heart rate with extended exhales.' },
    { id: 'athletic_mobility_routine', name: 'Sport-Specific Athletic Mobility Flow', isCore: false, desc: 'Dynamic stretching flow targeting hips, hamstrings, and shoulders.', cue: 'Open tight athletic joints with dynamic stretching.' },
    { id: 'mindful_eating_hydration', name: 'Hydration & Clean Nutrition Awareness', isCore: false, desc: 'Understanding hydration timing before and after yoga practice.', cue: 'Hydrate well throughout the day, practice on light stomach.' },
    { id: 'daily_routine_discipline', name: 'Dinacharya (Daily Morning Practice Routine)', isCore: false, desc: 'Building consistent 20-minute daily morning practice habits.', cue: 'Practice at the same time each morning for best results.' }
  ],
  [
    { id: 'hamstring_flexibility_range', name: 'Hamstring & Posterior Chain Flexibility', isCore: true, desc: 'Full range of motion in forward bends with flat spine.', cue: 'Hips hinge back, relax into gentle hamstring stretch.' },
    { id: 'hip_opening_mobility', name: 'Hip Opening Range (Pigeon Pose / Baddha Konasana)', isCore: true, desc: 'Releasing tight hip flexors and external rotators.', cue: 'Breathe deeply into hips, release stored tension.' },
    { id: 'thoracic_spine_mobility', name: 'Thoracic Spine Extension & Rotation', isCore: true, desc: 'Upper back mobility allowing open chest expansion.', cue: 'Rotate from mid-back, keep hips square.' },
    { id: 'shoulder_girdle_flexibility', name: 'Shoulder Girdle Mobility & Overhead Reach', isCore: true, desc: 'Full shoulder extension (Gomukhasana / Cow Face arms).', cue: 'Reach fingers toward each other behind back.' },
    { id: 'core_isometric_endurance', name: 'Core Isometric Endurance (60s Plank Hold)', isCore: true, desc: 'Sustaining solid plank hold without hip sagging.', cue: 'Strong core brace, steady uninterrupted breath.' },
    { id: 'cardiovascular_flow_stamina', name: 'Cardiovascular Stamina in Continuous Flows', isCore: false, desc: 'Maintaining smooth breathing across 10 continuous Surya Namaskars.', cue: 'Smooth rhythmic cadence, maintain breath control.' }
  ],
  [
    { id: 'mindful_patience_growth', name: 'Patience with Body Flexibility Progress', isCore: true, desc: 'Practicing non-judgment (Ahimsa) without forcing body into pain.', cue: 'Honor your body limits today, flexibility comes with time.' },
    { id: 'mental_stillness_meditation', name: 'Mental Stillness & Meditation Focus (Dhyana)', isCore: true, desc: 'Sitting quietly in Sukhasana for 5-10 minutes with calm breath.', cue: 'Observe thoughts without reacting, return to breath.' },
    { id: 'coachability_alignment_cues', name: 'Listening to Alignment Adjustments from Teacher', isCore: true, desc: 'Accepting hands-on or verbal alignment cues willingly.', cue: 'Adjust posture immediately based on teacher cues.' },
    { id: 'cleanliness_mat_etiquette', name: 'Saucha (Cleanliness & Studio Etiquette)', isCore: true, desc: 'Keeping yoga mat clean, entering studio barefoot quietly.', cue: 'Remove shoes, wipe mat, maintain quiet peaceful space.' },
    { id: 'positive_attitude_gratitude', name: 'Positive Attitude & Gratitude Practice', isCore: true, desc: 'Ending every practice session with genuine gratitude (Namaste).', cue: 'Bring hands to heart center, acknowledge your effort.' },
    { id: 'daily_consistency_grit', name: 'Dedication to Daily Discipline (Tapas)', isCore: true, desc: 'Showing up on the yoga mat regularly even when unmotivated.', cue: 'Consistency is the key to mental and physical mastery.' }
  ]
);

// Map of all sports skills
export const ALL_COACHING_SKILLS_BY_SPORT: Record<CoachingSportId, SkillItem[]> = {
  football: FOOTBALL_SKILLS,
  basketball: BASKETBALL_SKILLS,
  cricket: CRICKET_SKILLS,
  chess: CHESS_SKILLS,
  tennis: TENNIS_SKILLS,
  badminton: BADMINTON_SKILLS,
  athletics: ATHLETICS_SKILLS,
  volleyball: VOLLEYBALL_SKILLS,
  kabaddi: KABADDI_SKILLS,
  'table-tennis': TABLE_TENNIS_SKILLS,
  swimming: SWIMMING_SKILLS,
  'yoga-fitness': YOGA_FITNESS_SKILLS
};

// Helper to get preset skills
export function getPresetSkillIdsForSport(
  sportId: CoachingSportId,
  preset: SkillPresetType,
  allSkills: SkillItem[],
  positions: PositionRole[] = [],
  selectedPosition?: string
): string[] {
  const sportSkills = allSkills && allSkills.length > 0 ? allSkills : (ALL_COACHING_SKILLS_BY_SPORT[sportId] || FOOTBALL_SKILLS);

  if (preset === 'master40') {
    return sportSkills.map(s => s.id);
  }

  if (preset === 'core') {
    // Return all core skills (typically 10-14 essentials)
    const cores = sportSkills.filter(s => s.isCore).map(s => s.id);
    return cores.length > 0 ? cores : sportSkills.slice(0, 12).map(s => s.id);
  }

  if (preset === 'development') {
    // Core + top technical/tactical up to 20 skills
    const coreIds = new Set(sportSkills.filter(s => s.isCore).map(s => s.id));
    const result: string[] = Array.from(coreIds);
    for (const skill of sportSkills) {
      if (result.length >= 20) break;
      if (!coreIds.has(skill.id)) {
        result.push(skill.id);
      }
    }
    return result;
  }

  if (preset === 'positional') {
    // Core skills + position specific skills
    const coreIds = new Set(sportSkills.filter(s => s.isCore).map(s => s.id));
    if (selectedPosition) {
      const pos = positions.find(p => p.id.toLowerCase() === selectedPosition.toLowerCase() || p.name.toLowerCase().includes(selectedPosition.toLowerCase()));
      if (pos) {
        pos.skills.forEach(id => coreIds.add(id));
      }
    }
    return Array.from(coreIds);
  }

  // Custom or fallback
  return sportSkills.filter(s => s.isCore).map(s => s.id);
}
