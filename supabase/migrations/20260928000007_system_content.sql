-- System content shipped to every environment: reference data, the bilingual
-- exercise library, and the starter-program factory.
-- Descriptions are neutral execution cues only. No medical claims.

insert into public.muscle_groups (slug, name_sr, name_en) values
  ('chest', 'Grudi', 'Chest'),
  ('upper_back', 'Gornja leđa', 'Upper back'),
  ('lats', 'Latisimus', 'Lats'),
  ('lower_back', 'Donja leđa', 'Lower back'),
  ('shoulders', 'Ramena', 'Shoulders'),
  ('biceps', 'Biceps', 'Biceps'),
  ('triceps', 'Triceps', 'Triceps'),
  ('core', 'Trup', 'Core'),
  ('glutes', 'Gluteus', 'Glutes'),
  ('hips', 'Kukovi', 'Hips'),
  ('hip_flexors', 'Pregibači kuka', 'Hip flexors'),
  ('quadriceps', 'Kvadriceps', 'Quadriceps'),
  ('hamstrings', 'Zadnja loža', 'Hamstrings'),
  ('calves', 'Listovi', 'Calves'),
  ('full_body', 'Celo telo', 'Full body');

insert into public.equipment (slug, name_sr, name_en) values
  ('mat', 'Strunjača', 'Mat'),
  ('bodyweight', 'Sopstvena težina', 'Bodyweight'),
  ('resistance_band', 'Elastična guma', 'Resistance band'),
  ('trx', 'TRX', 'TRX'),
  ('jump_rope', 'Vijača', 'Jump rope'),
  ('dumbbell', 'Bučica', 'Dumbbell'),
  ('other', 'Ostalo', 'Other');

create temporary table _system_exercises (
  slug text,
  name_sr text,
  name_en text,
  description_sr text,
  description_en text,
  tracking_mode public.tracking_mode,
  is_mobility boolean,
  primary_muscles text[],
  secondary_muscles text[],
  equipment text[]
) on commit drop;

insert into _system_exercises values
-- Mat & bodyweight ---------------------------------------------------------
('glute_bridge', 'Glute most', 'Glute bridge',
 'Lezi na leđa, stopala na podu u širini kukova. Podigni kukove dok telo ne bude u pravoj liniji od ramena do kolena, zadrži kratko i spusti se kontrolisano.',
 'Lie on your back, feet hip-width apart on the floor. Lift your hips until shoulders, hips and knees form a line, pause briefly and lower with control.',
 'reps', false, '{glutes}', '{hamstrings,core}', '{mat}'),
('dead_bug', 'Mrtva buba', 'Dead bug',
 'Lezi na leđa, ruke ka plafonu, kolena savijena iznad kukova. Naizmenično spuštaj suprotnu ruku i nogu ka podu, zadržavajući donji deo leđa mirnim.',
 'Lie on your back, arms toward the ceiling, knees bent over hips. Alternately lower the opposite arm and leg toward the floor while keeping your lower back still.',
 'reps', false, '{core}', '{hip_flexors}', '{mat}'),
('bird_dog', 'Bird dog', 'Bird dog',
 'Oslonac na šakama i kolenima. Istovremeno ispruži suprotnu ruku i nogu, zadrži kratko i vrati se bez rotacije karlice.',
 'Start on hands and knees. Extend the opposite arm and leg together, pause briefly and return without rotating your pelvis.',
 'reps', false, '{core,lower_back}', '{glutes,shoulders}', '{mat}'),
('forearm_plank', 'Plank na podlakticama', 'Forearm plank',
 'Oslonac na podlakticama i prstima stopala, laktovi ispod ramena. Drži telo u pravoj liniji i diši ravnomerno.',
 'Support yourself on forearms and toes, elbows under shoulders. Keep your body in a straight line and breathe steadily.',
 'duration', false, '{core}', '{shoulders,glutes}', '{mat}'),
