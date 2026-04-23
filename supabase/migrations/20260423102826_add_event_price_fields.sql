begin;

alter table public.events
	add column if not exists price_min integer,
	add column if not exists price_max integer,
	add column if not exists split_evenly boolean not null default false;

alter table public.events
	drop constraint if exists events_price_min_non_negative,
	drop constraint if exists events_price_max_non_negative,
	drop constraint if exists events_price_min_lte_price_max;

alter table public.events
	add constraint events_price_min_non_negative check (price_min is null or price_min >= 0),
	add constraint events_price_max_non_negative check (price_max is null or price_max >= 0),
	add constraint events_price_min_lte_price_max check (
		price_min is null
		or price_max is null
		or price_min <= price_max
	);

commit;
