-- gpt-6.1-sol, announced 2026-09-29 (Paolo, 2026-09-30), replaces gpt-6-sol as
-- the GPT candidate for the analyst and clerk roles. List price read
-- 2026-09-30 from developers.openai.com/api/docs/pricing. USD per 1M tokens.
-- Live-tested in "Provide an OpenAI API key and smoke-test the OpenAI
-- provider" (Imbustai/imbustai-app#45).

insert into public.ai_model_pricing
  (provider, model, input_usd_per_mtok, output_usd_per_mtok, cache_read_usd_per_mtok, cache_write_usd_per_mtok, notes)
values
  ('openai', 'gpt-6.1-sol', 2.00, 10.00, 0.100, 2.500, 'List 2026-09-30, developers.openai.com/api/docs/pricing. Standard, <=272K input. Write 1.25x input. Read 0.05x input.')
on conflict (model) do update set
  provider = excluded.provider,
  input_usd_per_mtok = excluded.input_usd_per_mtok,
  output_usd_per_mtok = excluded.output_usd_per_mtok,
  cache_read_usd_per_mtok = excluded.cache_read_usd_per_mtok,
  cache_write_usd_per_mtok = excluded.cache_write_usd_per_mtok,
  notes = excluded.notes;