('side_plank', 'Bočni plank', 'Side plank',
 'Oslonac na podlaktici i bočnoj strani stopala (ili kolena za lakšu varijantu). Podigni kukove i drži telo u liniji.',
 'Support yourself on one forearm and the side of your foot (or knee for an easier version). Lift your hips and hold a straight line.',
 'duration', false, '{core}', '{glutes,shoulders}', '{mat}'),
('push_up', 'Sklek', 'Push-up',
 'Šake nešto šire od ramena, telo u pravoj liniji. Spusti grudi ka podu kontrolisano i odgurni se nazad.',
 'Hands slightly wider than shoulders, body in a straight line. Lower your chest toward the floor with control and press back up.',
 'reps', false, '{chest,triceps}', '{shoulders,core}', '{bodyweight}'),
('incline_push_up', 'Sklek sa povišenja', 'Incline push-up',
 'Šake na stabilnoj povišenoj površini (klupa, sto, zid). Što je površina viša, vežba je lakša.',
 'Hands on a stable raised surface (bench, table, wall). The higher the surface, the easier the exercise.',
 'reps', false, '{chest,triceps}', '{shoulders,core}', '{bodyweight}'),
('knee_push_up', 'Sklek na kolenima', 'Knee push-up',
 'Kao sklek, ali sa osloncem na kolenima. Drži liniju od ramena do kolena.',
 'Like a push-up, but supported on your knees. Keep a straight line from shoulders to knees.',
 'reps', false, '{chest,triceps}', '{shoulders}', '{mat}'),
('bodyweight_squat', 'Čučanj', 'Bodyweight squat',
 'Stopala u širini ramena. Spusti kukove unazad i nadole koliko je prijatno, kolena prate pravac prstiju, pa ustani.',
 'Feet shoulder-width apart. Sit your hips back and down as far as is comfortable, knees tracking over toes, then stand up.',
 'reps', false, '{quadriceps,glutes}', '{hamstrings,core}', '{bodyweight}'),
('reverse_lunge', 'Iskorak unazad', 'Reverse lunge',
 'Iz stojećeg stava zakorači jednom nogom unazad i spusti zadnje koleno ka podu. Vrati se odgurivanjem prednjom nogom.',
 'From standing, step one leg back and lower the back knee toward the floor. Return by pushing through the front foot.',
 'reps', false, '{quadriceps,glutes}', '{hamstrings,core}', '{bodyweight}'),
('wall_sit', 'Sedenje uz zid', 'Wall sit',
 'Leđa uz zid, spusti se kao da sediš na stolici. Drži poziciju u uglu koji ti prija.',
 'Back against a wall, slide down as if sitting on a chair. Hold at a knee angle that feels comfortable.',
 'duration', false, '{quadriceps}', '{glutes}', '{bodyweight}'),
('calf_raise', 'Podizanje na prste', 'Calf raise',
 'Stani uspravno, po potrebi se pridržavaj. Podigni se na prste, zadrži kratko i spusti se polako.',
 'Stand tall, holding on for balance if needed. Rise onto your toes, pause briefly and lower slowly.',
 'reps', false, '{calves}', '{}', '{bodyweight}'),
('side_lying_leg_raise', 'Bočno podizanje noge', 'Side-lying leg raise',
 'Lezi na bok, donja noga savijena. Podigni gornju ispruženu nogu bez okretanja karlice unazad.',
 'Lie on your side with the bottom leg bent. Lift the straight top leg without rolling your pelvis back.',
 'reps', false, '{glutes}', '{hips}', '{mat}'),
('clamshell', 'Školjka', 'Clamshell',
 'Lezi na bok, kolena savijena, stopala zajedno. Otvori gornje koleno ne pomerajući karlicu, pa ga vrati.',
 'Lie on your side, knees bent, feet together. Open the top knee without moving your pelvis, then close it.',
 'reps', false, '{glutes}', '{hips}', '{mat}'),
