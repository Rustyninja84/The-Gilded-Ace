-- ============================================================
-- THE GILDED ACE - POKER RELIABILITY PATCH
-- Run this entire script in Supabase SQL Editor.
--
-- Fixes:
--   1. Leave Table returns remaining stack and actually removes seat.
--   2. Betting rounds advance PRE-FLOP -> FLOP -> TURN -> RIVER.
--   3. Hand resolves when everyone but one player folds.
--   4. Showdown runs after river.
--   5. Bot/player actions cannot leave the room permanently stuck.
--
-- Assumes your existing tables:
--   profiles
--   poker_rooms
--   poker_seats
--   poker_hole_cards
-- and your existing poker_start_hand / poker_showdown / evaluator functions.
-- ============================================================

create or replace function public.poker_next_active_seat(
    p_room uuid,
    p_after integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_seat integer;
begin
    select seat_no
    into v_seat
    from poker_seats
    where room_id = p_room
      and folded = false
      and stack >= 0
      and seat_no > p_after
    order by seat_no
    limit 1;

    if v_seat is null then
        select seat_no
        into v_seat
        from poker_seats
        where room_id = p_room
          and folded = false
          and stack >= 0
        order by seat_no
        limit 1;
    end if;

    return v_seat;
end;
$$;


create or replace function public.poker_round_complete(
    p_room uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
    select not exists (
        select 1
        from poker_seats s
        join poker_rooms r on r.id = s.room_id
        where s.room_id = p_room
          and s.folded = false
          and s.stack > 0
          and (
              coalesce(s.acted, false) = false
              or coalesce(s.bet_round, 0) <> coalesce(r.current_bet, 0)
          )
    );
$$;


create or replace function public.poker_advance_street(
    p_room uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_room poker_rooms%rowtype;
    v_deck text[];
    v_community text[];
    v_pos integer;
    v_first integer;
begin
    select *
    into v_room
    from poker_rooms
    where id = p_room
    for update;

    if not found then
        raise exception 'Poker room not found.';
    end if;

    if v_room.hand_complete then
        return;
    end if;

    v_deck := coalesce(v_room.deck, array[]::text[]);
    v_community := coalesce(v_room.community_cards, array[]::text[]);
    v_pos := coalesce(v_room.deck_position, 1);

    update poker_seats
    set bet_round = 0,
        acted = case when stack <= 0 or folded then true else false end
    where room_id = p_room;

    if lower(coalesce(v_room.street, 'preflop')) in ('preflop','pre-flop') then
        -- Burn one, then deal flop.
        v_pos := v_pos + 1;

        if array_length(v_deck, 1) is null or v_pos + 2 > array_length(v_deck, 1) then
            raise exception 'Poker deck does not contain enough cards for the flop.';
        end if;

        v_community := v_community
            || v_deck[v_pos]
            || v_deck[v_pos + 1]
            || v_deck[v_pos + 2];

        v_pos := v_pos + 3;

        update poker_rooms
        set street = 'flop',
            community_cards = v_community,
            deck_position = v_pos,
            current_bet = 0,
            minimum_raise = big_blind
        where id = p_room;

    elsif lower(v_room.street) = 'flop' then
        -- Burn one, then turn.
        v_pos := v_pos + 1;

        if array_length(v_deck, 1) is null or v_pos > array_length(v_deck, 1) then
            raise exception 'Poker deck does not contain enough cards for the turn.';
        end if;

        v_community := v_community || v_deck[v_pos];
        v_pos := v_pos + 1;

        update poker_rooms
        set street = 'turn',
            community_cards = v_community,
            deck_position = v_pos,
            current_bet = 0,
            minimum_raise = big_blind
        where id = p_room;

    elsif lower(v_room.street) = 'turn' then
        -- Burn one, then river.
        v_pos := v_pos + 1;

        if array_length(v_deck, 1) is null or v_pos > array_length(v_deck, 1) then
            raise exception 'Poker deck does not contain enough cards for the river.';
        end if;

        v_community := v_community || v_deck[v_pos];
        v_pos := v_pos + 1;

        update poker_rooms
        set street = 'river',
            community_cards = v_community,
            deck_position = v_pos,
            current_bet = 0,
            minimum_raise = big_blind
        where id = p_room;

    elsif lower(v_room.street) = 'river' then
        perform public.poker_showdown(p_room);
        return;

    else
        raise exception 'Cannot advance unknown poker street: %', v_room.street;
    end if;

    select public.poker_next_active_seat(p_room, coalesce(v_room.dealer_seat, 0))
    into v_first;

    update poker_rooms
    set current_turn = v_first
    where id = p_room;
end;
$$;


create or replace function public.poker_finish_fold_win(
    p_room uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_room poker_rooms%rowtype;
    v_winner poker_seats%rowtype;
begin
    select *
    into v_room
    from poker_rooms
    where id = p_room
    for update;

    select *
    into v_winner
    from poker_seats
    where room_id = p_room
      and folded = false
    order by seat_no
    limit 1;

    if not found then
        update poker_rooms
        set hand_complete = true,
            current_turn = null,
            winner_text = 'Hand ended without a winner.',
            street = 'complete'
        where id = p_room;
        return;
    end if;

    update poker_seats
    set stack = stack + coalesce(v_room.pot, 0)
    where room_id = p_room
      and seat_no = v_winner.seat_no;

    update poker_rooms
    set pot = 0,
        hand_complete = true,
        current_turn = null,
        winner_text = v_winner.display_name || ' wins ' || coalesce(v_room.pot,0)::text || ' AC.',
        street = 'complete'
    where id = p_room;
end;
$$;


create or replace function public.poker_apply_action(
    p_room uuid,
    p_seat integer,
    p_action text,
    p_amount bigint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_room poker_rooms%rowtype;
    v_seat poker_seats%rowtype;
    v_call bigint;
    v_pay bigint;
    v_raise_to bigint;
    v_next integer;
    v_live integer;
    v_round_done boolean;
begin
    select *
    into v_room
    from poker_rooms
    where id = p_room
    for update;

    if not found then
        raise exception 'Poker room not found.';
    end if;

    if v_room.hand_complete then
        raise exception 'This poker hand is already complete.';
    end if;

    if v_room.current_turn is null or v_room.current_turn <> p_seat then
        raise exception 'It is not that seat''s turn.';
    end if;

    select *
    into v_seat
    from poker_seats
    where room_id = p_room
      and seat_no = p_seat
    for update;

    if not found then
        raise exception 'Poker seat not found.';
    end if;

    if v_seat.folded then
        raise exception 'This seat has already folded.';
    end if;

    v_call := greatest(0, coalesce(v_room.current_bet,0) - coalesce(v_seat.bet_round,0));

    case lower(p_action)

        when 'fold' then
            update poker_seats
            set folded = true,
                acted = true
            where room_id = p_room
              and seat_no = p_seat;

        when 'check' then
            if v_call <> 0 then
                raise exception 'You cannot check while facing a bet.';
            end if;

            update poker_seats
            set acted = true
            where room_id = p_room
              and seat_no = p_seat;

        when 'call' then
            if v_call <= 0 then
                raise exception 'There is no bet to call.';
            end if;

            if v_seat.stack < v_call then
                raise exception 'Not enough chips to call. All-in side pots are not enabled yet.';
            end if;

            v_pay := v_call;

            update poker_seats
            set stack = stack - v_pay,
                bet_round = bet_round + v_pay,
                bet_hand = bet_hand + v_pay,
                acted = true
            where room_id = p_room
              and seat_no = p_seat;

            update poker_rooms
            set pot = pot + v_pay
            where id = p_room;

        when 'raise' then
            if p_amount is null then
                raise exception 'Raise amount is required.';
            end if;

            v_raise_to := p_amount;

            if v_raise_to < coalesce(v_room.current_bet,0) + coalesce(v_room.minimum_raise,v_room.big_blind) then
                raise exception 'Raise must be at least the minimum raise.';
            end if;

            v_pay := v_raise_to - coalesce(v_seat.bet_round,0);

            if v_pay <= 0 then
                raise exception 'Invalid raise amount.';
            end if;

            if v_seat.stack < v_pay then
                raise exception 'Not enough chips to raise that amount.';
            end if;

            update poker_seats
            set acted = false
            where room_id = p_room
              and folded = false
              and stack > 0;

            update poker_seats
            set stack = stack - v_pay,
                bet_round = v_raise_to,
                bet_hand = bet_hand + v_pay,
                acted = true
            where room_id = p_room
              and seat_no = p_seat;

            update poker_rooms
            set pot = pot + v_pay,
                minimum_raise = greatest(
                    coalesce(v_room.big_blind,1),
                    v_raise_to - coalesce(v_room.current_bet,0)
                ),
                current_bet = v_raise_to
            where id = p_room;

        else
            raise exception 'Unknown poker action: %', p_action;
    end case;

    select count(*)
    into v_live
    from poker_seats
    where room_id = p_room
      and folded = false;

    if v_live <= 1 then
        perform public.poker_finish_fold_win(p_room);
        return;
    end if;

    select public.poker_round_complete(p_room)
    into v_round_done;

    if v_round_done then
        perform public.poker_advance_street(p_room);
        return;
    end if;

    select public.poker_next_active_seat(p_room, p_seat)
    into v_next;

    if v_next is null then
        -- Safety fallback: if no eligible next seat is found,
        -- re-check the round rather than leaving the room stuck.
        select public.poker_round_complete(p_room)
        into v_round_done;

        if v_round_done then
            perform public.poker_advance_street(p_room);
        else
            raise exception 'No eligible next poker seat could be found.';
        end if;
        return;
    end if;

    update poker_rooms
    set current_turn = v_next
    where id = p_room;
end;
$$;


create or replace function public.poker_player_action(
    p_room uuid,
    p_action text,
    p_amount bigint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_seat integer;
begin
    select seat_no
    into v_seat
    from poker_seats
    where room_id = p_room
      and user_id = auth.uid()
    limit 1;

    if v_seat is null then
        raise exception 'You are not seated at this table.';
    end if;

    perform public.poker_apply_action(
        p_room,
        v_seat,
        p_action,
        p_amount
    );
end;
$$;


create or replace function public.poker_leave_room(
    p_room uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_room poker_rooms%rowtype;
    v_seat poker_seats%rowtype;
    v_was_turn boolean;
    v_next integer;
    v_live integer;
begin
    select *
    into v_room
    from poker_rooms
    where id = p_room
    for update;

    if not found then
        raise exception 'Poker room not found.';
    end if;

    select *
    into v_seat
    from poker_seats
    where room_id = p_room
      and user_id = auth.uid()
    for update;

    if not found then
        -- Idempotent leave: already out of the room.
        return;
    end if;

    v_was_turn := (v_room.current_turn = v_seat.seat_no);

    -- Return remaining table stack to the user's profile balance.
    update profiles
    set balance = coalesce(balance,0) + coalesce(v_seat.stack,0)
    where id = auth.uid();

    delete from poker_hole_cards
    where room_id = p_room
      and (
          user_id = auth.uid()
          or seat_no = v_seat.seat_no
      );

    delete from poker_seats
    where room_id = p_room
      and user_id = auth.uid();

    select count(*)
    into v_live
    from poker_seats
    where room_id = p_room
      and folded = false;

    if not v_room.hand_complete and lower(coalesce(v_room.street,'waiting')) <> 'waiting' then
        if v_live <= 1 then
            perform public.poker_finish_fold_win(p_room);
            return;
        end if;

        if v_was_turn then
            select public.poker_next_active_seat(p_room, v_seat.seat_no)
            into v_next;

            update poker_rooms
            set current_turn = v_next
            where id = p_room;
        end if;
    end if;

    -- If the room is empty, leave it available but reset the hand.
    if not exists (
        select 1 from poker_seats where room_id = p_room
    ) then
        update poker_rooms
        set status = 'waiting',
            street = 'waiting',
            community_cards = array[]::text[],
            deck = array[]::text[],
            deck_position = 1,
            pot = 0,
            current_bet = 0,
            current_turn = null,
            hand_complete = true,
            winner_text = 'Table empty.'
        where id = p_room;
    end if;
end;
$$;


-- Keep EXECUTE available to logged-in members.
grant execute on function public.poker_player_action(uuid,text,bigint) to authenticated;
grant execute on function public.poker_leave_room(uuid) to authenticated;
grant execute on function public.poker_advance_street(uuid) to authenticated;

-- ============================================================
-- END PATCH
-- ============================================================
