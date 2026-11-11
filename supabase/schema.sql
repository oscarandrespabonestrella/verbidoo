-- Verb Adventure — Phase 2 target schema (Postgres / Supabase). Not used by the MVP yet.

create table language (code text primary key, name text not null);
create table language_variant (
  code text primary key,                -- 'pt-BR', 'es-419'
  language text not null references language,
  name text not null,
  tts_locale text not null
);

create table verb_concept (
  id text primary key,                  -- 'eat'
  category text not null,
  frequency_rank int,
  unlock_level int not null default 1
);

create table lemma (
  id bigint generated always as identity primary key,
  concept text not null references verb_concept,
  language text not null references language,
  variant text references language_variant,   -- null = all variants
  infinitive text not null,
  syllables text,
  ipa text,
  verb_class text not null check (verb_class in ('regular','irregular','stem-changing','spelling-change','reflexive','auxiliary')),
  unique (concept, language, variant)
);
create table lemma_meaning (
  lemma bigint references lemma on delete cascade,
  ui_language text references language,
  meaning text not null,
  primary key (lemma, ui_language)
);

create table tense (
  id text primary key,                  -- 'es.pret_perf_simple'
  language text not null references language,
  mood text not null,                   -- indicative, subjunctive, imperative, non-finite
  label text not null,
  learn_level int not null default 1,
  usage text not null default 'common' check (usage in ('common','formal','literary','regional','rare'))
);

create table conjugation (
  lemma bigint references lemma on delete cascade,
  tense text references tense,
  person smallint not null check (person between 0 and 5),
  variant text references language_variant,   -- null = all variants
  form text not null,
  is_irregular boolean not null default false,
  source text not null,                 -- 'engine+wiktionary+review'
  primary key (lemma, tense, person, variant)
);

create table example_sentence (id bigint generated always as identity primary key, concept text references verb_concept, level smallint not null);
create table sentence_text (
  sentence bigint references example_sentence on delete cascade,
  language text references language,
  variant text references language_variant,
  text text not null,                   -- verb marked as {form}
  audio_url text,
  primary key (sentence, language, variant)
);

create table media (concept text references verb_concept, kind text, url text not null, license text not null, author text);

-- Cloud accounts (children's progress, parent logins) live in supabase/cloud.sql — that part is used by the app today.