('prone_y_raise', 'Y podizanje na stomaku', 'Prone Y raise',
 'Lezi na stomak, ruke ispružene iznad glave u obliku slova Y. Podigni ruke malo od poda vodeći lopaticama, pa spusti.',
 'Lie face down with arms overhead in a Y shape. Lift your arms slightly off the floor, leading with the shoulder blades, then lower.',
 'reps', false, '{upper_back,shoulders}', '{lower_back}', '{mat}'),
-- Resistance bands --------------------------------------------------------
('band_row', 'Veslanje sa gumom', 'Band row',
 'Guma pričvršćena ispred tebe u visini grudi. Povuci ručke ka telu, lopatice lagano ka unutra, pa vrati kontrolisano.',
 'Anchor the band in front of you at chest height. Pull the handles toward your body, drawing shoulder blades back, and return with control.',
 'reps_band', false, '{upper_back,lats}', '{biceps}', '{resistance_band}'),
('band_pull_apart', 'Razvlačenje gume', 'Band pull-apart',
 'Drži gumu ispred sebe u visini ramena. Razvuci je ka stranama dok ne dodirne grudi, pa vrati polako.',
 'Hold the band in front of you at shoulder height. Pull it apart to the sides until it reaches your chest, then return slowly.',
 'reps_band', false, '{upper_back,shoulders}', '{}', '{resistance_band}'),
('band_chest_press', 'Potisak sa gumom', 'Band chest press',
 'Guma pričvršćena iza tebe u visini grudi. Potisni ručke napred do ispruženih ruku i vrati kontrolisano.',
 'Anchor the band behind you at chest height. Press the handles forward until your arms are straight and return with control.',
 'reps_band', false, '{chest,triceps}', '{shoulders}', '{resistance_band}'),
('band_overhead_press', 'Potisak iznad glave sa gumom', 'Band overhead press',
 'Stani na gumu, ručke u visini ramena. Potisni ih iznad glave bez zabacivanja donjeg dela leđa.',
 'Stand on the band with handles at shoulder height. Press overhead without arching your lower back.',
 'reps_band', false, '{shoulders,triceps}', '{core}', '{resistance_band}'),
('band_biceps_curl', 'Pregib za biceps sa gumom', 'Band biceps curl',
 'Stani na gumu, dlanovi napred. Savij laktove i podigni ručke ka ramenima, laktovi ostaju uz telo.',
 'Stand on the band, palms forward. Bend your elbows to bring the handles toward your shoulders, keeping elbows by your sides.',
 'reps_band', false, '{biceps}', '{}', '{resistance_band}'),
('band_triceps_extension', 'Opružanje za triceps sa gumom', 'Band triceps extension',
 'Guma pričvršćena iznad tebe. Laktovi uz telo, opruži ruke nadole i vrati polako.',
 'Anchor the band above you. With elbows by your sides, straighten your arms downward and return slowly.',
 'reps_band', false, '{triceps}', '{}', '{resistance_band}'),
('band_pallof_press', 'Pallof potisak', 'Pallof press',
 'Stani bočno u odnosu na pričvršćenu gumu, ručka uz grudi. Ispruži ruke napred ne dozvoljavajući trupu da se okrene.',
 'Stand side-on to the anchored band, handle at your chest. Press your arms forward without letting your torso rotate.',
 'reps_band', false, '{core}', '{shoulders}', '{resistance_band}'),
('band_lateral_walk', 'Bočni hod sa gumom', 'Banded lateral walk',
 'Mini guma iznad kolena ili oko skočnih zglobova, blagi polučučanj. Koračaj bočno održavajući napetost gume.',
 'Mini band above the knees or around the ankles, slight squat. Step sideways while keeping tension on the band.',
 'reps_band', false, '{glutes}', '{hips,quadriceps}', '{resistance_band}'),
('band_squat', 'Čučanj sa gumom', 'Banded squat',
 'Stani na gumu, ručke u visini ramena. Izvedi čučanj uz kontrolu i vrati se u stojeći stav.',
 'Stand on the band with handles at shoulder height. Squat with control and return to standing.',
 'reps_band', false, '{quadriceps,glutes}', '{hamstrings,core}', '{resistance_band}'),
('band_romanian_deadlift', 'Rumunsko mrtvo dizanje sa gumom', 'Band Romanian deadlift',
 'Stani na gumu, kolena blago savijena. Pomeri kukove unazad sa neutralnim leđima, pa se uspravi aktivirajući gluteus.',
 'Stand on the band, knees slightly bent. Hinge your hips back with a neutral spine, then stand up by driving through the glutes.',
 'reps_band', false, '{hamstrings,glutes}', '{lower_back}', '{resistance_band}'),
('band_lat_pulldown', 'Povlačenje gume nadole', 'Band lat pulldown',
 'Guma pričvršćena iznad glave. Povuci je nadole ka grudima vodeći laktovima, pa vrati kontrolisano.',
 'Anchor the band overhead. Pull it down toward your chest leading with the elbows, then return with control.',
 'reps_band', false, '{lats}', '{biceps,upper_back}', '{resistance_band}'),
-- TRX ------------------------------------------------------------------------
('trx_row', 'TRX veslanje', 'TRX row',
 'Drži ručke, telo u pravoj liniji pod uglom. Povuci grudi ka ručkama i spusti se kontrolisano. Što su stopala bliže sidru, to je teže.',
 'Hold the handles with your body straight at an angle. Pull your chest to the handles and lower with control. Feet closer to the anchor makes it harder.',
 'reps_trx', false, '{upper_back,lats}', '{biceps,core}', '{trx}'),
('trx_chest_press', 'TRX potisak za grudi', 'TRX chest press',
 'Okrenut od sidra, ruke ispružene napred. Spusti grudi između ručki i odgurni se nazad održavajući liniju tela.',
 'Facing away from the anchor, arms extended forward. Lower your chest between the handles and press back while keeping a straight body.',
 'reps_trx', false, '{chest,triceps}', '{shoulders,core}', '{trx}'),
('trx_squat', 'TRX čučanj', 'TRX squat',
 'Drži ručke ispred sebe radi ravnoteže. Spusti se u čučanj i ustani koristeći trake samo koliko je potrebno.',
 'Hold the handles in front of you for balance. Squat down and stand up, using the straps only as much as needed.',
 'reps_trx', false, '{quadriceps,glutes}', '{hamstrings}', '{trx}'),
('trx_lunge', 'TRX iskorak unazad', 'TRX reverse lunge',
 'Drži ručke radi ravnoteže i zakorači unazad u iskorak. Vrati se odgurivanjem prednjom nogom.',
 'Hold the handles for balance and step back into a lunge. Return by pushing through the front foot.',
 'reps_trx', false, '{quadriceps,glutes}', '{hamstrings}', '{trx}'),
('trx_y_fly', 'TRX Y podizanje', 'TRX Y fly',
 'Lice ka sidru, ruke ispružene. Podigni ruke u oblik slova Y dok se telo pomera ka uspravnom položaju.',
 'Face the anchor with straight arms. Raise your arms into a Y shape as your body moves toward upright.',
 'reps_trx', false, '{shoulders,upper_back}', '{core}', '{trx}'),
('trx_biceps_curl', 'TRX pregib za biceps', 'TRX biceps curl',
 'Lice ka sidru, dlanovi nagore. Savij laktove i privuci ručke ka čelu, laktovi ostaju u visini ramena.',
 'Face the anchor, palms up. Bend your elbows to bring the handles toward your forehead, keeping elbows at shoulder height.',
 'reps_trx', false, '{biceps}', '{core}', '{trx}'),
-- Jump rope ------------------------------------------------------------------
('jump_rope_basic', 'Preskakanje vijače', 'Jump rope',
 'Mali, lagani skokovi na prednjem delu stopala, laktovi uz telo, rotacija iz ručnih zglobova.',
 'Small, light jumps on the balls of your feet, elbows close to your body, turning the rope from the wrists.',
 'reps_duration', false, '{full_body}', '{calves}', '{jump_rope}'),
('jump_rope_intervals', 'Vijača — intervali', 'Jump rope intervals',
 'Preskakanje vijače u zadatom trajanju, uz odmor između intervala.',
 'Skip rope for the set duration, resting between intervals.',
 'duration', false, '{full_body}', '{calves}', '{jump_rope}'),
-- Dumbbells ------------------------------------------------------------------
('goblet_squat', 'Goblet čučanj', 'Goblet squat',
 'Drži bučicu uz grudi. Spusti se u čučanj sa uspravnim trupom i ustani.',
 'Hold a dumbbell at your chest. Squat down with an upright torso and stand up.',
 'reps_weight', false, '{quadriceps,glutes}', '{core}', '{dumbbell}'),
('dumbbell_row', 'Veslanje bučicom jednom rukom', 'One-arm dumbbell row',
 'Oslonac jednom rukom i kolenom na klupi. Povuci bučicu ka kuku i spusti je kontrolisano.',
 'Support one hand and knee on a bench. Pull the dumbbell toward your hip and lower with control.',
 'reps_weight', false, '{lats,upper_back}', '{biceps}', '{dumbbell}'),
('dumbbell_floor_press', 'Potisak bučicama sa poda', 'Dumbbell floor press',
 'Lezi na leđa, bučice iznad grudi. Spusti ih dok nadlaktice ne dodirnu pod, pa potisni nagore.',
 'Lie on your back with dumbbells over your chest. Lower until your upper arms touch the floor, then press up.',
 'reps_weight', false, '{chest,triceps}', '{shoulders}', '{dumbbell,mat}'),
('dumbbell_rdl', 'Rumunsko mrtvo dizanje bučicama', 'Dumbbell Romanian deadlift',
 'Bučice ispred butina, kolena blago savijena. Pomeri kukove unazad sa neutralnim leđima i vrati se u uspravan stav.',
 'Dumbbells in front of your thighs, knees slightly bent. Hinge your hips back with a neutral spine and return to standing.',
 'reps_weight', false, '{hamstrings,glutes}', '{lower_back}', '{dumbbell}'),
-- Mobility & stretching ----------------------------------------------------
('cat_cow', 'Mačka–krava', 'Cat-cow',
 'Oslonac na šakama i kolenima. Polako naizmenično zaobljavaj i opuštaj leđa u opsegu koji ti prija.',
 'On hands and knees, slowly alternate between rounding and gently arching your back within a comfortable range.',
 'reps', true, '{lower_back,upper_back}', '{core}', '{mat}'),
('open_book', 'Otvaranje knjige', 'Open book rotation',
 'Lezi na bok, kolena savijena. Gornju ruku polako otvori preko tela ka suprotnoj strani prateći je pogledom.',
 'Lie on your side, knees bent. Slowly open the top arm across to the other side, following it with your eyes.',
 'reps', true, '{upper_back}', '{shoulders,chest}', '{mat}'),
('hip_90_90', 'Rotacije kukova 90/90', '90/90 hip switches',
 'Sedi sa obe noge savijene pod 90°. Polako prebacuj kolena s jedne na drugu stranu.',
 'Sit with both legs bent at 90°. Slowly rotate your knees from one side to the other.',
 'reps', true, '{hips}', '{glutes}', '{mat}'),
('hip_flexor_stretch', 'Istezanje pregibača kuka', 'Half-kneeling hip flexor stretch',
 'Klekni na jedno koleno, drugo stopalo ispred. Blago pomeri karlicu napred dok ne osetiš istezanje s prednje strane kuka.',
 'Kneel on one knee with the other foot in front. Gently shift your pelvis forward until you feel a stretch at the front of the hip.',
 'duration', true, '{hip_flexors}', '{quadriceps}', '{mat}'),
('supine_hamstring_stretch', 'Istezanje zadnje lože na leđima', 'Supine hamstring stretch',
 'Lezi na leđa, gumu ili peškir prebaci preko stopala. Podigni opruženu nogu dok ne osetiš blago istezanje.',
 'Lie on your back with a band or towel around one foot. Raise the straight leg until you feel a gentle stretch.',
 'duration', true, '{hamstrings}', '{calves}', '{mat,resistance_band}'),
('figure_four_stretch', 'Istezanje „četvorka”', 'Figure-four stretch',
 'Lezi na leđa, skočni zglob jedne noge prebaci preko kolena druge i privuci noge ka sebi.',
 'Lie on your back, cross one ankle over the opposite knee and draw your legs toward you.',
 'duration', true, '{glutes}', '{hips}', '{mat}'),
('childs_pose', 'Poza deteta', 'Child''s pose',
 'Iz klečećeg položaja spusti kukove ka petama i ispruži ruke napred. Diši mirno.',
 'From kneeling, sit your hips back toward your heels and reach your arms forward. Breathe calmly.',
 'duration', true, '{lower_back}', '{lats,shoulders}', '{mat}'),
('doorway_chest_stretch', 'Istezanje grudi na dovratku', 'Doorway chest stretch',
 'Podlaktica na dovratku, lakat u visini ramena. Blago zakorači napred dok ne osetiš istezanje grudi.',
 'Place your forearm on a door frame, elbow at shoulder height. Step gently forward until you feel a chest stretch.',
 'duration', true, '{chest}', '{shoulders}', '{other}'),
('band_pass_through', 'Prebacivanje gume preko glave', 'Band shoulder pass-through',
 'Drži gumu širokim hvatom ispred sebe. Polako je prebaci preko glave iza tela i vrati, u opsegu koji ti prija.',
 'Hold a band with a wide grip in front of you. Slowly take it over your head behind you and back, within a comfortable range.',
 'reps', true, '{shoulders}', '{upper_back,chest}', '{resistance_band}'),
('knee_to_wall', 'Mobilnost skočnog zgloba uz zid', 'Knee-to-wall ankle mobilization',
 'Stopalo ispred zida, peta na podu. Pomeri koleno napred ka zidu i vrati ga.',
 'Foot in front of a wall, heel down. Move your knee forward toward the wall and back.',
 'reps', true, '{calves}', '{}', '{bodyweight}'),
('calf_stretch', 'Istezanje lista', 'Calf stretch',
 'Šake na zidu, jedna noga iza sa petom na podu. Nagni se napred dok ne osetiš istezanje lista.',
 'Hands on a wall, one leg back with the heel down. Lean forward until you feel a stretch in the calf.',
 'duration', true, '{calves}', '{}', '{bodyweight}'),
('quad_stretch_side', 'Istezanje kvadricepsa na boku', 'Side-lying quad stretch',
 'Lezi na bok, uhvati stopalo gornje noge i privuci petu ka gluteusu bez zabacivanja leđa.',
 'Lie on your side, hold the top foot and draw the heel toward your glutes without arching your back.',
 'duration', true, '{quadriceps}', '{hip_flexors}', '{mat}');

insert into public.exercises (source, slug, name_sr, name_en, description_sr, description_en, tracking_mode, is_mobility)
select 'system', slug, name_sr, name_en, description_sr, description_en, tracking_mode, is_mobility
from _system_exercises;

insert into public.exercise_muscles (exercise_id, muscle_group_id, role)
select e.id, m.id, 'primary'
from _system_exercises s
cross join lateral unnest(s.primary_muscles) as pm(slug)
join public.exercises e on e.slug = s.slug
join public.muscle_groups m on m.slug = pm.slug;

insert into public.exercise_muscles (exercise_id, muscle_group_id, role)
select e.id, m.id, 'secondary'
from _system_exercises s
cross join lateral unnest(s.secondary_muscles) as sm(slug)
join public.exercises e on e.slug = s.slug
join public.muscle_groups m on m.slug = sm.slug;

insert into public.exercise_equipment (exercise_id, equipment_id)
select e.id, q.id
from _system_exercises s
cross join lateral unnest(s.equipment) as eq(slug)
join public.exercises e on e.slug = s.slug
join public.equipment q on q.slug = eq.slug;

-- ---------------------------------------------------------------------------
-- Starter program factory
-- ---------------------------------------------------------------------------

-- Adds one block with exercises (by system slug) to a program day.
-- p_items: [{ "slug", "sets", "min", "max", "dur", "rest", "tempo" }]
create or replace function public.starter_add_block(
  p_day_id uuid,
  p_sort integer,
  p_type public.block_type,
  p_title text,
  p_rounds integer,
  p_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_block_id uuid;
begin
  insert into public.workout_blocks (program_day_id, block_type, title, rounds, sort_order)
  values (p_day_id, p_type, p_title, p_rounds, p_sort)
  returning id into v_block_id;

  insert into public.block_exercises (
    workout_block_id, exercise_id, sort_order, target_sets,
    target_reps_min, target_reps_max, target_duration_seconds, rest_seconds, tempo
  )
  select
    v_block_id,
    e.id,
    (item.ord - 1)::integer,
    coalesce((item.value ->> 'sets')::integer, 1),
    (item.value ->> 'min')::integer,
    (item.value ->> 'max')::integer,
    (item.value ->> 'dur')::integer,
    (item.value ->> 'rest')::integer,
    item.value ->> 'tempo'
  from jsonb_array_elements(p_items) with ordinality as item(value, ord)
  join public.exercises e on e.slug = item.value ->> 'slug' and e.source = 'system';
end;
$$;

-- Creates the example 3-day program (A light, B strong, C mobility) for the caller.
-- It is an example to adapt, not a personalised or medical recommendation.
create or replace function public.create_starter_program(
  p_weekdays smallint[] default '{1,3,5}',
  p_activate boolean default true
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_en boolean;
  v_days smallint[];
  v_program uuid;
  v_a uuid;
  v_b uuid;
  v_c uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select locale = 'en' into v_en from public.profiles where id = v_uid;
  v_en := coalesce(v_en, false);

  -- First three distinct preferred weekdays, topped up with Mon/Wed/Fri.
  select array_agg(d order by d) into v_days
  from (
    select d from (
      select distinct unnest(coalesce(p_weekdays, '{}'::smallint[])) as d
    ) x
    where d between 1 and 7
    order by d
    limit 3
  ) y;
  v_days := coalesce(v_days, '{}');
  if cardinality(v_days) < 3 then
    select array_agg(d order by d) into v_days
    from (
      select d from (
        select unnest(v_days) as d
        union
        select unnest('{1,3,5,2,4,6,7}'::smallint[])
      ) u
      order by (d = any (v_days)) desc, array_position('{1,3,5,2,4,6,7}'::smallint[], d)
      limit 3
    ) z;
  end if;

  insert into public.programs (owner_id, name, description, source)
  values (
    v_uid,
    case when v_en then 'Starter program' else 'Početni program' end,
    case when v_en
      then 'Example 3-day plan: light full-body, stronger full-body, and mobility. Adapt it to yourself; it is not a personalised or medical recommendation.'
      else 'Primer plana od 3 dana: lakši trening celog tela, jači trening celog tela i mobilnost. Prilagodi ga sebi; ovo nije personalizovana ni medicinska preporuka.'
    end,
    'starter'
  )
  returning id into v_program;

  insert into public.program_days (program_id, title, day_index, preferred_weekday, intensity)
  values (v_program, case when v_en then 'A · Light full-body' else 'A · Lakši trening celog tela' end, 0, v_days[1], 'light')
  returning id into v_a;

  insert into public.program_days (program_id, title, day_index, preferred_weekday, intensity)
  values (v_program, case when v_en then 'B · Stronger full-body' else 'B · Jači trening celog tela' end, 1, v_days[2], 'strong')
  returning id into v_b;

  insert into public.program_days (program_id, title, day_index, preferred_weekday, intensity)
  values (v_program, case when v_en then 'C · Mobility & stretching' else 'C · Mobilnost i istezanje' end, 2, v_days[3], 'mobility')
  returning id into v_c;

  -- Day A — light full-body
  perform public.starter_add_block(v_a, 0, 'single', case when v_en then 'Warm-up' else 'Zagrevanje' end, 1,
    '[{"slug":"cat_cow","sets":1,"min":8,"max":10}]');
  perform public.starter_add_block(v_a, 1, 'superset', null, 1,
    '[{"slug":"bodyweight_squat","sets":3,"min":10,"max":12,"rest":60,"tempo":"3-1-1"},
      {"slug":"band_row","sets":3,"min":10,"max":12,"rest":60}]');
  perform public.starter_add_block(v_a, 2, 'superset', null, 1,
    '[{"slug":"incline_push_up","sets":3,"min":8,"max":12,"rest":60},
      {"slug":"glute_bridge","sets":3,"min":10,"max":15,"rest":60}]');
  perform public.starter_add_block(v_a, 3, 'circuit', case when v_en then 'Core' else 'Trup' end, 2,
    '[{"slug":"dead_bug","min":8,"max":10},
      {"slug":"bird_dog","min":8,"max":10},
      {"slug":"forearm_plank","dur":30,"rest":45}]');

  -- Day B — stronger full-body
  perform public.starter_add_block(v_b, 0, 'single', case when v_en then 'Warm-up' else 'Zagrevanje' end, 1,
    '[{"slug":"jump_rope_basic","sets":2,"min":50,"max":100,"dur":60,"rest":60}]');
  perform public.starter_add_block(v_b, 1, 'superset', null, 1,
    '[{"slug":"reverse_lunge","sets":3,"min":8,"max":10,"rest":75},
      {"slug":"trx_row","sets":3,"min":8,"max":12,"rest":75,"tempo":"3-1-1"}]');
  perform public.starter_add_block(v_b, 2, 'superset', null, 1,
    '[{"slug":"push_up","sets":3,"min":6,"max":10,"rest":75},
      {"slug":"band_romanian_deadlift","sets":3,"min":10,"max":12,"rest":75}]');
  perform public.starter_add_block(v_b, 3, 'superset', null, 1,
    '[{"slug":"band_overhead_press","sets":3,"min":8,"max":12,"rest":60},
      {"slug":"band_pallof_press","sets":3,"min":10,"max":12,"rest":60}]');
  perform public.starter_add_block(v_b, 4, 'circuit', case when v_en then 'Finisher' else 'Završni krug' end, 2,
    '[{"slug":"side_plank","dur":25},
      {"slug":"calf_raise","min":12,"max":15},
      {"slug":"band_pull_apart","min":12,"max":15,"rest":45}]');

  -- Day C — mobility & stretching
  perform public.starter_add_block(v_c, 0, 'circuit', case when v_en then 'Mobility flow' else 'Tok mobilnosti' end, 2,
    '[{"slug":"cat_cow","min":8,"max":10},
      {"slug":"open_book","min":6,"max":8},
      {"slug":"hip_90_90","min":6,"max":8},
      {"slug":"knee_to_wall","min":8,"max":10}]');
  perform public.starter_add_block(v_c, 1, 'single', null, 1,
    '[{"slug":"hip_flexor_stretch","sets":2,"dur":30}]');
  perform public.starter_add_block(v_c, 2, 'single', null, 1,
    '[{"slug":"supine_hamstring_stretch","sets":2,"dur":30}]');
  perform public.starter_add_block(v_c, 3, 'single', null, 1,
    '[{"slug":"figure_four_stretch","sets":2,"dur":30}]');
  perform public.starter_add_block(v_c, 4, 'single', null, 1,
    '[{"slug":"childs_pose","sets":1,"dur":45}]');

  if p_activate then
    perform public.activate_program(v_program);
  end if;

  return v_program;
end;
$$;

grant execute on function public.starter_add_block(uuid, integer, public.block_type, text, integer, jsonb) to authenticated;
grant execute on function public.create_starter_program(smallint[], boolean) to authenticated;
revoke execute on function public.starter_add_block(uuid, integer, public.block_type, text, integer, jsonb) from anon, public;
revoke execute on function public.create_starter_program(smallint[], boolean) from anon, public;
